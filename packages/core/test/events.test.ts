import { describe, it, expect } from "vitest";
import { EventBus } from "../src/events";

describe("EventBus", () => {
  it("emits and receives typed events", () => {
    const bus = new EventBus<{ ping: string }>();
    const got: string[] = [];
    const off = bus.on("ping", (payload) => got.push(payload));
    bus.emit("ping", "one");
    bus.emit("ping", "two");
    expect(got).toEqual(["one", "two"]);
    off();
    bus.emit("ping", "three");
    expect(got).toEqual(["one", "two"]);
  });

  it("supports once listeners", () => {
    const bus = new EventBus<{ ping: string }>();
    let count = 0;
    bus.once("ping", () => count++);
    bus.emit("ping", "a");
    bus.emit("ping", "b");
    expect(count).toBe(1);
  });
});