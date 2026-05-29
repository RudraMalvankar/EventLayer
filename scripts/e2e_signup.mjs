import dotenv from "dotenv";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function run() {
  let session = null;
  const existingEmail = process.env.E2E_SIGNIN_EMAIL;
  const existingPassword = process.env.E2E_SIGNIN_PASSWORD;

  if (existingEmail && existingPassword) {
    console.log("Using existing test account");
    const { data: signinData, error: signinError } =
      await supabase.auth.signInWithPassword({
        email: existingEmail,
        password: existingPassword,
      });
    if (signinError) {
      console.error("signIn error for existing account", signinError.message);
      process.exit(1);
    }
    session = signinData?.session ?? null;
  } else {
    const ts = Date.now();
    const email = `test.user+${ts}@example.com`;
    const password = `Password!${ts}`;
    console.log("Creating test user", email);

    const { data: signData, error: signError } = await supabase.auth.signUp(
      { email, password },
      {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
      },
    );

    if (signError) {
      if (
        String(signError.message || "").includes("over_email_send_rate_limit")
      ) {
        console.warn(
          "Rate-limited by Supabase email send. Set E2E_SIGNIN_EMAIL and E2E_SIGNIN_PASSWORD to use an existing account.",
        );
        process.exit(0);
      }
      console.error("signUp error", signError);
      process.exit(1);
    }

    console.log(
      "signUp response:",
      !!signData?.session,
      "message:",
      signData?.user?.email || "no-user",
    );

    session = signData?.session ?? null;
    if (!session) {
      console.log("Attempting sign-in...");
      const { data: signinData, error: signinError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signinError) {
        console.warn(
          "signIn error (may require email confirm):",
          signinError.message,
        );
      }
      session = signinData?.session ?? null;
    }
  }

  if (!session) {
    console.log(
      "No session available. Email confirmation may be required. Test cannot proceed automated.",
    );
    process.exit(0);
  }

  console.log("Got session. Applying profile via /api/profile");
  const token = session.access_token;
  const payload = {
    display_name: "E2E Test User",
    city: "Mumbai",
    interests: ["AI", "Web3"],
  };

  const profileResp = await fetch("http://localhost:3000/api/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const profileJson = await profileResp.json();
  console.log("PATCH /api/profile status", profileResp.status, profileJson);

  const getResp = await fetch("http://localhost:3000/api/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getJson = await getResp.json();
  console.log("GET /api/profile status", getResp.status, getJson);

  if (getResp.ok && getJson?.data?.profile) {
    console.log("E2E signup -> profile save succeeded");
    process.exit(0);
  } else {
    console.error("E2E failed to save or fetch profile");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("ERROR", err);
  process.exit(2);
});
