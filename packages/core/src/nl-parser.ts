import { homedir } from "node:os";
import { IntentSchema, type ParsedIntent } from "./types.js";

export type ParseResult =
  | { ok: true; intent: ParsedIntent }
  | { ok: false; reason: "no-match" | "invalid"; error: string };

const QUOTED = /"([^"]+)"|'([^']+)'/g;

function firstMatch(input: string, re: RegExp): string | undefined {
  re.lastIndex = 0;
  const m = re.exec(input);
  if (!m) return undefined;
  return (m[1] ?? m[2] ?? m[0]).trim();
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function durationToMs(input: string): number | undefined {
  const m = /(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d)\b/i.exec(input);
  if (!m) return undefined;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return undefined;
  const unit = (m[2] ?? "").toLowerCase()[0];
  if (unit === "s") return n * 1000;
  if (unit === "m") return n * 60_000;
  if (unit === "h") return n * 3_600_000;
  if (unit === "d") return n * 86_400_000;
  return undefined;
}

function stripTrailingClause(name: string): string {
  const clean = name.trim();
  const andMatch = /\s+and\s+/i.exec(clean);
  if (andMatch) return clean.slice(0, andMatch.index).trim();
  return clean;
}

function splitAndClause(app: string): { app: string; search?: string } {
  const andMatch = /\s+and\s+/i.exec(app);
  if (!andMatch) return { app: app.trim() };
  const first = app.slice(0, andMatch.index).trim();
  const rest = app.slice(andMatch.index + andMatch[0].length).trim();
  const searchMatch = /\b(?:search|look up|google|find)\b\s+(.+)/i.exec(rest);
  const restOfClause = searchMatch?.[1];
  if (restOfClause) {
    const q = restOfClause.replace(/^(?:for|the|up)\s+/i, "").trim();
    return { app: first, search: q || undefined };
  }
  return { app: first };
}

function parseRelativeAt(input: string): Date | undefined {
  const ms = durationToMs(input);
  if (ms === undefined) return undefined;
  return new Date(Date.now() + ms);
}

const hourPattern = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
function parseClockTime(input: string): Date | undefined {
  const m = hourPattern.exec(input);
  if (!m) return undefined;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const meridiem = (m[3] ?? "").toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return undefined;
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

export function parseCommand(input: string): ParseResult {
  const text = input.trim();
  const lower = text.toLowerCase();

  const stripQuotes = (s: string) => s.replace(/^["']|["']$/g, "").trim();

  if (/^juno\b/.test(lower)) {
    const rest = text.slice(/^juno\b/.exec(text)![0].length).trim();
    if (rest) return parseCommand(rest);
    return { ok: false, reason: "no-match", error: "Empty command." };
  }

  const result = (intent: unknown) => {
    const parsed = IntentSchema.safeParse(intent);
    if (!parsed.success) return { ok: false as const, reason: "invalid" as const, error: parsed.error.message };
    return { ok: true as const, intent: parsed.data };
  };

  if (/\b(?:open|launch|start)\b/.test(lower) && !/\b(?:timer|remind)\b/.test(lower)) {
    const raw = firstMatch(text, QUOTED) ?? firstMatch(text, /\b(?:open|launch|start)\s+(.+)/i);
    if (raw) {
      const clause = splitAndClause(stripQuotes(raw));
      return result({ intent: "open", app: clause.app, search: clause.search });
    }
  }

  if (/\b(?:close|quit|kill|exit)\b/.test(lower)) {
    const app = firstMatch(text, QUOTED) ?? firstMatch(text, /\b(?:close|quit|kill|exit)\s+(.+)/i);
    if (app) return result({ intent: "close", app: stripQuotes(stripTrailingClause(app)) });
  }

  if (/\b(?:system|sys|computer)\b/.test(lower) && /\b(?:info|status|stats|details)\b/.test(lower)) {
    return result({ intent: "sys.info" });
  }

  if (/\b(?:read|cat)\b/.test(lower) && /\b(?:file|content|contents)\b/.test(lower) === false) {
    const path = firstMatch(text, QUOTED) ?? firstMatch(text, /\b(?:read|cat|show)\s+(.+)/i);
    if (path && !/\b(?:timer|remind)\b/.test(lower)) return result({ intent: "file.read", path: stripQuotes(path) });
  }

  if (/\blist\b/.test(lower) && (/\b(dir|directory|folder|files)\b/.test(lower) || /\b(?:ls|list)\b/.test(lower))) {
    const path =
      firstMatch(text, QUOTED) ??
      firstMatch(text, /\b(?:list|ls)\s+(?:the\s+)?(?:dir|directory|folder|files)\s+(?:in\s+)?(.+)/i) ??
      firstMatch(text, /\b(?:ls|list)\s+(.+)/i);
    if (path) return result({ intent: "file.list", path: stripQuotes(path) });
  }

  if (/\b(?:search|find|locate|look for)\b/.test(lower)) {
    const isPc = /\b(?:on|across|over)\s+(?:my\s+)?(?:pc|computer|system|drive|machine)\b/i.test(lower);
    const locationMatch = /\b(?:in|under|inside)\s+(.+)/i.exec(text);
    const pcMatch = /\b(?:on|across|over)\s+(?:my\s+)?(?:pc|computer|system|drive|machine)\b/i.exec(text);
    const strip = (candidate: string | undefined) => {
      let rest = candidate ? text.replace(candidate, "") : text;
      rest = rest.replace(/\b(?:search|find|locate|look for)\b/i, "");
      rest = rest.replace(/^(?:\s+)?(?:for|the|of|about|a|an)\s+/i, "");
      return rest.trim();
    };
    const rest = strip(locationMatch?.[0] ?? pcMatch?.[0]);
    const quoted = firstMatch(text, QUOTED);
    const query = stripQuotes(quoted ?? rest);
    if (query) {
      const inPath = locationMatch?.[1]?.trim();
      const path = inPath
        ? stripQuotes(inPath)
        : isPc
          ? homedir()
          : process.cwd();
      return result({ intent: "file.search", path, query });
    }
  }

  if (/\b(?:timer|timers?|countdown)\b/.test(lower)) {
    const durationMatch = /(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d)\b/i.exec(text);
    const durationMs = durationToMs(text);
    if (durationMatch && durationMs !== undefined) {
      const label = (firstMatch(text, /\b(?:for|named|called)\s+(?:a\s+)?(.+)/i) ?? "").trim();
      const cleaned = label
        .replace(durationMatch[0], "")
        .trim()
        .replace(/^(?:named|called)\s+/i, "")
        .trim();
      return result({ intent: "timer", durationMs, label: cleaned || undefined });
    }
  }

  if (/\bremind\b|\breminder\b/.test(lower)) {
    const at = parseRelativeAt(text) ?? parseClockTime(text);
    if (at) {
      const label =
        firstMatch(text, /\b(?:to|about|that|it)\s+(.+)/i)?.trim() ??
        "Reminder";
      return result({ intent: "reminder", at, label: label.length > 1 ? label : "Reminder" });
    }
  }

  if (/\b(?:calculate|calc|what is|what's)\b/.test(lower)) {
    const expression =
      firstMatch(text, QUOTED) ??
      text
        .replace(/\b(?:calculate|calc|what is|what's|the answer to)\b/gi, "")
        .replace(/[=?]$/g, "")
        .trim();
    if (/^[\d\s+\-*/().%^]+$/.test(expression)) return result({ intent: "calc", expression });
  }

  if (/\b(?:run|execute)\s+\S+/i.test(lower) || /\b(?:terminal|shell)\b/.test(lower)) {
    const raw = firstMatch(text, QUOTED) ?? firstMatch(text, /(?:run|execute)\s+(.+)/i);
    if (raw) {
      const command = stripQuotes(raw).trim();
      if (command && !/\b(?:timer|remind)\b/.test(lower)) {
        const label = (firstMatch(text, /\b(?:as|label|named|called)\s+(\S+)/i) ?? "").trim();
        const clean = label
          ? command.replace(new RegExp(`\\s+(?:as|label|named|called)\\s+${escapeRegExp(label)}\\s*$`, "i"), "")
          : command;
        return result({ intent: "terminal", command: clean, label: label || undefined });
      }
    }
  }

  if (/\b(?:install|download)\s+\S+/i.test(lower)) {
    const raw = firstMatch(text, QUOTED) ?? firstMatch(text, /\b(?:install|download)\s+(.+)/i);
    if (raw) {
      const pkg = stripTrailingClause(stripQuotes(raw));
      if (pkg && !/\b(?:timer|remind)\b/.test(lower)) {
        const clean = pkg.replace(/^(?:the|a|an)\s+/i, "");
        return result({ intent: "install", package: clean });
      }
    }
  }

  if (/\b(?:help|what can you do|commands)\b/.test(lower)) {
    const topic = firstMatch(text, /\b(?:help|commands)\s+(.+)/i);
    return result({ intent: "help", topic });
  }

  return { ok: false, reason: "no-match", error: `Could not understand: "${text}"` };
}

export function describeIntent(intent: ParsedIntent): string {
  switch (intent.intent) {
    case "open":
      return `Open ${intent.app}${intent.search ? ` and search "${intent.search}"` : ""}`;
    case "close":
      return `Close ${intent.app}`;
    case "file.read":
      return `Read ${intent.path}`;
    case "file.write":
      return `Write ${intent.path}`;
    case "file.list":
      return `List ${intent.path}`;
    case "file.search":
      return `Search "${intent.query}" in ${intent.path}`;
    case "timer":
      return `Timer: ${(intent.durationMs / 1000).toFixed(0)}s${intent.label ? ` (${intent.label})` : ""}`;
    case "reminder":
      return `Reminder at ${intent.at.toISOString()}: ${intent.label}`;
    case "calc":
      return `Calculate ${intent.expression}`;
    case "sys.info":
      return "System information";
    case "terminal":
      return `Run: ${intent.command}${intent.label ? ` (${intent.label})` : ""}`;
    case "install":
      return `Install ${intent.package}`;
    case "help":
      return `Help${intent.topic ? `: ${intent.topic}` : ""}`;
    default:
      return String(intent);
  }
}