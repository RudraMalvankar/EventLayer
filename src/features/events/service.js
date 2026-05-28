import {
  findEvents,
  findEventById,
  updateEventById,
  upsertEventsRepo,
  findSavedEvents,
  toggleSavedEventRepo,
} from "./repository.js";
import { fetchEventDetails } from "../scrapers/luma/details.js";

export async function getEventsService(filters = {}) {
  return findEvents(filters);
}

export async function getEventByIdService(id) {
  return findEventById(id);
}

export async function refreshEventDetailsService(id) {
  const current = await findEventById(id);
  if (current.error || !current.data) return current;
  if (!current.data.event_url) return current;

  const meta = await fetchEventDetails(current.data.event_url);
  const update = {
    title: meta.title || current.data.title || "",
    description: meta.description || current.data.description || "",
    banner_url: meta.banner_url || current.data.banner_url || null,
    start_date: meta.start_date || current.data.start_date || null,
    end_date: meta.end_date || current.data.end_date || null,
    organizer: meta.organizer || current.data.organizer || null,
    city: meta.city || current.data.city || null,
    country: meta.country || current.data.country || null,
  };

  return updateEventById(id, update);
}

export async function getEventDetailsLiveService(id) {
  const current = await findEventById(id);
  if (current.error || !current.data) return current;
  if (!current.data.event_url)
    return { data: { event: current.data, details: null }, error: null };

  const details = await fetchEventDetails(current.data.event_url);
  const update = {
    title: details.title || current.data.title || "",
    description: details.description || current.data.description || "",
    banner_url: details.banner_url || current.data.banner_url || null,
    start_date: details.start_date || current.data.start_date || null,
    end_date: details.end_date || current.data.end_date || null,
    organizer: details.organizer || current.data.organizer || null,
    city: details.city || current.data.city || null,
    country: details.country || current.data.country || null,
  };

  const updated = await updateEventById(id, update);
  if (updated.error) return updated;
  return {
    data: { event: updated.data || current.data, details },
    error: null,
  };
}

export async function upsertEventsService(eventsArray = []) {
  return upsertEventsRepo(eventsArray);
}

export async function getSavedEventsService(userId) {
  return findSavedEvents(userId);
}

export async function toggleSaveEventService(userId, eventId) {
  return toggleSavedEventRepo(userId, eventId);
}

export async function searchEventsService(filters = {}) {
  return findEvents({
    city: filters.city || undefined,
    category: filters.category || undefined,
    mode: filters.mode || undefined,
    is_free: typeof filters.is_free === "boolean" ? filters.is_free : undefined,
    keyword: filters.keyword || undefined,
    page: filters.page || 1,
    limit: filters.limit || 12,
  });
}
