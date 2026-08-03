import { z } from "zod";

export const IntentSchema = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("open"), app: z.string().min(1) }),
  z.object({ intent: z.literal("close"), app: z.string().min(1) }),
  z.object({ intent: z.literal("file.read"), path: z.string().min(1) }),
  z.object({ intent: z.literal("file.write"), path: z.string().min(1), content: z.string() }),
  z.object({ intent: z.literal("file.list"), path: z.string().min(1) }),
  z.object({ intent: z.literal("file.search"), path: z.string().min(1), query: z.string().min(1) }),
  z.object({ intent: z.literal("timer"), durationMs: z.number().positive(), label: z.string().optional() }),
  z.object({ intent: z.literal("reminder"), at: z.coerce.date(), label: z.string().min(1) }),
  z.object({ intent: z.literal("calc"), expression: z.string().min(1) }),
  z.object({ intent: z.literal("sys.info") }),
  z.object({ intent: z.literal("help"), topic: z.string().optional() }),
]);

export type ParsedIntent = z.infer<typeof IntentSchema>;

export type ActionResult = {
  ok: boolean;
  message: string;
  data?: unknown;
  error?: string;
};

export type Session = {
  id: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: string;
  intent?: ParsedIntent;
  result?: ActionResult;
};

export type TimerTask = {
  id: string;
  label: string;
  durationMs: number;
  startedAt: string;
  endsAt: string;
  status: "running" | "fired";
};

export type ReminderTask = {
  id: string;
  label: string;
  runAt: string;
  status: "pending" | "fired" | "cancelled";
};

export type EventMap = {
  "log.message": { message: ChatMessage; sessionId: string };
  "timer.started": { timer: TimerTask };
  "timer.fired": { timer: TimerTask };
  "reminder.fired": { reminder: ReminderTask };
  "notify": { title: string; body?: string; severity?: "info" | "success" | "warn" | "error" };
  "workflow.status": { id: string; status: string };
};

export type JunoConfig = {
  theme: "dark" | "light";
  accent: string;
  dataDir: string;
  apiPort: number;
  apiHost: string;
  historyEnabled: boolean;
  confirmDestructive: boolean;
  animate: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
};

export type Dispatcher = (intent: ParsedIntent) => Promise<ActionResult> | ActionResult;

export const DEFAULT_CONFIG: JunoConfig = {
  theme: "dark",
  accent: "#d4af37",
  dataDir: "",
  apiPort: 4173,
  apiHost: "127.0.0.1",
  historyEnabled: true,
  confirmDestructive: true,
  animate: true,
  logLevel: "info",
};