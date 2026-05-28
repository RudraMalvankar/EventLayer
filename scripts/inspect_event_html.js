(async function () {
  try {
    const fs = require("fs");
    const fetch = global.fetch || require("node-fetch");
    const listPath = "./scripts/events_list.json";
    if (!fs.existsSync(listPath)) {
      console.error("MISSING_EVENTS_FILE");
      process.exit(1);
    }
    const j = JSON.parse(fs.readFileSync(listPath, "utf8"));
    const events = (j.data && j.data.events) || j.events || j.data || [];
    if (!events.length) {
      console.log("NO_EVENTS");
      process.exit(0);
    }
    const id = events[0].id;
    const res = await fetch(`http://localhost:3000/events/${id}`);
    const html = await res.text();
    console.log("EVENT ID:", id);
    const matches =
      html.match(/(https?:)?\/\/[^\"'\s]*_next\/static\/[^\"'\s]*/g) ||
      html.match(/_next\/static\/[^\"'\s]*/g) ||
      [];
    console.log("Matches (up to 40):");
    matches.slice(0, 40).forEach((m) => console.log(" ", m));
    const portMatches = html.match(/:\d{2,5}/g) || [];
    console.log("Port-like tokens:", [...new Set(portMatches)].join(", "));
  } catch (err) {
    console.error(err && err.message ? err.message : err);
    process.exit(2);
  }
})();
