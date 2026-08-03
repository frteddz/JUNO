import { openApp, closeApp } from "./apps.js";
import { calculate } from "./calc.js";
import { listDir, readTextFile, searchFiles } from "./files.js";
import { getSystemInfo } from "./system.js";
import type { ActionResult, Dispatcher, ParsedIntent } from "./types.js";

export type ExecContext = { cwd?: string };

export function createDispatcher(_ctx: ExecContext = {}): Dispatcher {
  return async (intent: ParsedIntent): Promise<ActionResult> => {
    try {
      switch (intent.intent) {
        case "open": {
          await openApp(intent.app);
          return { ok: true, message: `Opened ${intent.app}` };
        }
        case "close": {
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
        case "timer":
        case "reminder": {
          return { ok: false, error: "Timers/reminders must be handled by the automation engine.", message: "" };
        }
        case "help": {
          return {
            ok: true,
            message:
              "I can open apps, read/list/search files, run calculations, show system info, and set timers/reminders.",
            data: { topic: intent.topic },
          };
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message, message: `Failed: ${message}` };
    }
    return { ok: false, message: "Unknown intent.", error: "Unknown intent" };
  }
}