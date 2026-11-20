# Codex 平台参考（memory-to-skill）

## 配置键前缀

`plugins.codex.memory_to_skill.*`

## 安装路径

每个 agent 从自己的目录读取 skill：Claude Code 为 `.claude/skills/`；
Codex 和 OpenCode 为 `.agents/skills/`（共享标准，Cursor
等也会读取）；OpenClaw 为 `.openclaw/skills/`。Claude Code **不会**读取
`.agents/skills/`。

推荐目标：

- `.agents/skills` — **项目级（推荐）**：来自本项目记忆的 skill 通常在这里最相关。
- `~/.agents/skills` — 全局：可在你的所有项目中使用。
- 自定义路径，或若干路径（一个 skill 可以安装到多个目录）。

安装到多个路径以覆盖多个 agent。
