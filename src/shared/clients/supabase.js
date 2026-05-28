import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

function missingClient() {
  return {
    auth: {
      async getSession() {
        return {
          data: { session: null },
          error: { message: "Supabase env vars are missing" },
        };
      },
      async getUser() {
        return {
          data: { user: null },
          error: { message: "Supabase env vars are missing" },
        };
      },
      async signInWithPassword() {
        return {
          data: null,
          error: { message: "Supabase env vars are missing" },
        };
      },
      async signUp() {
        return {
          data: null,
          error: { message: "Supabase env vars are missing" },
        };
      },
    },
    from() {
      throw new Error("Supabase env vars are missing");
    },
  };
}

export const supabase =
  env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey)
    : missingClient();

export const supabaseAdmin =
  env.supabaseUrl && env.supabaseServiceKey
    ? createClient(env.supabaseUrl, env.supabaseServiceKey)
    : missingClient();
