# OpenClaw 平台参考

## 插件版本与更新

OpenClaw 插件的最新已发布版本来自
`clawhub package inspect memsearch`；源码版本是
`plugins/openclaw/package.json`。用以下命令更新：

```bash
openclaw plugins install --force clawhub:memsearch
```

然后恢复所需的 hook 权限，并运行 `openclaw gateway restart`。

文档：https://zilliztech.github.io/memsearch/platforms/openclaw/installation/

## 插件键

```toml
[plugins.openclaw.summarize]
enabled = true
provider = ""      # empty/native = OpenClaw native summarizer
model = ""

[plugins.openclaw.project_review]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/PROJECT.md"

[plugins.openclaw.user_profile]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/USER.md"

[plugins.openclaw.memory_to_skill]
enabled = false
min_occurrences = 3   # how many times a workflow must recur before it is distilled
paths = []            # where installed skills are copied; empty = ask the user
```

## 原生模型默认值

- 除非被覆盖，否则原生摘要使用 OpenClaw agent/默认模型。
- 除非设置了 `plugins.openclaw.<task>.model`，否则原生维护也使用 OpenClaw agent/默认模型。
- `provider = ""` 或 `native` 使用 OpenClaw 的非交互式原生路径。

## 重启指引

在插件安装/更新或 hook 权限变更后运行 `openclaw gateway restart`，
因为 gateway 可能已经加载了旧的插件状态。TOML
变更会在下一次捕获/召回/索引/维护调用时生效。
