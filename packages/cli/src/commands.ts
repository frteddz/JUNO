import { Command } from "commander";
import chalk from "chalk";
import {
  getStore,
  createDispatcher,
  parseCommand,
  describeIntent,
  getSystemInfo,
  readTextFile,
  getConfig,
  saveConfig,
  openApp,
  closeApp,
  runInTerminal,
  installPackage,
  createEventBus,
  type JunoEventBus,
} from "@euthenia/core";
import { startTimer, scheduleReminder } from "@euthenia/automation";
import { AiEngine, runAiTurn } from "@euthenia/ai";

export function makeProgram(bus?: JunoEventBus): Command {
  const eventBus = bus ?? createEventBus();
  const program = new Command();
  program
    .name("juno")
    .version("0.3.1")
    .description("JUNO - Just Understands Natural Orders. A local-first command assistant.")
    .option("--json", "output JSON for scripting")
    .exitOverride();

  program
    .command("open <app>")
    .description("Open an application")
    .action(async (app: string) => {
      await openApp(app);
      print(program, { ok: true, message: `Opened ${app}` });
    });

  program
    .command("close <app>")
    .description("Close an application")
    .action(async (app: string) => {
      await closeApp(app);
      print(program, { ok: true, message: `Closed ${app}` });
    });

  program
    .command("read <path>")
    .description("Read a file")
    .action(async (path: string) => {
      const content = await readTextFile(path);
      if (program.opts().json) console.log(JSON.stringify({ ok: true, content }));
      else console.log(content);
    });

  program
    .command("timer <duration>")
    .description('Set a timer, e.g. "timer 30m" or "timer 90s"')
    .action((duration: string) => {
      const ms = parseDuration(duration);
      if (ms <= 0) {
        console.error(chalk.red("Invalid duration. Use e.g. 30m, 90s, 1h."));
        process.exit(2);
      }
      const timer = startTimer({ durationMs: ms }, eventBus);
      print(program, { ok: true, message: `Timer set (${timer.id})` });
    });

  program
    .command("info")
    .description("Show system information")
    .action(() => {
      const info = getSystemInfo();
      if (program.opts().json) {
        console.log(JSON.stringify(info));
        return;
      }
      console.log(
        [
          `Platform  ${info.platform} ${info.arch}`,
          `Host      ${info.hostname} (${info.user})`,
          `CPU       ${info.cpuModel} x${info.cpuCount}`,
          `Memory    ${Math.round(info.usedMemPercent)}% used`,
          `Uptime    ${Math.floor(info.uptimeSec / 60)}m`,
          `Node      ${info.nodeVersion}`,
        ].join("\n")
      );
    });

  const config = program.command("config").description("Read or update configuration");
  config
    .command("get [key]")
    .description("Read configuration")
    .action(async (key?: string) => {
      const cfg = await getConfig();
      if (key) {
        console.log(JSON.stringify((cfg as unknown as Record<string, unknown>)[key] ?? null));
      } else {
        console.log(JSON.stringify(cfg, null, program.opts().json ? 0 : 2));
      }
    });

  config
    .command("set <key> <value>")
    .description("Update configuration")
    .action(async (key: string, value: string) => {
      const next = await saveConfig(parseConfigPatch(key, value));
      const updated = (next as unknown as Record<string, unknown>)[key];
      console.log(chalk.green(`${key} = ${String(updated)}`));
    });

  program
    .command("auth")
    .description("Sign in to DeepSeek in a browser window (required once for AI mode)")
    .action(async () => {
      const engine = new AiEngine(false);
      await engine.beginVisibleAuth();
      console.log(chalk.cyan("Sign in to DeepSeek in the opened browser window, then come back here."));
      await engine.waitForSignedInAuth();
      const account = await engine.whoami();
      console.log(chalk.green(`Signed in as ${account ?? "your DeepSeek account"}. AI is ready.`));
      await engine.close();
    });

  program
    .command("run <command>")
    .description("Run a shell command in your terminal session")
    .option("-l, --label <label>", "label the process so it can be closed later")
    .action(async (command: string, opts: { label?: string }) => {
      const result = await runInTerminal(command, { label: opts.label });
      const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
      if (program.opts().json) {
        console.log(JSON.stringify({ ok: result.ok, code: result.code, output, timedOut: result.timedOut }));
        return;
      }
      if (output) console.log(output);
      if (result.timedOut) {
        console.error(chalk.red("Timed out."));
        process.exitCode = 2;
      } else if (result.code !== 0) {
        process.exitCode = result.code ?? 2;
      }
    });

  program
    .command("install <package>")
    .description("Install a software package using your OS package manager")
    .action(async (pkg: string) => {
      const result = await installPackage(pkg);
      const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
      if (program.opts().json) {
        console.log(JSON.stringify({ ok: result.ok, command: result.command, code: result.code, output }));
        return;
      }
      if (output) console.log(output);
      if (result.ok) {
        console.log(chalk.green(`Installed ${pkg} via ${result.command}`));
      } else {
        console.error(chalk.red(result.suggest ?? "Install failed"));
        process.exitCode = result.code ?? 2;
      }
    });

  program
    .command("say <text>")
    .description("Execute a natural-language command")
    .action(async (text: string) => {
      await runCommand(program, eventBus, text);
    });

  return program;
}

