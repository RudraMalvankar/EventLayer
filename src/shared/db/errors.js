export function isMissingTableError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("relation")
  );
}

export function ok(data) {
  return { data, error: null };
}

export function fail(message) {
  return { data: null, error: message };
}
