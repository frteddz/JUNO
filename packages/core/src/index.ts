import { openApp, closeApp, launcherCommand, platformLabel } from "./apps.js";
import { calculate } from "./calc.js";
import { getConfig, loadConfig, saveConfig, defaultDataDir } from "./config.js";
import { JunoStore, getStore, dbPath } from "./db.js";
import { createDispatcher, type ExecContext } from "./dispatch.js";
import { EventBus } from "./events.js";
import { listDir, readTextFile, searchFiles, type FileEntry } from "./files.js";
import { parseCommand, describeIntent, type ParseResult } from "./nl-parser.js";
import { getSystemInfo, type SystemInfo } from "./system.js";
import {
  launchApp,
  runInTerminal,
  stopTracked,
  listTracked,
  installPackage,
  resolveLaunchSpec,
  terminalPlatform,
  isTerminalSupported,
  type TerminalPlatform,
  type TerminalRunResult,
  type TrackedProcess,
  type LaunchSpec,
  type DownloadResult,
} from "./terminal.js";
import {
  DEFAULT_CONFIG,
  IntentSchema,
  type ActionResult,
  type ChatMessage,
  type Dispatcher,
  type JunoConfig,
  type ParsedIntent,
  type TimerTask,
  type ReminderTask,
} from "./types.js";
import type { JunoEventBus } from "./events.js";

export type {
  ActionResult,
  JunoConfig,
  Dispatcher,
  ParsedIntent,
  SystemInfo,
  FileEntry,
  ParseResult,
  ExecContext,
  JunoEventBus,
  ChatMessage,
  TimerTask,
  ReminderTask,
  TerminalPlatform,
  TerminalRunResult,
  TrackedProcess,
  LaunchSpec,
  DownloadResult,
};

export {
  openApp,
  closeApp,
  launcherCommand,
  platformLabel,
  calculate,
  getConfig,
  loadConfig,
  saveConfig,
  defaultDataDir,
  JunoStore,
  getStore,
  dbPath,
  EventBus,
  listDir,
  readTextFile,
  searchFiles,
  parseCommand,
  describeIntent,
  getSystemInfo,
  launchApp,
  runInTerminal,
  stopTracked,
  listTracked,
  installPackage,
  resolveLaunchSpec,
  terminalPlatform,
  isTerminalSupported,
  DEFAULT_CONFIG,
  IntentSchema,
  createDispatcher,
};

export function createEventBus(): JunoEventBus {
  return new EventBus();
}

export function createMessage(sessionId: string, role: ChatMessage["role"], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, ts: new Date().toISOString() };
}