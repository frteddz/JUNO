import { z } from "zod";
import type { JunoEventBus, JunoStore } from "@euthenia/core";

export const PluginManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  commands: z.array(z.string()).default([]),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

export type PluginContext = {
  bus: JunoEventBus;
  store: JunoStore;
  registerCommand: (pattern: string, handler: (input: string, args: string[]) => Promise<string>) => void;
};

export type JunoPlugin = {
  manifest: PluginManifest;
  activate(ctx: PluginContext): Promise<void> | void;
  deactivate?(): Promise<void>;
};

export class PluginRegistry {
  private plugins = new Map<string, JunoPlugin>();
  private commandHandlers = new Map<string, (input: string, args: string[]) => Promise<string>>();

  register(plugin: JunoPlugin): void {
    if (this.plugins.has(plugin.manifest.name)) {
      throw new Error(`Plugin "${plugin.manifest.name}" already registered`);
    }
    this.plugins.set(plugin.manifest.name, plugin);
  }

  async activateAll(ctx: PluginContext): Promise<void> {
    for (const plugin of this.plugins.values()) {
      const register = (pattern: string, handler: (input: string, args: string[]) => Promise<string>) => {
        this.commandHandlers.set(pattern, handler);
      };
      await plugin.activate({ ...ctx, registerCommand: register });
    }
  }

  async deactivateAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.deactivate?.();
    }
    this.plugins.clear();
    this.commandHandlers.clear();
  }

  list(): PluginManifest[] {
    return [...this.plugins.values()].map((p) => p.manifest);
  }

  async runCommand(pattern: string, input: string, args: string[]): Promise<string | undefined> {
    const handler = this.commandHandlers.get(pattern) ?? this.commandHandlers.get("*");
    if (!handler) return undefined;
    return handler(input, args);
  }

  count(): number {
    return this.plugins.size;
  }
}

export function definePlugin(plugin: JunoPlugin): JunoPlugin {
  return plugin;
}