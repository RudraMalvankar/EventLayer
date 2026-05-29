import { requireAuth } from "../../../src/features/auth/service";
import { supabaseAdmin } from "../../../src/shared/clients/supabase";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const ALLOWED_FIELDS = [
  "display_name",
  "first_name",
  "city",
  "interests",
  "event_types",
  "profile_picture_url",
];

function profilePayload(body = {}) {
  const payload = {};

  ALLOWED_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  });

  if (body.display_name) {
    payload.name = body.display_name;
  }

  return payload;
}

function legacyProfilePayload(body = {}) {
  const payload = {};

  if (body.display_name) payload.name = body.display_name;
  if (body.city) payload.city = body.city;
  if (Array.isArray(body.interests)) payload.interests = body.interests;

  return payload;
}

function isMissingColumnError(error) {
  return (
    error?.code === "PGRST204" ||
    String(error?.message || "").includes("Could not find")
  );
}

async function resolveUser(request) {
  try {
    const auth = await requireAuth(request);
    if (auth?.user) return auth.user;
  } catch {}

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) return session.user;

  throw new Response(JSON.stringify({ data: null, error: "Unauthorized" }), {
    status: 401,
  });
}

export async function GET(request) {
  try {
    const user = await resolveUser(request);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return Response.json({ data: null, error: error.message }, { status: 500 });
    }

    return Response.json({
      data: {
        profile: data || null,
        user: { id: user.id, email: user.email },
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request) {
  try {
    const user = await resolveUser(request);
    const body = await request.json();
    const payload = profilePayload(body);

    let { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: user.id, ...payload }, { onConflict: "id" })
      .select("*")
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      const legacyPayload = legacyProfilePayload(body);
      const legacyResult = await supabaseAdmin
        .from("profiles")
        .upsert({ id: user.id, ...legacyPayload }, { onConflict: "id" })
        .select("*")
        .maybeSingle();
      data = legacyResult.data;
      error = legacyResult.error;
    }

    if (error) {
      return Response.json({ data: null, error: error.message }, { status: 500 });
    }

    return Response.json({ data: { profile: data }, error: null });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}
