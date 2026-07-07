# Setup MiniMax Token Usage Plugin

This plugin displays MiniMax token usage in the Claude Code HUD status bar.

## Setup Steps

### 1. Set Environment Variable

Pick the line that matches your shell, then restart Claude Code so it picks up the new env:

**zsh** (macOS default) — append to `~/.zshrc`:

```bash
echo 'export MINIMAX_API_KEY="your_minimax_api_key"' >> ~/.zshrc
```

**bash** (Linux / Git Bash on Windows) — append to `~/.bashrc`:

```bash
echo 'export MINIMAX_API_KEY="your_minimax_api_key"' >> ~/.bashrc
```

**PowerShell** (Windows Terminal / modern Windows) — persist to user env:

```powershell
[System.Environment]::SetEnvironmentVariable('MINIMAX_API_KEY', 'your_minimax_api_key', 'User')
```

**cmd.exe** (legacy Windows) — persist to user env:

```cmd
setx MINIMAX_API_KEY "your_minimax_api_key"
```

> The HUD detects terminal capabilities automatically. If you are on a modern Windows terminal (Windows Terminal, VS Code's integrated terminal, PowerShell 7+) you'll get the full colored bar; if you're stuck on legacy `cmd.exe`, the HUD silently falls back to ASCII so nothing breaks.

### 2. Install Dependencies

```bash
cd ~/.claude/plugins/minimax-usage
npm install
npm run build
```

### 3. Configure HUD (Optional)

Edit `~/.claude/settings.json` and update the `statusLine.command`:

```bash
"command": "bash -c 'exec node /path/to/minimax-usage/dist/hud-cli.js'"
```

### 4. Reload Plugins

Run `/reload-plugins` in Claude Code.

## Usage

- `/minimax-usage` - Query and display current token usage
- HUD shows usage in the status bar at the bottom of Claude Code

## Links

- [GitHub](https://github.com/ovensi/minimax-usage)
- [Gitee](https://gitee.com/github-24306930/minimax-usage)

## Platform notes

- The MCP `minimax_query_usage` tool reads the **remaining percentage** fields that the current `/remains` endpoint actually populates; the legacy absolute-count fields are kept in the type definition for compatibility but no longer drive the output. If your MCP report ever shows `Used: 0.0% / Remaining: 100.0%` for everything, your key is probably hitting the wrong endpoint or has no quota data — not a Windows issue.
- All HUD rendering paths are pure Node; `scripts/combined-hud.ts` (compiled to `dist/combined-hud.js`) replaces the old `combined-hud.sh` and contains zero hardcoded paths, so it works the same on macOS, Linux, and Windows.
