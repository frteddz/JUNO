export type CronFields = {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
};

function parseField(raw: string, min: number, max: number): number {
  if (raw === "*") return -1;
  if (raw.includes("-")) {
    const [a, b] = raw.split("-").map(Number);
    if (a! >= min && b! <= max) return a!;
    throw new Error(`Cron range ${raw} out of bounds`);
  }
  if (raw.includes(",")) return Number(raw.split(",")[0]);
  if (raw.includes("/")) return Number(raw.split("/")[0]);
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Cron value ${raw} out of range`);
  return n;
}

export function parseCron(expr: string): CronFields {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`Invalid cron expression: "${expr}"`);
  return {
    minute: parseField(parts[0]!, 0, 59),
    hour: parseField(parts[1]!, 0, 23),
    dayOfMonth: parseField(parts[2]!, 1, 31),
    month: parseField(parts[3]!, 1, 12),
    dayOfWeek: parseField(parts[4]!, 0, 6),
  };
}

export function cronMatches(fields: CronFields, date: Date): boolean {
  return (
    match(fields.minute, date.getMinutes()) &&
    match(fields.hour, date.getHours()) &&
    match(fields.dayOfMonth, date.getDate()) &&
    match(fields.month, date.getMonth() + 1) &&
    match(fields.dayOfWeek, date.getDay())
  );
}

function match(value: number, actual: number): boolean {
  return value < 0 || value === actual;
}