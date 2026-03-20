import { describe, it, after, before } from "node:test";
import assert from "node:assert";
import type { Server } from "node:http";

let server: Server;
let baseUrl: string;

before(async () => {
  process.env.PORT = "0";
  process.env.SERVER_URL = "http://localhost";
  process.env.ORD_SOURCE_URL = "http://localhost:19999";
  const mod = await import("./index.js");
  server = mod.server;
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  baseUrl = `http://localhost:${port}`;
});

after(() => {
  server?.close();
});

describe("My Spaceship (Super Agent)", () => {
  it("serves agent card at /.well-known/agent.json", async () => {
    const res = await fetch(`${baseUrl}/.well-known/agent.json`);
    assert.strictEqual(res.status, 200);
    const card = await res.json();
    assert.strictEqual(card.name, "My Spaceship");
    assert.ok(Array.isArray(card.skills));
    assert.ok(card.skills.length >= 1);
  });

  it("returns health ok", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, "ok");
  });

  it("agent card has spaceship-command skill", async () => {
    const res = await fetch(`${baseUrl}/.well-known/agent.json`);
    const card = await res.json();
    const skillIds = card.skills.map((s: { id: string }) => s.id);
    assert.ok(skillIds.includes("spaceship-command"));
  });
});
