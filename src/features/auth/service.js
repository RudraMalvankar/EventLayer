import { supabase, supabaseAdmin } from "../../shared/clients/supabase.js";

export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token)
    throw new Response(JSON.stringify({ data: null, error: "Unauthorized" }), {
      status: 401,
    });
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user)
    throw new Response(JSON.stringify({ data: null, error: "Unauthorized" }), {
      status: 401,
    });
  return { user: data.user };
}
