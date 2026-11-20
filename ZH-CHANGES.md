# 改动清单：MemSearch DSH 插件 · 简体中文化版

本仓库是 [`@zilliz/memsearch-dsh`](https://github.com/zilliztech/memsearch) `0.1.10` 的社区简体中文化版本，
按 MIT 许可分发，原始版权归 Zilliz Inc.（见 [LICENSE](./LICENSE)）。

翻译做到「只改人读的文案，不动任何机器契约」：属性名、API 路由、action 值（`review` / `install`）、
JSON 键、命令、路径、占位符（`{{QUERY}}`、`{{COLLECTION}}`、`{{MEMSEARCH_CMD}}` 等）、
代码块内容全部保持原样。

## 改了什么

| 文件 | 改动 |
|---|---|
| `client.js` | 面板 UI 文案约 28 处：技能候选、审阅 / 安装 / 刷新 / 忽略 / 收起、加载中、空状态、toast 与错误提示、状态标签（候选 / 已安装）、来源与出现次数 |
| `index.js` | 三个技能（`memory-recall` / `memory-config` / `memory-to-skill`）的 `description` 与 `whenToUse`；`RECALL_HINT` 提示行；技能候选可审阅时的注入消息；摘要不可用时的兜底文案 |
| `skills/memory-recall/SKILL.md` | 整篇中文，保留占位符与 bash 命令 |
| `skills/memory-config/SKILL.md` | 整篇中文 |
| `skills/memory-to-skill/SKILL.md` | 整篇中文 |
| `skills/*/references/*.md` | 11 份参考文档中文（DSH、Claude Code、Codex、OpenClaw、OpenCode、WorkBuddy 等） |
| `README.md` | 整篇中文 |
| `prompts/summarize.txt` | 摘要语言规则改为强制简体中文（不再跟随原始对话语言） |
| `package.json` | `description` 中文化，版本号加 `-zh.1` 后缀 |

未改动：`runtime.js`、`cordis.patch.yml`、`scripts/*`（其中 `scripts/summarize.py` 里的兜底提示词仍是英文，
属于内部实现，正常路径不会走到）。

## 安装

把本仓库内容覆盖到 DSH 的插件目录：

```
<DSH_HOME>/profiles/<profile>/node_modules/@zilliz/memsearch-dsh/
```

然后在插件管理器里把 `include:memsearch` 关掉再打开（热重载），或者重启 DSH。

## extras/

- `global-prompts/`：四份中文强制提示词（`summarize` / `project_review` / `user_profile` / `memory_to_skill`）。
  放到 `~/.memsearch/prompts/`，并在 `~/.memsearch/config.toml` 的 `[prompts]` 里指向它们。
  **这样即使插件被 npm 升级覆盖，中文输出仍然生效**——推荐与插件本体一起使用。
- `config.toml.example`：嵌入模型与提示词路径示例（`onnx` + `Xenova/bge-m3`，无需 API key）。

## 校验

仓库自带一个不依赖网络的文档检查脚本，翻译或改文档后跑一次：

```bash
node .github/scripts/check-markdown.mjs   # 或 npm run check:markdown
```

它会检查：所有 `.md` 不得带 UTF-8 BOM（带 BOM 的 `package.json` 会让 `JSON.parse` 直接失败）、
代码围栏必须成对、Markdown 里的相对链接必须指向仓库中真实存在的路径、根目录 JSON 必须可解析。

## 需要注意

- 摘要后端 `summarizeMode=dsh-headless` 需要两样东西：`dsh` CLI 可执行，以及一个可用的模型凭据
  （`DEEPSEEK_API_KEY` 环境变量或凭据存储里的同名条目）。缺凭据时，记忆条目会写入
  「记忆摘要不可用：…」的兜底说明，而不是真正的摘要。
- onnx 嵌入模型首次运行需要下载；huggingface 直连不通时，可以手工构造 HF 缓存目录
  （`models--Xenova--bge-m3/refs/main` + `snapshots/<版本串>/tokenizer.json|model_quantized.onnx`），
  之后 `HF_HUB_OFFLINE=1` 也能离线工作。
- 中文版只是文案翻译，行为与上游 0.1.10 一致；上游若有更新，请以上游为准。
