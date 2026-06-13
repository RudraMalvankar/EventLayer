import { z } from "zod";

/**
 * Shared Zod schemas for API input validation.
 * Each schema validates the expected shape of request data.
 */

// ─── Events API ─────────────────────────────────────────────────────────────

export const eventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(12),
  city: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  mode: z.string().max(50).optional(),
  is_free: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  platform: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
  upcomingOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
});

// ─── Event by ID ────────────────────────────────────────────────────────────

export const eventByIdSchema = z.object({
  id: z.string().min(1).max(100),
});

// ─── Saved Events ───────────────────────────────────────────────────────────

export const savedGetQuerySchema = z.object({
  event_id: z.string().min(1).max(100).optional(),
});

export const savedPostBodySchema = z.object({
  event_id: z.string().min(1, "event_id is required").max(100),
});

export const savedDeleteBodySchema = z.object({
  event_id: z.string().min(1, "event_id is required").max(100),
});

// ─── Admin Login ────────────────────────────────────────────────────────────

export const adminLoginBodySchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(1, "Password is required").max(255),
});

// ─── Scrape Platform ────────────────────────────────────────────────────────

export const scrapePlatformParamsSchema = z.object({
  platform: z.enum([
    "luma",
    "meetup",
    "devfolio",
    "unstop",
    "devpost",
    "eventbrite",
  ]),
});

// ─── Admin Sync ─────────────────────────────────────────────────────────────

export const adminSyncBodySchema = z.object({}).strict(); // POST body must be empty