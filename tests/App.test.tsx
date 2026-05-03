import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../src/db';

// --- Mock 外部依赖 ---

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({ text: 'AI generated response' }),
    },
  })),
}));

// Mock react-i18next，用真实翻译资源但绕过 initReactI18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'sidebar.personal': '素材库',
        'sidebar.reference': '回顾区',
        'sidebar.lab': '研究实验室',
        'sidebar.agents': 'AI 助手',
        'sidebar.search_placeholder': '搜索记忆...',
        'sidebar.new_note': '新建便签',
        'sidebar.publish': '合成文章',
        'sidebar.settings': '设置',
        'canvas.zoom': '缩放',
        'canvas.full_screen': '全屏',
        'canvas.history': '历史记录',
        'canvas.new_canvas': '新建画布',
        'canvas.default_name': `画布 ${opts?.number ?? ''}`,
        'canvas.rename': '重命名',
        'canvas.delete_note': '删除便签',
        'canvas.select_note': '选择便签',
        'canvas.link_note': '链接到其他节点',
        'canvas.cycle_layout': '切换布局',
        'canvas.change_color': '更改颜色',
        'canvas.change_font': '更改字体',
        'nodes.theme': '核心主题',
        'nodes.note': '笔记',
        'nodes.observation': '观察',
        'nodes.ai_refinement': 'AI 优化',
        'nodes.ai_loading': '合成中...',
        'nodes.empty_note': '空笔记。点击编辑。',
        'nodes.type_something': '输入内容...',
        'nodes.connect_notes': '连接笔记进行分析。',
        'settings.title': '设置',
        'settings.profile': '个人资料',
        'settings.ai_config': 'AI 配置',
        'settings.language': '语言',
        'settings.user_name': '显示名称',
        'settings.user_role': '当前焦点 / 状态',
        'settings.provider': 'AI 服务商',
        'settings.api_key': 'API 密钥',
        'settings.base_url': '基础 URL (可选)',
        'settings.model': '模型',
        'settings.save_success': '设置已保存。',
        'settings.close': '关闭',
        'settings.save': '保存配置',
        'ai.input_placeholder': '让 AI 构思一些想法或段落...',
        'ai.loading': 'AI 思考中...',
        'agents.personas': '人格设定',
        'agents.new_persona': '新建人格',
        'agents.active_config': '当前配置',
        'agents.test_sandbox': '测试沙盒',
        'agents.close_sandbox': '关闭沙盒',
        'agents.enhance_prompt': 'AI 优化提示词',
        'agents.identity_tone': '身份与基调',
        'agents.persona_name': '人格名称',
        'agents.role_specialty': '角色专长',
        'agents.system_prompt': '系统提示词',
        'agents.knowledge_base': '知识集群 (预览)',
        'agents.model_params': '模型参数',
        'agents.temp': '采样温度',
        'agents.creativity': '创造力',
        'agents.delete_confirm': '您确定要删除此人格设定吗？',
        'agents.search_personas': '搜索人格...',
        'agents.sandbox_title': `沙盒：${opts?.name ?? ''}`,
        'agents.sandbox_empty': `正在测试 ${opts?.name ?? ''} 的沙盒。`,
        'agents.ai_thinking': 'AI 正在思考...',
        'agents.message_placeholder': `给 ${opts?.name ?? ''} 发送消息...`,
        'agents.sandbox_note': '沙盒使用当前的提示词和参数',
        'agents.select_persona': '请选择一个人格',
        'agents.select_subtitle': '从侧边栏选择一个人格或创建一个新人格。',
        'lab.investigate': '您想调查什么？',
        'lab.placeholder': '例如：空间衰减与记忆丧失之间的关系...',
        'lab.approve': '批准并执行',
        'lab.executing': '智能体执行日志',
        'lab.report': '综合报告',
        'lab.new_research': '新研究',
        'lab.past_sessions': '历史会话',
        'lab.agent_title': '深度研究智能体',
        'reference.index_title': '档案索引',
        'reference.search_refs': '搜索参考文献...',
        'reference.citation': '引用文献',
        'reference.metadata_notes': '元数据与笔记',
        'reference.tags': '标签',
        'reference.linked_drafts': '关联草稿',
        'reference.private_notes': '私密笔记',
        'reference.notes_placeholder': '为此参考文献添加您自己的笔记...',
        'app.name': '记忆建筑师',
        'app.description': '空间思维与知识合成',
      };
      return translations[key] ?? key;
    },
    i18n: {
      language: 'zh',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock lucide-react icons - 简单返回 SVG 占位
vi.mock('lucide-react', () => {
  const iconNames = [
    'MessageSquare', 'Terminal', 'Network', 'Search', 'Bell', 'Settings', 'Plus',
    'BookOpen', 'Users', 'Library', 'Microscope', 'Sparkles', 'Maximize2', 'Minimize2',
    'Quote', 'Brain', 'Bot', 'Wand2', 'Send', 'SlidersHorizontal', 'History', 'ZoomIn',
    'Focus', 'Image', 'FilePlus', 'Trash2', 'Link2', 'X', 'Camera', 'ChevronLeft',
    'ChevronRight', 'Check', 'Cpu', 'ArrowRight', 'ListChecks', 'CheckCircle2',
    'Loader2', 'PenLine', 'Edit3', 'FileText',
  ];
  const icons: Record<string, React.FC> = {};
  for (const name of iconNames) {
    icons[name] = (props: Record<string, unknown>) => {
      const { createElement } = require('react');
      return createElement('svg', { 'data-testid': `icon-${name}`, ...props });
    };
  }
  return icons;
});

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => {
    const { createElement } = require('react');
    return createElement('div', { 'data-testid': 'markdown' }, children);
  },
}));

