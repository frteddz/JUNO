import type { BrowserContext, Page } from "playwright";
import {
  IntentSchema,
  type ParsedIntent,
  type JunoEventBus,
  getConfig,
  createDispatcher,
  type JunoConfig,
} from "@juno/core";
import { startTimer, scheduleReminder } from "@juno/automation";
import { launchDeepSeek } from "./launch.js";
import {
  dismissBanners,
  waitForReady,
  detectServerBusy,
  waitForAuthState,
  waitForSignedIn,
  getSignedInAccount,
} from "./chat.js";
import { sendPrompt, streamReply } from "./reply.js";

export type AiPhase = "sending" | "thinking" | "generating" | "done" | "error";

export type AiPatch = {
  phase: AiPhase;
  text: string;
  elapsedMs: number;
  error?: string;
};

export interface AiEngineLike {
  ask(prompt: string, onPatch: (p: AiPatch) => void): Promise<{ text: string; action: ParsedIntent | null }>;
  close(): Promise<void>;
  whoami(): Promise<string | null>;
  beginVisibleAuth(): Promise<void>;
  waitForSignedInAuth(): Promise<void>;
}

export const ACTION_OPEN = "<<juno-action>>";
export const ACTION_CLOSE = "<<end-juno-action>>";

const PROTOCOL_PROMPT =
  "You are JUNO, a local terminal assistant. You run on the user's own machine " +
  "and can perform local actions by replying with a special marker instead of prose. " +
  "If the user's request maps to one of the local actions below, reply with EXACTLY ONE line, nothing else: " +
  `"${ACTION_OPEN}" followed by a JSON object followed by "${ACTION_CLOSE}". ` +
  "The JSON object uses this schema: " +
  '{ "intent": "open", "app": "firefox", "search": "ram prices" } | ' +
  '{ "intent": "close", "app": "spotify" } | ' +
  '{ "intent": "timer", "durationMs": 600000, "label": "cooldown" } | ' +
  '{ "intent": "reminder", "at": "2026-08-03T12:00:00.000Z", "label": "take a break" } | ' +
  '{ "intent": "file.search", "path": "/home/teddz", "query": "mynotes.txt,md,zip" } | ' +
  '{ "intent": "file.read", "path": "/home/teddz/notes.md" } | ' +
  '{ "intent": "file.list", "path": "/home/teddz/Projects" } | ' +
  '{ "intent": "calc", "expression": "2 + 3 * 4" } | ' +
  '{ "intent": "sys.info" } | ' +
  '{ "intent": "help" }. "durationMs" must be a number of milliseconds. ' +
  '"at" must be an ISO 8601 UTC timestamp. "path" should be an absolute path or the user home. ' +
  "For everything else (questions, explanations, conversation), reply normally in Markdown. " +
  "Do not mention the marker in prose replies.";

export class AiEngine implements AiEngineLike {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private pendingAuth = false;

  constructor(readonly headless: boolean) {}

  private async ensure(): Promise<Page> {
    if (this.page && !this.pendingAuth) return this.page;
    let page = this.page;
    if (!page) {
      const config: JunoConfig = await getConfig();
      const { context, page: p } = await launchDeepSeek({ headless: this.headless, dataDir: config.dataDir });
      this.context = context;
      this.page = p;
      page = p;
    }
    await dismissBanners(page);
    const state = await waitForAuthState(page, 30000);
    if (state !== "signed-in") {
      if (this.headless) {
        await this.close();
        throw new Error(
          "DeepSeek requires a signed-in account. Run `juno auth` to sign in once in a browser window, then try again.",
        );
      }
      this.pendingAuth = true;
      throw new Error("You need to sign in to DeepSeek in the opened browser window, then ask again.");
    }
    this.pendingAuth = false;
    await dismissBanners(page);
    await waitForReady(page);
    return page;
  }

