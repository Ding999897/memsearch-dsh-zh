# Codex 平台参考

## 插件版本与更新

Codex 插件没有独立的包/版本文件。检查
`${CODEX_HOME:-$HOME/.codex}/hooks.json` 以找到 hook 源路径，然后
将该仓库与 `zilliztech/memsearch` 的最新 GitHub release 进行比较：

```bash
git -C <memsearch-repo> describe --tags --always --dirty
gh release view --repo zilliztech/memsearch --json tagName,publishedAt,url
```

用 `git pull` 加上
`bash plugins/codex/scripts/install.sh` 更新源码安装。

文档：https://zilliztech.github.io/memsearch/platforms/codex/installation/

## 插件键

```toml
[plugins.codex.summarize]
enabled = true
provider = ""      # empty/native = Codex native summarizer
model = ""

[plugins.codex.project_review]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/PROJECT.md"

[plugins.codex.user_profile]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/USER.md"

[plugins.codex.memory_to_skill]
enabled = false
min_occurrences = 3   # how many times a workflow must recur before it is distilled
paths = []            # where installed skills are copied; empty = ask the user
```

## 原生模型默认值

- 原生摘要默认使用 `gpt-5.1-codex-mini`。
- 除非设置了 `plugins.codex.<task>.model`，否则原生维护使用 Codex 默认值。
- `provider = ""` 或 `native` 使用 Codex 的非交互式原生路径。

## 重启指引

在 `hooks.json`、skill、插件或本地 agent 文件变更后，建议新开一个 Codex 会话，
因为当前会话可能已经加载了旧的 hook/skill 状态。TOML 变更会在下一次捕获/召回/索引/
维护调用时生效。
