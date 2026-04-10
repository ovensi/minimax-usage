#!/bin/bash
# Combined HUD wrapper for statusLine
# Runs claude-hud and minimax-usage separately, outputs both lines

# Get minimax-usage output (runs async)
MINIMAX_OUTPUT=$(MINIMAX_API_KEY="$MINIMAX_API_KEY" node /Users/sizhou/project/minimax-usage/dist/hud-cli.js 2>/dev/null)

# Get claude-hud output
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
PLUGIN_DIR=$(ls -d "$CLAUDE_DIR/plugins/cache/claude-hud/claude-hud/"*/ 2>/dev/null | sort -V | tail -1)
RUNTIME="/Users/sizhou/.nvm/versions/node/v25.2.1/bin/node"

CLAUDE_HUD_OUTPUT=$("$RUNTIME" "${PLUGIN_DIR}dist/index.js" 2>/dev/null)

# Output both lines (claude-hud first line, then minimax)
if [ -n "$CLAUDE_HUD_OUTPUT" ]; then
  echo "$CLAUDE_HUD_OUTPUT" | head -1
fi
if [ -n "$MINIMAX_OUTPUT" ]; then
  echo "$MINIMAX_OUTPUT"
fi
