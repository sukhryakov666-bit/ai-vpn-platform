import { NextRequest, NextResponse } from "next/server";
import { setSessionCookies } from "../../../../lib/auth-proxy";
import { issueCsrfToken, setCsrfCookie } from "../../../../lib/csrf";
import { getApiBaseUrl } from "../../../../lib/session";
import { getRequestId, logEvent } from "../../../../lib/tracing";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);
  const body = (await request.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) {
    const response = NextResponse.json({ error: "email_and_password_required" }, { status: 400 });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const apiResponse = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId
    },
    body: JSON.stringify({
      email: body.email,
      password: body.password
    })
  });

  if (!apiResponse.ok) {
    logEvent("admin-web.session", "login_failed", { request_id: requestId, status: apiResponse.status });
    const response = NextResponse.json({ error: "invalid_credentials" }, { status: apiResponse.status });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const tokens = (await apiResponse.json()) as LoginResponse;
  const csrfToken = issueCsrfToken();
  const response = NextResponse.json({ success: true, csrfToken });
  setSessionCookies(response, tokens);
  setCsrfCookie(response, csrfToken);
  response.headers.set("x-request-id", requestId);
  logEvent("admin-web.session", "login_success", { request_id: requestId });

  return response;
}
