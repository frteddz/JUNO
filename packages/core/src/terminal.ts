import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { platform } from "node:os";
import { defaultDataDir } from "./config.js";
import { searchUrl } from "./apps.js";

export type TerminalPlatform = "linux" | "windows" | "unsupported";

export function terminalPlatform(): TerminalPlatform {
  const p = platform();
  if (p === "linux") return "linux";
  if (p === "win32") return "windows";
  return "unsupported";
}

export function isTerminalSupported(): boolean {
  return terminalPlatform() !== "unsupported";
}

export type TerminalRunResult = {
  ok: boolean;
  code: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type TrackedProcess = {
  key: string;
  label: string;
  command: string;
  pid: number;
  startedAt: string;
  status: "running" | "exited";
  exitCode: number | null;
};

type TrackEntry = {
  meta: TrackedProcess;
  worker: ChildProcess;
};

const MAX_OUTPUT = 64 * 1024;

const running = new Map<string, TrackEntry>();

function cap(s: string): string {
  return s.length > MAX_OUTPUT ? `${s.slice(0, MAX_OUTPUT)}\n… (truncated)` : s;
}

function defaultShell(): { shell: string; args: string[] } {
  return terminalPlatform() === "windows" ? { shell: "cmd", args: ["/d", "/s", "/c"] } : { shell: "bash", args: ["-lc"] };
}

function which(candidate: string): string | null {
  const probe = terminalPlatform() === "windows" ? "where" : "which";
  const r = spawnSync(probe, [candidate], { stdio: "ignore" });
  return r.status === 0 ? candidate : null;
}

function trackedFile(): string {
  return join(defaultDataDir(), "tracked.json");
}

function readTrackedFile(): TrackedProcess[] {
  try {
    if (!existsSync(trackedFile())) return [];
    const parsed = JSON.parse(readFileSync(trackedFile(), "utf8")) as TrackedProcess[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTrackedFile(entries: TrackedProcess[]): void {
  try {
    mkdirSync(defaultDataDir(), { recursive: true });
    writeFileSync(trackedFile(), JSON.stringify(entries, null, 2), "utf8");
  } catch {
    void 0;
  }
}

function trackEntry(key: string, label: string, worker: ChildProcess, command: string): TrackedProcess {
  const prev = running.get(key);
  if (prev) {
    stopWorker(prev.worker);
  }
  const meta: TrackedProcess = {
    key,
    label,
    command,
    pid: worker.pid ?? 0,
    startedAt: new Date().toISOString(),
    status: "running",
    exitCode: null,
  };
  const entry: TrackEntry = { meta, worker };
  running.set(key, entry);
  writeTrackedFile(readTrackedFile().filter((t) => t.key !== key).concat(meta));
  worker.on("exit", (code) => {
    const current = running.get(key);
    if (current && current.worker === worker) {
      current.meta.status = "exited";
      current.meta.exitCode = code;
      writeTrackedFile(readTrackedFile().filter((t) => t.key !== key).concat({ ...current.meta }));
    }
  });
  return meta;
}

function stopWorker(worker: ChildProcess): void {
  const pid = worker.pid;
  if (pid == null) return;
  if (terminalPlatform() === "windows") {
    spawnSync("taskkill", ["/pid", String(pid), "/f", "/t"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* not running */
    }
  }
}

export function listTracked(): TrackedProcess[] {
  const merged = new Map<string, TrackedProcess>();
  for (const t of readTrackedFile()) merged.set(t.key, t);
  for (const e of running.values()) merged.set(e.meta.key, e.meta);
  return [...merged.values()];
}

function trackKey(label: string): string {
  return label.replace(/\s+/g, "").toLowerCase();
}

export async function stopTracked(
  label: string,
): Promise<{ ok: true; matched: TrackedProcess } | { ok: false; matched: null }> {
  const key = trackKey(label);
  const found = running.get(key);
  if (found) {
    stopWorker(found.worker);
    running.delete(key);
    writeTrackedFile(readTrackedFile().filter((t) => t.key !== key));
    const snapshot: TrackedProcess = { ...found.meta, status: "exited" };
    return { ok: true, matched: snapshot };
  }
  const persisted = readTrackedFile().find((t) => t.key === key);
  if (!persisted) return { ok: false, matched: null };
  killPid(persisted.pid);
  writeTrackedFile(readTrackedFile().filter((t) => t.key !== key));
  return { ok: true, matched: { ...persisted, status: "exited" } };
}

function killPid(pid: number): void {
  if (pid <= 0) return;
  if (terminalPlatform() === "windows") {
    spawnSync("taskkill", ["/pid", String(pid), "/f", "/t"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      void 0;
    }
  }
}

export type LaunchSpec = {
  cmd: string;
  args: string[];
  detached: boolean;
};

export function resolveLaunchSpec(app: string): LaunchSpec | "unknown" | "unsupported" {
  const p = terminalPlatform();
  if (p === "unsupported") return "unsupported";
  if (p === "linux") {
    if (which(app)) return { cmd: app, args: [], detached: true };
    return "unknown";
  }
  const exe = app.toLowerCase().endsWith(".exe") ? app : `${app}.exe`;
  if (which(exe)) return { cmd: app, args: [], detached: false };
  return { cmd: app, args: [], detached: false };
}

export async function launchApp(app: string, search?: string): Promise<{ ok: boolean; message: string }> {
  const spec = resolveLaunchSpec(app);
  if (spec === "unsupported") {
    return { ok: false, message: "Terminal launch is currently supported on Linux and Windows only." };
  }
  if (spec === "unknown") {
    return {
      ok: false,
      message: `Could not find "${app}" to launch. Try "install ${app}" or ask JUNO to research how to run it.`,
    };
  }
  const args = search ? [...spec.args, searchUrl(search)] : spec.args;
  const worker = spawn(spec.cmd, args, { stdio: "ignore", detached: spec.detached && terminalPlatform() !== "windows" });
  worker.once("error", () => {});
  trackEntry(trackKey(app), app, worker, [spec.cmd, ...args].join(" "));
  return { ok: true, message: `Launched ${app} (pid ${worker.pid ?? "?"})` };
}

export async function runInTerminal(
  command: string,
  opts: { label?: string; cwd?: string; timeoutMs?: number } = {},
): Promise<TerminalRunResult & { command: string }> {
  if (!isTerminalSupported()) {
    throw new Error("Terminal access is currently supported on Linux and Windows only.");
  }
  const { shell, args } = defaultShell();
  const worker: ChildProcess = spawn(shell, [...args, command], { cwd: opts.cwd });
  let stdout = "";
  let stderr = "";
  worker.stdout?.on("data", (d: Buffer) => (stdout += d.toString()));
  worker.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
  let timedOut = false;
  const timer =
    opts.timeoutMs && opts.timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          stopWorker(worker);
        }, opts.timeoutMs)
      : undefined;

  if (opts.label) {
    trackEntry(trackKey(opts.label), opts.label, worker, command);
  }

  const code = await new Promise<number | null>((resolve) => {
    worker.once("error", () => resolve(null));
    worker.once("close", (c) => resolve(c));
  });
  if (timer) clearTimeout(timer);
  return {
    ok: code === 0 && !timedOut,
    code,
    signal: null,
    stdout: cap(stdout),
    stderr: cap(stderr),
    timedOut,
    command,
  };
}

export type DownloadResult = {
  ok: boolean;
  command: string;
  code: number | null;
  stdout: string;
  stderr: string;
  suggest: string | null;
};

export async function installPackage(pkg: string): Promise<DownloadResult> {
  if (terminalPlatform() === "windows") {
    if (which("winget")) {
      return execInstall(["winget", "install", "--accept-package-agreements", "--accept-source-agreements", pkg], pkg);
    }
    if (which("choco")) {
      return execInstall(["choco", "install", "-y", pkg], pkg);
    }
    return noManager(pkg);
  }
  if (which("apt-get")) {
    return execInstall(["sudo", "-n", "apt-get", "install", "-y", pkg], pkg);
  }
  if (which("dnf")) {
    return execInstall(["sudo", "-n", "dnf", "install", "-y", pkg], pkg);
  }
  if (which("pacman")) {
    return execInstall(["sudo", "-n", "pacman", "-S", "--noconfirm", pkg], pkg);
  }
  if (which("flatpak")) {
    return execInstall(["flatpak", "install", "-y", "--noninteractive", "flathub", pkg], pkg);
  }
  if (which("snap")) {
    return execInstall(["snap", "install", pkg], pkg);
  }
  return noManager(pkg);
}

function noManager(pkg: string): DownloadResult {
  return {
    ok: false,
    command: "",
    code: null,
    stdout: "",
    stderr: `No supported package manager found. Install ${pkg} manually.`,
    suggest: null,
  };
}

async function execInstall(cmd: string[], _pkg: string): Promise<DownloadResult> {
  const worker: ChildProcess = spawn(cmd[0]!, cmd.slice(1));
  let stdout = "";
  let stderr = "";
  worker.stdout?.on("data", (d: Buffer) => (stdout += d.toString()));
  worker.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
  const code = await new Promise<number | null>((resolve) => {
    worker.once("error", (err) => {
      stderr += `\n${err.message}`;
      resolve(null);
    });
    worker.once("close", (c) => resolve(c));
  });
  const command = cmd.join(" ");
  return {
    ok: code === 0,
    command,
    code,
    stdout: cap(stdout),
    stderr: cap(stderr),
    suggest: code === 0 ? null : `Try manually: ${command.replace("-n ", "")}`,
  };
}
