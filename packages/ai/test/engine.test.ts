import { describe, it, expect } from "vitest";
import { extractAction, ACTION_OPEN, ACTION_CLOSE } from "../src/engine";

describe("extractAction", () => {
  it("parses a plain marker", () => {
    const r = extractAction(`${ACTION_OPEN}{"intent":"open","app":"firefox"}${ACTION_CLOSE}`);
    expect(r).toMatchObject({ intent: "open", app: "firefox" });
  });

  it("parses a marker with trailing prose", () => {
    const text = `Sure thing!\n${ACTION_OPEN}{"intent":"timer","durationMs":600000}${ACTION_CLOSE}`;
    const r = extractAction(text);
    expect(r).toMatchObject({ intent: "timer", durationMs: 600000 });
  });

  it("parses a reminder with ISO date", () => {
    const r = extractAction(
      `${ACTION_OPEN}{"intent":"reminder","at":"2026-08-03T12:00:00.000Z","label":"take a break"}${ACTION_CLOSE}`,
    );
    expect(r).toMatchObject({ intent: "reminder", label: "take a break" });
    if (r?.intent === "reminder") expect(r.at.toISOString()).toBe("2026-08-03T12:00:00.000Z");
  });

  it("returns null without a marker", () => {
    expect(extractAction("just some prose")).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    expect(extractAction(`${ACTION_OPEN}not json${ACTION_CLOSE}`)).toBeNull();
  });

  it("returns null on invalid schema", () => {
    expect(extractAction(`${ACTION_OPEN}{"intent":"open"}${ACTION_CLOSE}`)).toBeNull();
  });

  it("parses a search action", () => {
    const r = extractAction(
      `${ACTION_OPEN}{"intent":"file.search","path":"/home/teddz","query":"mynotes.txt,md"}${ACTION_CLOSE}`,
    );
    expect(r).toMatchObject({ intent: "file.search", path: "/home/teddz", query: "mynotes.txt,md" });
  });
});
