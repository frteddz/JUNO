# JUNO - Plugin Development

Plugins extend JUNO with new commands and capabilities without modifying the core application.

## Structure

A plugin is a module exporting a manifest and an `activate` lifecycle:

```ts
import { definePlugin, type PluginContext } from "@juno/plugins";

export default definePlugin({
  manifest: {
    name: "my-plugin",
    version: "1.0.0",
    description: "A sample plugin",
    commands: ["*"], // respond to any command
  },
  activate(ctx: PluginContext) {
    ctx.registerCommand("*", async (input, args) => {
      return `Handled: ${input} ${args.join(" ")}`;
    });
  },
  deactivate() {
    // optional cleanup
  },
});
```

## The `PluginContext`

| Field | Type | Description |
| --- | --- | --- |
| `bus` | `JunoEventBus` | Publish/listen to JUNO events |
| `store` | `JunoStore` | SQLite-backed persistence |
| `registerCommand` | `(pattern, handler) => void` | Register a command handler |

## Manifest fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | Unique plugin name |
| `version` | string (`x.y.z`) | yes | Semantic version |
| `description` | string | no | Short description |
| `commands` | string[] | no | Command patterns handled |

## Loading plugins

Plugin loading from `~/.juno/plugins` and a `juno plugin` command is on the roadmap
(see [milestone.md](milestone.md)).

## Registering a plugin programmatically

```ts
import { PluginRegistry } from "@juno/plugins";

const registry = new PluginRegistry();
registry.register(myPlugin);
await registry.activateAll({ bus, store, registerCommand });
```