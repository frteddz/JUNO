import { render } from "ink";
import React from "react";
import { createEventBus, getConfig } from "@juno/core";
import { App } from "./App.js";
import { useApp } from "./store.js";

export async function startTui(): Promise<void> {
  const config = await getConfig();
  useApp.setState({ theme: config.theme, accent: config.accent, animate: config.animate });
  const bus = createEventBus();
  render(React.createElement(App, { bus }));
}

export { useApp } from "./store.js";
export { App } from "./App.js";