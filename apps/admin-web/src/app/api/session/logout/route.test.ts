import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route";

function makeRequest(options: { cookieToken?: string; headerToken?: string; requestId?: string }): unknown {
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

test("logout rejects request when csrf header is missing", async () => {
  const response = await POST(
    makeRequest({
      cookieToken: "csrf-1",
      requestId: "req-logout-missing"
    }) as never
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "csrf_mismatch" });
  assert.equal(response.headers.get("x-request-id"), "req-logout-missing");
});

test("logout rejects request when csrf token mismatches", async () => {
  const response = await POST(
    makeRequest({
      cookieToken: "csrf-1",
      headerToken: "csrf-2",
      requestId: "req-logout-mismatch"
    }) as never
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "csrf_mismatch" });
  assert.equal(response.headers.get("x-request-id"), "req-logout-mismatch");
});

test("logout succeeds and clears session cookies for valid csrf", async () => {
  const response = await POST(
    makeRequest({
      cookieToken: "csrf-ok",
      headerToken: "csrf-ok",
      requestId: "req-logout-success"
    }) as never
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(response.cookies.get("avp_access_token")?.value, "");
  assert.equal(response.cookies.get("avp_refresh_token")?.value, "");
  assert.equal(response.cookies.get("avp_csrf_token")?.value, "");
  assert.equal(response.headers.get("x-request-id"), "req-logout-success");
});
