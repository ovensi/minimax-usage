#!/bin/bash
# Combined HUD wrapper for statusLine
# Runs claude-hud and minimax-usage sequentially, merges outputs

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
PLUGIN_DIR=$(ls -d "$CLAUDE_DIR/plugins/cache/claude-hud/claude-hud/"*/ 2>/dev/null | sort -V | tail -1)
RUNTIME="/Users/sizhou/.nvm/versions/node/v25.2.1/bin/node"
HUD_CLI="/Users/sizhou/project/minimax-usage/dist/hud-cli.js"

# claude-hud reads stdin from Claude Code for context/usage data
CLAUDE_HUD_OUTPUT=$("$RUNTIME" "${PLUGIN_DIR}dist/index.js" 2>/dev/null)

# minimax-usage makes its own API call, does not need stdin
MINIMAX_OUTPUT=$(MINIMAX_API_KEY="$MINIMAX_API_KEY" node "$HUD_CLI" 2>/dev/null)

# Output claude-hud lines first, then minimax on its own line
if [ -n "$CLAUDE_HUD_OUTPUT" ]; then
  echo "$CLAUDE_HUD_OUTPUT"
fi
if [ -n "$MINIMAX_OUTPUT" ]; then
  echo "$MINIMAX_OUTPUT"
fi
