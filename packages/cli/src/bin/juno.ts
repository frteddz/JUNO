#!/usr/bin/env node
import { makeProgram, runCommand, CliError } from "../index.js";
import { createEventBus } from "@euthenia/core";

const rawArgs = process.argv.slice(2);

export const SUBCOMMANDS = new Set([
  "open",
  "close",
  "read",
  "run",
  "install",
  "timer",
  "info",
  "config",
  "config-get",
  "config-set",
  "say",
  "auth",
  "help",
  "--help",
  "-h",
  "--version",
  "-V",
  "--run",
]);

async function main(): Promise<void> {
  if (rawArgs.length === 0 || rawArgs[0] === "--run" || rawArgs[0] === "tui") {
    const { startTui } = await import("@euthenia/tui");
    await startTui();
    return;
  }

  const eventBus = createEventBus();
  const program = makeProgram(eventBus);

  const first = rawArgs[0];
  const isSubcommand = first !== undefined && SUBCOMMANDS.has(first);

  if (!isSubcommand && first !== undefined && !first.startsWith("-")) {
    try {
      await runCommand(program, eventBus, rawArgs.join(" "));
      return;
    } catch (err) {
      if (err instanceof CliError) {
        process.exit(2);
      }
      console.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  }

  program.parseAsync().catch((err) => {
    if (err && typeof err.code === "string" && err.code.startsWith("commander.")) {
      process.exit(0);
    }
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

main();