// Mock motion
vi.mock('motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: new Proxy({}, {
    get: (_target, prop) => {
      return ({ children, ...rest }: Record<string, unknown>) => {
        const { createElement } = require('react');
        return createElement(String(prop), rest, children);
      };
    },
  }),
}));

// 导入被测组件
import App from '../src/App';

describe('App 组件', () => {
  beforeEach(async () => {
    // 清空数据库
    await db.nodes.clear();
    await db.articles.clear();
    await db.agents.clear();
    await db.edges.clear();
    await db.canvases.clear();
    // 清空 localStorage
    localStorage.clear();
  });

  // --- 辅助函数：在 <a> 标签中查找导航链接 ---
  const getNavLinks = () => {
    const nav = document.querySelector('nav');
    return nav ? Array.from(nav.querySelectorAll('a')) : [];
  };

  // --- 基础渲染 ---
  describe('基础渲染', () => {
    it('能正常渲染 App 组件', async () => {
      await act(async () => {
        render(<App />);
      });
      // 侧边栏导航链接应存在
      const links = getNavLinks();
      const linkTexts = links.map(a => a.textContent?.trim());
      expect(linkTexts).toContain('素材库');
      expect(linkTexts).toContain('回顾区');
      expect(linkTexts).toContain('研究实验室');
      expect(linkTexts).toContain('AI 助手');
    });

    it('渲染用户默认名称', async () => {
      await act(async () => {
        render(<App />);
      });
      expect(screen.getByText('Main Library')).toBeInTheDocument();
    });

    it('渲染用户默认角色状态', async () => {
      await act(async () => {
        render(<App />);
      });
      expect(screen.getByText('Focus Mode Active')).toBeInTheDocument();
    });
  });

  // --- 侧边栏导航 ---
  describe('侧边栏导航', () => {
    it('默认选中 personal 标签', async () => {
      await act(async () => {
        render(<App />);
      });
      const links = getNavLinks();
      const personalLink = links.find(a => a.textContent?.includes('素材库'));
      expect(personalLink).toBeDefined();
      expect(personalLink).toHaveClass('bg-white');
    });

    it('切换到 reference 标签', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      const links = getNavLinks();
      const refLink = links.find(a => a.textContent?.includes('回顾区'))!;
      await user.click(refLink);
      expect(refLink).toHaveClass('bg-white');
    });

    it('切换到 lab 标签', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      const links = getNavLinks();
      const labLink = links.find(a => a.textContent?.includes('研究实验室'))!;
      await user.click(labLink);
      expect(labLink).toHaveClass('bg-white');
    });

    it('切换到 agents 标签', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      const links = getNavLinks();
      const agentsLink = links.find(a => a.textContent?.includes('AI 助手'))!;
      await user.click(agentsLink);
      expect(agentsLink).toHaveClass('bg-white');
    });
  });

  // --- 设置按钮 ---
  describe('设置', () => {
    it('点击设置按钮打开设置面板', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      const settingsBtn = screen.getByTitle('设置');
      await user.click(settingsBtn);

      // 设置面板应出现
      expect(screen.getByText('设置')).toBeInTheDocument();
      expect(screen.getByText('AI 配置')).toBeInTheDocument();
    });

    it('设置面板包含语言切换选项', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      await user.click(screen.getByTitle('设置'));
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('中文')).toBeInTheDocument();
    });

    it('设置面板包含 AI 提供商选项', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      await user.click(screen.getByTitle('设置'));
      expect(screen.getByText('AI 服务商')).toBeInTheDocument();
      expect(screen.getByText('API 密钥')).toBeInTheDocument();
      expect(screen.getByText('模型')).toBeInTheDocument();
    });
  });

  // --- 新建便签 ---
  describe('新建便签', () => {
    it('点击新建便签按钮创建节点', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      // "新建便签" 是 title 属性，不是可见文本
      const newNoteBtn = screen.getAllByTitle('新建便签')[0];
      await user.click(newNoteBtn);

      // 验证数据库中有新节点
      const nodes = await db.nodes.toArray();
      expect(nodes.length).toBeGreaterThanOrEqual(1);
      expect(nodes.some(n => n.type === 'text')).toBe(true);
    });
  });

  // --- 画布管理 ---
  describe('画布管理', () => {
    it('历史按钮能打开画布列表', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      // 先确保有画布数据
      await db.canvases.put({
        id: 'default',
        name: 'Main Workspace',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 点击历史按钮（用 title 定位）
      const historyBtn = screen.getByTitle('历史记录');
      await user.click(historyBtn);

      // 画布列表应出现
      expect(screen.getByText('新建画布')).toBeInTheDocument();
    });
  });

  // --- 缩放控制 ---
  describe('缩放控制', () => {
    it('显示缩放百分比', async () => {
      await act(async () => {
        render(<App />);
      });

      // 初始缩放应为 100%
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('点击缩放+按钮增加缩放', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      // 缩放+按钮的文本是 "缩放 +"
      const zoomInBtn = screen.getByText('缩放 +');
      await user.click(zoomInBtn);

      // 缩放应大于 100%
      const zoomText = screen.getByText(/%/);
      const value = parseInt(zoomText.textContent ?? '100');
      expect(value).toBeGreaterThan(100);
    });

    it('点击缩放-按钮减少缩放', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      // 缩放-按钮的文本是 "缩放 -"
      const zoomOutBtn = screen.getByText('缩放 -');
      await user.click(zoomOutBtn);

      const zoomText = screen.getByText(/%/);
      const value = parseInt(zoomText.textContent ?? '100');
      expect(value).toBeLessThan(100);
    });

    it('连续缩放后百分比正确更新', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<App />);
      });

      // 连续放大两次
      await user.click(screen.getByText('缩放 +'));
      await user.click(screen.getByText('缩放 +'));

      const zoomText = screen.getByText(/%/);
      const value = parseInt(zoomText.textContent ?? '100');
      expect(value).toBeGreaterThan(110);
    });
  });

  // --- 数据库种子初始化 ---
  describe('数据库种子数据', () => {
    it('首次渲染时自动创建默认画布', async () => {
      await act(async () => {
        render(<App />);
      });

      // 等待 useEffect 中的 seed 完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const canvas = await db.canvases.get('default');
      expect(canvas).toBeDefined();
      expect(canvas?.name).toBe('Main Workspace');
    });

    it('首次渲染时自动创建系统 Agent', async () => {
      await act(async () => {
        render(<App />);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const agents = await db.agents.toArray();
      const roles = agents.map(a => a.role);
      expect(roles).toContain('Debater');
      expect(roles).toContain('Journalist');
      expect(roles).toContain('Connector');
      expect(roles).toContain('Editor');
      expect(roles).toContain('Visionary');
      expect(roles).toContain('Realist');
    });

    it('首次渲染时自动创建示例节点和边', async () => {
      await act(async () => {
        render(<App />);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const nodes = await db.nodes.toArray();
      expect(nodes.length).toBeGreaterThanOrEqual(3);

      const edges = await db.edges.toArray();
      expect(edges.length).toBeGreaterThanOrEqual(3);

      // 应有 theme 类型节点
      expect(nodes.some(n => n.type === 'theme')).toBe(true);
    });
  });

  // --- localStorage 持久化 ---
  describe('localStorage 持久化', () => {
    it('用户名从 localStorage 恢复', async () => {
      localStorage.setItem('user_name', '自定义用户');
      await act(async () => {
        render(<App />);
      });
      expect(screen.getByText('自定义用户')).toBeInTheDocument();
    });

    it('用户角色从 localStorage 恢复', async () => {
      localStorage.setItem('user_role', '专注写作中');
      await act(async () => {
        render(<App />);
      });
      expect(screen.getByText('专注写作中')).toBeInTheDocument();
    });
  });
});
