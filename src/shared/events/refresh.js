export const SAVED_EVENTS_UPDATED_EVENT = "eventlayer:saved-events-updated";
export const SAVED_EVENTS_STORAGE_KEY = "eventlayer.savedEvents.updatedAt";

export function notifySavedEventsUpdated() {
  if (typeof window === "undefined") return;

  const updatedAt = String(Date.now());
  window.localStorage.setItem(SAVED_EVENTS_STORAGE_KEY, updatedAt);
  window.dispatchEvent(
    new CustomEvent(SAVED_EVENTS_UPDATED_EVENT, {
      detail: { updatedAt },
    }),
  );
}

export function subscribeToSavedEventsUpdated(handler) {
  if (typeof window === "undefined") return () => {};

  const customHandler = () => handler();
  const storageHandler = (event) => {
    if (event?.key === SAVED_EVENTS_STORAGE_KEY) handler();
  };

  window.addEventListener(SAVED_EVENTS_UPDATED_EVENT, customHandler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(SAVED_EVENTS_UPDATED_EVENT, customHandler);
    window.removeEventListener("storage", storageHandler);
  };
}