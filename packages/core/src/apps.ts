import { spawn } from "node:child_process";
import { platform } from "node:os";

export function platformLabel(): string {
  const p = platform();
  return p === "win32" ? "windows" : p === "darwin" ? "macos" : "linux";
}

export function launcherCommand(app: string): { cmd: string; args: string[] } {
  const p = platform();
  if (p === "win32") {
    return { cmd: "cmd", args: ["/c", "start", "", app] };
  }
  if (p === "darwin") {
    return { cmd: "open", args: ["-a", app] };
  }
  return { cmd: app, args: [] };
}

export async function openApp(app: string): Promise<void> {
  const { cmd, args } = launcherCommand(app);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
    child.once("exit", (code) => {
      if (code !== 0) reject(new Error(`${cmd} exited with code ${code}`));
      else resolve();
    });
  });
}

export async function closeApp(app: string): Promise<void> {
  const p = platform();
  let cmd: string;
  if (p === "win32") {
    cmd = `taskkill /IM ${app} /F`;
  } else if (p === "darwin") {
    cmd = `osascript -e 'tell application "${app}" to quit'`;
  } else {
    cmd = `pkill -f "${app}"`;
  }
  await new Promise<void>((resolve, reject) => {
    spawn(cmd, { shell: true, stdio: "ignore" })
      .once("error", reject)
      .once("exit", () => resolve());
  });
}