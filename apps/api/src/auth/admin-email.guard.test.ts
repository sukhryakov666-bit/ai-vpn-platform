import assert from "node:assert/strict";
import test from "node:test";
import { ForbiddenException } from "@nestjs/common";
import { AdminEmailGuard } from "./admin-email.guard";

function makeContext(email?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: email ? { sub: "user-1", email } : undefined
      })
    })
  };
}

test("AdminEmailGuard allows explicitly allowlisted email", () => {
  const guard = new AdminEmailGuard({
    get: () => "admin@ai-vpn.local,ops@ai-vpn.local"
  } as never);
  const allowed = guard.canActivate(makeContext("ops@ai-vpn.local") as never);
  assert.equal(allowed, true);
});

test("AdminEmailGuard rejects non-allowlisted email", () => {
  const guard = new AdminEmailGuard({
    get: () => "admin@ai-vpn.local"
  } as never);
  assert.throws(
    () => guard.canActivate(makeContext("user@example.com") as never),
    (error: unknown) => error instanceof ForbiddenException
  );
});

test("AdminEmailGuard rejects missing user email", () => {
  const guard = new AdminEmailGuard({
    get: () => "admin@ai-vpn.local"
  } as never);
  assert.throws(
    () => guard.canActivate(makeContext(undefined) as never),
    (error: unknown) => error instanceof ForbiddenException
  );
});
