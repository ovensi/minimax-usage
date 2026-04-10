"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHudLine = getHudLine;
exports.startHudUpdater = startHudUpdater;
const minimax_core_1 = require("./vendor/minimax-core");
function formatProgressBar(percent, width = 20) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return "[" + "=".repeat(filled) + " ".repeat(empty) + "]";
}
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}
function formatHudLine(model) {
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
