# DeepSeek Harness (DSH) 平台参考（memory-to-skill）

## 配置键前缀

`plugins.dsh.memory_to_skill.*`

## 安装路径

蒸馏出的候选存放在 `.memsearch/skill-candidates/`（受 git 跟踪），
且**绝不会自动安装**。Web profile 提供 skill 审阅
dock；安装需通过 `memsearch skills install` 手动执行。

安装目标从 memsearch 配置中的 `plugins.dsh.memory_to_skill.paths`
解析；相对条目相对于项目目录解析。未设置时，DSH
默认使用 `~/.agents/skills`，`skill-filesystem` provider 会监视并
自动加载它。

推荐目标：

- `.agents/skills` — 项目级共享标准
- `~/.agents/skills` — 全局（DSH 默认），可在所有项目中使用
- 自定义路径，或若干路径（一个 skill 可以安装到多个目录）
