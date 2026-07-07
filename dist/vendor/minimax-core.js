"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimaxError = void 0;
exports.queryTokenUsage = queryTokenUsage;
exports.formatDuration = formatDuration;
exports.formatDate = formatDate;
exports.getConfig = getConfig;
exports.terminalSupportsAnsi = terminalSupportsAnsi;
class MinimaxError extends Error {
    constructor(message) {
        super(message);
        this.name = "MinimaxError";
    }
}
exports.MinimaxError = MinimaxError;
async function queryTokenUsage(config) {
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
        const data = (await response.json());
        if (data.base_resp && data.base_resp.status_code !== 0) {
            throw new MinimaxError(`API error: ${data.base_resp.status_msg}`);
        }
        return data;
    }
    catch (error) {
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
function formatDuration(milliseconds) {
    if (milliseconds === 0)
        return "0m";
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}
function getConfig() {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
        throw new MinimaxError("MINIMAX_API_KEY environment variable is not set");
    }
    const apiHost = process.env.MINIMAX_API_HOST || "https://www.minimaxi.com";
    return { apiKey, apiHost };
}
/**
 * Whether the current stdout can render ANSI escape codes + box-drawing
 * characters without producing garbage. Used by the HUD renderer to decide
 * between the colored Unicode version and the plain-ASCII fallback.
 *
 * Rules:
 *   1. NO_COLOR set (any value) — disable.
 *   2. Not a TTY (redirected to a file / pipe) — disable.
 *   3. On Windows: only enable when we know the host supports VT processing.
 *      Windows Terminal sets WT_SESSION; VS Code's integrated terminal sets
 *      TERM_PROGRAM=vscode. Everything else on Windows (legacy cmd.exe,
 *      PowerShell 5.x without OEM change) is treated as not supporting ANSI
 *      so we don't ship escape sequences the user will see as `←[31m`.
 *   4. All other platforms — enable.
 */
function terminalSupportsAnsi() {
    if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== "") {
        return false;
    }
    if (!process.stdout.isTTY) {
        return false;
    }
    if (process.platform === "win32") {
        if (process.env.WT_SESSION)
            return true;
        if (process.env.TERM_PROGRAM === "vscode")
            return true;
        return false;
    }
    return true;
}
