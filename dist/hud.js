"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHudLine = getHudLine;
exports.startHudUpdater = startHudUpdater;
const minimax_core_1 = require("./vendor/minimax-core");
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
function colorFor(usedPercent) {
    if (usedPercent >= 85)
        return RED;
    if (usedPercent >= 70)
        return YELLOW;
    return GREEN;
}
function barFor(usedPercent, width = 20) {
    const filled = Math.round((usedPercent / 100) * width);
    const empty = width - filled;
    return `${colorFor(usedPercent)}${"█".repeat(filled)}${DIM}${"░".repeat(empty)}${RESET}`;
}
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
}
function formatHudLine(model) {
    // API now reports remaining percentage rather than absolute counts.
    // `current_interval_remaining_percent` / `current_weekly_remaining_percent`
    // express how much quota is LEFT; convert to used% for the bar.
    const intervalUsed = 100 - (model.current_interval_remaining_percent ?? 100);
    const weeklyUsed = 100 - (model.current_weekly_remaining_percent ?? 100);
    const lines = [
        `Model: ${model.model_name}`,
        `  3h-cycle: ${intervalUsed}%/${100 - intervalUsed}%  ${barFor(intervalUsed)}`,
        `  Week:     ${weeklyUsed}%/${100 - weeklyUsed}%   ${barFor(weeklyUsed)}`,
        `  Resets in: ${formatDuration(model.remains_time)} (week: ${formatDuration(model.weekly_remains_time)})`,
    ];
    return lines.join("\n");
}
async function getHudLine(defaultModel) {
    try {
        const config = (0, minimax_core_1.getConfig)();
        const data = await (0, minimax_core_1.queryTokenUsage)(config);
        const models = data.model_remains || [];
        if (models.length === 0) {
            return null;
        }
        let targetModel;
        if (defaultModel) {
            targetModel = models.find(m => m.model_name === defaultModel) || models[0];
        }
        else {
            targetModel = models[0];
        }
        return formatHudLine(targetModel);
    }
    catch {
        return null;
    }
}
function startHudUpdater(config, renderFn) {
    let intervalId;
    let stopped = false;
    async function update() {
        if (stopped)
            return;
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
