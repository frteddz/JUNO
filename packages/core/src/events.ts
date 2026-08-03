import { EventEmitter } from "node:events";
import type { EventMap } from "./types.js";

export class EventBus<Events extends Record<string, unknown>> {
  private emitter = new EventEmitter();

  on<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): () => void {
    this.emitter.on(event, listener as (payload: unknown) => void);
    return () => this.emitter.off(event, listener as (payload: unknown) => void);
  }

  once<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void {
    this.emitter.once(event, listener as (payload: unknown) => void);
  }

  emit<K extends keyof Events & string>(event: K, payload: Events[K]): boolean {
    return this.emitter.emit(event, payload);
  }

  removeAll(): void {
    this.emitter.removeAllListeners();
  }
}

export type JunoEventBus = EventBus<EventMap>;