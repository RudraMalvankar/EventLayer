import { scrapeByPlatform } from "../src/features/scrapers/service.js";

const platforms = ["unstop", "devpost", "eventbrite"];

for (const platform of platforms) {
  const res = await scrapeByPlatform(platform);
  const sample = (res?.events || []).slice(0, 3).map((event) => ({
    title: event.title,
    url: event.event_url || event.url || event.redirectURL || null,
    start_date: event.start_date || event.startDate || event.starts_at || null,
    city: event.city || null,
    organizer: event.organizer || event.hostedBy || null,
  }));

  console.log(`PLATFORM ${platform}`);
  console.log(`COUNT ${res?.events?.length || 0}`);
  console.log(`ERROR ${res?.error || null}`);
  console.log(JSON.stringify(sample, null, 2));
  console.log("---");
}
