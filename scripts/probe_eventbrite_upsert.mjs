import { scrapeByPlatform } from "../src/features/scrapers/service.js";
import { fetchEventDetails } from "../src/features/scrapers/luma/details.js";
import { supabaseAdmin } from "../src/shared/clients/supabase.js";

const res = await scrapeByPlatform("eventbrite");
const event = res.events[0];
const url = event?.url || event?.redirectURL || event?.event_url || null;
const meta = await fetchEventDetails(url);
const row = {
  title: event?.title || "",
  description: event?.description || meta.description || null,
  event_url: url,
  banner_url: meta.banner_url || null,
  start_date: meta.start_date || event?.startDate || event?.start_date || null,
  end_date: meta.end_date || event?.endDate || event?.end_date || null,
  organizer: event?.organizer || event?.hostedBy || meta.organizer || null,
  city: meta.city || event?.city || null,
  country: meta.country || event?.country || null,
  platform: event?.platform || "eventbrite",
  category: event?.category || event?.type || null,
  tags: event?.tags || [],
  mode: event?.mode || null,
  is_free: null,
  created_at: new Date().toISOString(),
};

console.log(JSON.stringify({ row, meta }, null, 2));
const up = await supabaseAdmin
  .from("events")
  .upsert([row], { onConflict: "event_url" })
  .select("id,platform,event_url");
console.log(JSON.stringify({ data: up.data, error: up.error }, null, 2));
