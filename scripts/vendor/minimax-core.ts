export interface ModelRemain {
  model_name: string;
  current_interval_total_count: number;
  current_interval_usage_count: number;
  remains_time: number;
  start_time: number;
  end_time: number;
}

export interface UsageResponse {
  model_remains?: ModelRemain[];
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
}

export class MinimaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MinimaxError";
  }
}

export interface MiniMaxConfig {
  apiKey: string;
  apiHost: string;
}

export async function queryTokenUsage(config: MiniMaxConfig): Promise<UsageResponse> {
  const url = `${config.apiHost}/v1/api/openplatform/coding_plan/remains`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new MinimaxError(`HTTP error: ${response.status}`);
    }

    const data = (await response.json()) as UsageResponse;

    if (data.base_resp && data.base_resp.status_code !== 0) {
      throw new MinimaxError(`API error: ${data.base_resp.status_msg}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new MinimaxError('Request timed out');
      }
      throw error;
    }
    throw new MinimaxError('Unknown error occurred');
  }
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds === 0) return "0m";
  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getConfig(): MiniMaxConfig {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new MinimaxError("MINIMAX_API_KEY environment variable is not set");
  }

  const apiHost = process.env.MINIMAX_API_HOST || "https://www.minimaxi.com";

  return { apiKey, apiHost };
}
