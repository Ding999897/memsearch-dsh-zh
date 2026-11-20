# WorkBuddy

WorkBuddy 与 Claude Code 共用 MemSearch 的 shell 钩子和 Markdown 记忆。使用 `memsearch config set plugins.workbuddy.summarize.provider <name>` 选择一个已有的具名 API provider；模型和 API key 来自 `llm.providers.<name>`。桌面应用必须能够访问所配置的 key，以及带 WorkBuddy 支持的 MemSearch CLI。provider 为空或为 `native` 时会跳过捕获。在聊天 UI 中选择的模型不会决定摘要模型。

如果捕获缺失，请检查工作区、provider，以及 Stop 钩子是否提供了可读的 `transcript_path`。请使用日志所引用的 transcript，绝不要使用其他会话最新的文件。WorkBuddy 只运行捕获与召回。
