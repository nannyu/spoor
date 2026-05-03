import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
        "connect_notes": "Connect notes to analyze."
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
        "save_success": "Settings saved.",
        "close": "Close",
        "save": "Save Configuration"
      },
      "ai": {
        "input_placeholder": "Ask AI to draft some ideas or paragraphs...",
        "loading": "AI is thinking..."
      },
      "lab": {
        "investigate": "What would you like to investigate?",
        "placeholder": "e.g., The relationship between spatial decay and memory loss...",
        "approve": "Approve & Execute",
        "executing": "Agent Execution Log",
        "report": "Synthesized Report",
        "new_research": "New Research",
        "past_sessions": "Past Sessions",
        "agent_title": "Deep Research Agent"
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
        "select_subtitle": "Choose an agent from the sidebar or create a new one."
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
        "connect_notes": "连接笔记进行分析。"
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
        "save_success": "设置已保存。",
        "close": "关闭",
        "save": "保存配置"
      },
      "ai": {
        "input_placeholder": "让 AI 构思一些想法或段落...",
        "loading": "AI 思考中..."
      },
      "lab": {
        "investigate": "您想调查什么？",
        "placeholder": "例如：空间衰减与记忆丧失之间的关系...",
        "approve": "批准并执行",
        "executing": "智能体执行日志",
        "report": "综合报告",
        "new_research": "新研究",
        "past_sessions": "历史会话",
        "agent_title": "深度研究智能体"
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
        "select_subtitle": "从侧边栏选择一个人格或创建一个新人格。"
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
