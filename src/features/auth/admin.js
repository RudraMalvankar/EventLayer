import { env } from "../../shared/config/env.js";

export function getAdminEmails() {
  return String(env.adminEmails || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  const list = getAdminEmails();
  if (!list.length) return false;
  return list.includes(String(email || "").toLowerCase());
}
