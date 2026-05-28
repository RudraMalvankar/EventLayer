(async function () {
  try {
    const fs = require("fs");
    const fetch = global.fetch || require("node-fetch");
    const path = "./scripts/events_list.json";
    if (!fs.existsSync(path)) {
      console.error("MISSING_EVENTS_FILE");
      process.exit(1);
    }
    const raw = fs.readFileSync(path, "utf8");
    const j = JSON.parse(raw);
    const events = (j.data && j.data.events) || j.events || j.data || [];
    if (!events.length) {
      console.log("NO_EVENTS");
      process.exit(0);
    }
    const list = events.slice(0, 5);
    for (const e of list) {
      const id = e.id;
      const res = await fetch(`http://localhost:3000/events/${id}`);
      const html = await res.text();
      const hasPort3001 = html.includes(":3001");
      const hasChunkPattern = /_next\/static\/chunks\/app\/events\//.test(html);
      const hasLoadingChunk = html.includes("Loading chunk");
      const bad = hasPort3001 || hasChunkPattern || hasLoadingChunk;
      console.log(id, bad ? "BAD" : "OK");
      if (bad) {
        if (hasPort3001) console.log("  contains :3001 references");
        if (hasChunkPattern) console.log("  contains app/events chunk pattern");
        if (hasLoadingChunk) console.log('  contains "Loading chunk" text');
      }
    }
  } catch (err) {
    console.error("ERROR", err && err.message ? err.message : err);
    process.exit(2);
  }
})();
