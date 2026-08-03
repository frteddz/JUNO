import { describe, it, expect } from "vitest";
import { parseCron, cronMatches } from "../src/cron";

describe("cron", () => {
  it("parses a valid expression", () => {
    const fields = parseCron("0 9 * * *");
    expect(fields.minute).toBe(0);
    expect(fields.hour).toBe(9);
    expect(fields.dayOfMonth).toBe(-1);
  });

  it("rejects bad arity", () => {
    expect(() => parseCron("0 9 * *")).toThrow();
  });

  it("matches a specific time", () => {
    const at9 = parseCron("0 9 * * *");
    expect(cronMatches(at9, new Date(2026, 7, 3, 9, 0, 0))).toBe(true);
    expect(cronMatches(at9, new Date(2026, 7, 3, 10, 0, 0))).toBe(false);
  });
});