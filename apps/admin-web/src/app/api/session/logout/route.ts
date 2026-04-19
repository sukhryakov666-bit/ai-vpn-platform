import { NextRequest, NextResponse } from "next/server";
import { clearCsrfCookie, validateCsrf } from "../../../../lib/csrf";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, getSecureCookieFlag } from "../../../../lib/session";
import { getRequestId, logEvent } from "../../../../lib/tracing";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);
  if (!validateCsrf(request)) {
    const denied = NextResponse.json({ error: "csrf_mismatch" }, { status: 403 });
    denied.headers.set("x-request-id", requestId);
    return denied;
  }
  const response = NextResponse.json({ success: true });
  const secure = getSecureCookieFlag();
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0
  });
  clearCsrfCookie(response);
  response.headers.set("x-request-id", requestId);
  logEvent("admin-web.session", "logout", { request_id: requestId });
  return response;
}
