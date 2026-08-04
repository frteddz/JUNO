import { describe, it, expect, beforeAll } from "vitest";
import {
  terminalPlatform,
  isTerminalSupported,
  runInTerminal,
  installPackage,
  resolveInstallCommand,
  resolveLaunchSpec,
  parseDdgResearch,
  researchLaunchCommand,
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

describe("resolveLaunchSpec", () => {
  it("finds PATH apps on linux", () => {
    if (terminalPlatform() === "linux") {
      const spec = resolveLaunchSpec("bash");
      expect(spec).not.toBe("unknown");
      if (spec !== "unknown" && spec !== "unsupported") {
        expect(spec.cmd).toBe("bash");
      }
    }
  });

  it("returns unknown for a bogus app", () => {
    if (terminalPlatform() === "linux") {
      expect(resolveLaunchSpec("__definitely_not_an_app_xyz__")).toBe("unknown");
    }
  });
});

describe("researchLaunchCommand", () => {
  const ddgHtml =
    `<div class="result"><a class="result__snippet" href="//duckduckgo.com/l/?uddg=${encodeURIComponent("https://example.com/run")}">raw</a>` +
    `<a class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent("https://example.com/sober")}">Run Sober on Linux</a>` +
    `<a class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent("https://example.org/flatpak")}">Flatpak guide</a></div>`;

  it("parses result links from ddg html", () => {
    const links = parseDdgResearch(ddgHtml);
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ title: "Run Sober on Linux", url: "https://example.com/sober" });
  });

  it("returns empty result list for non-html", () => {
    expect(parseDdgResearch("<html>nothing here</html>")).toHaveLength(0);
  });

  it("returns empty string when a source has no result links", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes("duckduckgo")) {
        return new Response("<html>no results</html>", { status: 200 });
      }
      throw new Error("network error");
    }) as typeof fetch;
    try {
      const result = await researchLaunchCommand("__zzz_nothing_here__");
      expect(result).toBe("");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
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