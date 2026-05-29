import { normalizeEvent } from "../src/features/scrapers/normalizer.js";
import enrichAndUpsert from "../src/features/scrapers/enrichWithGemini.js";

async function run() {
  const rawEvent = {
    title: "Sample Hackathon: Build with AI",
    description:
      "Join us on June 8 for a hands-on hackathon in Mumbai. Free entry. Submit teams of up to 4. Tags: AI, ml, web3.",
    event_url: "https://example.com/events/sample-hackathon",
    city: "Mumbai",
    start_date: "Jun 8",
  };

  const normalized = normalizeEvent(rawEvent, "example");
  console.log("Normalized before enrichment:", normalized);

  const merged = await enrichAndUpsert(normalized, rawEvent.description, {
    upsert: false,
  });
  console.log("Merged after enrichment:", merged);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
