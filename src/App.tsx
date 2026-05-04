import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from './db';
import {
  Maximize2,
  Minimize2,
  X,
  Loader2,
  PenLine,
} from 'lucide-react';
import { DraggableNode } from './components/canvas/DraggableNode';
import { AISettingsModal } from './components/AISettingsModal';
import { Sidebar } from './components/Sidebar';
import { CanvasHistoryPopover } from './components/CanvasHistoryPopover';
import { CanvasToolbar } from './components/CanvasToolbar';
import type { AIConfig } from './components/AISettingsModal';
import { Reference } from './components/Reference';
import { ResearchLab } from './components/ResearchLab';
import { AgentsStudio } from './components/AgentsStudio';
import { callUniversalAI } from './services/ai';
import { getCanvasCenterPosition } from './utils/canvas';
import { NodeRenderer } from './components/nodes/NodeRenderer';
import { useSeedData } from './hooks/useSeedData';
import { useUserProfile } from './hooks/useUserProfile';
import { useFullscreen } from './hooks/useFullscreen';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useNodeActions } from './hooks/useNodeActions';

export default function App() {
  const { t, i18n } = useTranslation();
  const nodesRef = useRef<Record<string, HTMLElement | null>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const edgeLabelsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');

  // User Profile
  const { userName, setUserName, userRole, setUserRole, userAvatar, setUserAvatar } = useUserProfile();

  // Fullscreen
  const { isFullscreen, toggleFullscreen } = useFullscreen(mainRef);

  // Canvas interaction (transform, pan, zoom, edge lines)
  const { canvasTransform, setCanvasTransform, transformRef, handlePanStart } = useCanvasInteraction(
    mainRef, contentContainerRef, svgRef, edgeLabelsRef, nodesRef, connectingFrom, setConnectingFrom,
  );

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
    localStorage.setItem('active_canvas_id', activeCanvasId);
  }, [activeCanvasId]);

  useSeedData();

  // Node actions (CRUD, selection, linking)
  const { toggleNodeSelection, handleLink, deleteEdge, removeNodeId, addTextNode, addFileNode } = useNodeActions({
    activeCanvasId, nodesRef, connectingFrom, setConnectingFrom, edges, selectedNodes, setSelectedNodes, transformRef,
  });

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
                onClick={toggleFullscreen}
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
        <CanvasToolbar 
          isAiLoading={isAiLoading} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
          handleAiSubmit={handleAiSubmit} addTextNode={addTextNode} addFileNode={addFileNode}
          agentConfigs={agentConfigs} canvasTransform={canvasTransform}
          setCanvasTransform={setCanvasTransform} transformRef={transformRef}
          activeCanvasId={activeCanvasId}
        />
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
