import { getConfig, queryTokenUsage } from "./vendor/minimax-core";
import type { ModelRemain } from "./vendor/minimax-core";

export interface HudConfig {
  refreshInterval: number;
  defaultModel?: string;
}

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

function colorFor(usedPercent: number): string {
  if (usedPercent >= 85) return RED;
  if (usedPercent >= 70) return YELLOW;
  return GREEN;
}

function barFor(usedPercent: number, width: number = 20): string {
  const filled = Math.round((usedPercent / 100) * width);
  const empty = width - filled;
  return `${colorFor(usedPercent)}${"█".repeat(filled)}${DIM}${"░".repeat(empty)}${RESET}`;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
}

function formatHudLine(model: ModelRemain): string {
  // API now reports remaining percentage rather than absolute counts.
  // `current_interval_remaining_percent` / `current_weekly_remaining_percent`
  // express how much quota is LEFT; convert to used% for the bar.
  const intervalUsed = 100 - (model.current_interval_remaining_percent ?? 100);
  const weeklyUsed = 100 - (model.current_weekly_remaining_percent ?? 100);

  // Left column for the model name; lines 2+ are indented to align beneath it.
  const indent = " ".repeat(model.model_name.length + 2);
  const line1 = `${model.model_name}  3h: ${intervalUsed}%/${100 - intervalUsed}% ${barFor(intervalUsed)}  wk: ${weeklyUsed}%/${100 - weeklyUsed}% ${barFor(weeklyUsed)}`;
  const line2 = `${indent}⟲ ${formatDuration(model.remains_time)}  (week ⟲ ${formatDuration(model.weekly_remains_time)})`;
  return [line1, line2].join("\n");
}

export async function getHudLine(defaultModel?: string): Promise<string | null> {
  try {
    const config = getConfig();
    const data = await queryTokenUsage(config);
    const models = data.model_remains || [];

    if (models.length === 0) {
      return null;
    }

    let targetModel: ModelRemain;
    if (defaultModel) {
      targetModel = models.find(m => m.model_name === defaultModel) || models[0];
    } else {
      targetModel = models[0];
    }

    return formatHudLine(targetModel);
  } catch {
    return null;
  }
}

export function startHudUpdater(
  config: HudConfig,
  renderFn: (line: string | null) => void
): () => void {
  let intervalId: NodeJS.Timeout;
  let stopped = false;

  async function update() {
    if (stopped) return;
    const line = await getHudLine(config.defaultModel);
    if (!stopped) {
      renderFn(line);
    }
  }

  update();
  intervalId = setInterval(update, config.refreshInterval);

  return () => {
    stopped = true;
    clearInterval(intervalId);
  };
}
