# OpenCode 平台参考（memory-to-skill）

## 配置键前缀

`plugins.opencode.memory_to_skill.*`

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

## V2 运行时与原生蒸馏

V2 插件从其打包文件中注册 `memory-recall`、`memory-config` 和
`memory-to-skill`。这些内置项不需要全局
Skill 符号链接。候选安装仍使用上文的已配置文件系统
目标，并且需要用户明确请求。

原生蒸馏使用无状态的宿主推理，采用任务的模型覆盖
或宿主默认值。它没有用于 transcript 验证的工具。共享提示词
允许在原始证据不可用时生成通用候选；绝不要编造
确切命令，也不要根据日志摘要声称已完成 L3 验证。
