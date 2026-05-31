import {
  verifyAdminCredentials,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  getDefaultAdminHint,
} from "../../../../src/features/auth/adminSession.js";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = verifyAdminCredentials(body.email, body.password);
    if (!result.ok) {
      return Response.json(
        { data: null, error: "Invalid admin email or password" },
        { status: 401 },
      );
    }
    const res = Response.json({ data: { email: result.email }, error: null });
    return setAdminSessionCookie(res, result.email);
  } catch {
    return Response.json({ data: null, error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = Response.json({ data: { signed_out: true }, error: null });
  return clearAdminSessionCookie(res);
}

export async function GET() {
  return Response.json({ data: getDefaultAdminHint(), error: null });
}
