import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SEC,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SEC,
  getApiBaseUrl,
  getSecureCookieFlag
} from "./session";

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

type ProxySuccess<T> = {
  ok: true;
  payload: T;
  refreshedTokens?: Tokens;
};

type ProxyFailure = {
  ok: false;
  status: number;
};

export async function proxyWithAutoRefresh<T>(
  request: NextRequest,
  executeWithToken: (accessToken: string, requestId: string) => Promise<Response>,
  requestId: string
): Promise<ProxySuccess<T> | ProxyFailure> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { ok: false, status: 401 };
  }

  let upstream = await executeWithToken(accessToken, requestId);
  let refreshedTokens: Tokens | undefined;

  if (upstream.status === 401) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) {
      return { ok: false, status: 401 };
    }

    const refreshed = await refreshTokens(refreshToken, requestId);
    if (!refreshed) {
      return { ok: false, status: 401 };
    }
    refreshedTokens = refreshed;
    upstream = await executeWithToken(refreshed.accessToken, requestId);
  }

  if (!upstream.ok) {
    return { ok: false, status: upstream.status };
  }

  const payload = (await upstream.json()) as T;
  return { ok: true, payload, refreshedTokens };
}

export function jsonWithOptionalSession<T>(
  body: T,
  options?: {
    status?: number;
    refreshedTokens?: Tokens;
    requestId?: string;
  }
): NextResponse {
  const response = NextResponse.json(body, { status: options?.status });
  if (options?.refreshedTokens) {
    setSessionCookies(response, options.refreshedTokens);
  }
  if (options?.requestId) {
    response.headers.set("x-request-id", options.requestId);
  }
  return response;
}

export function setSessionCookies(response: NextResponse, tokens: Tokens): void {
  const secure = getSecureCookieFlag();
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_SEC
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SEC
  });
}

async function refreshTokens(refreshToken: string, requestId: string): Promise<Tokens | null> {
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId
    },
    body: JSON.stringify({ refreshToken })
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as Tokens;
}
