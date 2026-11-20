# Claude Code 平台参考

## 插件版本与更新

Claude Code 插件最新的 marketplace/source 版本位于 `zilliztech/memsearch` 仓库的
`plugins/claude-code/.claude-plugin/plugin.json` 和
`.claude-plugin/marketplace.json` 中。用以下命令查看最新的源清单：

```bash
curl -fsSL https://raw.githubusercontent.com/zilliztech/memsearch/main/plugins/claude-code/.claude-plugin/plugin.json
```

对于 marketplace 安装，先执行 `claude plugin marketplace update memsearch-plugins`，
再执行 `claude plugin update memsearch`，然后重启 Claude Code。

文档：https://zilliztech.github.io/memsearch/platforms/claude-code/installation/

## 插件键

```toml
[plugins.claude-code.summarize]
enabled = true
provider = ""      # empty/native = Claude Code native summarizer
model = ""

[plugins.claude-code.project_review]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/PROJECT.md"

[plugins.claude-code.user_profile]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/USER.md"

[plugins.claude-code.memory_to_skill]
enabled = false
min_occurrences = 3   # how many times a workflow must recur before it is distilled
paths = []            # where installed skills are copied; empty = ask the user
```

## 原生模型默认值

- 原生摘要默认使用 `haiku`。
- 原生维护默认使用 `sonnet`。
- `provider = ""` 或 `native` 使用 Claude Code 的非交互式原生路径。

## 重启指引

在插件安装/更新，或 hook/skill 文件变更后，建议新开一个 Claude Code 会话，
因为当前会话可能已经加载了旧的插件状态。TOML 变更会在下一次捕获/召回/索引/
维护调用时生效。
