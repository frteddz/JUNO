export type BackoffPolicy = {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
};

export const DEFAULT_RETRY: BackoffPolicy = {
  attempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 5000,
  backoffFactor: 2,
};

export function humanDuration(ms: number): string {
  const parts: string[] = [];
  if (ms >= 86_400_000) {
    parts.push(`${Math.floor(ms / 86_400_000)}d`);
    ms %= 86_400_000;
  }
  if (ms >= 3_600_000) {
    parts.push(`${Math.floor(ms / 3_600_000)}h`);
    ms %= 3_600_000;
  }
  if (ms >= 60_000) {
    parts.push(`${Math.floor(ms / 60_000)}m`);
    ms %= 60_000;
  }
  if (ms >= 1000) parts.push(`${Math.floor(ms / 1000)}s`);
  return parts.join(" ") || "0s";
}

export async function withBackoff(
  fn: () => Promise<void>,
  policy: BackoffPolicy = DEFAULT_RETRY
): Promise<{ attempts: number; errors: Error[] }> {
  const errors: Error[] = [];
  let delay = policy.baseDelayMs;
  for (let attempt = 1; attempt <= policy.attempts; attempt++) {
    try {
      await fn();
      return { attempts: attempt, errors };
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      errors.push(e);
      if (attempt === policy.attempts) break;
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * policy.backoffFactor, policy.maxDelayMs);
    }
  }
  throw errors[errors.length - 1];
}

export function isPermanentError(err: Error): boolean {
  const msg = `${err.name}: ${err.message}`.toLowerCase();
  return (
    msg.includes("enoent") ||
    msg.includes("not found") ||
    msg.includes("invalid") ||
    msg.includes("unauthorized") ||
    msg.includes("permission denied")
  );
}