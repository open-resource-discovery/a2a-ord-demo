import { describe, it, after, before } from "node:test";
import assert from "node:assert";
import type { Server } from "node:http";

let server: Server;
let baseUrl: string;

before(async () => {
  process.env.PORT = "0";
  process.env.SERVER_URL = "http://localhost";
  const mod = await import("./index.js");
  server = mod.server;
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  baseUrl = `http://localhost:${port}`;
});

after(() => {
  server?.close();
});

describe("Spaceship App", () => {
  it("returns health ok", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, "ok");
  });

  it("serves Solar agent card", async () => {
    const res = await fetch(`${baseUrl}/solar/agent.json`);
    assert.strictEqual(res.status, 200);
    const card = await res.json();
    assert.strictEqual(card.name, "Solar System Explorer");
    assert.ok(card.url.endsWith("/solar"));
    assert.ok(Array.isArray(card.skills));
    assert.ok(card.skills.length >= 2);
  });

  it("serves Repair agent card", async () => {
    const res = await fetch(`${baseUrl}/repair/agent.json`);
    assert.strictEqual(res.status, 200);
    const card = await res.json();
    assert.strictEqual(card.name, "Repair Technician");
    assert.ok(card.url.endsWith("/repair"));
    assert.ok(Array.isArray(card.skills));
    assert.ok(card.skills.length >= 2);
  });
});
