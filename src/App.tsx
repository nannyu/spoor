import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from './db';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import {
  Settings,
  Plus,
  BookOpen,
  Library,
  Microscope,
  Sparkles,
  Maximize2,
  Minimize2,
  Bot,
  Wand2,
  Send,
  History,
  ZoomIn,
  Image as ImageIcon,
  Link2,
  X,
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  PenLine,
  Edit3,
} from 'lucide-react';
import { DraggableNode } from './components/canvas/DraggableNode';
import { AISettingsModal } from './components/AISettingsModal';
import type { AIConfig } from './components/AISettingsModal';
import { Reference } from './components/Reference';
import { ResearchLab } from './components/ResearchLab';
import { AgentsStudio } from './components/AgentsStudio';

export default function App() {
  const { t, i18n } = useTranslation();
  const nodesRef = useRef<Record<string, HTMLElement | null>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const edgeLabelsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });

  // Local-only UI states
  const [activeCanvasId, setActiveCanvasId] = useState<string>(() => localStorage.getItem('active_canvas_id') || 'default');
  const [isCanvasListOpen, setIsCanvasListOpen] = useState(false);

  // Database-backed states
  const articles = useLiveQuery(() => db.articles.toArray()) || [];
  const agentConfigs = useLiveQuery(() => db.agents.toArray()) || [];
  const dynamicNodes = useLiveQuery(() => 
    db.nodes.filter(node => (node.canvasId === activeCanvasId) || (!node.canvasId && activeCanvasId === 'default')).toArray()
  , [activeCanvasId]) || [];
  const edges = useLiveQuery(() => 
    db.edges.filter(edge => (edge.canvasId === activeCanvasId) || (!edge.canvasId && activeCanvasId === 'default')).toArray()
  , [activeCanvasId]) || [];
  const canvases = useLiveQuery(() => db.canvases.toArray()) || [];

  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [activeReferenceId, setActiveReferenceId] = useState<string>('');
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');

  // User Profile States
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || 'Main Library');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') || 'Focus Mode Active');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('user_avatar') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ4QVDvA9fTIQoBUT7DMYuMx4lar18Lu2yQ4F-BA02ETKD3F685obhnMMZ1DTSPgIGtayR6TnhxxI6xPnMhkIfVwIw8pUoiCCKugCt50m261Esqg2-55XI-P4ZSBmpCF6WZeh0zZYF25ixFg1yLaNs5Xysi48cS0GvzZsLD-Z_8zoH7WpKlehQuPAUPWjbyO09MlCOEVrth2zGKWn3MGyHKx3VZmQ2hgrMhzuBmSy6XFRKlRS29CPcZsqDQJ-BLENv8p6ldZ5UsiM');

  useEffect(() => {
    localStorage.setItem('user_name', userName);
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('user_avatar', userAvatar);
  }, [userName, userRole, userAvatar]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUserAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const [aiConfig, setAiConfig] = useState(() => {
    const saved = localStorage.getItem('ai_config');
    return saved ? JSON.parse(saved) : {
      provider: 'gemini',
      apiKey: '',
      baseUrl: '',
      model: 'gemini-1.5-flash'
    };
  });

  useEffect(() => {
    localStorage.setItem('ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    transformRef.current = canvasTransform;
  }, [canvasTransform]);

  useEffect(() => {
    localStorage.setItem('active_canvas_id', activeCanvasId);
  }, [activeCanvasId]);

  // Initialize DB with example data if empty
  useEffect(() => {
    const seed = async () => {
      // Ensure default canvas exists
      const defaultCanvas = await db.canvases.get('default');
      if (!defaultCanvas) {
        await db.canvases.add({
          id: 'default',
          name: 'Main Workspace',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      const agentIds = ['challenger', 'interviewer', 'synthesizer', 'stylist', 'futurist', 'pragmatist'];
      const existingAgents = await db.agents.toArray();
      const existingIds = new Set(existingAgents.map(a => a.id));
      const missingIds = agentIds.filter(id => !existingIds.has(id));

      if (missingIds.length > 0) {
        const allSystemAgents = [
          { id: 'challenger', name: 'The Challenger', role: 'Debater', prompt: 'You are a critical Debater. Do not agree with the user or simply follow orders. Challenge the premise of what is connected to you. Point out logical flaws, demand stronger evidence, and actively try to find holes in the argument to help the user refine their thoughts.', temperature: 0.7, creativity: 0.4 },
          { id: 'interviewer', name: 'AI Interviewer', role: 'Journalist', prompt: 'You are an AI Interviewer who takes initiative. Do not wait for commands. Based on the provided context, actively start asking probing questions to draw out deeper narratives or follow-up ideas.', temperature: 0.7, creativity: 0.4 },
          { id: 'synthesizer', name: 'The Synthesizer', role: 'Connector', prompt: 'You are a Connector/Synthesizer. Your goal is to find hidden patterns and non-obvious relationships between the notes and ideas connected to you. Suggest how disparate concepts can be merged into a cohesive whole.', temperature: 0.8, creativity: 0.7 },
          { id: 'stylist', name: 'The Stylist', role: 'Editor', prompt: 'You are a Master Editor and Stylist. Your role is to take the provided content and elevate its quality. Focus on tone, clarity, and impact. Make the text compelling, professional, or poetic depending on the context.', temperature: 0.6, creativity: 0.5 },
          { id: 'futurist', name: 'The Futurist', role: 'Visionary', prompt: 'You are a Visionary Futurist. Based on the ideas connected to you, project their evolution 10-20 years into the future. What are the long-term implications, potential disruptors, and wild possibilities?', temperature: 0.9, creativity: 0.9 },
          { id: 'pragmatist', name: 'The Pragmatist', role: 'Realist', prompt: 'You are a realistic Pragmatist. Your job is to ground the user\'s ideas in reality. Identify practical constraints, missing logistical steps, potential costs, and immediate roadblocks that need to be addressed.', temperature: 0.4, creativity: 0.2 }
        ];
        
        const toAdd = allSystemAgents.filter(a => missingIds.includes(a.id));
        await db.agents.bulkPut(toAdd);
      }

      const totalCount = await db.agents.count();
      if (totalCount <= 6) { // If only system agents exist or it's first run
        const nodeCount = await db.nodes.count();
        if (nodeCount === 0) {
          await db.articles.put({
          id: 'ref-042',
          title: 'Spatial Encoding in Reconstructive Memory',
          content: 'The human mind does not merely store experiences as isolated visual or auditory files. Instead, it constructs architectural spaces where these memories represent structural loads...',
          date: '1994',
          type: 'REF-042'
        });
 
        await db.nodes.bulkPut([
          { id: 'theme', type: 'theme', content: 'The Memory Architect', x: 200, y: 300 },
          { id: 'insp1', type: 'note', content: 'Spatial architecture of trauma', x: 500, y: 200 },
          { id: 'ai', type: 'ai', content: 'Memory is not a storage, but a navigation.', x: 500, y: 400 },
          { id: 'insp2', type: 'note', content: 'Non-euclidean memory leaks', x: 800, y: 300 }
        ]);
 
        await db.edges.bulkPut([
          { id: 'e1', from: 'theme', to: 'insp1' },
          { id: 'e2', from: 'theme', to: 'ai' },
          { id: 'e3', from: 'ai', to: 'insp2' },
          { id: 'e4', from: 'insp1', to: 'insp2' }
        ]);
      }
    }
  };
    seed();
  }, []);

  const toggleNodeSelection = (id: string) => {
    setSelectedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selectedNodes.size === 0) return;
    setIsAiLoading(true);
    try {
      let combinedText = '';
      for (const id of Array.from(selectedNodes)) {
        const el = nodesRef.current[id];
        if (el) {
          combinedText += el.innerText + '\n\n';
        }
      }

      const text = await callUniversalAI({
        config: aiConfig,
        prompt: `Turn the following concepts, notes, and drafts into a cohesive, well-written article:\n\n${combinedText}`
      });
      
      const newArticle = {
        id: `gen-${Date.now()}`,
        title: 'Generated Synthesis',
        content: text || '',
        date: new Date().getFullYear().toString(),
        type: 'GEN-' + Math.floor(Math.random() * 1000)
      };
      
      await db.articles.add(newArticle);
      setActiveReferenceId(newArticle.id);
      setActiveTab('reference');
      setSelectedNodes(new Set());
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const triggerAgentAnalysis = async (agentConfigId: string, agentNodeId: string, contextNodeId: string) => {
    const agentConfig = agentConfigs.find(a => a.id === agentConfigId);
    if (!agentConfig) return;

    const contextEl = nodesRef.current[contextNodeId];
    if (!contextEl) return;
    
    const clone = contextEl.cloneNode(true) as HTMLElement;
    const contextText = clone.innerText || clone.textContent || '';
    if (!contextText.trim()) return;

    setIsAiLoading(true);
    try {
      const text = await callUniversalAI({
        config: aiConfig,
        prompt: `Context to analyze:\n${contextText}`,
        systemInstruction: agentConfig.prompt
      });

      if (text) {
        const agentNode = dynamicNodes.find(n => n.id === agentNodeId);
        const x = agentNode ? agentNode.x + 350 : window.innerWidth / 2;
        const y = agentNode ? agentNode.y : window.innerHeight / 2;
        const newNodeId = crypto.randomUUID();
        
        await db.nodes.add({ id: newNodeId, canvasId: activeCanvasId, type: 'ai', content: text, x, y });
        await db.edges.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, from: agentNodeId, to: newNodeId });
      }
    } catch(e) {
      console.error(e);
      alert('AI generation failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
  const [editingCanvasName, setEditingCanvasName] = useState('');

  const renameCanvas = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    await db.canvases.update(id, { name: newName, updatedAt: Date.now() });
    setEditingCanvasId(null);
  };

  const createNewCanvas = async () => {
    const id = crypto.randomUUID();
    await db.canvases.add({
      id,
      name: t('canvas.default_name', { number: canvases.length + 1 }),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setActiveCanvasId(id);
    setIsCanvasListOpen(false);
  };

  const handleNodeDragEnd = (draggedId: string, finalPos: {x: number, y: number}) => {
    // Update position in database
    db.nodes.update(draggedId, { x: finalPos.x, y: finalPos.y });

    const draggedEl = nodesRef.current[draggedId];
    if (!draggedEl) return;
    
    // Convert to screen coordinates for accurate distance measurement (ignoring scale/pan for now for simplicity, bounding rect includes it)
    const dRect = draggedEl.getBoundingClientRect();
    const dCenterX = dRect.left + dRect.width / 2;
    const dCenterY = dRect.top + dRect.height / 2;

    const SNAP_DISTANCE = 150; // pixels

    const isDraggedAgent = dynamicNodes.find(n => n.id === draggedId)?.type === 'agent';

    let snapped = false;

    Object.keys(nodesRef.current).forEach(otherId => {
      if (otherId === draggedId || snapped) return;
      const otherEl = nodesRef.current[otherId];
      if (!otherEl) return;

      const isOtherAgent = dynamicNodes.find(n => n.id === otherId)?.type === 'agent';

      // One must be agent, other must not be agent ideally (or both are, but whatever)
      if ((isDraggedAgent && !isOtherAgent) || (!isDraggedAgent && isOtherAgent)) {
        const oRect = otherEl.getBoundingClientRect();
        const oCenterX = oRect.left + oRect.width / 2;
        const oCenterY = oRect.top + oRect.height / 2;

        const dist = Math.hypot(dCenterX - oCenterX, dCenterY - oCenterY);
        
        if (dist < SNAP_DISTANCE) {
          const agentId = isDraggedAgent ? draggedId : otherId;
          const contextId = isDraggedAgent ? otherId : draggedId;
          const agentConfigId = dynamicNodes.find(n => n.id === agentId)?.agentConfigId;
          
          if (agentConfigId && agentId && contextId) {
            snapped = true;
            // Optionally add edge to visualize snap
            if (!edges.find(e => (e.from === agentId && e.to === contextId) || (e.from === contextId && e.to === agentId))) {
               db.edges.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, from: agentId, to: contextId });
            }
            triggerAgentAnalysis(agentConfigId, agentId, contextId);
          }
        }
      }
    });
  };

  const handleLink = (id: string) => {
    if (connectingFrom) {
      if (connectingFrom !== id && !edges.find(e => (e.from === connectingFrom && e.to === id) || (e.from === id && e.to === connectingFrom))) {
        db.edges.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, from: connectingFrom, to: id });
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(id);
    }
  };

  const deleteEdge = (id: string) => {
    db.edges.delete(id);
  };

  const removeNodeId = (id: string) => {
    db.nodes.delete(id);
    db.edges.where('from').equals(id).or('to').equals(id).delete();
  };

  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        setCanvasTransform(prev => {
          const zoomBase = 1.05;
          const factor = e.deltaY < 0 ? zoomBase : 1 / zoomBase;
          const newScale = Math.min(Math.max(0.1, prev.scale * factor), 5);
          
          const mainRect = main.getBoundingClientRect();
          const clientX = e.clientX - mainRect.left;
          const clientY = e.clientY - mainRect.top;

          const mouseXInCanvas = (clientX - prev.x) / prev.scale;
          const mouseYInCanvas = (clientY - prev.y) / prev.scale;

          const newX = clientX - mouseXInCanvas * newScale;
          const newY = clientY - mouseYInCanvas * newScale;

          return { x: newX, y: newY, scale: newScale };
        });
      } else {
        setCanvasTransform(prev => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };
    main.addEventListener('wheel', onWheel, { passive: false });
    return () => main.removeEventListener('wheel', onWheel);
  }, []);

  const handlePanStart = (e: React.PointerEvent) => {
    if (e.target === e.currentTarget || e.button === 1 || e.button === 0) {
      if (connectingFrom) setConnectingFrom(null);
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startTransform = transformRef.current;

      const onPointerMove = (moveEv: PointerEvent) => {
        setCanvasTransform({
          ...startTransform,
          x: startTransform.x + (moveEv.clientX - startX),
          y: startTransform.y + (moveEv.clientY - startY),
        });
      };
      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    const updateLines = () => {
      const svg = svgRef.current;
      const container = contentContainerRef.current;
      const edgeLabelsContainer = edgeLabelsRef.current;
      if (!svg || !container) return;
      
      const containerRect = container.getBoundingClientRect();
      const currentScale = transformRef.current.scale;

      const edgeGroups = Array.from(svg.querySelectorAll('g[data-edge-id]')) as SVGGElement[];
      
      edgeGroups.forEach((g: SVGGElement) => {
        const fromId = g.getAttribute('data-edge-from');
        const toId = g.getAttribute('data-edge-to');
        const edgeId = g.getAttribute('data-edge-id');
        if (!fromId || !toId || !edgeId) return;
        
        const fromNode = nodesRef.current[fromId];
        const toNode = nodesRef.current[toId];
        if (fromNode && toNode) {
          const fromRect = fromNode.getBoundingClientRect();
          const toRect = toNode.getBoundingClientRect();
          
          const x1 = (fromRect.left + fromRect.width / 2 - containerRect.left) / currentScale;
          const y1 = (fromRect.top + fromRect.height / 2 - containerRect.top) / currentScale;
          const x2 = (toRect.left + toRect.width / 2 - containerRect.left) / currentScale;
          const y2 = (toRect.top + toRect.height / 2 - containerRect.top) / currentScale;
          
          g.querySelectorAll('line').forEach((line: SVGLineElement) => {
            line.setAttribute('x1', x1.toString());
            line.setAttribute('y1', y1.toString());
            line.setAttribute('x2', x2.toString());
            line.setAttribute('y2', y2.toString());
          });
          
          if (edgeLabelsContainer) {
             const btn = edgeLabelsContainer.querySelector(`[data-edge-btn="${edgeId}"]`) as HTMLButtonElement;
             if (btn) {
               btn.style.left = `${(x1 + x2) / 2}px`;
               btn.style.top = `${(y1 + y2) / 2}px`;
             }
          }
        }
      });
      
      const tempEdge = svg.querySelector('#temp-edge') as SVGLineElement;
      const connFrom = svg.getAttribute('data-connecting-from');
      if (tempEdge) {
        if (connFrom && nodesRef.current[connFrom]) {
          const fromNode = nodesRef.current[connFrom];
          const fromRect = fromNode.getBoundingClientRect();
          
          const x1 = (fromRect.right - containerRect.left) / currentScale;
          const y1 = (fromRect.top + fromRect.height / 2 - containerRect.top) / currentScale;
          const x2 = (mousePosRef.current.x - containerRect.left) / currentScale;
          const y2 = (mousePosRef.current.y - containerRect.top) / currentScale;

          tempEdge.style.display = 'block';
          tempEdge.setAttribute('x1', x1.toString());
          tempEdge.setAttribute('y1', y1.toString());
          tempEdge.setAttribute('x2', x2.toString());
          tempEdge.setAttribute('y2', y2.toString());
        } else {
          tempEdge.style.display = 'none';
        }
      }

      animationFrameId = requestAnimationFrame(updateLines);
    };
    updateLines();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleAiSubmit = async () => {
    if (!aiPrompt.trim() || isAiLoading) return;
    
    setIsAiLoading(true);
    try {
      // Build context from connected nodes
      const connectedNodeIds = new Set<string>();
      edges.forEach(e => {
        connectedNodeIds.add(e.from);
        connectedNodeIds.add(e.to);
      });
      
      let contextText = '';
      connectedNodeIds.forEach(id => {
        const el = nodesRef.current[id];
        if (el) {
          contextText += `\n[Context Fragment]: ` + (el.innerText || '');
        }
      });

      const text = await callUniversalAI({
        config: aiConfig,
        prompt: `Context from connected notes across the canvas:\n${contextText}\n\nUser request: ${aiPrompt}`
      });
      
      if (text) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const t = transformRef.current;
        const x = (cx - t.x) / t.scale - 150 + Math.random() * 50;
        const y = (cy - t.y) / t.scale - 100 + Math.random() * 50;
        await db.nodes.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, type: 'ai', content: text, x, y });
        setAiPrompt('');
      }
    } catch (error) {
      console.error(error);
      alert('AI generation failed. Please check your API key or network.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const addTextNode = async () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const t = transformRef.current;
    const x = (cx - t.x) / t.scale - 150 + Math.random() * 50;
    const y = (cy - t.y) / t.scale - 100 + Math.random() * 50;
    await db.nodes.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, type: 'text', content: '', x, y });
  };

  const addFileNode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const t = transformRef.current;
      const x = (cx - t.x) / t.scale - 150 + Math.random() * 50;
      const y = (cy - t.y) / t.scale - 100 + Math.random() * 50;
      await db.nodes.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, type, content: url, fileType: file.type, x, y });
      e.target.value = ''; // Reset input
    }
  };

  // removeNode is now unused, using removeNodeId instead

  // Remove SVG points
  return (
    <div className="bg-[#FAF9F6] font-serif text-[#1a1a1a] min-h-screen overflow-hidden flex flex-col paper-texture">
      
      <div className="flex flex-1" onPointerDown={() => { if (connectingFrom) setConnectingFrom(null); }}>
        {/* SideNavBar */}
        <aside className={`hidden md:flex flex-col py-6 space-y-2 bg-[#F4F1ED] h-screen border-r border-[#E6E4DF] sticky top-0 transition-all duration-300 overflow-y-auto scrollbar-hide ${isSidebarOpen ? 'w-48' : 'w-20 items-center'}`}>

          <div className="mb-6 px-4">
            <div className={`flex flex-col ${isSidebarOpen ? 'items-start' : 'items-center'} gap-2`}>
              <div className="flex items-center gap-3 w-full group relative">
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div 
                  onClick={() => avatarInputRef.current?.click()}
                  className={`relative cursor-pointer group/avatar flex-shrink-0 flex items-center justify-center ${isSidebarOpen ? 'w-6' : 'w-10'}`}
                >
                  <img 
                    alt="Curator Profile" 
                    className={`rounded border-2 border-[#E6E4DF] object-cover shadow-sm transition-all group-hover/avatar:opacity-80 ${isSidebarOpen ? 'w-6 h-6' : 'w-10 h-10'}`} 
                    src={userAvatar}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/20 rounded">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
                {isSidebarOpen && (
                  <p 
                    contentEditable 
                    suppressContentEditableWarning
                    onBlur={(e) => setUserName(e.currentTarget.innerText)}
                    className="text-base font-bold whitespace-nowrap tracking-tight outline-none hover:bg-[#EAE7E2]/50 rounded px-1 -mx-1 transition-colors cursor-text overflow-hidden text-ellipsis"
                  >
                    {userName}
                  </p>
                )}
              </div>
              {isSidebarOpen && (
                <p 
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={(e) => setUserRole(e.currentTarget.innerText)}
                  className="text-[10px] font-sans uppercase tracking-widest text-[#8c8a84] whitespace-nowrap outline-none hover:bg-[#EAE7E2]/50 rounded px-1 -mx-1 transition-colors cursor-text"
                >
                  {userRole}
                </p>
              )}
            </div>
          </div>
          <nav className="flex flex-col font-sans text-sm w-full">
            {isSidebarOpen && <div className="px-4 py-2 text-[#8c8a84] text-[11px] uppercase tracking-wider mb-2">{t('sidebar.personal')}</div>}
            <a onClick={(e) => { e.preventDefault(); setActiveTab('personal'); }} className={`cursor-pointer flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center'} py-2 ${activeTab === 'personal' ? 'bg-white border-y border-[#E6E4DF] text-[#C2410C]' : 'text-[#5a5a54] hover:bg-[#EAE7E2] transition-colors'}`}>
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              {isSidebarOpen && <span>{t('sidebar.personal')}</span>}
            </a>
            <a onClick={(e) => { e.preventDefault(); setActiveTab('reference'); }} className={`cursor-pointer flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center'} py-2 ${activeTab === 'reference' ? 'bg-white border-y border-[#E6E4DF] text-[#C2410C]' : 'text-[#5a5a54] hover:bg-[#EAE7E2] transition-colors'}`}>
              <Library className="w-4 h-4 flex-shrink-0" />
              {isSidebarOpen && <span>{t('sidebar.reference')}</span>}
            </a>
            <a onClick={(e) => { e.preventDefault(); setActiveTab('lab'); }} className={`cursor-pointer flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center'} py-2 ${activeTab === 'lab' ? 'bg-white border-y border-[#E6E4DF] text-[#C2410C]' : 'text-[#5a5a54] hover:bg-[#EAE7E2] transition-colors'}`}>
              <Microscope className="w-4 h-4 flex-shrink-0" />
              {isSidebarOpen && <span>{t('sidebar.lab')}</span>}
            </a>
            <a onClick={(e) => { e.preventDefault(); setActiveTab('agents'); }} className={`cursor-pointer flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center'} py-2 ${activeTab === 'agents' ? 'bg-white border-y border-[#E6E4DF] text-[#C2410C]' : 'text-[#5a5a54] hover:bg-[#EAE7E2] transition-colors'}`}>
              <Bot className="w-4 h-4 flex-shrink-0" />
              {isSidebarOpen && <span>{t('sidebar.agents')}</span>}
            </a>
          </nav>
          <div className="mt-auto px-4 pb-4 w-full flex flex-col gap-1">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'} py-2 text-[#8c8a84] hover:text-[#1a1a1a] hover:bg-[#EAE7E2] transition-colors rounded-lg group/toggle`}
            >
              <div className={`flex items-center justify-center ${isSidebarOpen ? 'w-6' : 'w-10'}`}>
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 transition-transform group-hover/toggle:translate-x-0.5" />}
              </div>
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'} py-2 text-[#5a5a54] hover:bg-[#EAE7E2] transition-colors rounded-lg group/settings`}
              title={t('sidebar.settings')}
            >
              <div className={`flex items-center justify-center ${isSidebarOpen ? 'w-6' : 'w-10'}`}>
                <Settings className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/settings:rotate-45`} />
              </div>
            </button>
          </div>
        </aside>

        {activeTab === 'personal' && (
        <main 
          ref={mainRef} 
          className="flex-1 relative overflow-hidden bg-[#FAF9F6] paper-texture"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const t = canvasTransform;
              const rect = e.currentTarget.getBoundingClientRect();
              
              const ox = ((e.clientX - rect.left) - t.x) / t.scale;
              const oy = ((e.clientY - rect.top) - t.y) / t.scale;

              for (let index = 0; index < Array.from(e.dataTransfer.files).length; index++) {
                const file = e.dataTransfer.files[index];
                if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) continue;
                const type = file.type.startsWith('video/') ? 'video' : 'image';
                const url = URL.createObjectURL(file);
                await db.nodes.add({
                  id: crypto.randomUUID(),
                  canvasId: activeCanvasId,
                  type,
                  content: url,
                  fileType: file.type,
                  x: ox + (index * 20) - 100, 
                  y: oy + (index * 20) - 100
                });
              }
            }
          }}
        >
          {/* Draggable background (pan) */}
          <div 
            className="absolute inset-0 cursor-grab active:cursor-grabbing z-0" 
            onPointerDown={handlePanStart}
          />

          {/* Symmetrical Controls */}
          <div className="absolute top-6 left-6 flex items-center z-40 gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsCanvasListOpen(!isCanvasListOpen)}
                  className="bg-white text-[#1a1a1a] p-3 rounded-full shadow-md hover:bg-[#F4F1ED] transition-all flex items-center justify-center border border-[#E6E4DF] group"
                  title={t('canvas.history')}
                >
                  <History className="w-5 h-5 transition-transform group-hover:rotate-[-10deg]" />
                </button>
                
                {isCanvasListOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#E6E4DF] rounded-xl shadow-2xl p-1 z-50">
                    <div className="px-3 py-2 text-[10px] font-bold text-[#8c8a84] uppercase tracking-wider font-mono border-b border-[#F4F1ED] mb-1">{t('canvas.history')}</div>
                    <div className="max-h-60 overflow-y-auto">
                      {canvases.map(canvas => (
                        <div 
                          key={canvas.id}
                          className={`group w-full text-left px-3 py-2 text-sm rounded-lg mb-1 transition-colors flex flex-col ${activeCanvasId === canvas.id ? 'bg-[#F4F1ED] border border-[#E6E4DF]' : 'hover:bg-[#F4F1ED]'}`}
                        >
                          {editingCanvasId === canvas.id ? (
                            <form 
                              className="flex items-center gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                renameCanvas(canvas.id, editingCanvasName);
                              }}
                            >
                              <input
                                autoFocus
                                value={editingCanvasName}
                                onChange={(e) => setEditingCanvasName(e.target.value)}
                                onBlur={() => renameCanvas(canvas.id, editingCanvasName)}
                                className="flex-1 bg-white border border-[#C2410C] px-2 py-0.5 rounded outline-none text-xs text-[#1a1a1a]"
                              />
                            </form>
                          ) : (
                            <div className="font-bold flex items-center justify-between">
                              <button 
                                onClick={() => {
                                  setActiveCanvasId(canvas.id);
                                  setIsCanvasListOpen(false);
                                }}
                                className="flex-1 text-left truncate"
                              >
                                {canvas.name}
                              </button>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCanvasId(canvas.id);
                                    setEditingCanvasName(canvas.name);
                                  }}
                                  className="p-1 hover:text-[#C2410C] opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={t('canvas.rename')}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                {activeCanvasId === canvas.id && <div className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" />}
                              </div>
                            </div>
                          )}
                          <div className="text-[10px] text-[#8c8a84]">{new Date(canvas.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-1 mt-1 border-t border-[#F4F1ED]">
                      <button 
                        onClick={createNewCanvas}
                        className="w-full text-left px-3 py-2 text-sm text-[#C2410C] font-bold hover:bg-[#F4F1ED] rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('canvas.new_canvas')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
          </div>

          {/* Transformed content container */}
          <div className="absolute top-6 right-6 flex items-center z-40 gap-3">
              <button 
                onClick={handlePublish}
                disabled={selectedNodes.size === 0 || isAiLoading}
                className="bg-[#C2410C] text-white p-3 rounded-full shadow-md hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center group border border-[#a0350a]/50"
                title={isAiLoading ? t('nodes.ai_loading') : `${t('sidebar.publish')} (${selectedNodes.size})`}
              >
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenLine className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    mainRef.current?.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }}
                className="bg-white text-[#1a1a1a] p-3 rounded-full shadow-md hover:scale-105 transition-all border border-[#E6E4DF] flex items-center justify-center hover:border-[#C2410C] hover:text-[#C2410C]"
                title={isFullscreen ? t('canvas.full_screen') : t('canvas.full_screen')}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
          </div>

          <div 
            ref={contentContainerRef}
            className="absolute inset-0 origin-top-left z-0 pointer-events-none"
            style={{ transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})` }}
          >
            {/* Connection Lines (SVG) */}
            <svg ref={svgRef} data-connecting-from={connectingFrom || ''} className="absolute inset-0 overflow-visible z-10 w-[1px] h-[1px]">
              {edges.map(edge => (
                <g 
                  key={edge.id} 
                  data-edge-id={edge.id} 
                  data-edge-from={edge.from} 
                  data-edge-to={edge.to}
                  className="group cursor-pointer pointer-events-auto"
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                >
                  {/* Visual Line */}
                  <line 
                    className="node-connector transition-colors group-hover:stroke-[#C2410C]" 
                    style={{ strokeWidth: 2, stroke: '#d1cfca', pointerEvents: 'none' }} 
                  />
                  {/* Wider Hit Area */}
                  <line 
                    className="hit-area" 
                    style={{ strokeWidth: 20, stroke: 'transparent', pointerEvents: 'auto' }} 
                  />
                </g>
              ))}
              <line id="temp-edge" className="node-connector pointer-events-none" style={{ strokeWidth: 2, stroke: '#C2410C', strokeDasharray: '5,5', display: connectingFrom ? 'block' : 'none' }} />
            </svg>

            <div ref={edgeLabelsRef} className="absolute inset-0 pointer-events-none z-20 w-[1px] h-[1px]">
              {edges.map(edge => (
                <button
                  key={`btn-${edge.id}`}
                  data-edge-btn={edge.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white border border-[#C2410C] text-[#C2410C] hover:bg-[#C2410C] hover:text-white shadow-sm rounded-full flex items-center justify-center transition-all pointer-events-auto z-10 ${hoveredEdgeId === edge.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteEdge(edge.id); }}
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                  style={{ top: -100, left: -100 }}
                >
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>

            <div className="absolute inset-0 z-30 w-[1px] h-[1px] pointer-events-none"> 
              {/* All Nodes from Database */}
              {dynamicNodes.map((node: any) => {
                const rotation = 
                  (node.type === 'note' || node.type === 'text') ? (node.layout === 0 || node.layout === undefined ? 1 : 0) :
                  (node.type === 'theme') ? (node.layout === 0 || node.layout === undefined ? -1 : 0) :
                  (node.type === 'image') ? -1 :
                  (node.type === 'video') ? 1 : 0;

                return (
                  <DraggableNode 
                    key={node.id} 
                    id={node.id} nodesRef={nodesRef} isConnecting={connectingFrom !== null} onLink={handleLink}
                    initialX={node.x} initialY={node.y} 
                    initialWidth={node.width} initialHeight={node.height}
                    onDelete={() => removeNodeId(node.id)} scale={canvasTransform.scale}
                    rotation={rotation}
                    onCycleLayout={() => {
                    const currentLayout = node.layout || 0;
                    db.nodes.update(node.id, { layout: (currentLayout + 1) % 4 });
                  }}
                  isSelected={selectedNodes.has(node.id)}
                  isEditing={editingNodeId === node.id}
                  onToggleSelect={() => toggleNodeSelection(node.id)}
                  allowPalette={true}
                  onDragEnd={handleNodeDragEnd}
                  onResizeEnd={(size) => {
                    db.nodes.update(node.id, size);
                  }}
                >
                  {node.type === 'theme' && (
                    <div 
                      className={`w-full h-full shadow-xl border-2 transition-all duration-500 flex flex-col ${
                        node.layout === 1 ? 'p-8 border-l-4 border-[#C2410C] bg-white border-[#E6E4DF]' :
                        node.layout === 2 ? 'p-10 bg-[#1a1a1a] text-white border-[#333] shadow-2xl' :
                        node.layout === 3 ? 'p-6 border-2 border-black bg-white' : 
                        'p-6 bg-white border-[#E6E4DF]'
                      }`}
                      style={{ outline: '1px solid transparent' }}
                    >
                      <div className={`flex items-center space-x-2 mb-3 ${node.layout === 3 ? 'hidden' : ''}`}>
                        <Sparkles className={`w-3 h-3 ${node.layout === 2 ? 'text-[#C2410C]' : 'text-[#C2410C]'}`} />
                        <span className={`text-[10px] font-sans font-bold uppercase tracking-widest ${node.layout === 2 ? 'text-[#8c8a84]' : 'text-[#C2410C]'}`}>{t('nodes.theme')}</span>
                        <div className={`h-px flex-1 ${node.layout === 2 ? 'bg-white/10' : 'bg-[#F4F1ED]'}`}></div>
                      </div>

                      {node.layout === 3 && (
                        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black mb-6 flex justify-between items-center">
                          <span>Manifesto // 01</span>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-[#C2410C] rounded-full"></div>
                          </div>
                        </div>
                      )}

                      <div className={`flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar ${editingNodeId === node.id ? 'select-text' : ''}`}>
                        <h3 
                          className={`font-bold leading-tight focus:outline-none rounded px-1 -mx-1 transition-all cursor-text ${
                            node.layout === 1 ? 'text-3xl font-serif mb-4' :
                            node.layout === 2 ? 'text-4xl tracking-tighter mb-4' :
                            node.layout === 3 ? 'text-xl font-mono uppercase mb-4' :
                            'text-2xl text-[#1a1a1a] mb-2'
                          }`} 
                          contentEditable 
                          suppressContentEditableWarning
                          onBlur={(e) => db.nodes.update(node.id, { content: e.currentTarget.innerText })}
                        >
                          {node.content}
                        </h3>

                        <p className={`focus:outline-none rounded px-1 -mx-1 transition-all cursor-text ${
                          node.layout === 1 ? 'text-base font-serif leading-relaxed italic text-[#5a5a54]' :
                          node.layout === 2 ? 'text-sm font-sans opacity-60 leading-relaxed' :
                          node.layout === 3 ? 'text-xs font-mono leading-5 bg-[#F4F1ED] p-4 text-[#1a1a1a] border-l-2 border-black' :
                          'text-sm font-serif leading-relaxed text-[#4a4a44]'
                        }`} contentEditable suppressContentEditableWarning>
                          {node.description || 'Central research objective for the current workspace.'}
                        </p>
                      </div>

                      <div className={`mt-6 pt-4 flex justify-between items-center ${node.layout === 2 ? 'text-white/30 border-t border-white/10' : 'text-[#8c8a84] border-t border-[#F4F1ED]'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-1 rounded-full ${node.layout === 2 ? 'bg-[#C2410C]' : 'bg-[#C2410C]'}`}></div>
                          <span className="text-[10px] font-sans font-medium uppercase tracking-widest">{node.layout === 3 ? 'LATENT_SPACE' : 'Spatial Encoding'}</span>
                        </div>
                        <button className={`${node.layout === 2 ? 'text-white/40 hover:text-white' : 'text-[#C2410C]'} hover:scale-110 transition-transform`}><Maximize2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}
                  {(node.type === 'note' || node.type === 'text') && (
                    <div 
                      className={`w-full h-full shadow-lg transition-all duration-500 border-2 flex flex-col ${
                        node.layout === 1 ? 'p-8 font-serif text-lg leading-8 bg-white border-[#E6E4DF]' :
                        node.layout === 2 ? 'p-4 bg-[#F4F1ED] border-transparent shadow-sm' :
                        node.layout === 3 ? 'p-10 border-2 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] bg-white' :
                        'p-5 bg-white border-[#E6E4DF]'
                      }`}
                      style={{ outline: '1px solid transparent' }}
                    >
                      <div className={`flex items-center space-x-2 mb-2 ${node.layout === 3 ? 'mb-6' : ''}`}>
                        <span className={`text-[10px] font-sans font-bold uppercase tracking-wider ${
                          node.layout === 3 ? 'bg-[#1a1a1a] text-white px-2 py-0.5' : 'text-[#8c8a84]'
                        }`}>
                          {node.type === 'note' ? t('nodes.observation') : t('nodes.note')}
                        </span>
                        {node.layout === 1 && <div className="h-px flex-1 bg-[#C2410C]/20"></div>}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
                        {editingNodeId === node.id ? (
                          <div 
                            autoFocus
                            className={`focus:outline-none rounded px-1 -mx-1 transition-all cursor-text min-h-[50px] select-text empty:before:content-['${t('nodes.type_something')}'] empty:before:text-gray-300 ${
                              node.layout === 1 ? 'text-xl text-[#1a1a1a] font-serif' :
                              node.layout === 2 ? 'text-xs font-mono leading-5 text-[#5a5a54]' :
                              node.layout === 3 ? 'text-2xl font-bold tracking-tight text-[#1a1a1a]' :
                              'text-sm font-serif leading-relaxed text-[#4a4a44]'
                            }`} 
                            contentEditable 
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              db.nodes.update(node.id, { content: e.currentTarget.innerText });
                              setEditingNodeId(null);
                            }}
                          >
                            {node.content}
                          </div>
                        ) : (
                          <div 
                            onClick={() => setEditingNodeId(node.id)}
                            className={`markdown-body cursor-text min-h-[50px] ${
                              node.layout === 1 ? 'text-xl text-[#1a1a1a] font-serif' :
                              node.layout === 2 ? 'text-xs font-mono leading-5 text-[#5a5a54]' :
                              node.layout === 3 ? 'text-2xl font-bold tracking-tight text-[#1a1a1a]' :
                              'text-sm font-serif leading-relaxed text-[#4a4a44]'
                            }`}
                          >
                            <Markdown>{node.content || `_${t('nodes.empty_note')}_`}</Markdown>
                          </div>
                        )}
                      </div>

                      {node.layout === 3 && (
                        <div className="mt-4 flex justify-end">
                          <Bot className="w-4 h-4 text-[#1a1a1a] opacity-10" />
                        </div>
                      )}
                    </div>
                  )}
                  {node.type === 'ai' && (
                    <div 
                      className="w-full h-full bg-[#F4F1ED] p-6 shadow-lg border border-[#E6E4DF] flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-3 sticky top-0 bg-[#F4F1ED]">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-[#C2410C] rounded-full flex items-center justify-center text-white text-[10px]"><Bot className="w-3 h-3" /></div>
                          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]">{t('nodes.ai_refinement')}</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
                        {editingNodeId === node.id ? (
                          <div 
                            autoFocus
                            className="whitespace-pre-wrap text-sm text-[#4a4a44] font-serif leading-relaxed focus:outline-none bg-[#EAE7E2]/50 rounded px-1 -mx-1 transition-colors cursor-text min-h-[40px]" 
                            contentEditable 
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              db.nodes.update(node.id, { content: e.currentTarget.innerText });
                              setEditingNodeId(null);
                            }}
                          >
                            {node.content}
                          </div>
                        ) : (
                          <div 
                            onClick={() => setEditingNodeId(node.id)}
                            className="markdown-body text-sm text-[#4a4a44] font-serif leading-relaxed cursor-text min-h-[40px]"
                          >
                            <Markdown>{node.content}</Markdown>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {node.type === 'image' && (
                    <div 
                      className="w-full h-full bg-white p-2 shadow-lg border-2 border-[#E6E4DF] flex flex-col"
                      style={{ outline: '1px solid transparent' }}
                    >
                      <div className="w-full bg-[#EAE7E2] rounded flex items-center justify-center border border-dashed border-[#d1cfca] overflow-hidden pointer-events-none flex-1">
                        <img alt="Atmospheric Library" className="w-full h-full object-cover shadow-inner pointer-events-none" src={node.content}/>
                      </div>
                    </div>
                  )}
                  {node.type === 'video' && (
                    <div 
                      className="w-full h-full bg-white p-2 shadow-lg border-2 border-[#E6E4DF] flex flex-col"
                      style={{ outline: '1px solid transparent' }}
                    >
                      <div className="w-full bg-[#1a1a1a] rounded flex items-center justify-center border border-dashed border-[#d1cfca] overflow-hidden flex-1">
                        <video className="w-full h-full object-cover pointer-events-auto" controls src={node.content}/>
                      </div>
                    </div>
                  )}
                  {node.type === 'agent' && (
                    <div className="w-full h-full bg-[#1a1a1a] text-[#FAF9F6] p-4 shadow-2xl border border-[#333] rounded-lg relative overflow-hidden group flex flex-col">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#C2410C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="w-8 h-8 rounded bg-[#333] flex items-center justify-center text-[#C2410C]">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">{agentConfigs.find(a => a.id === node.agentConfigId)?.name || 'Agent'}</div>
                          <div className="text-[10px] text-[#8c8a84] font-mono uppercase tracking-wider">{agentConfigs.find(a => a.id === node.agentConfigId)?.role || 'Assistant'}</div>
                        </div>
                      </div>
                      <div className="text-xs text-[#a09f9c] mt-2 border-t border-[#333] pt-2 relative z-10">
                        {t('nodes.connect_notes')}
                      </div>
                    </div>
                  )}
                </DraggableNode>
              );
            })}
            </div>

          </div>

        {/* AI Prompt Bar & Toolbar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
            <div className={`bg-white rounded-2xl shadow-2xl border border-[#E6E4DF] p-2 flex items-center space-x-2 ring-4 ring-[#F4F1ED]/50 transition-all ${isAiLoading ? 'opacity-80' : ''}`}>
              <div className="flex items-center gap-1 pl-2 border-r border-[#E6E4DF] pr-3 mr-1 relative group">
                <button onClick={addTextNode} title={t('sidebar.new_note')} className="w-8 h-8 flex items-center justify-center text-[#5a5a54] hover:text-[#1a1a1a] hover:bg-[#F4F1ED] rounded-lg cursor-pointer transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <div className="relative group/agent">
                  <button title={t('sidebar.agents')} className="w-8 h-8 flex items-center justify-center text-[#5a5a54] hover:text-[#1a1a1a] hover:bg-[#F4F1ED] rounded-lg cursor-pointer transition-colors">
                    <Bot className="w-4 h-4" />
                  </button>
                  {/* Dropdown for agents */}
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-[#E6E4DF] rounded-xl shadow-xl opacity-0 invisible group-hover/agent:opacity-100 group-hover/agent:visible transition-all flex flex-col p-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-[#8c8a84] uppercase tracking-wider font-mono">{t('sidebar.agents')}</div>
                    {agentConfigs.map(agent => (
                      <button key={agent.id} onClick={async () => {
                        const cx = window.innerWidth / 2;
                        const cy = window.innerHeight / 2;
                        const t = transformRef.current;
                        const x = (cx - t.x) / t.scale - 150 + (Math.random() * 50);
                        const y = (cy - t.y) / t.scale - 100 + (Math.random() * 50);
                        await db.nodes.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, type: 'agent', agentConfigId: agent.id, x, y });
                      }} className="text-left px-3 py-2 text-sm text-[#1a1a1a] hover:bg-[#F4F1ED] rounded-lg mb-1 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-[#C2410C]"></div>
                         <div>
                           <div className="font-bold">{agent.name}</div>
                           <div className="text-[10px] text-[#5a5a54] leading-tight">{agent.role}</div>
                         </div>
                      </button>
                    ))}
                  </div>
                </div>
                <label title="Upload Media" className="w-8 h-8 flex items-center justify-center text-[#5a5a54] hover:text-[#1a1a1a] hover:bg-[#F4F1ED] rounded-lg cursor-pointer transition-colors m-0">
                  <ImageIcon className="w-4 h-4" />
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={addFileNode} />
                </label>
              </div>
              <div className="pl-1 text-[#C2410C]">
                 <Wand2 className={`w-5 h-5 ${isAiLoading ? 'animate-pulse' : ''}`} />
              </div>
              <input 
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 font-sans text-sm py-3 text-[#1a1a1a] placeholder-[#8c8a84] disabled:opacity-50" 
                placeholder={t('ai.input_placeholder')} 
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiSubmit()}
                disabled={isAiLoading}
              />
              <button 
                onClick={handleAiSubmit}
                disabled={isAiLoading}
                className="bg-[#C2410C] text-white p-2.5 rounded-xl font-sans text-sm font-bold shadow-md flex items-center justify-center hover:bg-[#a0350a] transition-colors disabled:opacity-75 shrink-0"
              >
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-8 right-6 flex items-center bg-white/80 backdrop-blur-sm border border-[#E6E4DF] rounded-md px-3 py-1.5 shadow-sm font-sans text-[10px] font-bold text-[#8c8a84] space-x-3 z-40">
            <button 
              className="hover:text-[#1a1a1a] transition-colors"
              onClick={() => setCanvasTransform(p => ({ ...p, scale: Math.max(0.1, p.scale / 1.1) }))}
            >{t('canvas.zoom')} -</button>
            <span className="flex items-center gap-1 w-12 justify-center"><ZoomIn className="w-3 h-3" /> {Math.round(canvasTransform.scale * 100)}%</span>
            <button 
              className="hover:text-[#1a1a1a] transition-colors"
              onClick={() => setCanvasTransform(p => ({ ...p, scale: Math.min(5, p.scale * 1.1) }))}
            >{t('canvas.zoom')} +</button>
          </div>
        </main>
        )}

        {activeTab === 'reference' && <Reference articles={articles} activeReferenceId={activeReferenceId} setActiveReferenceId={setActiveReferenceId} />}
        {activeTab === 'lab' && <ResearchLab aiConfig={aiConfig} callAI={callUniversalAI} />}
        {/* Agents in Agents Studio need consistent write access */}
        {activeTab === 'agents' && <AgentsStudio agentConfigs={agentConfigs} setAgentConfigs={async (newConfigs: any) => {
          // This ensures updates to agents from studio are saved to DB
          for (const config of newConfigs) {
            await db.agents.put(config);
          }
        }} aiConfig={aiConfig} callAI={callUniversalAI} />}
        <AISettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={aiConfig} setConfig={setAiConfig} />
      </div>
    </div>
  );
}

async function callUniversalAI({ 
  config, 
  prompt, 
  systemInstruction, 
  temperature = 0.7, 
  topP = 0.4 
}: { 
  config: any, 
  prompt: string, 
  systemInstruction?: string, 
  temperature?: number, 
  topP?: number 
}) {
  const useUserConfig = config?.apiKey && config.apiKey.trim() !== '';

  if (!useUserConfig || config.provider === 'gemini') {
    const apiKey = useUserConfig ? config.apiKey : (process.env.GEMINI_API_KEY);
    if (!apiKey) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey });
    const modelId = useUserConfig ? config.model : "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction,
        temperature,
        topP
      }
    });

    return response.text;
  }

  if (config.provider === 'openai' || config.provider === 'custom') {
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt }
        ],
        temperature,
        top_p: topP
      })
    });

    if (!response.ok) {
       const err = await response.json().catch(() => ({}));
       throw new Error(err.error?.message || `API Error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }

  if (config.provider === 'anthropic') {
    const response = await fetch(`https://api.anthropic.com/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'dangerouslyAllowBrowser': 'true'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20240620',
        system: systemInstruction,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic error: ${response.status}`);
    }
    const data = await response.json();
    return data.content[0].text;
  }

  throw new Error("Provider not supported");
}
