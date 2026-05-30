import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

const MISSING_ENV_ERROR = { message: "Supabase env vars are missing" };

function missingResult({ single = false } = {}) {
  return single
    ? { data: null, error: MISSING_ENV_ERROR }
    : { data: [], error: MISSING_ENV_ERROR, count: 0 };
}

function createMissingQueryBuilder() {
  let result = missingResult();

  const builder = {
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    ilike() {
      return builder;
    },
    order() {
      return builder;
    },
    or() {
      return builder;
    },
    range() {
      return builder;
    },
    limit() {
      return builder;
    },
    gte() {
      return builder;
    },
    lte() {
      return builder;
    },
    insert() {
      result = missingResult();
      return builder;
    },
    upsert() {
      result = missingResult();
      return builder;
    },
    update() {
      result = missingResult({ single: true });
      return builder;
    },
    delete() {
      result = missingResult();
      return builder;
    },
    maybeSingle() {
      result = missingResult({ single: true });
      return Promise.resolve(result);
    },
    single() {
      result = missingResult({ single: true });
      return Promise.resolve(result);
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve(result).catch(reject);
    },
    finally(callback) {
      return Promise.resolve(result).finally(callback);
    },
  };

  return builder;
}

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
      async signInWithOAuth() {
        return {
          data: null,
          error: { message: "Supabase env vars are missing" },
        };
      },
      async signOut() {
        return {
          error: { message: "Supabase env vars are missing" },
        };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
    },
    from() {
      return createMissingQueryBuilder();
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
