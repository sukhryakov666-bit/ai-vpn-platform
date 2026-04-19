import assert from "node:assert/strict";
import test from "node:test";
import { NextResponse } from "next/server";
import { clearCsrfCookie, issueCsrfToken, setCsrfCookie, validateCsrf } from "./csrf";

function makeRequest(options: { cookieToken?: string; headerToken?: string }): unknown {
  return {
    cookies: {
      get: (name: string) => {
        if (name !== "avp_csrf_token") {
          return undefined;
        }
        return options.cookieToken ? { value: options.cookieToken } : undefined;
      }
    },
    headers: {
      get: (name: string) => {
        if (name !== "x-csrf-token") {
          return null;
        }
        return options.headerToken ?? null;
      }
    }
  };
}

test("validateCsrf returns true for matching cookie/header token", () => {
  const request = makeRequest({ cookieToken: "csrf-1", headerToken: "csrf-1" });
  assert.equal(validateCsrf(request as never), true);
});

test("validateCsrf returns false for missing or mismatched token", () => {
  const missing = makeRequest({ cookieToken: "csrf-1" });
  const mismatch = makeRequest({ cookieToken: "csrf-1", headerToken: "csrf-2" });
  assert.equal(validateCsrf(missing as never), false);
  assert.equal(validateCsrf(mismatch as never), false);
});

test("issueCsrfToken returns non-empty token", () => {
  const token = issueCsrfToken();
  assert.ok(token.length > 10);
});

test("setCsrfCookie and clearCsrfCookie manage response cookie state", () => {
  const response = NextResponse.json({ ok: true });
  setCsrfCookie(response, "csrf-xyz");
  assert.equal(response.cookies.get("avp_csrf_token")?.value, "csrf-xyz");
  clearCsrfCookie(response);
  assert.equal(response.cookies.get("avp_csrf_token")?.value, "");
});
