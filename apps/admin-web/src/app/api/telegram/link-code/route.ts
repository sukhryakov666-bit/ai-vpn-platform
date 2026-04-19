import { NextRequest, NextResponse } from "next/server";
import { jsonWithOptionalSession, proxyWithAutoRefresh } from "../../../../lib/auth-proxy";
import { validateCsrf } from "../../../../lib/csrf";
import { getApiBaseUrl } from "../../../../lib/session";
import { getRequestId, logEvent } from "../../../../lib/tracing";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);
  if (!validateCsrf(request)) {
    const denied = NextResponse.json({ error: "csrf_mismatch" }, { status: 403 });
    denied.headers.set("x-request-id", requestId);
    return denied;
  }
  const result = await proxyWithAutoRefresh<{ code: string; expiresAt: string }>(
    request,
    (accessToken, rid) =>
      fetch(`${getApiBaseUrl()}/telegram-self/link-code`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          "x-request-id": rid
        }
      }),
    requestId
  );

  if (!result.ok) {
    const error =
      result.status === 401
        ? "session_expired"
        : result.status >= 500
          ? "api_unavailable"
          : "link_code_issue_failed";
    logEvent("admin-web.telegram", "link_code_issue_failed", {
      request_id: requestId,
      status: result.status,
      error
    });
    const response = NextResponse.json({ error }, { status: result.status });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const response = jsonWithOptionalSession(result.payload, {
    refreshedTokens: result.refreshedTokens,
    requestId
  });
  logEvent("admin-web.telegram", "link_code_issued", {
    request_id: requestId,
    refreshed: Boolean(result.refreshedTokens)
  });
  return response;
}