async function runCommand(program: Command, bus: JunoEventBus, text: string): Promise<void> {
  const store = getStore();
  const sessionId = store.createSession().id;
  const ts = new Date().toISOString();
  store.addMessage(sessionId, { id: crypto.randomUUID(), role: "user", content: text, ts });

  const config = await getConfig();
  if (config.aiProvider === "deepseek") {
    const engine = new AiEngine(true);
    try {
      let lastText = "";
      const result = await runAiTurn(engine, text, bus, (patch) => {
        if (patch.phase === "generating" || patch.phase === "done") {
          lastText = patch.text;
        }
      });
      if (result.action) {
        console.log(result.ok ? chalk.green(result.message) : chalk.red(result.message));
      } else {
        console.log(chalk.green(result.message ?? lastText));
      }
    } catch (err) {
      console.error(
        chalk.red(`AI unavailable: ${err instanceof Error ? err.message : String(err)}\nRun \`juno auth\` to sign in.`),
      );
      throw new CliError("AI unavailable");
    } finally {
      await engine.close().catch(() => {});
    }
    return;
  }

  const parsed = parseCommand(text);
  if (!parsed.ok) {
    console.error(chalk.red(parsed.error));
    throw new CliError(parsed.error);
  }

  if (parsed.intent.intent === "timer") {
    startTimer({ durationMs: parsed.intent.durationMs, label: parsed.intent.label }, bus);
    print(program, { ok: true, message: describeIntent(parsed.intent) });
    return;
  }
  if (parsed.intent.intent === "reminder") {
    scheduleReminder({ at: parsed.intent.at, label: parsed.intent.label }, bus);
    print(program, { ok: true, message: describeIntent(parsed.intent) });
    return;
  }

  const dispatcher = createDispatcher();
  const result = await dispatcher(parsed.intent);
  store.addMessage(sessionId, { id: crypto.randomUUID(), role: "assistant", content: result.message, ts: new Date().toISOString() });

  if (program.opts().json) {
    console.log(JSON.stringify({ ok: result.ok, message: result.message, data: result.data ?? null }));
  } else if (result.ok) {
    console.log(chalk.green(result.message));
  } else {
    console.error(chalk.red(result.message));
    throw new CliError(result.message);
  }
}

function parseDuration(raw: string): number {
  const m = /^(\d+(?:\.\d+)?)\s*(s|m|h)$/i.exec(raw.trim());
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "s") return n * 1000;
  if (unit === "m") return n * 60_000;
  return n * 3_600_000;
}

function parseConfigPatch(key: string, value: string): Record<string, unknown> {
  if (key === "apiPort") return { apiPort: Number(value) };
  if (key === "confirmDestructive" || key === "animate" || key === "historyEnabled") {
    return { [key]: value === "true" || value === "1" };
  }
  return { [key]: value };
}

function print(program: Command, result: { ok: boolean; message: string }): void {
  if (program.opts().json) {
    console.log(JSON.stringify(result));
  } else {
    console.log(result.ok ? chalk.green(result.message) : chalk.red(result.message));
  }
}

export class CliError extends Error {}

export { runCommand };