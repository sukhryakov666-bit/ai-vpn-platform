import assert from "node:assert/strict";
import test from "node:test";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { NodeProtocol } from "@prisma/client";
import { NodesService } from "./nodes.service";

function buildNode(overrides: Record<string, unknown> = {}) {
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
    score: 100,
    isActive: true,
    ...overrides
  };
}

test("create rejects duplicate endpoint host+port", async () => {
  const service = new NodesService({
    node: {
      findFirst: async () => ({ id: "dup-node" }),
      create: async () => {
        throw new Error("should_not_create_duplicate_endpoint");
      }
    }
  } as never);

  await assert.rejects(
    () =>
      service.create({
        ...buildNode(),
        name: "wg-eu-2"
      }),
    (error: unknown) => error instanceof ConflictException
  );
});

test("create succeeds for unique endpoint", async () => {
  let createdName = "";
  const service = new NodesService({
    node: {
      findFirst: async () => null,
      create: async ({ data }: { data: { name: string } }) => {
        createdName = data.name;
        return buildNode({ id: "node-2", name: data.name });
      }
    }
  } as never);

  const created = await service.create({
    ...buildNode(),
    name: "wg-eu-2",
    endpointHost: "wg-eu-2.example.internal"
  });
  assert.equal(createdName, "wg-eu-2");
  assert.equal(created.id, "node-2");
});

test("update rejects duplicate endpoint from another node", async () => {
  const existing = buildNode({ id: "node-1" });
  const service = new NodesService({
    node: {
      findUnique: async () => existing,
      findFirst: async () => ({ id: "node-2" }),
      update: async () => {
        throw new Error("should_not_update_duplicate_endpoint");
      }
    }
  } as never);

  await assert.rejects(
    () =>
      service.update("node-1", {
        endpointHost: "shared-endpoint.example.internal",
        endpointPort: 443
      }),
    (error: unknown) => error instanceof ConflictException
  );
});

test("update allows keeping own endpoint and applies non-endpoint changes", async () => {
  const existing = buildNode({ id: "node-1" });
  let updatedScore = -1;
  const service = new NodesService({
    node: {
      findUnique: async () => existing,
      findFirst: async () => null,
      update: async ({ data }: { data: { score?: number } }) => {
        updatedScore = data.score ?? -1;
        return { ...existing, ...data };
      }
    }
  } as never);

  const updated = await service.update("node-1", {
    score: 77
  });
  assert.equal(updatedScore, 77);
  assert.equal(updated.score, 77);
});

test("update throws not_found for unknown node", async () => {
  const service = new NodesService({
    node: {
      findUnique: async () => null
    }
  } as never);

  await assert.rejects(
    () => service.update("missing", { score: 80 }),
    (error: unknown) => error instanceof NotFoundException
  );
});
