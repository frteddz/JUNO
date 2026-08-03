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

  it("parses find with 'on my pc' defaulting to home dir", () => {
    const r = parseCommand("find mynotes.txt on my pc");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.intent).toMatchObject({ intent: "file.search", query: "mynotes.txt" });
      if (r.intent.intent === "file.search") {
        expect(r.intent.path).toBe(process.env.HOME ?? ".");
      }
    }
  });

  it("parses find with an explicit location", () => {
    const r = parseCommand("find budget.xlsx in Downloads");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "file.search", query: "budget.xlsx", path: "Downloads" });
  });

  it("parses find with comma-separated patterns", () => {
    const r = parseCommand("find report.txt,md,zip on my pc");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "file.search", query: "report.txt,md,zip" });
  });

  it("parses locate and look for aliases", () => {
    const r1 = parseCommand("locate the wallpaper in Pictures");
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.intent).toMatchObject({ intent: "file.search", query: "wallpaper" });
    const r2 = parseCommand("look for notes.md on my computer");
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.intent).toMatchObject({ intent: "file.search", query: "notes.md" });
  });

  it("parses timer with days", () => {
    const r = parseCommand("set a timer for 10d");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "timer", durationMs: 10 * 86_400_000 });
  });

  it("parses timer without 'set'", () => {
    const r = parseCommand("start a 5 minute timer");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "timer", durationMs: 5 * 60_000 });
  });

  it("drops the duration from the timer label", () => {
    const r = parseCommand("set a timer for 10m named cooldown");
    expect(r.ok).toBe(true);
    if (r.ok && r.intent.intent === "timer") {
      expect(r.intent.durationMs).toBe(10 * 60_000);
      expect(r.intent.label).toBe("cooldown");
    }
  });

  it("strips trailing 'and' clause from open", () => {
    const r = parseCommand("open firefox and search the ram prices");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "open", app: "firefox" });
  });

  it("strips trailing 'and' clause from close", () => {
    const r = parseCommand("close spotify and set a 10m timer");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "close", app: "spotify" });
  });

  it("keeps timer words out of open intent", () => {
    const r = parseCommand("start a 5m timer");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "timer", durationMs: 5 * 60_000 });
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