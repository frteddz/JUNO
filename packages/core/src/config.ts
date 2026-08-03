import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_CONFIG, type JunoConfig } from "./types.js";

export function defaultDataDir(): string {
  const env = process.env.JUNO_DATA_DIR;
  if (env) return env;
  return join(homedir(), ".juno");
}

let cached: JunoConfig | undefined;

export async function loadConfig(overrides: Partial<JunoConfig> = {}): Promise<JunoConfig> {
  const configPath = join(defaultDataDir(), "config.json");
  let file: Partial<JunoConfig> = {};
  try {
    file = (await readFile(configPath, "utf8").then((s) => JSON.parse(s))) as Partial<JunoConfig>;
  } catch {
    file = {};
  }

  const port = Number(process.env.JUNO_API_PORT ?? file.apiPort ?? DEFAULT_CONFIG.apiPort);
  const config: JunoConfig = {
    ...DEFAULT_CONFIG,
    ...file,
    ...overrides,
    dataDir: process.env.JUNO_DATA_DIR ?? file.dataDir ?? defaultDataDir(),
    apiPort: Number.isFinite(port) && port > 0 ? port : DEFAULT_CONFIG.apiPort,
    apiHost: process.env.JUNO_API_HOST ?? file.apiHost ?? DEFAULT_CONFIG.apiHost,
    logLevel: (overrideLogLevel() ?? file.logLevel ?? DEFAULT_CONFIG.logLevel) as JunoConfig["logLevel"],
  };

  cached = config;
  return config;
}

function overrideLogLevel(): JunoConfig["logLevel"] | undefined {
  const v = process.env.JUNO_LOG_LEVEL;
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return undefined;
}

export async function saveConfig(patch: Partial<JunoConfig>): Promise<JunoConfig> {
  const dir = defaultDataDir();
  await mkdir(dir, { recursive: true });
  const current = cached ?? (await loadConfig());
  const next: JunoConfig = { ...current, ...patch };
  await writeFile(join(dir, "config.json"), JSON.stringify(next, null, 2), "utf8");
  cached = next;
  return next;
}

export async function getConfig(): Promise<JunoConfig> {
  if (cached) return cached;
  return loadConfig();
}