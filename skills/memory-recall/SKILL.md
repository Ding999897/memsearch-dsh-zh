<!--
  memsearch-dsh memory-recall 技能正文。
  由 plugins/dsh/index.js 通过 ctx.skills.registerProvider() 注册，
  元数据（name: memory-recall、description、whenToUse）在代码中提供。
  加载时 {{PLACEHOLDER}} 占位符会替换为当前工作区的实际值。
-->

# 记忆检索（Memory Recall）

在 memsearch 的持久记忆中检索与用户问题相关的上下文。记忆库跨 agent 共享（Claude Code、Codex、OpenClaw、OpenCode、DeepSeek Harness），因此能浮现其中任何一方过去的产出、决策和对话片段。

## 何时使用

当用户的问题能受益于历史上下文时使用本技能：用户提到过去的工作、询问之前做过什么，或当前任务可以复用早前的决策与发现。检索很便宜（一次索引查询），拿不准时就执行。

## 步骤

### 1. 检索相关片段

对项目对应的 memsearch collection 做一次语义检索。本技能加载时，插件会根据当前工作目录推导出 collection：

```bash
{{MEMSEARCH_CMD}} search "{{QUERY}}" --top-k 5 --json-output {{MILVUS_FLAG}}--default-collection "{{COLLECTION}}"
```

每次检索前，先确认 `~/.memsearch/config.toml` 或项目内的
`.memsearch.toml` 是否存在。两者都不存在时，在命令里加上 `--provider onnx`；
否则不要指定 provider，沿用已有配置。

把 `{{QUERY}}` 换成对用户所需内容的简短自然语言描述。`--json-output` 的结果包含 `content`、`source`、`heading`、`score` 和 `chunk_hash`。

### 2. 展开有价值的命中

对最有价值的命中，展开完整的 markdown 小节以查看上下文：

```bash
{{MEMSEARCH_CMD}} expand <chunk_hash> {{MILVUS_FLAG}}--default-collection "{{COLLECTION}}"
```

### 3. 追溯到原始对话（可选）

如果展开的结果里带有如下锚点注释：

```
<!-- session:<id> turn:<N> db:<path> -->
```

可以渲染该轮次前后的原始对话：

```bash
{{PYTHON_CMD}} "{{PLUGIN_DIR}}/scripts/parse-transcript.py" --db "<path>" --turn <N> --context 3
```

只想要目标轮次时用 `--context 0`；省略 `--turn` 则查看最近的若干轮。

如果脚本提示缺少解压组件，可用其声明的依赖在隔离环境中运行：

```bash
uv run --script "{{PLUGIN_DIR}}/scripts/parse-transcript.py" --db "<path>" --turn <N> --context 3
```

### 4. 汇报整理后的摘要

向用户返回一段简明的相关上下文摘要，必要时注明记忆来源文件。如果检索不到相关内容，用一句话直说，然后不用记忆继续任务。不要编造记忆。

## 说明

- 记忆库是 `<project>/.memsearch/memory/YYYY-MM-DD.md` 下的纯 markdown。Milvus 只是派生的检索索引，某个片段在索引中的进度可能略落后于 markdown 源文件。
- 如果 `memsearch` 不在 PATH 中，请使用检测到的命令前缀 `{{MEMSEARCH_CMD}}`（可能是 `uvx --from 'memsearch[onnx]' memsearch`）。
- 优先给出面向用户的最终结论，而不是原始转录细节。
