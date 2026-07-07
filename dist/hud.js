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
    if ((0, minimax_core_1.terminalSupportsAnsi)()) {
        // Fancy: full-block filled, light-shade empty, color-coded by usage.
        return `${colorFor(usedPercent)}${"█".repeat(filled)}${DIM}${"░".repeat(empty)}${RESET}`;
    }
    // Plain ASCII fallback for legacy Windows consoles / pipes / NO_COLOR.
    return `[${"#".repeat(filled)}${"-".repeat(empty)}]`;
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
    const fancy = (0, minimax_core_1.terminalSupportsAnsi)();
    // Left column for the model name; lines 2+ are indented to align beneath it.
    const indent = " ".repeat(model.model_name.length + 2);
    const spinner = fancy ? "⟲" : "resets in:";
    const line1 = `${model.model_name}  3h: ${intervalUsed}%/${100 - intervalUsed}% ${barFor(intervalUsed)}  wk: ${weeklyUsed}%/${100 - weeklyUsed}% ${barFor(weeklyUsed)}`;
    const line2 = `${indent}${spinner} ${formatDuration(model.remains_time)}  (week ${spinner} ${formatDuration(model.weekly_remains_time)})`;
    return [line1, line2].join("\n");
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
            targetModel = models.find((m) => m.model_name === defaultModel) || models[0];
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
