import { queryTokenUsage, getConfig, formatDuration, formatDate } from "./vendor/minimax-core";
import type { ModelRemain } from "./vendor/minimax-core";

// MCP server protocol implementation
// This implements a simple JSON-RPC over stdin/stdout

interface McpRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

function formatUsageForDisplay(model: ModelRemain): string {
  const total = model?.current_interval_total_count ?? 0;
  const remaining = model?.current_interval_usage_count ?? 0;
  const used = total - remaining;
  const usagePercent = total === 0 ? "0.0" : ((used / total) * 100).toFixed(1);

  const startDate = formatDate(model.start_time);
  const endDate = formatDate(model.end_time);
  const timeRemaining = formatDuration(model.remains_time);

  return `
Model: ${model.model_name}
--------------------------------
  Period:         ${startDate} to ${endDate}
  Quota:          ${total} requests
  Used:           ${used} requests (${usagePercent}%)
  Remaining:      ${remaining} requests
  Resets In:      ${timeRemaining}
`;
}

async function handleRequest(request: McpRequest): Promise<McpResponse> {
  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        tools: [
          {
            name: "minimax_query_usage",
            description: "Query MiniMax token plan usage for the current billing period",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      },
    };
  }

  if (request.method === "tools/call") {
    if (request.params && typeof request.params === 'object') {
      const params = request.params as { name?: string; arguments?: Record<string, unknown> };
      if (params.name === "minimax_query_usage") {
        try {
          const config = getConfig();
          const data = await queryTokenUsage(config);
          const models = data.model_remains || [];

          if (models.length === 0) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                content: [
                  {
                    type: "text",
                    text: "No usage data available.",
                  },
                ],
              },
            };
          }

          // Format first model's data for display
          const displayText = models.map(formatUsageForDisplay).join("\n");

          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              content: [
                {
                  type: "text",
                  text: displayText,
                },
              ],
            },
          };
        } catch (error) {
          return {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      }
    }
  }

  return {
    jsonrpc: "2.0",
    id: request.id,
    error: {
      code: -32601,
      message: `Method not found: ${request.method}`,
    },
  };
}

// Read requests from stdin and write responses to stdout
async function main(): Promise<void> {
  let buffer = "";
  const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB limit

  process.stdin.on("data", async (chunk: Buffer) => {
    buffer += chunk.toString();

    // Prevent memory exhaustion
    if (buffer.length > MAX_BUFFER_SIZE) {
      buffer = buffer.slice(-MAX_BUFFER_SIZE);
    }

    // Process complete JSON-RPC messages (newline-delimited)
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim() === "") continue;
      try {
        const request = JSON.parse(line) as McpRequest;
        const response = await handleRequest(request);
        process.stdout.write(JSON.stringify(response) + "\n");
      } catch (error) {
        const errorResponse: McpResponse = {
          jsonrpc: "2.0",
          id: 0,
          error: {
            code: -32700,
            message: "Parse error",
          },
        };
        process.stdout.write(JSON.stringify(errorResponse) + "\n");
      }
    }
  });

  process.stdin.on("error", (err) => {
    console.error("stdin error:", err);
  });
}

main().catch((error) => {
  console.error("MCP server error:", error);
  process.exit(1);
});
