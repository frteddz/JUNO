import { create } from "zustand";
import type { ChatMessage } from "@juno/core";

export type ThemeMode = "dark" | "light";

type AppState = {
  messages: ChatMessage[];
  input: string;
  busy: boolean;
  theme: ThemeMode;
  accent: string;
  animate: boolean;
  addMessage: (msg: ChatMessage) => void;
  clear: () => void;
  setInput: (s: string) => void;
  setBusy: (b: boolean) => void;
  setTheme: (t: ThemeMode) => void;
  setAccent: (a: string) => void;
  setAnimate: (b: boolean) => void;
};

export const useApp = create<AppState>((set) => ({
  messages: [],
  input: "",
  busy: false,
  theme: "dark",
  accent: "#d4af37",
  animate: true,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clear: () => set({ messages: [] }),
  setInput: (input) => set({ input }),
  setBusy: (busy) => set({ busy }),
  setTheme: (theme) => set({ theme }),
  setAccent: (accent) => set({ accent }),
  setAnimate: (animate) => set({ animate }),
}));