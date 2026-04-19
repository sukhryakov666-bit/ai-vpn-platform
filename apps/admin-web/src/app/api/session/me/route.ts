import { NextRequest, NextResponse } from "next/server";
import { jsonWithOptionalSession, proxyWithAutoRefresh } from "../../../../lib/auth-proxy";
import { issueCsrfToken, setCsrfCookie } from "../../../../lib/csrf";
import { getApiBaseUrl, CSRF_TOKEN_COOKIE } from "../../../../lib/session";
import { getRequestId, logEvent } from "../../../../lib/tracing";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);
  const result = await proxyWithAutoRefresh<unknown>(
    request,
    (accessToken, rid) =>
      fetch(`${getApiBaseUrl()}/auth/me`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "x-request-id": rid
        }
      }),
    requestId
  );

  if (!result.ok) {
    logEvent("admin-web.session", "session_check_failed", { request_id: requestId, status: result.status });
    const response = NextResponse.json({ authenticated: false });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const existingCsrfToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value ?? null;
  const csrfToken = existingCsrfToken ?? issueCsrfToken();
  const response = jsonWithOptionalSession({ authenticated: true, user: result.payload, csrfToken }, {
    refreshedTokens: result.refreshedTokens,
    requestId
  });
  if (!existingCsrfToken) {
    setCsrfCookie(response, csrfToken);
  }
  logEvent("admin-web.session", "session_check_ok", { request_id: requestId, refreshed: Boolean(result.refreshedTokens) });
  return response;
}
