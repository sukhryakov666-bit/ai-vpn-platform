import assert from "node:assert/strict";
import test from "node:test";
import { parseCorsOrigins } from "./security";

test("parseCorsOrigins parses comma-separated values", () => {
  const parsed = parseCorsOrigins("http://localhost:3001, https://admin.example.com");
  assert.deepEqual(parsed, ["http://localhost:3001", "https://admin.example.com"]);
});

test("parseCorsOrigins uses localhost default", () => {
  const parsed = parseCorsOrigins(undefined);
  assert.deepEqual(parsed, ["http://localhost:3001"]);
});

test("parseCorsOrigins rejects wildcard origin", () => {
  assert.throws(
    () => parseCorsOrigins("https://admin.example.com,*"),
    (error: unknown) => error instanceof Error && error.message.includes("wildcard")
  );
});
