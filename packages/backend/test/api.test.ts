import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../src/server";
import { createDispatcher } from "@euthenia/core";
import type { FastifyInstance } from "fastify";
import os from "node:os";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";

describe("backend API", () => {
  let app: FastifyInstance;
  let dir: string;

  beforeAll(async () => {
    dir = mkdtempSync(join(os.tmpdir(), "juno-test-"));
    app = await buildServer({ dispatcher: createDispatcher(), dataDir: dir });
  });

  afterAll(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("serves /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().app).toBe("juno");
  });

  it("serves /api/config", async () => {
    const res = await app.inject({ method: "GET", url: "/api/config" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("theme");
  });

  it("executes a calculation command", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/command",
      payload: { text: "what is 12 * 8?" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.intent.intent).toBe("calc");
  });

  it("returns 400 on unparseable command", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/command",
      payload: { text: "zzzz not a real command" },
    });
    expect(res.statusCode).toBe(400);
  });
});