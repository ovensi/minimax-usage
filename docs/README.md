# MiniMax Token Usage Plugin

Query MiniMax token plan usage (used/remaining) for the current billing period.

## Features

- **MCP Server**: Exposes `minimax_query_usage` tool
- **Claude Code Tool**: Use `/minimax-usage` or `minimax-usage` command
- **HUD Status Bar**: Shows token usage at the bottom of the CLI

## Setup

### 1. Set API Key

macOS / Linux (zsh / bash):

```bash
echo 'export MINIMAX_API_KEY="your_minimax_api_key"' >> ~/.zshrc   # or ~/.bashrc
source ~/.zshrc
```

Windows PowerShell (persist via `$PROFILE`):

```powershell
[System.Environment]::SetEnvironmentVariable('MINIMAX_API_KEY', 'your_minimax_api_key', 'User')
```

Windows cmd.exe:

```cmd
setx MINIMAX_API_KEY "your_minimax_api_key"
```

### 2. Install Plugin

Copy `minimax-usage/` to your Claude Code plugins directory:

```bash
cp -r minimax-usage ~/.claude/plugins/
```

### 3. Configure (optional)

Copy and edit config:

```bash
cp minimax-usage/config.json.example minimax-usage/config.json
```

Edit `config.json`:

```json
{
  "refresh_interval": 60000,
  "api_host": "https://www.minimaxi.com",
  "default_model": ""
}
```

## Usage

### Claude Code Tool

```
/minimax-usage
```

### HUD

The HUD automatically displays at the bottom of your CLI:

```
Model: claude-3.5-sonnet | Used: 1.13K/200K [==========      ] 56.5% | Resets in: 5d 12h
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MINIMAX_API_KEY` | Yes | - | MiniMax API Key |
| `MINIMAX_API_HOST` | No | `https://www.minimaxi.com` | API host |
