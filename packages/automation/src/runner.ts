import { parseCommand, type ActionResult, type Dispatcher, type ParsedIntent } from "@euthenia/core";
import { humanDuration, isPermanentError, type BackoffPolicy } from "./backoff.js";

export type AutomationStep =
  | { kind: "command"; text: string }
  | { kind: "shell"; cmd: string };

export type StepResult = {
  kind: string;
  label: string;
  ok: boolean;
  data?: unknown;
  error?: string;
};

export type WorkflowOptions = {
  dispatcher: Dispatcher;
  retry?: BackoffPolicy;
  onStatus?: (msg: string) => void;
};

const DEFAULT_POLICY: Required<BackoffPolicy> = {
  attempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 5000,
  backoffFactor: 2,
};

export async function runWorkflow(steps: AutomationStep[], opts: WorkflowOptions): Promise<StepResult[]> {
  const results: StepResult[] = [];
  for (const step of steps) {
    if (step.kind === "command") {
      const parsed = parseCommand(step.text);
      if (!parsed.ok) {
        results.push({ kind: "command", label: step.text, ok: false, error: parsed.error });
        return results;
      }
      const r = await runCommandStep(parsed.intent, opts);
      results.push({ kind: "command", label: step.text, ok: r.ok, data: r.data, error: r.error });
      if (!r.ok) return results;
    } else {
      const r = await runShellStep(step.cmd);
      results.push({ kind: "shell", label: step.cmd, ok: r.ok, data: r.data, error: r.error });
      if (!r.ok) return results;
    }
  }
  return results;
}

async function runCommandStep(intent: ParsedIntent, opts: WorkflowOptions): Promise<StepResult> {
  if (intent.intent === "timer" || intent.intent === "reminder") {
    return { kind: "command", label: "scheduled", ok: true, data: { queued: true, intent } };
  }
  const policy = { ...DEFAULT_POLICY, ...opts.retry };
  const errors: Error[] = [];
  let delay = policy.baseDelayMs;
  for (let attempt = 1; attempt <= policy.attempts; attempt++) {
    try {
      const r = await execute(intent, opts.dispatcher);
      return { kind: "command", label: "command", ok: r.ok, data: r, error: r.error };
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      errors.push(e);
      if (isPermanentError(e) || attempt === policy.attempts) break;
      await sleep(delay);
      delay = Math.min(delay * policy.backoffFactor, policy.maxDelayMs);
      opts.onStatus?.(`Retrying (attempt ${attempt + 1}) in ${humanDuration(delay)}`);
    }
  }
  return {
    kind: "command",
    label: "command",
    ok: false,
    error: errors[errors.length - 1]?.message ?? "unknown error",
  };
}

async function execute(intent: ParsedIntent, dispatcher: Dispatcher): Promise<ActionResult> {
  const r = await dispatcher(intent);
  if (!r.ok) throw new Error(r.error ?? r.message);
  return r;
}

async function runShellStep(cmd: string): Promise<StepResult> {
  const { execFile } = await import("node:child_process");
  const run = () =>
    new Promise<void>((resolve, reject) => {
      execFile("/bin/sh", ["-c", cmd], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  const errors: Error[] = [];
  let delay = 250;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await run();
      return { kind: "shell", label: cmd, ok: true };
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      errors.push(e);
      if (attempt === 3) break;
      await sleep(delay);
      delay = Math.min(delay * 2, 5000);
    }
  }
  return { kind: "shell", label: cmd, ok: false, error: errors[errors.length - 1]?.message };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}