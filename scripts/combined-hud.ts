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

import { spawnSync, SpawnSyncReturns } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const SELF_DIR = __dirname;                          // .../minimax-usage/scripts
const PLUGIN_ROOT = path.resolve(SELF_DIR, "..");    // .../minimax-usage
const HUD_CLI = path.join(PLUGIN_ROOT, "dist", "hud-cli.js");

const CONFIG_DIR =
  process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");

// claude-hud caches its installed versions under
//   $CLAUDE_CONFIG_DIR/plugins/cache/claude-hud/claude-hud/<version>/dist/index.js
const CLAUDE_HUD_CACHE = path.join(
  CONFIG_DIR,
  "plugins",
  "cache",
  "claude-hud",
  "claude-hud"
);

function findClaudeHudEntry(): string | null {
  if (!fs.existsSync(CLAUDE_HUD_CACHE)) return null;

  let entries: string[];
  try {
    entries = fs.readdirSync(CLAUDE_HUD_CACHE);
  } catch {
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
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function safeSpawn(
  scriptPath: string,
  extraEnv: Record<string, string>,
  inheritStdin: boolean
): string | null {
  if (!scriptPath || !fs.existsSync(scriptPath)) return null;

  let result: SpawnSyncReturns<string>;
  try {
    result = spawnSync(process.execPath, [scriptPath], {
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
  } catch {
    return null;
  }

  if (result.status !== 0) return null;
  const out = (result.stdout || "").trim();
  return out.length > 0 ? out : null;
}

function main(): void {
  const claudeHudEntry = findClaudeHudEntry();
  // claude-hud reads its own context from stdin (model, cwd, etc.). Claude
  // Code pipes the same JSON envelope to the statusLine command, so we forward
  // stdin to the claude-hud child. minimax-usage does not need stdin.
  const claudeHudOut = safeSpawn(claudeHudEntry ?? "", {}, true);
  const minimaxOut = safeSpawn(
    HUD_CLI,
    { MINIMAX_API_KEY: process.env.MINIMAX_API_KEY || "" },
    false
  );

  if (claudeHudOut) process.stdout.write(claudeHudOut + "\n");
  if (minimaxOut) process.stdout.write(minimaxOut + "\n");
}

main();