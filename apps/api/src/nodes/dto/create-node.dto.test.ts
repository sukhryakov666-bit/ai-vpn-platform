import assert from "node:assert/strict";
import test from "node:test";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NodeProtocol } from "@prisma/client";
import { CreateNodeDto } from "./create-node.dto";

function validPayload(): Record<string, unknown> {
  return {
    name: "wg-eu-2",
    region: "eu-central",
    protocol: NodeProtocol.wireguard,
    endpointHost: "wg-eu-2.example.internal",
    endpointPort: 51820,
    publicKey: "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456",
    allowedIps: "0.0.0.0/0",
    dns: "1.1.1.1",
    addressPoolCidr: "10.9.0.0/24",
    score: 80,
    isActive: true
  };
}

test("CreateNodeDto accepts valid endpoint/cidr/score", async () => {
  const dto = plainToInstance(CreateNodeDto, validPayload());
  const errors = await validate(dto);
  assert.equal(errors.length, 0);
});

test("CreateNodeDto rejects invalid endpoint host", async () => {
  const dto = plainToInstance(CreateNodeDto, {
    ...validPayload(),
    endpointHost: "bad host"
  });
  const errors = await validate(dto);
  assert.ok(errors.some((error) => error.property === "endpointHost"));
});

test("CreateNodeDto rejects invalid CIDR", async () => {
  const dto = plainToInstance(CreateNodeDto, {
    ...validPayload(),
    addressPoolCidr: "10.9.0.0"
  });
  const errors = await validate(dto);
  assert.ok(errors.some((error) => error.property === "addressPoolCidr"));
});

test("CreateNodeDto rejects out-of-range score", async () => {
  const dto = plainToInstance(CreateNodeDto, {
    ...validPayload(),
    score: 1000
  });
  const errors = await validate(dto);
  assert.ok(errors.some((error) => error.property === "score"));
});
