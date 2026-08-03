import { randomBytes, timingSafeEqual } from "node:crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function resolveToken(): string {
  return process.env.JUNO_API_TOKEN ?? "";
}

export function verifyToken(present: string | undefined, expected: string): boolean {
  if (!expected || !present) return false;
  const a = Buffer.from(present);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireToken(token: string | undefined): void {
  const expected = resolveToken();
  if (expected && !verifyToken(token, expected)) {
    const err = new Error("Unauthorized");
    (err as Error & { statusCode: number }).statusCode = 401;
    (err as Error & { code: string }).code = "FST_UNAUTHORIZED";
    throw err;
  }
}