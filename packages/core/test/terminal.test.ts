import { describe, it, expect, beforeAll } from "vitest";
import {
  terminalPlatform,
  isTerminalSupported,
  runInTerminal,
  installPackage,
  resolveInstallCommand,
  listTracked,
  stopTracked,
} from "../src/terminal";

const supported = isTerminalSupported();

describe("terminalPlatform", () => {
  beforeAll(() => {
    if (!supported && process.platform !== "win32") {
      console.warn("terminal tests skipped on unsupported platform");
    }
  });

  it("reports a known platform on supported OSes", () => {
    if (supported) {
      expect(["linux", "windows"]).toContain(terminalPlatform());
    } else {
      expect(terminalPlatform()).toBe("unsupported");
    }
  });
});

describe("runInTerminal", () => {
  it("runs a command and returns its output", async () => {
    if (terminalPlatform() === "linux") {
      const r = await runInTerminal("printf hello-juno");
      expect(r.ok).toBe(true);
      expect(r.code).toBe(0);
      expect(r.stdout).toContain("hello-juno");
    }
  });

  it("reports a non-zero exit code", async () => {
    if (terminalPlatform() === "linux") {
      const r = await runInTerminal("exit 3");
      expect(r.ok).toBe(false);
      expect(r.code).toBe(3);
    }
  });

  it("times out a long-running command", async () => {
    if (terminalPlatform() === "linux") {
      const r = await runInTerminal("sleep 5", { timeoutMs: 200 });
      expect(r.timedOut).toBe(true);
      expect(r.ok).toBe(false);
    }
  }, 5000);

  it("tracks a labeled process and stops it", async () => {
    if (terminalPlatform() === "linux") {
      const r = await runInTerminal("sleep 30", { label: "snooze", timeoutMs: 300 });
      expect(r.timedOut).toBe(true);
      const tracked = listTracked().find((t) => t.label === "snooze");
      expect(tracked).toBeDefined();
      const stopped = await stopTracked("snooze");
      expect(stopped.ok).toBe(true);
    }
  }, 5000);
});

describe("installPackage", () => {
  it("resolves a package manager command on linux", () => {
    if (terminalPlatform() === "linux") {
      const cmd = resolveInstallCommand("firefox");
      expect(cmd).toBeTruthy();
      expect(cmd!.length).toBeGreaterThan(0);
      expect(cmd!.some((c) => c.includes("firefox"))).toBe(true);
    }
  });

  it("times out a hanging install", async () => {
    if (terminalPlatform() === "linux") {
      const cmd = resolveInstallCommand("__definitely_absent__");
      if (!cmd) return;
      const r = await installPackage("__definitely_absent__", { timeoutMs: 200 });
      expect(r.ok).toBe(false);
    }
  }, 5000);
});