  async ask(
    prompt: string,
    onPatch: (p: AiPatch) => void,
  ): Promise<{ text: string; action: ParsedIntent | null }> {
    const start = Date.now();
    onPatch({ phase: "sending", text: "", elapsedMs: 0 });
    try {
      const page = await this.ensure();
      if (await detectServerBusy(page)) {
        throw new Error("DeepSeek is busy right now, try again in a moment.");
      }
      await sendPrompt(page, `${PROTOCOL_PROMPT}\n\nUser: ${prompt}`);
      onPatch({ phase: "thinking", text: "", elapsedMs: Date.now() - start });
      const text = await streamReply(page, (chunk) => {
        onPatch({
          phase: chunk.done ? "done" : "generating",
          text: chunk.text,
          elapsedMs: Date.now() - start,
        });
      });
      const action = extractAction(text);
      onPatch({ phase: "done", text, elapsedMs: Date.now() - start });
      return { text, action };
    } catch (err) {
      onPatch({
        phase: "error",
        text: "",
        elapsedMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async close(): Promise<void> {
    this.pendingAuth = false;
    if (this.context) await this.context.close().catch(() => {});
    this.context = null;
    this.page = null;
  }

  async whoami(): Promise<string | null> {
    const hadPage = this.page !== null && !this.pendingAuth;
    try {
      let page = this.page;
      if (!page || this.pendingAuth) {
        await this.close();
        const config: JunoConfig = await getConfig();
        const launched = await launchDeepSeek({ headless: this.headless, dataDir: config.dataDir });
        this.context = launched.context;
        this.page = launched.page;
        page = launched.page;
      }
      await dismissBanners(page);
      const state = await waitForAuthState(page, 30000);
      if (state !== "signed-in") return null;
      return await getSignedInAccount(page);
    } catch {
      return null;
    } finally {
      if (!hadPage) await this.close().catch(() => {});
    }
  }

  async beginVisibleAuth(): Promise<void> {
    if (this.headless) {
      await this.close();
      const config: JunoConfig = await getConfig();
      const { context, page } = await launchDeepSeek({ headless: false, dataDir: config.dataDir });
      this.context = context;
      this.page = page;
    }
    const page = this.page!;
    await dismissBanners(page);
    await page.goto("https://chat.deepseek.com/sign_in", { waitUntil: "domcontentloaded" });
  }

  async waitForSignedInAuth(): Promise<void> {
    await waitForSignedIn(this.page!, 300000);
  }
}

export function extractAction(text: string): ParsedIntent | null {
  const openIdx = text.indexOf(ACTION_OPEN);
  if (openIdx < 0) return null;
  const start = openIdx + ACTION_OPEN.length;
  const closeIdx = text.indexOf(ACTION_CLOSE, start);
  const raw = (closeIdx >= 0 ? text.slice(start, closeIdx) : text.slice(start)).trim();
  try {
    const parsed = JSON.parse(raw) as unknown;
    const validated = IntentSchema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

export type AiTurnResult = {
  ok: boolean;
  message: string;
  action: ParsedIntent | null;
};

export async function runAiTurn(
  engine: AiEngineLike,
  prompt: string,
  bus: JunoEventBus,
  onPatch?: (p: AiPatch) => void,
): Promise<AiTurnResult> {
  const { text, action } = await engine.ask(prompt, onPatch ?? (() => {}));
  if (!action) return { ok: true, message: text, action: null };
  const dispatcher = createDispatcher();
  let message: string;
  if (action.intent === "timer") {
    const timer = startTimer({ durationMs: action.durationMs, label: action.label }, bus);
    message = `Timer set (${timer.id.slice(0, 8)}) for ${action.durationMs} ms${action.label ? `: ${action.label}` : ""}`;
  } else if (action.intent === "reminder") {
    const r = scheduleReminder({ at: action.at, label: action.label }, bus);
    message = `Reminder set (${r.id.slice(0, 8)}) at ${action.at.toISOString()}: ${action.label}`;
  } else {
    const result = await dispatcher(action);
    message = result.message;
  }
  return { ok: true, message, action };
}