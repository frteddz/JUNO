import { describe, it, expect } from "vitest";
import { PluginRegistry, definePlugin, PluginManifestSchema } from "../src/index";

describe("PluginRegistry", () => {
  it("registers and lists plugins", () => {
    const registry = new PluginRegistry();
    registry.register(
      definePlugin({
        manifest: { name: "hello", version: "1.0.0" },
        activate() {},
      })
    );
    expect(registry.count()).toBe(1);
    expect(registry.list()).toMatchObject([{ name: "hello", version: "1.0.0" }]);
  });

  it("rejects duplicate names", () => {
    const registry = new PluginRegistry();
    const plugin = { manifest: { name: "dup", version: "1.0.0" }, activate() {} };
    registry.register(plugin);
    expect(() => registry.register(plugin)).toThrow(/already registered/);
  });

  it("activates and runs commands", async () => {
    const registry = new PluginRegistry();
    const calls: string[] = [];
    registry.register({
      manifest: { name: "cmd", version: "1.0.0", commands: ["*"] },
      activate(ctx) {
        ctx.registerCommand("*", async (input) => {
          calls.push(input);
          return "ok";
        });
      },
    });
    await registry.activateAll({
      bus: {} as never,
      store: {} as never,
      registerCommand() {},
    });
    const out = await registry.runCommand("*", "hello", []);
    expect(out).toBe("ok");
    expect(calls).toEqual(["hello"]);
  });

  it("validates manifests", () => {
    expect(() => PluginManifestSchema.parse({ name: "x", version: "nope" })).toThrow();
  });
});