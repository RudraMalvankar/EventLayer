/** Local calendar date key (YYYY-MM-DD) for grouping and day filters. */
export function dayKey(value) {
  if (!value) return "tba";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "tba";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function localDayKeyFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Event start is now or in the future (skips past start times). */
export function isUpcoming(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now();
}
