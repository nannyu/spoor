import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { agentDefaultsEn, agentDefaultsZh } from './i18n/agentDefaultsContent';

const resources = {
  en: {
    translation: {
      "app": {
        "name": "The Memory Architect",
        "description": "Spatial Thinking & Knowledge Synthesis"
      },
      "sidebar": {
        "personal": "Library",
        "reference": "Review",
        "lab": "Research Lab",
        "agents": "Agents",
        "search_placeholder": "Search memories...",
        "new_note": "New Note",
        "publish": "Synthesize",
        "agent_subtitle": "Intelligent Co-thinkers",
        "drop_agent": "Drop to analyze context",
        "settings": "Settings"
      },
      "canvas": {
        "zoom": "Zoom",
        "full_screen": "Fullscreen",
        "history": "History",
        "new_canvas": "New Canvas",
        "default_name": "Canvas {{number}}",
        "rename": "Rename",
        "delete_note": "Delete note",
        "select_note": "Select note",
        "link_note": "Link to another note",
        "cycle_layout": "Cycle Layout",
        "change_color": "Change Color",
        "change_font": "Change Font"
      },
      "nodes": {
        "theme": "Core Theme",
        "note": "Note",
        "observation": "Observation",
        "ai_refinement": "AI Refinement",
        "ai_loading": "Synthesizing...",
        "empty_note": "Empty note. Click to edit.",
        "type_something": "Type something...",
        "connect_notes": "Connect notes to analyze.",
        "ai_your_follow_up": "Your follow-up",
        "ai_follow_up_placeholder": "Ask a follow-up. Type \"web search\" to fetch sources (Enter to send, Shift+Enter for newline)…",
        "ai_follow_up_send": "Send",
        "agent_run_analysis": "Run analysis on linked notes",
        "agent_no_context": "Link a note that has content to this agent (use the + button), then run analysis.",
        "search_while_writing": "Web search from this note (streams result cards beside you)",
        "search_follow_up_ack": "Retrieved web sources as linked cards from this turn.",
        "search_no_metaso_key": "Add a Metaso Search API key in Settings to use “web search” in the AI follow-up box.",
        "search_need_text": "No query: add keywords after “web search”, or ensure the AI reply above has a usable first line.",
        "search_no_results": "No web results for that query.",
        "search_failed": "Web search failed. Check the Metaso key and network."
      },
      "settings": {
        "title": "Settings",
        "profile": "Profile",
        "ai_config": "AI Configuration",
        "language": "Language",
        "user_name": "Display Name",
        "user_role": "Current Focus / Status",
        "provider": "AI Provider",
        "api_key": "API Key",
        "base_url": "Base URL (Optional)",
        "model": "Model",
        "metaso_key": "Metaso Search API Key",
        "metaso_key_hint": "Optional: enables real-time web search in Research Lab for richer, sourced reports.",
        "save_success": "Settings saved.",
        "close": "Close",
        "save": "Save Configuration"
      },
      "ai": {
        "input_placeholder": "Ask AI to draft some ideas or paragraphs...",
        "loading": "AI is thinking...",
        "generated_article_title": "Generated Synthesis",
        "intent": {
          "analyzer_system": "You are an intent-disambiguation helper for a canvas writing assistant. The user's line may be short, a question, or pack several tasks.\n\nDecide whether at least two genuinely different helpful interpretations exist (not trivial synonyms). If one reading clearly dominates, set ambiguous to false.\n\nReply with ONLY valid JSON (no markdown fences, no extra text):\n{\"ambiguous\": false, \"options\": [], \"hint\": \"\"}\nor\n{\"ambiguous\": true, \"options\": [\"first concrete instruction\", \"second ...\", \"third ...\"], \"hint\": \"one short sentence why\"}\n\nRules:\n- If ambiguous is false: options MUST be []. hint may be \"\".\n- If ambiguous is true: options MUST be exactly three distinct, self-contained instructions the downstream model could follow, in the SAME language as the user's message.\n- Each option must be actionable (full sentence or clear imperative).",
          "analyzer_user": "User message:\n---\n{{text}}\n---",
          "modal_title": "Clarify your request",
          "modal_original": "Your input",
          "modal_choose": "Pick the interpretation that matches what you want:",
          "extra_section": "Additional notes",
          "extra_placeholder": "Optional: constraints, tone, audience…",
          "confirm": "Confirm and generate",
          "cancel": "Cancel"
        },
        "prompts": {
          "localeDirective": "Always reply entirely in English for this session, unless the user explicitly asks for another language.",
          "publish": "Turn the following concepts, notes, and drafts into a cohesive, well-written article:\n\n{{content}}",
          "agentContext": "Context to analyze:\n{{content}}",
          "toolbar": "Context from connected notes across the canvas:\n{{context}}\n\nUser request: {{request}}",
          "context_fragment_label": "\n[Context Fragment]: ",
          "threadFollowUp": "You are continuing a dialogue on the canvas. The assistant’s previous reply was:\n\n---\n{{previous}}\n---\n\nThe user’s new message:\n{{request}}\n\nRespond as a thoughtful continuation. Address the follow-up directly; keep the same voice and depth as before unless the user asks otherwise."
        }
      },
      "lab": {
        "investigate": "What would you like to investigate?",
        "placeholder": "e.g., The relationship between spatial decay and memory loss...",
        "approve": "Approve & Execute",
        "executing": "Agent Execution Log",
        "report": "Synthesized Report",
        "new_research": "New Research",
        "past_sessions": "Past Sessions",
        "agent_title": "Deep Research Agent",
        "searching": "Searching the web...",
        "search_complete": "{{count}} web sources found",
        "search_fallback": "Search unavailable, using offline mode",
        "plan_edit_hint": "Edit each step directly below. When you run research, the model will follow this outline.",
        "plan_revision_placeholder": "Describe how you want to change the outline (e.g., merge steps, add a competitor review, shorten step 2)...",
        "plan_revision_apply": "Update outline with AI",
        "plan_revision_applying": "Updating outline...",
        "ai_generate_plan": "You are a senior research strategist helping an author who is writing a manuscript.\nTheir research question is: \"{{query}}\".\n\nDesign a logically connected 3‑step research plan that will help the author deeply investigate this topic and integrate the findings into their manuscript.\n\nFor each step, return a JSON object with:\n- \"title\": a short, descriptive title (5–7 words),\n- \"desc\": a 2–3 sentence description that clearly states:\n  - the specific goal of this step,\n  - the key methods, sources, or analytical techniques to be used,\n  - how the output of this step directly feeds into the manuscript.\n\nThe three steps should follow a natural research progression, such as:\n(1) scoping & literature foundation, (2) core analysis or evidence gathering, (3) synthesis, implications, or argument construction.\nTailor the progression to the nature of the query (e.g., empirical paper, review, theoretical essay, policy report).\n\nRespond ONLY with a valid JSON array in the following format (no additional text):\n[\n  {\"title\": \"Step 1 Title\", \"desc\": \"Step 1 Description\"},\n  {\"title\": \"Step 2 Title\", \"desc\": \"Step 2 Description\"},\n  {\"title\": \"Step 3 Title\", \"desc\": \"Step 3 Description\"}\n]",
        "ai_revise_plan": "You are refining a multi-step research outline.\n\nResearch question: \"{{query}}\"\n\nCurrent plan (JSON array; each item has \"title\" and \"desc\"):\n{{plan}}\n\nUser instructions for revising the plan:\n{{instruction}}\n\nApply the instructions faithfully. Keep a coherent 2–5 step flow unless the user explicitly asks for a different number. Each step must have meaningful \"title\" and \"desc\" strings.\n\nRespond ONLY with a valid JSON array (no markdown fences, no extra text), exactly in this shape:\n[\n  {\"title\": \"...\", \"desc\": \"...\"}\n]",
        "ai_research_report": "You are a research synthesizing agent. Based on the user's query: \"{{query}}\", generate a detailed research report.\nRespond ONLY in valid JSON format matching this structure:\n{\n  \"intro\": \"Introduction paragraph\",\n  \"points\": [\n    {\"title\": \"Point 1 Title\", \"text\": \"Detailed analysis of this point\"}\n  ],\n  \"conclusion\": \"Conclusion paragraph with actionable next steps\"\n}"
      },
      "reference": {
        "index_title": "Archive Index",
        "search_refs": "Search references...",
        "citation": "Copy Citation",
        "metadata_notes": "Metadata & Notes",
        "tags": "Tags",
        "linked_drafts": "Linked Drafts",
        "private_notes": "Private Notes",
        "notes_placeholder": "Add your own notes to this reference..."
      },
      "agents": {
        "personas": "Personas",
        "new_persona": "New Persona",
        "active_config": "Active Configuration",
        "test_sandbox": "Test Sandbox",
        "close_sandbox": "Close Sandbox",
        "enhance_prompt": "AI Enhance",
        "identity_tone": "Identity & Tone",
        "persona_name": "Persona Name",
        "role_specialty": "Role Specialty",
        "system_prompt": "System Prompt",
        "knowledge_base": "Knowledge Clusters (Preview)",
        "model_params": "Model Params",
        "temp": "Temperature",
        "creativity": "Creativity",
        "delete_confirm": "Are you sure you want to delete this persona?",
        "search_personas": "Search personas...",
        "sandbox_title": "Sandbox: {{name}}",
        "sandbox_empty": "Testing sandbox for {{name}}. Send a message to see how it responds based on the current system prompt.",
        "ai_thinking": "AI is thinking...",
        "message_placeholder": "Message {{name}}...",
        "sandbox_note": "Sandbox uses current prompt & params",
        "select_persona": "Select a Persona",
        "select_subtitle": "Choose an agent from the sidebar or create a new one.",
        "defaults": agentDefaultsEn,
        "studio": {
          "fallback_assistant": "You are a helpful assistant.",
          "enhance_user": "You are an expert in prompt engineering and AI system design. Your task is to enhance the system prompt for an AI agent.\n\nAgent Name: {{name}}\nAgent Role: {{role}}\nOriginal System Prompt:\n\"\"\"\n{{prompt}}\n\"\"\"\n\nCreate a significantly improved version of this system prompt. The enhanced prompt must:\n\n1. **Structure** – Use clear sections (e.g., Role & Persona, Core Capabilities, Behavioral Guidelines, Communication Style, Emotional Intelligence, Boundaries & Constraints, Workflow).\n2. **Role Elaboration** – Deeply flesh out the agent’s identity, leveraging its name and role to build a coherent persona.\n3. **Operational Detail** – Add step‑by‑step thinking or process guidelines where appropriate; specify tools, tone, and fallback behaviours.\n4. **Emotional Intelligence** – Integrate empathy, active listening, tone matching, de‑escalation techniques, and rules for asking clarifying questions or handling frustration.\n5. **Do’s & Don’ts** – Include explicit behavioural rules: what the agent should always do and what it must never do.\n6. **Fidelity** – Preserve the original intent and core responsibilities; do not add capabilities unrelated to the original prompt.\n7. **Formatting** – Use a clean, professional layout with markdown headings, bullet points, and short paragraphs. The final prompt should be self-contained and ready to use.\n\nOutput only the enhanced system prompt. Start your response with the line \"New Enhanced Prompt:\" and then provide the prompt – no explanations, no commentary.\nNew Enhanced Prompt:"
        }
      }
    }
  },
  zh: {
    translation: {
      "app": {
        "name": "记忆建筑师",
        "description": "空间思维与知识合成"
      },
      "sidebar": {
        "personal": "素材库",
        "reference": "回顾区",
        "lab": "研究实验室",
        "agents": "AI 助手",
        "search_placeholder": "搜索记忆...",
        "new_note": "新建便签",
        "publish": "合成文章",
        "agent_subtitle": "智能协同思考者",
        "drop_agent": "拖拽以分析上下文",
        "settings": "设置"
      },
      "canvas": {
        "zoom": "缩放",
        "full_screen": "全屏",
        "history": "历史记录",
        "new_canvas": "新建画布",
        "default_name": "画布 {{number}}",
        "rename": "重命名",
        "delete_note": "删除便签",
        "select_note": "选择便签",
        "link_note": "链接到其他节点",
        "cycle_layout": "切换布局",
        "change_color": "更改颜色",
        "change_font": "更改字体"
      },
      "nodes": {
        "theme": "核心主题",
        "note": "笔记",
        "observation": "观察",
        "ai_refinement": "AI 优化",
        "ai_loading": "合成中...",
        "empty_note": "空笔记。点击编辑。",
        "type_something": "输入内容...",
        "connect_notes": "连接笔记进行分析。",
        "ai_your_follow_up": "你的追问",
        "ai_follow_up_placeholder": "继续追问…（可输入「联网搜索」检索资料；Enter 发送，Shift+Enter 换行）",
        "ai_follow_up_send": "发送",
        "agent_run_analysis": "开始分析已连接的笔记",
        "agent_no_context": "请先用右侧「+」将含有内容的笔记连到该智能体，再点此开始分析。",
        "search_while_writing": "据此便签联网检索（结果以多张卡片逐张出现在旁侧）",
        "search_follow_up_ack": "已检索并生成资料卡片（见连线）。",
        "search_no_metaso_key": "请先在设置中填写秘塔搜索 API Key，才能在 AI 追问中输入「联网搜索」或使用研究实验室检索。",
        "search_need_text": "缺少检索词：可在「联网搜索」后写上关键词，或确保上方 AI 回复首行有可用内容。",
        "search_no_results": "没有搜到相关网页结果。",
        "search_failed": "联网搜索失败，请检查秘塔 Key 与网络。"
      },
      "settings": {
        "title": "设置",
        "profile": "个人资料",
        "ai_config": "AI 配置",
        "language": "语言",
        "user_name": "显示名称",
        "user_role": "当前焦点 / 状态",
        "provider": "AI 服务商",
        "api_key": "API 密钥",
        "base_url": "基础 URL (可选)",
        "model": "模型",
        "metaso_key": "秘塔搜索 API Key",
        "metaso_key_hint": "可选：配置后研究实验室将启用联网搜索，生成更丰富的引用报告。",
        "save_success": "设置已保存。",
        "close": "关闭",
        "save": "保存配置"
      },
      "ai": {
        "input_placeholder": "让 AI 构思一些想法或段落...",
        "loading": "AI 思考中...",
        "generated_article_title": "生成的合成稿",
        "intent": {
          "analyzer_system": "你是画布写作助手前的「意图消歧」模块。用户输入可能很短、带疑问，或一句话里塞了多件任务。\n\n判断是否存在至少两种**实质不同**、助手都可能合理解读的方向（同义改写不算）。若一种理解明显占主导，则不算歧义，ambiguous 取 false。\n\n只输出合法 JSON（不要 Markdown 代码块、不要解释）：\n{\"ambiguous\": false, \"options\": [], \"hint\": \"\"}\n或\n{\"ambiguous\": true, \"options\": [\"第一种具体可执行指令\", \"第二种…\", \"第三种…\"], \"hint\": \"一句话说明为何歧义\"}\n\n规则：\n- ambiguous 为 false 时，options 必须为 []，hint 可为空字符串。\n- ambiguous 为 true 时，options 必须恰好三条，彼此区分明确，且与**用户消息语言一致**；每条应是 downstream 模型能直接照做的完整短句或清晰祈使句。",
          "analyzer_user": "用户原话：\n---\n{{text}}\n---",
          "modal_title": "澄清你的意图",
          "modal_original": "你的输入",
          "modal_choose": "请选择最符合你本意的一种理解：",
          "extra_section": "补充说明",
          "extra_placeholder": "可选：补充约束、语气、受众等…",
          "confirm": "确认并生成",
          "cancel": "取消"
        },
        "prompts": {
          "localeDirective": "请始终使用简体中文回复，除非用户明确要求使用其他语言。",
          "publish": "请将以下概念、笔记与草稿整合为一篇连贯、文笔流畅的文章：\n\n{{content}}",
          "agentContext": "待分析上下文：\n{{content}}",
          "toolbar": "画布上已连接笔记的上下文：\n{{context}}\n\n用户需求：{{request}}",
          "context_fragment_label": "\n【上下文片段】：",
          "threadFollowUp": "你正在画布上延续一段对话。助手上一轮回复如下：\n\n---\n{{previous}}\n---\n\n用户的新消息：\n{{request}}\n\n请承接上文，直接回应这条追问；语气与深度与之前保持一致，除非用户另有要求。"
        }
      },
      "lab": {
        "investigate": "您想调查什么？",
        "placeholder": "例如：空间衰减与记忆丧失之间的关系...",
        "approve": "批准并执行",
        "executing": "智能体执行日志",
        "report": "综合报告",
        "new_research": "新研究",
        "past_sessions": "历史会话",
        "agent_title": "深度研究智能体",
        "searching": "正在联网搜索...",
        "search_complete": "已获取 {{count}} 条网络来源",
        "search_fallback": "搜索不可用，使用离线模式",
        "plan_edit_hint": "可直接编辑各步标题与说明；执行研究时，模型会以你最终保存的大纲为准。",
        "plan_revision_placeholder": "说明希望如何修改大纲（例如：合并第 1、2 步，新增竞品对比，收紧第 2 步范围）…",
        "plan_revision_apply": "让 AI 按说明更新大纲",
        "plan_revision_applying": "正在更新大纲…",
        "ai_generate_plan": "你是一位资深研究策略顾问，正在辅助作者完成书稿写作。\n作者的研究问题是：「{{query}}」。\n\n请设计一个逻辑连贯的三步研究计划，帮助作者深入调研该主题，并把成果融入书稿。\n\n每一步请返回一个 JSON 对象，字段为：\n- \"title\"：简短有概括力的标题（约 5–7 个词）；\n- \"desc\"：2–3 句话，清楚说明：\n  - 该步的具体目标；\n  - 关键方法、文献来源或分析手段；\n  - 该步产出如何直接进入书稿。\n\n三步应形成自然递进，例如：\n（1）界定范围与文献基础；（2）核心分析或证据收集；（3）综合、推论或论点构建。\n请根据问题性质（如实证论文、综述、理论散文、政策报告等）调整递进。\n\n仅回复合法 JSON 数组，不要任何额外文字，格式如下：\n[\n  {\"title\": \"第一步标题\", \"desc\": \"第一步描述\"},\n  {\"title\": \"第二步标题\", \"desc\": \"第二步描述\"},\n  {\"title\": \"第三步标题\", \"desc\": \"第三步描述\"}\n]",
        "ai_revise_plan": "你正在根据用户意见修订多步研究大纲。\n\n研究问题：「{{query}}」\n\n当前大纲（JSON 数组，每项含 \"title\" 与 \"desc\"）：\n{{plan}}\n\n用户对大纲的修改要求：\n{{instruction}}\n\n请忠实落实上述要求，保持 2–5 个有机衔接的步骤（除非用户明确要求其他数量）。每一步须有清晰的「title」与「desc」。\n\n仅回复合法 JSON 数组，不要 Markdown 代码块或任何额外说明，格式示例：\n[\n  {\"title\": \"…\", \"desc\": \"…\"}\n]",
        "ai_research_report": "你是研究综合智能体。请基于用户问题「{{query}}」生成一份详细研究报告。\n仅使用合法 JSON，结构必须符合：\n{\n  \"intro\": \"引言段落\",\n  \"points\": [\n    {\"title\": \"要点一标题\", \"text\": \"该要点的详细分析\"}\n  ],\n  \"conclusion\": \"结论文段，含可执行的后续步骤\"\n}"
      },
      "reference": {
        "index_title": "档案索引",
        "search_refs": "搜索参考文献...",
        "citation": "引用文献",
        "metadata_notes": "元数据与笔记",
        "tags": "标签",
        "linked_drafts": "关联草稿",
        "private_notes": "私密笔记",
        "notes_placeholder": "为此参考文献添加您自己的笔记..."
      },
      "agents": {
        "personas": "人格设定",
        "new_persona": "新建人格",
        "active_config": "当前配置",
        "test_sandbox": "测试沙盒",
        "close_sandbox": "关闭沙盒",
        "enhance_prompt": "AI 优化提示词",
        "identity_tone": "身份与基调",
        "persona_name": "人格名称",
        "role_specialty": "角色专长",
        "system_prompt": "系统提示词",
        "knowledge_base": "知识集群 (预览)",
        "model_params": "模型参数",
        "temp": "采样温度",
        "creativity": "创造力",
        "delete_confirm": "您确定要删除此人格设定吗？",
        "search_personas": "搜索人格...",
        "sandbox_title": "沙盒：{{name}}",
        "sandbox_empty": "正在测试 {{name}} 的沙盒。发送消息以查看其根据当前系统提示词的响应。",
        "ai_thinking": "AI 正在思考...",
        "message_placeholder": "给 {{name}} 发送消息...",
        "sandbox_note": "沙盒使用当前的提示词和参数",
        "select_persona": "请选择一个人格",
        "select_subtitle": "从侧边栏选择一个人格或创建一个新人格。",
        "defaults": agentDefaultsZh,
        "studio": {
          "fallback_assistant": "你是一个乐于助人的助手。",
          "enhance_user": "你是提示词工程与 AI 系统设计专家。请优化以下 AI 智能体的系统提示词。\n\n智能体名称：{{name}}\n角色：{{role}}\n原始系统提示词：\n\"\"\"\n{{prompt}}\n\"\"\"\n\n请给出显著改进后的系统提示词，必须满足：\n\n1. **结构**——分节清晰（如：角色与人格、核心能力、行为准则、沟通风格、情绪智能、边界与约束、工作流）。\n2. **角色展开**——结合名称与角色，把人格写透。\n3. **可执行细节**——在合适处补充分步思考或流程；说明语气、工具与兜底行为。\n4. **情绪智能**——融入共情、倾听、语气匹配、降温与澄清提问等规则。\n5. **要与不要**——明确行为红线与必须坚持的做法。\n6. **忠实原意**——保留原任务与职责，不凭空增加无关能力。\n7. **排版**——使用 Markdown 标题、列表与短段落，成稿可直接使用。\n\n只输出增强后的系统提示词。先单独一行写「新增强提示词：」，随后给出正文，不要解释或评论。\n新增强提示词:"
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('app_language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
