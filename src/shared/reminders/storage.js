export const REMINDERS_STORAGE_KEY = "eventlayer.calendar.reminders.v1";
export const REMINDED_STORAGE_KEY = "eventlayer.calendar.reminded.v1";
export const REMINDERS_UPDATED_EVENT = "eventlayer:reminders-updated";

// TODO: When an `event_reminders` table exists, replace localStorage with
// server persistence through `/api/reminders` and keep this module as a UI cache.

export const REMINDER_OPTIONS = [
  {
    key: "1d",
    label: "1 day before",
    shortLabel: "1 day",
    offsetMinutes: 24 * 60,
  },
  {
    key: "3h",
    label: "3 hours before",
    shortLabel: "3 hours",
    offsetMinutes: 3 * 60,
  },
  {
    key: "30m",
    label: "30 minutes before",
    shortLabel: "30 min",
    offsetMinutes: 30,
  },
];

function readJson(key, fallback) {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeReminderKey(value) {
  const option = REMINDER_OPTIONS.find((item) => item.key === value);
  return option?.key || "1d";
}

function normalizeReminderMap(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.entries(raw).reduce((acc, [eventId, value]) => {
      if (!eventId) return acc;
      if (typeof value === "string") {
        acc[eventId] = {
          reminderKey: normalizeReminderKey(value),
          createdAt: Date.now(),
        };
        return acc;
      }
      if (value && typeof value === "object") {
        acc[eventId] = {
          reminderKey: normalizeReminderKey(value.reminderKey),
          createdAt: value.createdAt || Date.now(),
        };
      }
      return acc;
    }, {});
  }

  if (Array.isArray(raw)) {
    return raw.reduce((acc, eventId) => {
      const id = String(eventId || "").trim();
      if (!id) return acc;
      acc[id] = { reminderKey: "1d", createdAt: Date.now() };
      return acc;
    }, {});
  }

  return {};
}

export function getReminderOption(reminderKey) {
  return REMINDER_OPTIONS.find((item) => item.key === reminderKey) || REMINDER_OPTIONS[0];
}

export function loadReminderMap() {
  return normalizeReminderMap(readJson(REMINDERS_STORAGE_KEY, {}));
}

export function loadReminderSet() {
  return new Set(Object.keys(loadReminderMap()));
}

export function loadRemindedSet() {
  const value = readJson(REMINDED_STORAGE_KEY, []);
  return new Set(Array.isArray(value) ? value.map(String) : []);
}

export function persistReminderMap(value) {
  writeJson(REMINDERS_STORAGE_KEY, normalizeReminderMap(value));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REMINDERS_UPDATED_EVENT));
  }
}

export function persistReminderSet(values) {
  const next = Array.from(values || []).reduce((acc, eventId) => {
    const id = String(eventId || "").trim();
    if (!id) return acc;
    acc[id] = { reminderKey: "1d", createdAt: Date.now() };
    return acc;
  }, {});
  persistReminderMap(next);
}

export function persistRemindedSet(values) {
  writeJson(REMINDED_STORAGE_KEY, Array.from(values || []));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(REMINDERS_UPDATED_EVENT));
  }
}

export function setReminderValue(current, eventId, reminderKey) {
  const next = { ...(current || {}) };
  const key = String(eventId || "").trim();
  if (!key) return next;
  next[key] = {
    reminderKey: normalizeReminderKey(reminderKey),
    createdAt: Date.now(),
  };
  return next;
}

export function clearReminderValue(current, eventId) {
  const next = { ...(current || {}) };
  const key = String(eventId || "").trim();
  if (!key) return next;
  delete next[key];
  return next;
}

export function getReminderValue(current, eventId) {
  return current?.[String(eventId || "").trim()] || null;
}

export function subscribeToReminderUpdates(handler) {
  if (typeof window === "undefined") return () => {};

  const storageHandler = (event) => {
    if (
      event?.key === REMINDERS_STORAGE_KEY ||
      event?.key === REMINDED_STORAGE_KEY
    ) {
      handler();
    }
  };

  window.addEventListener(REMINDERS_UPDATED_EVENT, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(REMINDERS_UPDATED_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
