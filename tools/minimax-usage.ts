import { getConfig, queryTokenUsage, formatDuration, formatDate } from "../scripts/vendor/minimax-core";
import type { ModelRemain } from "../scripts/vendor/minimax-core";

/**
 * Claude Code tool definition for minimax-usage
 */
export const minimaxUsageTool = {
  name: "minimax-usage",
  description: "Query MiniMax token plan usage for the current billing period. Shows used/remaining requests and reset time.",
  inputSchema: {},
  async invoke() {
    try {
      const config = getConfig();
      const data = await queryTokenUsage(config);
      const models = data.model_remains || [];

      if (models.length === 0) {
        return "No usage data available.";
      }

      const lines: string[] = [];
      lines.push("================================");
      lines.push("    Minimax Account Usage");
      lines.push("================================");
      lines.push("");

      for (const model of models) {
        const total = model.current_interval_total_count;
        const remaining = model.current_interval_usage_count;
        const used = total - remaining;
        const usagePercent = total === 0 ? "0.0" : ((used / total) * 100).toFixed(1);

        const startDate = formatDate(model.start_time);
        const endDate = formatDate(model.end_time);
        const timeRemaining = formatDuration(model.remains_time);

        lines.push(`Model: ${model.model_name}`);
        lines.push("--------------------------------");
        lines.push(`  Period:         ${startDate} to ${endDate}`);
        lines.push(`  Quota:          ${total} requests`);
        lines.push(`  Used:           ${used} requests (${usagePercent}%)`);
        lines.push(`  Remaining:      ${remaining} requests`);
        lines.push(`  Resets In:      ${timeRemaining}`);
        lines.push("");
      }

      lines.push("================================");
      lines.push(`Query Time: ${formatDate(Date.now())}`);
      lines.push("================================");

      return lines.join("\n");
    } catch (error) {
      if (error instanceof Error) {
        return `Error: ${error.message}`;
      }
      return "Error: Failed to query Minimax usage";
    }
  },
};