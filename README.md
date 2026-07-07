# MiniMax Token Usage Plugin

Claude Code 插件，查询 MiniMax Token Plan 当前时间段的已用量和剩余用量。

## 功能特性

- **MCP 服务器** - 提供 `minimax_query_usage` 工具
- **Claude Code 命令** - 使用 `/minimax-usage` 或 `minimax-usage` 命令查询
- **HUD 状态栏** - 在 CLI 底部显示 token 使用进度条

## 安装

### 1. 克隆插件

```bash
git clone https://gitee.com/github-24306930/minimax-usage.git ~/.claude/plugins/minimax-usage
```

### 2. 设置环境变量

macOS / Linux（zsh / bash）：

```bash
echo 'export MINIMAX_API_KEY="your_minimax_api_key"' >> ~/.zshrc   # 或 ~/.bashrc
source ~/.zshrc
```

Windows PowerShell（追加到 `$PROFILE`）：

```powershell
[System.Environment]::SetEnvironmentVariable('MINIMAX_API_KEY', 'your_minimax_api_key', 'User')
```

Windows cmd.exe（仅当前会话，重启失效）：

```cmd
setx MINIMAX_API_KEY "your_minimax_api_key"
```

### 3. 配置 Claude HUD（可选）

修改 `~/.claude/settings.json`，添加 minimax-usage 到组合 HUD 脚本：

```bash
# 编辑 combined-hud.sh 中的路径指向你的插件目录
```

## 使用方法

### Claude Code 命令

```
/minimax-usage
```

输出示例：

```
================================
    Minimax Account Usage
================================

Model: MiniMax-M*
--------------------------------
  Period:         2026/04/10 15:00 to 2026/04/10 20:00
  Quota:          600 requests
  Used:           42 requests (7.0%)
  Remaining:      558 requests
  Resets In:      4h 42m

================================
Query Time: 2026/04/10 15:30
================================
```

### HUD 显示

```
Model: MiniMax-M* | Used: 42/600 [==] 7% | Resets in: 4h 42m
```

## 配置选项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `refresh_interval` | number | 60000 | HUD 刷新间隔（毫秒） |
| `api_host` | string | https://www.minimaxi.com | API 主机地址 |
| `default_model` | string | 第一个模型 | HUD 显示的默认模型 |

## 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `MINIMAX_API_KEY` | 是 | - | MiniMax API 密钥 |
| `MINIMAX_API_HOST` | 否 | https://www.minimaxi.com | API 主机地址 |

## API

插件调用 MiniMax API endpoint:

```
GET https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains
Authorization: Bearer <MINIMAX_API_KEY>
```

## License

MIT
