import { createHash } from "crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { AuthService } from "./auth.service";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

test("refresh rotates token and revokes previous refresh token", async () => {
  const tokenStore = new Map<
    string,
    { id: string; tokenHash: string; userId: string; expiresAt: Date; revokedAt: Date | null; replacedById: string | null }
  >();
  const oldRefreshToken = "refresh-old";
  const oldEntry: {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedById: string | null;
  } = {
    id: "rt-1",
    tokenHash: hashToken(oldRefreshToken),
    userId: "user-1",
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    replacedById: null
  };
  tokenStore.set(oldEntry.tokenHash, oldEntry);

  let seq = 0;
  const refreshPayloads = new Map<string, { sub: string; email: string }>();
  const jwtService = {
    signAsync: async (payload: { sub: string; email: string }, options?: { expiresIn?: string }) => {
      seq += 1;
      if (options?.expiresIn === "15m") {
        return `access-${seq}`;
      }
      const token = `refresh-${seq}`;
      refreshPayloads.set(token, payload);
      return token;
    },
    verifyAsync: async (token: string) => {
      if (token === oldRefreshToken) {
        return { sub: "user-1", email: "user@example.com" };
      }
      const payload = refreshPayloads.get(token);
      if (!payload) {
        throw new Error("Unknown refresh token");
      }
      return payload;
    }
  };

  const prisma = {
    refreshToken: {
      findUnique: async ({ where }: { where: { tokenHash: string } }) => tokenStore.get(where.tokenHash) ?? null,
      create: async ({
        data
      }: {
        data: { userId: string; tokenHash: string; expiresAt: Date };
      }) => {
        const entry = {
          id: `rt-${tokenStore.size + 1}`,
          tokenHash: data.tokenHash,
          userId: data.userId,
          expiresAt: data.expiresAt,
          revokedAt: null,
          replacedById: null
        };
        tokenStore.set(data.tokenHash, entry);
        return entry;
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string };
        data: { revokedAt: Date; replacedById: string };
      }) => {
        const entry = [...tokenStore.values()].find((value) => value.id === where.id);
        if (!entry) {
          throw new Error("Token not found");
        }
        entry.revokedAt = data.revokedAt;
        entry.replacedById = data.replacedById;
        return entry;
      },
      updateMany: async () => ({ count: 0 })
    }
  };

  const service = new AuthService(
    prisma as never,
    {} as never,
    jwtService as never,
    {
      getOrThrow: (key: string) => (key.includes("ACCESS") ? "access-secret" : "refresh-secret")
    } as never
  );

  const result = await service.refresh(oldRefreshToken);
  assert.ok(result.accessToken.startsWith("access-"));
  assert.ok(result.refreshToken.startsWith("refresh-"));
  assert.notEqual(result.refreshToken, oldRefreshToken);

  const rotatedEntry = tokenStore.get(hashToken(result.refreshToken));
  assert.ok(rotatedEntry);
  assert.equal(rotatedEntry?.userId, "user-1");
  assert.equal(oldEntry.replacedById, rotatedEntry?.id ?? null);
  assert.ok(oldEntry.revokedAt instanceof Date);
});
