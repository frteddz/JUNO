import { randomUUID } from "node:crypto";
import { getStore, type JunoEventBus, type ReminderTask, type TimerTask } from "@euthenia/core";

export type AutomationOptions = {
  bus?: JunoEventBus;
  dataDir?: string;
};

const MS = { second: 1000, minute: 60_000, hour: 3_600_000, day: 86_400_000 };

export function startTimer(
  input: { durationMs: number; label?: string },
  bus: JunoEventBus,
  dataDir?: string
): TimerTask {
  const timer: TimerTask = {
    id: randomUUID(),
    label: input.label ?? "Timer",
    durationMs: input.durationMs,
    startedAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + input.durationMs).toISOString(),
    status: "running",
  };
  getStore(dataDir).saveTimer(timer);
  setTimeout(() => {
    getStore(dataDir).fireTimer(timer.id);
    timer.status = "fired";
    bus.emit("timer.fired", { timer });
    bus.emit("notify", { title: "Timer done", body: timer.label, severity: "success" });
  }, input.durationMs);
  bus.emit("timer.started", { timer });
  return timer;
}

export function scheduleReminder(
  input: { at: Date; label: string },
  bus: JunoEventBus,
  dataDir?: string
): ReminderTask {
  const reminder: ReminderTask = {
    id: randomUUID(),
    label: input.label,
    runAt: input.at.toISOString(),
    status: "pending",
  };
  getStore(dataDir).saveReminder(reminder);
  const delay = Math.max(0, input.at.getTime() - Date.now());
  setTimeout(() => {
    getStore(dataDir).fireReminder(reminder.id);
    reminder.status = "fired";
    bus.emit("reminder.fired", { reminder });
    bus.emit("notify", { title: "Reminder", body: reminder.label, severity: "info" });
  }, delay);
  return reminder;
}

export function humanDuration(ms: number): string {
  const parts: string[] = [];
  if (ms >= MS.day) {
    parts.push(`${Math.floor(ms / MS.day)}d`);
    ms %= MS.day;
  }
  if (ms >= MS.hour) {
    parts.push(`${Math.floor(ms / MS.hour)}h`);
    ms %= MS.hour;
  }
  if (ms >= MS.minute) {
    parts.push(`${Math.floor(ms / MS.minute)}m`);
    ms %= MS.minute;
  }
  if (ms >= MS.second) parts.push(`${Math.floor(ms / MS.second)}s`);
  return parts.join(" ") || "0s";
}