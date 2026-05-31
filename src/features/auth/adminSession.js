import crypto from "crypto";
import { cookies } from "next/headers";
import { env } from "../../shared/config/env.js";
import {
  HARDCODED_ADMIN_EMAIL,
  HARDCODED_ADMIN_PASSWORD,
} from "./adminCredentials.js";
import { getAdminEmails, isAdminEmail } from "./admin.js";

export { HARDCODED_ADMIN_EMAIL, HARDCODED_ADMIN_PASSWORD };

const COOKIE_NAME = "el_admin_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function signingSecret() {
  return env.scrapeSecret || env.supabaseServiceKey || "eventlayer-admin-dev";
}

export function verifyAdminCredentials(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const pwd = String(password || "");

  if (
    normalizedEmail === HARDCODED_ADMIN_EMAIL.toLowerCase() &&
    pwd === HARDCODED_ADMIN_PASSWORD
  ) {
    return { ok: true, email: HARDCODED_ADMIN_EMAIL };
  }

  if (pwd === HARDCODED_ADMIN_PASSWORD && isAdminEmail(normalizedEmail)) {
    return { ok: true, email: normalizedEmail };
  }

  return { ok: false };
}

function signToken(email) {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${email}|${exp}`;
  const sig = crypto.createHmac("sha256", signingSecret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expected = crypto
    .createHmac("sha256", signingSecret())
    .update(payload)
    .digest("hex");
  if (sig !== expected) return null;
  const [email, expStr] = payload.split("|");
  if (!email || Date.now() > Number(expStr)) return null;
  if (email !== HARDCODED_ADMIN_EMAIL.toLowerCase() && !isAdminEmail(email)) {
    return null;
  }
  return email;
}

export function setAdminSessionCookie(response, email) {
  const token = signToken(email.toLowerCase());
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return response;
}

export function clearAdminSessionCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function getAdminSessionFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (match) {
    const email = verifyToken(decodeURIComponent(match[1]));
    if (email) return email;
  }
  try {
    const jar = cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (token) return verifyToken(token);
  } catch {
    // route handler context only
  }
  return null;
}

export async function isAdminAuthorized(request) {
  const sessionEmail = await getAdminSessionFromRequest(request);
  if (sessionEmail) return true;

  try {
    const { requireAuth } = await import("./service.js");
    const { user } = await requireAuth(request);
    return isAdminEmail(user?.email);
  } catch {
    return false;
  }
}

export function getDefaultAdminHint() {
  const emails = getAdminEmails();
  return {
    email: emails[0] || HARDCODED_ADMIN_EMAIL,
    password: HARDCODED_ADMIN_PASSWORD,
  };
}
