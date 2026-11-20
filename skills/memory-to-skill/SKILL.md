<!--
  memsearch-dsh memory-to-skill 技能正文。
  由 plugins/dsh/index.js 在插件加载时通过 ctx.skills.register() 注册，
  元数据（name: memory-to-skill、description、whenToUse）在代码中提供。
-->


你管理 MemSearch 的**程序性记忆**：把重复做的工作蒸馏成技能——它是每日日志
（情节记忆）与 PROJECT.md / USER.md（语义记忆）之外的第三层。请说明一次：这是
MemSearch 的技能蒸馏，而不是宿主 agent 自带的 skills 系统。

阶段：**0** 记忆日志 → **1** 候选（`.memsearch/skill-candidates/`，一个纳入
git 跟踪、持续演进的存储）→ **2** 已安装（某个 agent 的技能目录）。
候选永不自动安装；安装永远是人类的一步。用户的要求可能停在“创建/审阅候选”，
也可能在同一轮内获得明确同意后继续安装；按用户要求的阶段来。

`plugins.<platform>.memory_to_skill.*` 配置键前缀与安装路径说明因平台而异——
见你所处平台的参考文件：

- Claude Code → `references/claude-code.md`
- Codex → `references/codex.md`
- OpenClaw → `references/openclaw.md`
- OpenCode → `references/opencode.md`
- DeepSeek Harness → `references/dsh.md`

## 意图路由

- “把这个做成技能”、“就按我们刚做的” → **A. 立即捕获**。
- “有哪些技能 / 审阅候选 / 安装 X” → **B. 审阅与安装**。
- “挖掘我的历史 / 找出重复的工作流” → **C. 从历史中蒸馏**。
- “开启 / 配置 / 多积极” → **D. 配置**。
- 意图不清或无内容 → 先跑 **B** 的 `list`；为空则提供 A 或 C。

## A. 捕获刚做过的事（0→1→2）

你已经有上下文，所以**自己起草技能**——不要为此调用后台蒸馏器。写一个 SKILL.md
**正文**（markdown，不带 frontmatter）：针对该重复任务的祈使句编号步骤、具体命令
与路径、不含密钥、自包含。

**要精确，不要猜。** 你手上有刚做完的实时会话，所以用真实的命令、路径和输出，
不要近似值。某个细节不确定时，去核实（重读相关文件或转录）或者把该步写得更泛；
错误的命令比含糊的命令更糟。然后把候选持久化：

```bash
printf '%s' "## <title>\n\n1. ...\n2. ..." | memsearch skills add \
  --name "<short-slug>" \
  --description "<what it does AND when it should trigger — lead with the verbs a user types>" \
  --body-file -
```

`add` 会处理 slug、标准 frontmatter、meta.json 和 git 提交——不涉及 LLM。
然后把候选展示给用户；只在用户要求或明确同意时才安装（见 **B**）。最后检查后台
蒸馏是否开启；没开就提议开启（这样以后重复的工作流会被自动捕获）——不要强推。

## B. 审阅并安装候选（1→2）

```bash
memsearch skills status          # 待安装的候选版本
memsearch skills list            # 加 -j 可看来源 / 已安装路径
git -C .memsearch/skill-candidates log --oneline -5 2>/dev/null || true
```

`skills status` 把每个候选当前 `SKILL.md` 内容哈希与上次 `skills install` 记录的
哈希对比；它不检查正在生效的 agent 技能目录。某个已安装技能显示“待更新”，表示
候选源在上次刻意安装之后又演进了；审阅候选之后再重装。

推荐或安装之前，先浏览候选正文：若某一步看起来不确定或概括得含糊，就回到源材料
核对（必要时打开转录）或标给用户让他们决定——安装是原样复制候选，这里是发现错误
步骤的最后机会。展示候选时，如果有助于解释某个候选是新增、演进、移除还是重建，
可以提一下该存储最近的 git 历史。

把安装当作交互式检查点：先展示候选，按用户要求做调整后再安装，并与用户确认安装
目标。安装目标优先取自配置：如果 `paths` 是非空列表，就把这些路径作为建议目标
展示，确认后逐条作为 `--path` 传入。若为空，询问用户装到哪里；不要静默回落到
默认路径。

```bash
memsearch config get plugins.<platform>.memory_to_skill.paths 2>/dev/null || echo "[]"
memsearch skills install <name> --path <configured-or-user-approved-path>
```

把 `<platform>` 换成你平台的键前缀（见参考文件）。安装后提醒用户新开一个 agent
会话或重新打开对话，以便加载新安装的技能。

如果列表**为空**，多半是后台蒸馏未开启或尚未运行。给用户三个选择：立即从最近的
工作捕获（**A**）、从历史蒸馏（**C**）、开启后台流程（**D**）。

## C. 从历史中挖掘重复工作流（0→1）

要从过去的工作（而不只是当前会话）中提炼技能，先自己读最近的日志——它们在
`.memsearch/memory/*.md`——找出在多个会话中反复出现的多步流程。对每个确实可复用
的流程起草技能，并用 `memsearch skills add` 持久化（每个技能一次调用），方式与
**A** 相同。用自己的判断：只提出反复出现且可泛化的流程，不要单日的一次性操作。

**起草前先钻取原始记录。** 日志条目是有损摘要；确切的命令、参数和路径在原始转录
里。每条日志都带有指向转录文件的锚点。用转录钻取（确切命令见 memory-recall 技能
的平台参考文件）拿到**带工具调用**的原始轮次，据此写技能。如果展示的片段不完整，
在写下确切命令或路径前，先浏览同一原始来源中相邻的轮次。只有该命令失败（未知格式）
时才回退到直接读原始文件。若某细节无法确认，把该步写泛或省略——绝不编造。

后台流程开启时会自动挖掘，从摘要出发；在这里按需做则可以更有意识地查看原始转录，
结果可能更准确。

## D. 配置

确切的 `plugins.<platform>.memory_to_skill.*` 命令见你平台的参考文件：

```bash
memsearch config get plugins.<platform>.memory_to_skill.enabled 2>/dev/null || echo "false"
# 全局开启后台流程（不要悄悄开启）
memsearch config set plugins.<platform>.memory_to_skill.enabled true
# 历史挖掘的积极程度（默认 3；越小越积极）
memsearch config set plugins.<platform>.memory_to_skill.min_occurrences 3
# 预设安装目标（否则安装时才询问）
memsearch config set plugins.<platform>.memory_to_skill.paths '[".agents/skills"]'
```

自 v0.4.11 起，项目内的 `.memsearch.toml` 只接受白名单内的本地索引键。不要用
`--project` 设置 `plugins.*` 这类配置（如 `memory_to_skill.enabled`、
`min_occurrences`、`paths`）；请写进全局配置。

注意：`enabled` 只控制**后台**（会话结束时）流程。上面的显式命令（`skills add`、
`skills install`）始终可用，也可以用（C）直接从历史挖掘。

## 安装路径

平台相关的技能目录与推荐安装目标见你平台的参考文件。

## 红线

- 未经用户同意，绝不开启该功能、修改安装路径或安装候选。
- 不要手工编辑存储；用 `memsearch skills add` 创建候选，让纳入 git 跟踪的
  `.memsearch/skill-candidates/` 保留历史。
