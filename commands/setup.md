# Setup MiniMax Token Usage Plugin

This plugin displays MiniMax token usage in the Claude Code HUD status bar.

## Setup Steps

### 1. Set Environment Variable

Add this to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export MINIMAX_API_KEY='your_minimax_api_key'
```

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
