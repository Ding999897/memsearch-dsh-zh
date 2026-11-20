# DeepSeek Harness (DSH) 平台参考

## 插件版本与更新

DSH 插件是 npm 包 `@zilliz/memsearch-dsh`。检查已发布版本：

```bash
npm view @zilliz/memsearch-dsh version dist-tags --json
```

源码版本是 `plugins/dsh/package.json`。通过 profile patch 机制安装/更新：

```bash
dsh plugin --profile <name> add @zilliz/memsearch-dsh
```

文档：https://zilliztech.github.io/memsearch/platforms/dsh/installation/

## 两个配置面

与其他平台不同，DSH 将配置拆分到两个面上：

1. **MemSearch TOML**（`~/.memsearch/config.toml`）— 摘要 provider/模型、
   Milvus、collection、记忆目录以及维护任务。使用
   `[plugins.dsh.*]` 前缀。
2. **插件级开关**，位于 profile 的 `cordis.patch.yml` 中 — 捕获/
   注入/摘要开关以及摘要器后端，设置在 `memsearch`
   行的 `config` 下。

## MemSearch TOML 键

```toml
[plugins.dsh.summarize]
provider = ""      # named [llm.providers.<name>] entry; only used by custom-llm mode
model = ""

[plugins.dsh.project_review]
enabled = false
provider = "native"   # native = a one-shot DSH headless agent
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/PROJECT.md"

[plugins.dsh.user_profile]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/USER.md"

[plugins.dsh.memory_to_skill]
enabled = false
min_occurrences = 3
paths = []          # install targets; default resolves to ~/.agents/skills
```

## 插件级开关（cordis.patch.yml）

这些不在 MemSearch TOML 中。它们位于 profile patch 中，
`memsearch` 行的 `config` 下：

```yaml
- id: memsearch
  config:
    captureEnabled: true     # capture completed turns
    injectEnabled: true      # remind the agent to use memory-recall
    summarizeEnabled: true   # summarize turns before writing
    summarizeMode: auto      # auto | dsh-headless | custom-llm
```

## 摘要器后端

- **`auto`**（默认）— 如果设置了 `[plugins.dsh.summarize] provider`，则使用
  `custom-llm`；否则使用 `dsh-headless`。
- **`dsh-headless`** — 启动一个一次性 `dsh --profile headless` agent。该
  子 agent 的模型是部署的 `agent-default-model`，来自
  `~/.dsh/settings.yaml`（与 Web UI 模型选择器写入的是同一选择）。
  **`[plugins.dsh.summarize]` 的 provider/model 在此不适用** — 请改为在
  DSH 设置中修改模型。
- **`custom-llm`** — 使用 `[llm.providers.*]` 直接发起 LLM 调用；provider/model
  来自 `[plugins.dsh.summarize]`。

各模式之间没有静默回退：解析出的后端就是实际使用的后端。
摘要失败时会写入一段简短的不可用说明，绝不会写入原始 transcript
转储。

### 设置原生摘要

在初始设置期间，如果捕获和摘要已启用，且后端
解析为 `dsh-headless`，请检查所选 provider 如何获取其 API key。
对于由 DSH 服务启动环境提供的 key，摘要进程
会继承它。对于保存在 DSH **Models** 页面上的 key，请在本地过滤
`dsh --profile headless --dump-config` 的输出，只显示
`credentials` 条目是否已启用。

如果该条目被禁用，请主动提出为使用
`headless` profile 的所有任务启用已保存的 key。当用户选择此选项时，在
`$DSH_HOME/profiles/headless/cordis.patch.yml`
（默认 `~/.dsh/profiles/headless/cordis.patch.yml`）中更新或添加
以下顶层条目。保留其他
条目和任何现有凭据设置。

```yaml
- id: credentials
  name: '@deepseek-ai/dsh-credentials-local'
  disabled: false
```

重新检查生效的条目，并验证下一个完成的回合会在每日 Markdown 文件中写入摘要。
如果 Web 聊天正常但摘要报告 `MISSING_CREDENTIAL`，请使用相同的检查。

## 原生模型默认值

- `dsh-headless` 和 `native` 维护使用 DSH 部署的
  `agent-default-model`（Web UI 模型选择器 / `~/.dsh/settings.yaml`）。

## 重启指引

安装或更新插件后重启 DSH profile，以便
`memory-recall` skill 重新注册，插件行重新加载。TOML 变更会在
下一次捕获/召回/索引/维护调用时生效；摘要器
后端变更（`summarizeMode`）需要插件配置重新加载。

## 命令可用性

对于缺少命令的警告，请检查 profile 的 `PATH` 以及显式的
`DSH_CLI`、`MEMSEARCH_CMD` 或 `MEMSEARCH_PYTHON` 设置。Desktop 可以通过
**Manage dsh Command… → Install** 注册其自带的 CLI；Windows 使用
`dsh.cmd`。保留带引号的路径或 JSON 参数数组，并在环境变更后
重启 profile。不要猜测私有的 Desktop/pnpm 路径，也不要静默
更改所选的摘要后端。如果命令能启动但失败，
请检查其报告的错误以及所选的 profile/provider 配置。
