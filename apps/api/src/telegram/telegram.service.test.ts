import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { TelegramService } from "./telegram.service";

test("createLinkCode stores hashed code and returns TTL-bound token", async () => {
  let createdRecord:
    | {
        userId: string;
        codeHash: string;
        expiresAt: Date;
      }
    | undefined;

  const service = new TelegramService(
    {
      telegramLinkCode: {
        create: async ({ data }: { data: { userId: string; codeHash: string; expiresAt: Date } }) => {
          createdRecord = data;
          return { id: "lc-1", ...data };
        }
      }
    } as never,
    {
      findByEmail: async (email: string) => ({ id: "user-1", email })
    } as never
  );

  const before = Date.now();
  const result = await service.createLinkCode({ email: "user@example.com" });
  const after = Date.now();

  assert.match(result.code, /^[A-F0-9]{8}$/);
  assert.ok(createdRecord);
  assert.equal(createdRecord?.userId, "user-1");
  assert.equal(createdRecord?.codeHash.length, 64);
  const expiresAtMs = new Date(result.expiresAt).getTime();
  assert.ok(expiresAtMs >= before + 9 * 60_000);
  assert.ok(expiresAtMs <= after + 11 * 60_000);
});

test("redeemLinkCode links telegram profile and marks code as used", async () => {
  let linked:
    | {
        userId: string;
        telegramUserId: string;
        telegramUsername?: string;
      }
    | undefined;
  let usedId: string | undefined;

  const service = new TelegramService(
    {
      telegramLinkCode: {
        findUnique: async () => ({
          id: "lc-1",
          userId: "user-1",
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: { email: "user@example.com" }
        }),
        update: async ({ where }: { where: { id: string } }) => {
          usedId = where.id;
          return { id: where.id };
        }
      }
    } as never,
    {
      linkTelegramProfile: async (userId: string, telegramUserId: string, telegramUsername?: string) => {
        linked = { userId, telegramUserId, telegramUsername };
        return {} as never;
      }
    } as never
  );

  const result = await service.redeemLinkCode({
    code: "ABCDEF12",
    telegramUserId: "10001",
    telegramUsername: "vpn_user"
  });

  assert.deepEqual(linked, {
    userId: "user-1",
    telegramUserId: "10001",
    telegramUsername: "vpn_user"
  });
  assert.equal(usedId, "lc-1");
  assert.deepEqual(result, { linked: true, email: "user@example.com" });
});

test("redeemLinkCode rejects expired or already used code", async () => {
  const service = new TelegramService(
    {
      telegramLinkCode: {
        findUnique: async () => ({
          id: "lc-expired",
          userId: "user-1",
          usedAt: new Date(),
          expiresAt: new Date(Date.now() - 1_000),
          user: { email: "user@example.com" }
        })
      }
    } as never,
    {
      linkTelegramProfile: async () => ({} as never)
    } as never
  );

  await assert.rejects(
    () =>
      service.redeemLinkCode({
        code: "ABCDEF12",
        telegramUserId: "10001"
      }),
    (error: unknown) => error instanceof NotFoundException
  );
});
