import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CSRF_TOKEN_COOKIE, getSecureCookieFlag } from "./session";

export function issueCsrfToken(): string {
  return randomUUID();
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false,
    sameSite: "strict",
    secure: getSecureCookieFlag(),
    path: "/"
  });
}

export function clearCsrfCookie(response: NextResponse): void {
  response.cookies.set(CSRF_TOKEN_COOKIE, "", {
    httpOnly: false,
    sameSite: "strict",
    secure: getSecureCookieFlag(),
    path: "/",
    maxAge: 0
  });
}

export function validateCsrf(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}
