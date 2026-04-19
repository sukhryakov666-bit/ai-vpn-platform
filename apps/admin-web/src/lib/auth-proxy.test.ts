import assert from "node:assert/strict";
import test from "node:test";
import { proxyWithAutoRefresh } from "./auth-proxy";

type CookieBag = Record<string, string | undefined>;

function makeRequest(cookies: CookieBag): unknown {
  return {
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value ? { value } : undefined;
      }
    }
  };
}

test("proxyWithAutoRefresh returns unauthorized when access token is missing", async () => {
  const result = await proxyWithAutoRefresh<{ ok: boolean }>(
    makeRequest({}) as never,
    async () => new Response(null, { status: 200 }),
    "req-1"
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 401);
  }
});

test("proxyWithAutoRefresh refreshes token and retries upstream", async () => {
  const originalFetch = global.fetch;
  let fetchCalls = 0;
  global.fetch = (async (_url: string | URL | Request) => {
    fetchCalls += 1;
    return new Response(
      JSON.stringify({
        accessToken: "new-access",
        refreshToken: "new-refresh"
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    const seenTokens: string[] = [];
    const result = await proxyWithAutoRefresh<{ ok: boolean }>(
      makeRequest({
        avp_access_token: "expired-access",
        avp_refresh_token: "valid-refresh"
      }) as never,
      async (token: string, requestId: string) => {
        assert.equal(requestId, "req-2");
        seenTokens.push(token);
        if (token === "expired-access") {
          return new Response(null, { status: 401 });
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      },
      "req-2"
    );

    assert.equal(fetchCalls, 1);
    assert.deepEqual(seenTokens, ["expired-access", "new-access"]);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.payload, { ok: true });
      assert.deepEqual(result.refreshedTokens, {
        accessToken: "new-access",
        refreshToken: "new-refresh"
      });
    }
  } finally {
    global.fetch = originalFetch;
  }
});
