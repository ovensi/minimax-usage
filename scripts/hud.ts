import { getConfig, queryTokenUsage } from "./vendor/minimax-core";
import type { ModelRemain } from "./vendor/minimax-core";

export interface HudConfig {
  refreshInterval: number;
  defaultModel?: string;
}

function formatProgressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "[" + "=".repeat(filled) + " ".repeat(empty) + "]";
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatHudLine(model: ModelRemain): string {
  const total = model.current_interval_total_count;
  const remaining = model.current_interval_usage_count;
  const used = total - remaining;
  const percent = total === 0 ? 0 : Math.round((used / total) * 100);

  const progressBar = formatProgressBar(percent);
  const usedStr = formatNumber(used);
  const totalStr = formatNumber(total);
  const percentStr = `${percent}%`;

  const seconds = Math.floor(model.remains_time / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const timeRemaining = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;

  return `Model: ${model.model_name} | Used: ${usedStr}/${totalStr} ${progressBar} ${percentStr} | Resets in: ${timeRemaining}`;
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
