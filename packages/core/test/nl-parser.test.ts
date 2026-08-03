import { describe, it, expect } from "vitest";
import { parseCommand } from "../src/nl-parser";
import { calculate } from "../src/calc";

describe("parseCommand", () => {
  it("parses open intent", () => {
    const r = parseCommand('open "Firefox"');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "open", app: "Firefox" });
  });

  it("parses timer with minutes", () => {
    const r = parseCommand("set a timer for 30 minutes");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "timer", durationMs: 30 * 60_000 });
  });

  it("parses reminder relative time", () => {
    const before = Date.now() + 10 * 60_000;
    const r = parseCommand("remind me in 10 minutes to take a break");
    expect(r.ok).toBe(true);
    if (r.ok && r.intent.intent === "reminder") {
      expect(r.intent.at.getTime()).toBeGreaterThanOrEqual(before - 1000);
      expect(r.intent.label).toContain("take a break");
    }
  });

  it("parses system info", () => {
    const r = parseCommand("show system info");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "sys.info" });
  });

  it("returns no-match for unknown", () => {
    const r = parseCommand("frobnicate the widget");
    expect(r.ok).toBe(false);
  });
});

describe("calculate", () => {
  it("adds, subtracts, multiplies", () => {
    expect(calculate("2 + 3 * 4")).toBe(14);
    expect(calculate("(2 + 3) * 4")).toBe(20);
  });

  it("handles division", () => {
    expect(calculate("10 / 4")).toBe(2.5);
  });

  it("throws on division by zero", () => {
    expect(() => calculate("1 / 0")).toThrow("zero");
  });
});