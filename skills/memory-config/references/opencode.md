# OpenCode 平台参考

## 插件版本与更新

OpenCode 插件的最新已发布版本来自
`npm view @zilliz/memsearch-opencode version dist-tags --json`；源码
版本是 `plugins/opencode/package.json`。插件 **0.4.0** 支持官方
OpenCode **>=2.0.32 <3**；插件 **0.3.17** 支持 V1。开发 SDK 固定为
2.0.32。检查 `opencode --version`，并从其加载日志或缓存元数据中
确认插件实际加载的路径和包版本。注册表最新版本和工作区包版本
不能证明某个正在运行的会话加载了哪个插件。

在建议更新之前，请检查已加载版本所记录的 OpenCode 支持范围。`0.3.17` 插件使用 V1 API。仅支持 V2 的插件需要 V2 宿主；应将宿主与支持范围进行比较，而不是与插件版本做数值比较。若不匹配：

- OpenCode V1 配仅支持 V2 的插件：建议升级 OpenCode，或固定到有文档说明的 V1 兼容插件版本，例如
  `"plugin": ["@zilliz/memsearch-opencode@0.3.17"]`，同时保留其他插件。
- OpenCode V2 配 V1 插件：建议执行 `opencode plugin add
  @zilliz/memsearch-opencode@0.4.0`，或使用支持范围包含该宿主的更新版本。移除旧的 MemSearch 条目，确保恰好只有一个条目处于启用状态。

在获得授权的插件变更之后，通过 OpenCode 支持的方式刷新相关插件缓存，并重启以验证加载的版本。V1 可能在仅支持 V2 的入口点完成初始化之前就将其拒绝，因此其启动检查和运行时注册的 skill 不能成为唯一的排障入口。同样的指引必须仍可在安装文档或独立安装的 `memory-config` skill 中获取。

OpenCode transcript 召回从 OpenCode 的 SQLite 数据库读取，而捕获的 MemSearch 记忆以 markdown 形式存放在 `.memsearch/memory/` 下。

文档：https://zilliztech.github.io/memsearch/platforms/opencode/installation/

## Transcript 迁移与已有记忆

现有 markdown 摘要和 `<!-- session:... turn:... db:... -->` 锚点保持原有格式。搜索与展开基于这些记忆进行操作；L3 transcript 召回还要求所引用的 session 和 turn 在宿主数据库中仍可访问。

如果 OpenCode 升级后 L3 失败，请在诊断迁移问题之前，先检查宿主/插件兼容性、数据库位置与可用性，以及具体的 session/turn 查找。V1 的 `message`/`part` 表和 V2 的 `session_message` 使用不同的表示形式；仅凭表存在并不能证明所引用的 session 已被迁移。

当证据表明宿主迁移不完整时，请说明该限制，并引导用户参阅适用的
[OpenCode 迁移指引](https://opencode.ai/v2/docs/migrate-v1)。
宿主迁移由用户执行。不要迁移或编辑 OpenCode 数据库、改写 markdown 锚点，
或重置 MemSearch 捕获状态来作为召回的回退手段。保留可用的搜索/展开结果，
并在原始对话可验证之前将 L3 报告为不可用。新对话捕获同样
依赖于受支持的宿主数据，应单独检查。

## 插件键

```toml
[plugins.opencode.summarize]
enabled = true
provider = ""      # empty/native = OpenCode native summarizer
model = ""

[plugins.opencode.project_review]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/PROJECT.md"

[plugins.opencode.user_profile]
enabled = false
provider = "native"
model = ""
min_interval_hours = 24
input_dir = ".memsearch/memory"
output_file = ".memsearch/USER.md"

[plugins.opencode.memory_to_skill]
enabled = false
min_occurrences = 3   # how many times a workflow must recur before it is distilled
paths = []            # where installed skills are copied; empty = ask the user
```

## 原生模型默认值

- 原生摘要依次使用 `plugins.opencode.summarize.model`、宿主解析出的 title-agent 模型，最后是宿主默认值。V2 会把 `small_model` 迁移到 title agent。
- 除非设置了 `plugins.opencode.<task>.model`，否则原生维护使用 OpenCode 的默认值。
- `provider = ""` 或 `native` 使用无状态的 `ctx.generate.text`：没有会话历史、子会话或工具。原生维护无法通过 transcript 工具验证确切命令；不要在 Skill 候选中编造该证据。
- 其他 provider 保留共享的 API-provider 配置、端点、环境变量 key 引用、模型覆盖和提示词。这些是 MemSearch 设置；不要为了诊断它们而修改 OpenCode 的 provider/auth 配置。

## 重启指引

在宿主配置、插件代码或打包的 Skill 变更后重启 OpenCode。
V2 使用 `plugins` 数组，且其中恰好只有一个 MemSearch 源。Skill 在
运行时注册；不要将源条目与 npm 条目或旧的本地插件
链接混在一起。TOML 变更会在下一次捕获/召回/索引/维护调用时生效。

完成事件会立即触发一个有限次的捕获辅助程序；15 秒的
恢复扫描会覆盖错过的事件。待处理的捕获/索引工作在
prompt/context/search/expand 之前重放。宿主有 3 秒的关闭限制，因此
短暂退出可能会把工作留给下一次激活；退出时的推理并不保证
无条件执行。没有需要重启的独立 V2 守护进程，
插件也不管理旧的守护进程。诊断捕获时，请检查 `.memsearch/opencode-turns.db`
的 V2 pending/progress 表和 `.memsearch/.index-state.json`。绝不要删除状态来作为召回的回退手段。
