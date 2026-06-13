import {
  verifyAdminCredentials,
  createAdminLoginResponse,
  createAdminLogoutResponse,
  getDefaultAdminHint,
} from "../../../../src/features/auth/adminSession.js";
import { withRateLimit } from "../../../../src/shared/security/rateLimiter.js";

async function postHandler(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = verifyAdminCredentials(body.email, body.password);
    if (!result.ok) {
      return Response.json(
        { data: null, error: "Invalid admin email or password" },
        { status: 401 },
      );
    }
    return createAdminLoginResponse(result.email);
  } catch (err) {
    console.error("Admin login error:", err);
    return Response.json(
      { data: null, error: "Login failed — check server logs" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(postHandler, {
  routeName: "admin-login",
  limit: 10,       // 10 attempts
  windowMs: 60_000, // per minute
});

export async function DELETE() {
  return createAdminLogoutResponse();
}

export async function GET() {
  return Response.json({ data: getDefaultAdminHint(), error: null });
}
