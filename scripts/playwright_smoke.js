const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  try {
    const raw = fs.readFileSync("scripts/events_list.json", "utf8");
    const j = JSON.parse(raw);
    const events = (j.data && j.data.events) || j.events || j.data || [];
    if (!events.length) {
      console.error("NO_EVENTS");
      process.exit(1);
    }
    const list = events.slice(0, 6);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const results = [];
    for (const e of list) {
      const page = await context.newPage();
      const entry = {
        id: e.id,
        url: `http://localhost:3000/events/${e.id}`,
        console: [],
        errors: [],
        responses: [],
      };
      page.on("console", (msg) => {
        try {
          entry.console.push({ type: msg.type(), text: msg.text() });
        } catch (e) {}
      });
      page.on("pageerror", (err) => {
        entry.errors.push(String(err));
      });
      page.on("response", (res) => {
        const url = res.url();
        const status = res.status();
        if (url.includes("_next/static")) entry.responses.push({ url, status });
      });
      try {
        const resp = await page.goto(entry.url, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        entry.status = resp ? resp.status() : null;
      } catch (err) {
        entry.gotoError = String(err);
      }
      await page.waitForTimeout(1000);
      await page.close();
      results.push(entry);
    }
    await browser.close();
    fs.writeFileSync(
      "scripts/playwright_results.json",
      JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2),
    );
    console.log("WROTE scripts/playwright_results.json");
    process.exit(0);
  } catch (err) {
    console.error("ERROR", err && err.message ? err.message : err);
    process.exit(2);
  }
})();
