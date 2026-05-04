import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from './db';
import {
  Plus,
  Maximize2,
  Minimize2,
  Bot,
  Wand2,
  Send,
  ZoomIn,
  Image as ImageIcon,
  X,
  Loader2,
  PenLine,
} from 'lucide-react';
import { DraggableNode } from './components/canvas/DraggableNode';
import { AISettingsModal } from './components/AISettingsModal';
import { Sidebar } from './components/Sidebar';
import { CanvasHistoryPopover } from './components/CanvasHistoryPopover';
import type { AIConfig } from './components/AISettingsModal';
import { Reference } from './components/Reference';
import { ResearchLab } from './components/ResearchLab';
import { AgentsStudio } from './components/AgentsStudio';
import { callUniversalAI } from './services/ai';
import { getCanvasCenterPosition } from './utils/canvas';
import { NodeRenderer } from './components/nodes/NodeRenderer';
import { useSeedData } from './hooks/useSeedData';

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

  useSeedData();

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
        const { x, y } = getCanvasCenterPosition(transformRef.current);
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
    const { x, y } = getCanvasCenterPosition(transformRef.current);
    await db.nodes.add({ id: crypto.randomUUID(), canvasId: activeCanvasId, type: 'text', content: '', x, y });
  };

  const addFileNode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const { x, y } = getCanvasCenterPosition(transformRef.current);
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
        <Sidebar 
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          activeTab={activeTab} setActiveTab={setActiveTab}
          userAvatar={userAvatar} setUserAvatar={setUserAvatar}
          userName={userName} setUserName={setUserName}
          userRole={userRole} setUserRole={setUserRole}
          setIsSettingsOpen={setIsSettingsOpen}
        />

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
          <CanvasHistoryPopover canvases={canvases} activeCanvasId={activeCanvasId} setActiveCanvasId={setActiveCanvasId} />

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
                  <NodeRenderer node={node} editingNodeId={editingNodeId} setEditingNodeId={setEditingNodeId} agentConfigs={agentConfigs} />
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
                        const { x, y } = getCanvasCenterPosition(transformRef.current);
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
