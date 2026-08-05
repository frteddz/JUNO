import { create } from "zustand";
import type { ChatMessage } from "@euthenia/core";

export type ThemeMode = "dark" | "light";

type AppState = {
  messages: ChatMessage[];
  input: string;
  busy: boolean;
  theme: ThemeMode;
  accent: string;
  animate: boolean;
  scrollTop: number;
  follow: boolean;
  sidebar: boolean;
  maxScroll: number;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clear: () => void;
  setInput: (s: string) => void;
  setBusy: (b: boolean) => void;
  setTheme: (t: ThemeMode) => void;
  setAccent: (a: string) => void;
  setAnimate: (b: boolean) => void;
  setScrollTop: (n: number) => void;
  setFollow: (b: boolean) => void;
  setSidebar: (b: boolean) => void;
  setMaxScroll: (n: number) => void;
};

export const useApp = create<AppState>((set) => ({
  messages: [],
  input: "",
  busy: false,
  theme: "dark",
  accent: "#d4af37",
  animate: true,
  scrollTop: 0,
  follow: true,
  sidebar: true,
  maxScroll: 0,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, patch) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
  clear: () => set({ messages: [] }),
  setInput: (input) => set({ input }),
  setBusy: (busy) => set({ busy }),
  setTheme: (theme) => set({ theme }),
  setAccent: (accent) => set({ accent }),
  setAnimate: (animate) => set({ animate }),
  setScrollTop: (scrollTop) => set({ scrollTop }),
  setFollow: (follow) => set({ follow }),
  setSidebar: (sidebar) => set({ sidebar }),
  setMaxScroll: (maxScroll) => set({ maxScroll }),
}));