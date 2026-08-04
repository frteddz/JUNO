import { openApp, closeApp } from "./apps.js";
import { calculate } from "./calc.js";
import { listDir, readTextFile, searchFiles } from "./files.js";
import { getSystemInfo } from "./system.js";
import {
  launchApp,
  runInTerminal,
  stopTracked,
  installPackage,
  listTracked,
  isTerminalSupported,
} from "./terminal.js";
import type { ActionResult, Dispatcher, ParsedIntent } from "./types.js";

export type ExecContext = { cwd?: string };

export function createDispatcher(_ctx: ExecContext = {}): Dispatcher {
  return async (intent: ParsedIntent): Promise<ActionResult> => {
    try {
      switch (intent.intent) {
        case "open": {
          if (!isTerminalSupported()) {
            await openApp(intent.app, intent.search);
            return { ok: true, message: `Opened ${intent.app}${intent.search ? ` and searched "${intent.search}"` : ""}` };
          }
          const launched = await launchApp(intent.app, intent.search);
          if (!launched.ok) return { ok: false, error: launched.message, message: launched.message };
          return { ok: true, message: `Opened ${intent.app}${intent.search ? ` and searched "${intent.search}"` : ""}` };
        }
        case "close": {
          const stopped = await stopTracked(intent.app);
          if (stopped.ok) {
            return { ok: true, message: `Closed ${intent.app} (pid ${stopped.matched.pid})` };
          }
          await closeApp(intent.app);
          return { ok: true, message: `Closed ${intent.app}` };
        }
        case "file.read": {
          const content = await readTextFile(intent.path);
          return { ok: true, message: `Read ${intent.path}`, data: { content } };
        }
        case "file.write": {
          const { writeFile, mkdir } = await import("node:fs/promises");
          const { dirname } = await import("node:path");
          await mkdir(dirname(intent.path), { recursive: true });
          await writeFile(intent.path, intent.content, "utf8");
          return { ok: true, message: `Wrote ${intent.path}` };
        }
        case "file.list": {
          const entries = await listDir(intent.path);
          return { ok: true, message: `${entries.length} entries in ${intent.path}`, data: { entries } };
        }
        case "file.search": {
          const hits = await searchFiles(intent.path, intent.query);
          return { ok: true, message: `${hits.length} matches for "${intent.query}"`, data: { hits } };
        }
        case "calc": {
          const value = calculate(intent.expression);
          return { ok: true, message: `${intent.expression} = ${value}`, data: { value } };
        }
        case "sys.info": {
          const info = getSystemInfo();
          return { ok: true, message: "System information", data: { info } };
        }
        case "terminal": {
          const result = await runInTerminal(intent.command, {
            label: intent.label,
            cwd: intent.cwd,
            timeoutMs: 60_000,
          });
          const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
          const tail = output.length > 2000 ? `${output.slice(0, 2000)}\n… (truncated)` : output;
          const status = result.timedOut
            ? "timed out after 60s"
            : result.code === null
              ? "could not start"
              : `exit ${result.code}`;
          return {
            ok: result.ok,
            message: `$ ${intent.command}\n${tail || status}`,
            data: { code: result.code, timedOut: result.timedOut, output },
          };
        }
        case "install": {
          const result = await installPackage(intent.package);
          const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
          const tail = output.length > 2000 ? `${output.slice(0, 2000)}\n… (truncated)` : output;
          if (result.ok) {
            return { ok: true, message: `Installed ${intent.package}: ${result.command}`, data: { command: result.command } };
          }
          return {
            ok: false,
            error: result.suggest ?? "Install failed",
            message: `Install ${intent.package} failed:\n${tail}\n${result.suggest ?? ""}`.trim(),
            data: { command: result.command, code: result.code },
          };
        }
        case "timer":
        case "reminder": {
          return { ok: false, error: "Timers/reminders must be handled by the automation engine.", message: "" };
        }
        case "help": {
          return {
            ok: true,
            message:
              "I can open apps, run terminal commands, install packages, read/list/search files, run calculations, show system info, and set timers/reminders.",
            data: { topic: intent.topic, running: listTracked() },
          };
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message, message: `Failed: ${message}` };
    }
    return { ok: false, message: "Unknown intent.", error: "Unknown intent" };
  };
}
