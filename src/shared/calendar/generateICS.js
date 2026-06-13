/**
 * Generates an .ics (iCalendar) string from event data.
 * Compatible with Google Calendar, Apple Calendar, and Outlook.
 *
 * @param {Object} event
 * @param {string} event.title
 * @param {string} [event.description]
 * @param {string} [event.start_date]  - ISO string or date string
 * @param {string} [event.end_date]    - ISO string or date string
 * @param {string} [event.city]
 * @param {string} [event.country]
 * @param {string} [event.location_detail]
 * @param {string} [event.event_url]
 * @param {string} [event.id]
 * @returns {string} The .ics file content
 */
export function generateICS(event) {
  const now = new Date();
  const uid = `eventlayer-${event.id || now.getTime()}@eventlayer.dev`;

  const startDate = toICSDate(event.start_date);
  const endDate = toICSDate(event.end_date) || addDuration(startDate, 2); // default 2h

  const location = [event.location_detail, event.city, event.country]
    .filter(Boolean)
    .join(", ");

  const description = sanitizeICS(event.description || event.ai_summary || "");
  const url = event.event_url || `https://eventlayer.dev/events/${event.id}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventLayer//EventLayer.dev//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${sanitizeICS(event.title || "Event")}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${sanitizeICS(location)}` : "",
    `URL:${url}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * Builds a Google Calendar URL that opens the event creation page pre-filled.
 * @param {Object} event
 * @returns {string} Google Calendar URL
 */
export function getGoogleCalendarUrl(event) {
  const startDate = toICSDate(event.start_date);
  const endDate = toICSDate(event.end_date) || addDuration(startDate, 2);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "Event",
    dates: `${startDate}/${endDate}`,
    details: event.description || event.ai_summary || "",
    location: [event.location_detail, event.city, event.country]
      .filter(Boolean)
      .join(", "),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Formats an ICS-compatible filename for the event.
 * @param {Object} event
 * @returns {string} filename like "my-event-title.ics"
 */
export function getICSFilename(event) {
  const slug = (event.title || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug}.ics`;
}

/**
 * Converts a date value to the ICS format (YYYYMMDDTHHMMSSZ).
 * Returns undefined if the date is invalid.
 */
function toICSDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return formatICSDate(date);
}

/**
 * Formats a Date object to ICS format: YYYYMMDDTHHMMSSZ
 */
function formatICSDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Sanitizes a string for ICS format (escapes special chars).
 */
function sanitizeICS(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * Adds a default duration (hours) to a date string.
 */
function addDuration(icsDate, hours) {
  if (!icsDate) return undefined;
  // Parse YYYYMMDDTHHMMSSZ
  const year = Number.parseInt(icsDate.slice(0, 4), 10);
  const month = Number.parseInt(icsDate.slice(4, 6), 10) - 1;
  const day = Number.parseInt(icsDate.slice(6, 8), 10);
  const hour = Number.parseInt(icsDate.slice(9, 11), 10);
  const minute = Number.parseInt(icsDate.slice(11, 13), 10);
  const second = Number.parseInt(icsDate.slice(13, 15), 10);

  const date = new Date(Date.UTC(year, month, day, hour, minute, second));
  date.setUTCHours(date.getUTCHours() + hours);
  return formatICSDate(date);
}