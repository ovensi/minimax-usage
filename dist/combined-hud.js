"use strict";
/*
 * Combined HUD wrapper for statusLine.
 *
 * Runs the claude-hud plugin's HUD and minimax-usage's HUD, then prints both
 * to stdout so Claude Code's statusLine can show them together.
 *
 * Cross-platform: pure Node, no shell. Replaces the previous bash script
 * which had hardcoded macOS paths and Unix-only assumptions
 * (see issue #1 — Windows not supported).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const SELF_DIR = __dirname; // .../minimax-usage/scripts
const PLUGIN_ROOT = path.resolve(SELF_DIR, ".."); // .../minimax-usage
const HUD_CLI = path.join(PLUGIN_ROOT, "dist", "hud-cli.js");
const CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
// claude-hud caches its installed versions under
//   $CLAUDE_CONFIG_DIR/plugins/cache/claude-hud/claude-hud/<version>/dist/index.js
const CLAUDE_HUD_CACHE = path.join(CONFIG_DIR, "plugins", "cache", "claude-hud", "claude-hud");
function findClaudeHudEntry() {
    if (!fs.existsSync(CLAUDE_HUD_CACHE))
        return null;
    let entries;
    try {
        entries = fs.readdirSync(CLAUDE_HUD_CACHE);
    }
    catch {
        return null;
    }
    // Pick the lexicographically-highest semver-looking directory name.
    // Lexicographic sort happens to work for "0.1.0", "1.0.0", "1.10.0", etc.
    const versions = entries
        .filter((name) => /^\d+(\.\d+)*$/.test(name))
        .sort()
        .reverse();
    for (const v of versions) {
        const candidate = path.join(CLAUDE_HUD_CACHE, v, "dist", "index.js");
        if (fs.existsSync(candidate))
            return candidate;
    }
    return null;
}
function safeSpawn(scriptPath, extraEnv, inheritStdin) {
    if (!scriptPath || !fs.existsSync(scriptPath))
        return null;
    let result;
    try {
        result = (0, child_process_1.spawnSync)(process.execPath, [scriptPath], {
            env: { ...process.env, ...extraEnv },
            encoding: "utf-8",
            timeout: 10000,
            // Suppress child stderr — Claude Code's statusLine should not show
            // upstream HUD diagnostics. Errors are silently swallowed; the
            // caller falls back to "no output" for that HUD.
            stdio: [
                inheritStdin ? "inherit" : "ignore",
                "pipe",
                "ignore",
            ],
        });
    }
    catch {
        return null;
    }
    if (result.status !== 0)
        return null;
    const out = (result.stdout || "").trim();
    return out.length > 0 ? out : null;
}
function main() {
    const claudeHudEntry = findClaudeHudEntry();
    // claude-hud reads its own context from stdin (model, cwd, etc.). Claude
    // Code pipes the same JSON envelope to the statusLine command, so we forward
    // stdin to the claude-hud child. minimax-usage does not need stdin.
    const claudeHudOut = safeSpawn(claudeHudEntry ?? "", {}, true);
    const minimaxOut = safeSpawn(HUD_CLI, { MINIMAX_API_KEY: process.env.MINIMAX_API_KEY || "" }, false);
    if (claudeHudOut)
        process.stdout.write(claudeHudOut + "\n");
    if (minimaxOut)
        process.stdout.write(minimaxOut + "\n");
}
main();
