import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route";

type CookieBag = Record<string, string | undefined>;

function makeRequest(options: { cookies?: CookieBag; headerToken?: string; requestId?: string }): unknown {
  const cookies = options.cookies ?? {};
  return {
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value ? { value } : undefined;
      }
    },
    headers: {
      get: (name: string) => {
        if (name === "x-csrf-token") {
          return options.headerToken ?? null;
        }
        if (name === "x-request-id") {
          return options.requestId ?? null;
        }
        return null;
      }
    }
  };
}

test("link-code route rejects request with missing csrf header", async () => {
  const response = await POST(
    makeRequest({
      cookies: { avp_csrf_token: "csrf-1" },
      requestId: "req-link-missing"
    }) as never
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "csrf_mismatch" });
  assert.equal(response.headers.get("x-request-id"), "req-link-missing");
});

test("link-code route rejects request with mismatched csrf token", async () => {
  const response = await POST(
    makeRequest({
      cookies: { avp_csrf_token: "csrf-1" },
      headerToken: "csrf-2",
      requestId: "req-link-mismatch"
    }) as never
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "csrf_mismatch" });
  assert.equal(response.headers.get("x-request-id"), "req-link-mismatch");
});

test("link-code route passes csrf check and returns session_expired when access cookie missing", async () => {
  const response = await POST(
    makeRequest({
      cookies: { avp_csrf_token: "csrf-ok" },
      headerToken: "csrf-ok",
      requestId: "req-link-valid-csrf"
    }) as never
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "session_expired" });
  assert.equal(response.headers.get("x-request-id"), "req-link-valid-csrf");
});
