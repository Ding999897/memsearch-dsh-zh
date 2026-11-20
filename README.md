> **简体中文化版本** —— 本仓库是 [`@zilliz/memsearch-dsh`](https://github.com/zilliztech/memsearch) 0.1.10 的社区中文翻译版（MIT，原始版权归 Zilliz Inc.）。改动清单见 [ZH-CHANGES.md](./ZH-CHANGES.md)。

# @zilliz/memsearch-dsh

MemSearch 是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的插件。
它为 DSH 提供持久的跨 agent 记忆，与 Claude Code、Codex、OpenClaw 和 OpenCode 插件
使用同一个 `.memsearch/memory/` markdown 存储，底层由 Milvus 混合检索索引支撑。

```
capture  ── session/event turn/end ──> summarize (dsh-headless agent default, or custom-llm) ──> memory/YYYY-MM-DD.md
hint     ── agent/pre-step step 1  ──> remind the agent to use memory-recall when needed
recall   ── native memory-recall skill ──> search → expand → transcript
review   ── web UI dock panel ──> GET/POST /memsearch-dsh/* ──> list candidates / queue review / install
```

## 前置要求

- 安装 memsearch：

  ```bash
  uv tool install "memsearch[onnx]"
  ```

- 一个要挂载记忆的 DSH profile（web / headless / tui）。
- Node >= 22.19（DSH 的要求）。
- profile 的 `PATH` 中要有 Python 3（`python3`、`python`，或 Windows 的 `py -3` 启动器）。

## 安装

### 从 npm 安装（推荐）

```bash
dsh plugin --profile web add @zilliz/memsearch-dsh
```

若想用保存在 DSH **Models** 页面上的 API key 生成默认摘要，需要让 `headless`
任务能访问已保存的 key。在 `~/.dsh/profiles/headless/cordis.patch.yml` 中添加或更新
以下顶层条目，也可以交给 `memory-config` 处理。

```yaml
- id: credentials
  name: '@deepseek-ai/dsh-credentials-local'
  disabled: false
```

### 从源码安装（开发）

```bash
cd /path/to/memsearch/plugins/dsh
npm install --omit=peer
dsh plugin --profile web add /path/to/memsearch/plugins/dsh
```

> `dsh plugin` 是 pnpm 的转发器：它把包链接进 profile，检测 `package.json` 中的
> `dsh.bundle` 声明，并将其追加到 profile 的 bundle 层。包内的 `cordis.patch.yml`
> 随后会把 `memsearch` 行插入 profile 的插件树。
>
> 请把 `web` 换成你的 profile 名称（`headless`、`tui` 等），并重启该 profile 的
> DSH（或新开一个会话），让插件挂载生效。

### 开发测试

在 `plugins/dsh` 中运行 `npm test` 执行 Node 测试。维护集成测试套件还需要本检出的
Python 核心：

```bash
# From the repository root
uv sync --locked
cd plugins/dsh
uv run --project ../.. npm run test:integration
```

集成套件通过运行时进程派生和真实的 Python 维护 runner 调用已注册的定时器与
会话回调。它只把原生 LLM 生成替换为确定性的本地输出；无需模型服务、embedding、
数据库或运行中的 DSH 宿主。CI 会运行两个套件。

### 手动插入 patch（不使用 `dsh plugin`）

把下面这行追加到 profile 的 `cordis.patch.yml`，并确保 `@zilliz/memsearch-dsh`
能从 profile 的 `node_modules` 解析到（例如作为 `link:` 依赖）：

```yaml
- insert:
    - id: memsearch
      name: '@zilliz/memsearch-dsh'
```

### 验证捕获

完成一个回合后，打开 `<project>/.memsearch/memory/` 中今天的文件，检查是否有
关于你所讨论内容的摘要。

## 配置

当全局和项目级 MemSearch 配置都不存在时，embedding 会通过 ONNX 在本地运行。
已有配置按原样使用。请通过 `memsearch config` 或 `memory-config` 技能配置
embedding 与 Milvus 设置。

插件通过 profile 的 `cordis.patch.yml` 的 `config` 块配置（patch 你插入的
`memsearch` 行）。所有键都是可选的。

| 键 | 类型 | 默认值 | 含义 |
| --- | --- | --- | --- |
| `captureEnabled` | bool | `true` | 将已完成的回合捕获到记忆中。 |
| `injectEnabled` | bool | `true` | 当存在记忆时，在每个回合的第一步之前提醒 agent 使用 memory-recall。 |
| `summarizeEnabled` | bool | `true` | 写入前先对回合做摘要（失败时写入一条简短的不可用说明，绝不写入原始转储）。 |
| `summarizeMode` | string | `auto` | 设置了 `[plugins.dsh.summarize] provider` 时使用 `custom-llm`，否则使用 `dsh-headless`。也可显式选择任一后端以固定它。 |

其余一切——provider/model、Milvus、collection、记忆目录——都来自
**memsearch config / 环境变量**，与其他平台插件完全一致（没有按插件划分的配置字段）：

- **摘要 provider/model** → `[plugins.dsh.summarize] provider` / `model`
  位于 `~/.memsearch/config.toml`（或 `[llm.providers.*]`；见下文
  `custom-llm` 小节）。
- **Milvus** → memsearch 配置中的 `[milvus] uri`。
- **Collection** → 由项目路径派生（`derive-collection.sh`），可被 memsearch 配置中的
  `[milvus] collection` 或传给 memsearch CLI 的 `--collection` 覆盖。
- **记忆目录** → `MEMSEARCH_DIR` 环境变量（显式指定 → 全局作用域），否则为
  `<project>/.memsearch`。

从使用独立 DSH collection 的 Windows 版本升级时，启动会基于现有 Markdown 重建
共享索引。原始文件和旧 collection 都会保留；显式的 `[milvus] collection` 设置
仍然生效。

### 维护任务（PROJECT.md / USER.md / 技能）

可选的后台维护，与其他平台插件保持一致。每个任务默认关闭；在
`~/.memsearch/config.toml` 中启用你需要的任务：

```toml
[plugins.dsh.project_review]
enabled = true            # maintain .memsearch/PROJECT.md
[plugins.dsh.user_profile]
enabled = true            # maintain .memsearch/USER.md
[plugins.dsh.memory_to_skill]
enabled = true            # distill recurring workflows into skill candidates
min_occurrences = 3       # how often a workflow must recur before distilling
```

每个任务的通用设置：`provider`（`native` = 一次性 DSH headless agent，默认）、
`model`、`min_interval_hours`（默认 24）、`input_dir`、`output_file`。候选技能落在
`.memsearch/skill-candidates/`（受 git 跟踪），并且**绝不会自动安装**——安装是需要
人工执行的步骤（参见其他平台插件中的 `memory-to-skill` 技能）。

覆盖层示例（把它加到 profile 自己的 `cordis.patch.yml`）：

```yaml
- id: memsearch
  config:
    summarizeMode: dsh-headless   # pin the headless backend (default is auto)
```

### 摘要模式

有两种后端，由 `summarizeMode` 选择——这与 Claude Code / Codex / OpenClaw /
OpenCode 插件提供的“已配置的选择”相同（它们各自都能用自家 LLM 或 headless
agent + 小模型来摘要）。默认值（`auto`）与它们一致：配置了 provider 就直接调用
LLM；什么都不配置就使用 headless agent。

- **`auto`**（默认）—— 与其他平台插件一致：
  - 若 memsearch 配置中设置了 `[plugins.dsh.summarize] provider`
    （`~/.memsearch/config.toml`，与其他插件读取的位置相同），则使用
    该 provider/model 对应的 `custom-llm`；
  - 否则使用 `dsh-headless`。
  也就是说，插件的行为与另外四个一致：**配置了 provider → 直接调用 LLM；
  什么都不配置 → headless**。
- **`dsh-headless`** —— 启动一个一次性的 DSH headless agent
  （`dsh --profile headless "<summarize task>"`）来写笔记，与其他插件复用
  自家 agent headless 模式的方式一致。该子 agent 使用部署的
  `agent-default-model`——`~/.dsh/settings.yaml` 的用户层（也就是 Web UI 模型
  设置写入的那份选择）会覆盖任何 patch，因此**`[plugins.dsh.summarize]` 的
  provider/model 在这里不生效**——请改为在 DSH 设置中修改模型
  （`~/.dsh/settings.yaml` 中的 `agent-default-model:`，或 Web UI 的模型选择器）。
  启动是异步、发起后即忘的，所以 headless 启动的那几秒绝不会阻塞对话。需要
  PATH 中有 `dsh`，或把 `DSH_CLI` 指向 CLI 入口。桌面用户可以在应用菜单中启用
  **Manage dsh Command… → Install**；Windows 的 `dsh.cmd` 启动器使用 Desktop
  自带的运行时。修改其命令环境后请重启 DSH。
  子 agent 以 `MEMSEARCH_DSH_SUMMARIZE=1` 启动；插件会检查该标记，并在摘要器内部
  保持惰性（不 capture / inject / skill），因此摘要器自身的会话永远不会被循环
  重复捕获。
- **`custom-llm`** —— `scripts/summarize.py` 导入 memsearch 的
  `[llm.providers.*]` 配置并直接调用 LLM。轻量：一个 python 进程，无需启动 DSH，
  也没有额外的 CLI 依赖。当你想要特定的小模型（例如 memsearch 配置中的官方
  `deepseek-v4-flash` key）而又不想启动 agent 时，选择它。Provider 选择顺序
  （最具体的优先）：
  1. `[plugins.dsh.summarize] provider`（或 summarize.py 由此收到的
     `summarizeProvider` CLI 参数）——在 `[llm.providers.<name>]` 中查找；
     条目缺失会显式报错（可见错误），绝不会静默写空。
  2. `llm.provider`，前提是它指向一个已配置的 provider 或是原始类型。
  3. `compact.llm_provider`（已弃用）或作为最终默认的 `openai`。

**模式之间没有自动回退**：你配置（或由 auto 解析出）的后端就是实际使用的后端。
如果它失败（缺少 dsh CLI、provider 配置有误），会写入一条包含原因的简短不可用
说明——插件绝不会静默切换到未配置的 LLM。

摘要失败时会写入一条简短的不可用说明（与 Claude Code 的行为一致——记忆保持干净，
transcript 锚点让原始内容仍可通过渐进式披露访问），并通过 DSH logger 记录一条
可见的警告。

## 工作原理

- **捕获** —— 监听 `session/event` 中的 `turn/end`，渲染该回合
  （`[User]` / `[Assistant]` / `[Tool call]` 行），随后发起后即忘地摘要（若已启用），
  并以共享锚点格式 `<!-- session:<id> turn:<N> db:<path> -->` 追加到**该会话自己的**
  `memory/YYYY-MM-DD.md`。项目目录取自 `session.header.cwd`，因此长期运行的 web
  界面会捕获它托管的每个项目，而不只是进程的启动目录。回合会串行化（LLM 摘要
  调用绝不重叠），并且 `captureExists` 去重保证每个回合在其事件重放时保持幂等。
- **召回提示** —— 在 `agent/pre-step` 的第 1 步，若项目存在记忆文件，则追加一条
  简短提示，建议使用 `memory-recall`。是否使用过往上下文由 agent 判断，需要时它会
  调用该技能。
- **召回** —— 注册 `memory-recall` 技能（可通过 DSH 原生 `skill` 工具调用），
  执行 检索 → 展开 → transcript 逐层下钻，并返回整理后的摘要。其检索集合在技能
  加载时由当前工作目录派生。
- **维护** —— 运行共享的维护 runner（PROJECT.md / USER.md 维护与 memory-to-skill
  蒸馏），触发时机为 `session/disposed`，外加每 6 小时的兜底定时器。每个任务都是
  一个到期状态机：最多每 `min_interval_hours`（默认 24 小时）运行一次，且仅在
  memsearch 配置中启用时运行（`[plugins.dsh.project_review]`、
  `[plugins.dsh.user_profile]`、`[plugins.dsh.memory_to_skill]`），与其他平台插件
  一致。维护工作由一次性 DSH headless agent 执行（与摘要相同的
  `dsh --profile headless` 机制），并以 `MEMSEARCH_DSH_SUMMARIZE=1` 启动，使插件
  在其内部保持惰性。每次原生维护调用有十分钟上限；完整 runner 为三个任务加清理
  预留 31 分钟。失败的任务可以在后续触发时重试，被中断的运行不会永久阻塞维护。
- **技能审阅面板（仅 web）** —— 位于输入框上方的非阻塞 dock 条（注册到
  `conversation.input.dock` 槽位），列出蒸馏到 `.memsearch/skill-candidates/` 的
  技能候选。它由插件的浏览器端（`client.js`，在 `package.json` 中通过 `dsh.client`
  声明）提供，并通过 DSH web 服务器上的两个 JSON 路由与宿主通信：
  - `GET /memsearch-dsh/skill-candidates?sessionId=<id>` —— 列出候选
    （pending 在前），解析自每个候选的 `meta.json`。
  - `POST /memsearch-dsh/skill-review`，请求体 `{ sessionId, name, action }`：
    - `action: "review"` 会把一条 `[memsearch] Skill candidate ...` 用户消息
      排入在线 agent 的收件箱（`agent.inbox.append('next-turn',
      ...)`）。
      agent 会在下个回合审阅该候选——非阻塞，绝不会打断正在运行的回合，
      也绝不会打开阻塞式对话框。
    - `action: "install"` 会在后台（detached、unref'd）执行
      `memsearch skills install <name> --path <dir>`，安装到解析出的目标：
      memsearch 配置中 `plugins.dsh.memory_to_skill.paths` 的第一项
      （相对项按项目目录解析），否则为 DSH 默认的 `~/.agents/skills`，
      `skill-filesystem` provider 会监视并自动加载该目录。
  项目目录由会话 id 解析：优先在线 agent 的会话 cwd，其次会话持久化的 header cwd
  （因此只是浏览旧对话——尚无在线 agent——仍会显示该对话的项目，而不是启动目录），
  最后是进程 cwd。所以在多项目 web 界面上，面板反映的是你当前查看的会话所属项目。
  路由会在 DSH web 服务器服务可用后注册（memsearch 插件挂载在 base bundle 层，
  早于 web 服务器启动；`apply` 会用 1 秒的 unref 定时器重试）。
  Headless / TUI profile 没有浏览器：`webServer` 服务永远不会出现，不会注册路由，
  其余一切保持不变。

## 卸载

```bash
dsh plugin --profile web remove @zilliz/memsearch-dsh
```

移除依赖会删除 profile 层条目；记忆 markdown 文件和 Milvus 索引保持不动。

## 开发

- 插件是纯 ESM，无构建步骤——`dsh plugin add` 直接链接检出的代码，因此修改在
  profile 重载后立即生效。
- 浏览器端（`client.js`）是预构建的 client-module bundle：它用
  `window.__ModuleLoader__.load({ id, factory })` 注册工厂（web shell 在
  `/plugins/<id>/client.js` 提供的惰性 CJS 表），并导出 Cordis 客户端插件形态
  （`inject` + `apply`）。它按原样提交；请直接编辑它并保持 `__ModuleLoader__`
  注册格式（参照随包发布的 `@deepseek-ai/dsh-client-ui-*` `lib/client.js` bundle）。
- `scripts/` 下的 Python helper 使用仓库的 `ruff` 配置做 lint，并在
  `plugins/dsh/tests/` 下测试。
- 保持记忆写入格式与其他平台插件字节级兼容；共享的标题与 transcript 锚点格式
  参见 [`scripts/capture.py`](../opencode/scripts/capture.py) 中的 OpenCode
  journal writer。

### 命令设置

插件优先使用显式的命令设置。`DSH_CLI` 选择 headless DSH 入口，`MEMSEARCH_CMD`
选择 MemSearch，`MEMSEARCH_PYTHON` 选择供 helper 脚本使用的 Python 解释器。
可使用可执行文件路径、带参数的引号命令，或 JSON 参数数组；包含空格的路径必须
保持为单个参数。非法的显式设置会被报告，而不会被替换成另一个安装。

在没有显式设置的情况下，DSH 依次从 `PATH`、`~/.local/share/pnpm/dsh` 解析。
MemSearch 依次使用 `PATH` 中的 `memsearch`、`~/.local/bin/uvx`，然后是 `PATH`
中的 `uvx`。

缺少 DSH 或 Python 命令会产生依赖警告。请启用 Desktop 的 CLI 入口或配置所需
命令，然后重启 profile。能够启动但执行失败的命令会报告其执行错误；请检查该命令
的 profile、provider 和模型配置。插件不会更改这些设置，也不会自动切换摘要后端。
摘要失败时，Markdown journal 会保留现有的不可用说明和 transcript 锚点。

