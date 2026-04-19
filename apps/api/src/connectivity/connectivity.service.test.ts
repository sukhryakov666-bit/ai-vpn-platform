import assert from "node:assert/strict";
import test from "node:test";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { NodeHealth, NodeProtocol, WireGuardProfileStatus } from "@prisma/client";
import { ConnectivityService } from "./connectivity.service";

function buildNode() {
  return {
    id: "node-1",
    name: "wg-eu-1",
    region: "eu-central",
    protocol: NodeProtocol.wireguard,
    endpointHost: "wg-eu-1.example.internal",
    endpointPort: 51820,
    publicKey: "SERVER_PUBLIC_KEY_ABC123456789",
    allowedIps: "0.0.0.0/0",
    dns: "1.1.1.1",
    addressPoolCidr: "10.8.0.0/24",
    health: NodeHealth.healthy,
    isActive: true,
    score: 100
  };
}

test("provisionWireGuardProfile reuses active profile by default", async () => {
  const existing = {
    id: "profile-1",
    config: "[Interface]\nPrivateKey = existing\nAddress = 10.8.0.10/32"
  };
  const service = new ConnectivityService({
    node: {
      findFirst: async () => buildNode()
    },
    wireGuardProfile: {
      findFirst: async () => existing,
      findMany: async () => [],
      create: async () => {
        throw new Error("should_not_create_when_reuse_active");
      }
    }
  } as never);

  const result = await service.provisionWireGuardProfile("user-1", {});
  assert.equal(result.profileId, "profile-1");
  assert.equal(result.config, existing.config);
});

test("provisionWireGuardProfile allocates first free host deterministically", async () => {
  const created: { clientAddress?: string } = {};
  const service = new ConnectivityService({
    node: {
      findFirst: async () => buildNode()
    },
    wireGuardProfile: {
      findFirst: async () => null,
      findMany: async () => [{ clientAddress: "10.8.0.2/32" }, { clientAddress: "10.8.0.4/32" }],
      create: async ({ data }: { data: { clientAddress: string } }) => {
        created.clientAddress = data.clientAddress;
        return { id: "profile-2", ...data };
      }
    }
  } as never);

  const result = await service.provisionWireGuardProfile("user-1", { reuseActive: false });
  assert.equal(created.clientAddress, "10.8.0.3/32");
  assert.equal(result.profileId, "profile-2");
});

test("provisionWireGuardProfile fails when address pool exhausted", async () => {
  const node = {
    ...buildNode(),
    addressPoolCidr: "10.8.0.0/30"
  };
  const service = new ConnectivityService({
    node: {
      findFirst: async () => node
    },
    wireGuardProfile: {
      findFirst: async () => null,
      findMany: async () => [{ clientAddress: "10.8.0.2/32" }],
      create: async () => ({ id: "unexpected" })
    }
  } as never);

  await assert.rejects(
    () => service.provisionWireGuardProfile("user-1", { reuseActive: false }),
    (error: unknown) => error instanceof ConflictException
  );
});

test("provisionWireGuardProfile fails on unsupported cidr", async () => {
  const node = {
    ...buildNode(),
    addressPoolCidr: "10.8.0.0/12"
  };
  const service = new ConnectivityService({
    node: {
      findFirst: async () => node
    },
    wireGuardProfile: {
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({ id: "unexpected" })
    }
  } as never);

  await assert.rejects(
    () => service.provisionWireGuardProfile("user-1", { reuseActive: false }),
    (error: unknown) => error instanceof ConflictException
  );
});

test("provisionWireGuardProfile skips unhealthy nodes", async () => {
  let whereClause: unknown;
  const service = new ConnectivityService({
    node: {
      findFirst: async ({ where }: { where: unknown }) => {
        whereClause = where;
        return buildNode();
      }
    },
    wireGuardProfile: {
      findFirst: async () => ({
        id: "profile-1",
        config: "existing"
      }),
      findMany: async () => [],
      create: async () => ({ id: "unexpected" })
    }
  } as never);

  await service.provisionWireGuardProfile("user-1", {});
  assert.ok(String(JSON.stringify(whereClause)).includes(NodeHealth.healthy));
  assert.ok(String(JSON.stringify(whereClause)).includes(NodeHealth.degraded));
  assert.ok(!String(JSON.stringify(whereClause)).includes(NodeHealth.unhealthy));
  assert.equal(WireGuardProfileStatus.active, "active");
});

test("revokeWireGuardProfile marks active profile as revoked", async () => {
  let updatePayload: { id: string; status: WireGuardProfileStatus } | undefined;
  const service = new ConnectivityService({
    wireGuardProfile: {
      findFirst: async () => ({
        id: "profile-9",
        userId: "user-1",
        status: WireGuardProfileStatus.active,
        revokedAt: null
      }),
      update: async ({ where, data }: { where: { id: string }; data: { status: WireGuardProfileStatus; revokedAt: Date } }) => {
        updatePayload = { id: where.id, status: data.status };
        return {
          id: where.id,
          revokedAt: data.revokedAt
        };
      }
    }
  } as never);

  const result = await service.revokeWireGuardProfile("user-1", "profile-9");
  assert.equal(result.revoked, true);
  assert.equal(result.profileId, "profile-9");
  assert.ok(result.revokedAt);
  assert.deepEqual(updatePayload, {
    id: "profile-9",
    status: WireGuardProfileStatus.revoked
  });
});

test("revokeWireGuardProfile is idempotent for already revoked profile", async () => {
  const revokedAt = new Date("2026-04-19T09:00:00.000Z");
  const service = new ConnectivityService({
    wireGuardProfile: {
      findFirst: async () => ({
        id: "profile-10",
        userId: "user-1",
        status: WireGuardProfileStatus.revoked,
        revokedAt
      })
    }
  } as never);

  const result = await service.revokeWireGuardProfile("user-1", "profile-10");
  assert.equal(result.revoked, true);
  assert.equal(result.profileId, "profile-10");
  assert.equal(result.revokedAt, revokedAt.toISOString());
});

test("revokeWireGuardProfile rejects unknown profile for user", async () => {
  const service = new ConnectivityService({
    wireGuardProfile: {
      findFirst: async () => null
    }
  } as never);

  await assert.rejects(
    () => service.revokeWireGuardProfile("user-1", "missing"),
    (error: unknown) => error instanceof NotFoundException
  );
});
