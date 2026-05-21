import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const ACCENT = '#C2410C';
const BG_CANVAS = '#FAF9F6';
const BG_SIDEBAR = '#F4F1ED';
const BORDER = '#E6E4DF';

import logoUrl from '../../LOGO.png';
import mirrorUrl from '../../Mirror Icon - Orange Theme.png';
import weavingUrl from '../../Weaving Icon - Orange Theme.png';
import ironUrl from '../../Iron Smoothing Icon.png';
import compassUrl from '../../Compass Icon - Orange Theme.png';

const AGENT_ICONS = {
  interviewer: mirrorUrl,
  synthesizer: weavingUrl,
  stylist: ironUrl,
  futurist: compassUrl,
};

const NOTE_TEXT =
  'Memory is not storage — it is navigation through overlapping spaces of thought.';

function PromoNoteCard({ layout, width, height, highlight }) {
  const morph = Number(layout);
  const isGlass = morph === 1;
  const isMinimal = morph === 2;
  const isNeo = morph === 3;
  const isReceipt = morph === 4;

  if (isReceipt) {
    return (
      <div
        style={{
          width,
          height,
          boxShadow: highlight
            ? '0 0 0 3px rgba(194,65,12,0.35), 0 18px 40px rgba(0,0,0,0.12)'
            : '0 12px 28px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.4s',
        }}
      >
        <div style={{ height: 10, background: 'repeating-linear-gradient(-45deg, transparent 5px, #f5f0e8 5px, #f5f0e8 10px)' }} />
        <div
          style={{
            background: '#f5f0e8',
            border: '2px solid #c7c5d4',
            padding: 14,
            height: height - 20,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            color: '#2c281f',
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #c7c5d4', paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 700 }}>THOUGHT RECEIPT</div>
            <div style={{ marginTop: 6, opacity: 0.8 }}>STORE #042 · TXN 8F2A</div>
          </div>
          <div style={{ flex: 1, lineHeight: 1.45, opacity: 0.92 }}>{NOTE_TEXT}</div>
          <div style={{ borderTop: '2px dashed #c7c5d4', paddingTop: 8, textAlign: 'center', fontSize: 10 }}>PAID</div>
        </div>
        <div style={{ height: 10, transform: 'rotate(180deg)', background: 'repeating-linear-gradient(-45deg, transparent 5px, #f5f0e8 5px, #f5f0e8 10px)' }} />
      </div>
    );
  }

  const outer = {
    width,
    height,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'all 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: highlight
      ? '0 0 0 3px rgba(194,65,12,0.4), 0 18px 40px rgba(0,0,0,0.12)'
      : isNeo
        ? '4px 4px 0 0 #1b1b1c'
        : '0 12px 28px rgba(0,0,0,0.08)',
    border: isNeo ? '2px solid #1b1b1c' : isGlass ? '2px solid rgba(194,65,12,0.25)' : `2px solid ${BORDER}`,
    borderRadius: isGlass ? 14 : 0,
    background: isGlass
      ? 'rgba(255,255,255,0.55)'
      : isMinimal
        ? '#F4F1ED'
        : isNeo
          ? '#fcf8f9'
          : '#ffffff',
    padding: isNeo ? 22 : isMinimal ? 16 : 20,
    position: 'relative',
  };

  return (
    <div style={outer}>
      {isGlass && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(194,65,12,0.12), transparent 55%)',
              borderRadius: 14,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 90,
              height: 90,
              background: 'radial-gradient(circle, rgba(255,237,213,0.5), transparent 70%)',
              filter: 'blur(12px)',
            }}
          />
        </>
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: isNeo ? '#fff' : ACCENT,
          background: isNeo ? '#1b1b1c' : 'transparent',
          alignSelf: isNeo ? 'flex-start' : 'stretch',
          padding: isNeo ? '4px 8px' : 0,
          marginBottom: isNeo ? 12 : 8,
        }}
      >
        {isGlass ? 'Thought' : 'Observation'}
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          fontFamily: isNeo ? 'Georgia, serif' : isMinimal ? 'ui-monospace, monospace' : 'Georgia, serif',
          fontSize: isNeo ? 20 : isMinimal ? 12 : 14,
          lineHeight: isNeo ? 1.35 : 1.55,
          color: isNeo ? '#1b1b1c' : '#4a4a44',
          fontWeight: isNeo ? 600 : 400,
        }}
      >
        {NOTE_TEXT}
      </div>
    </div>
  );
}

function ThemeCard({ x, y, w, h, title, desc, highlight }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        background: '#fff',
        border: `2px solid ${highlight ? ACCENT : BORDER}`,
        boxShadow: highlight ? '0 0 0 2px rgba(194,65,12,0.25), 0 16px 36px rgba(0,0,0,0.1)' : '0 12px 28px rgba(0,0,0,0.08)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: ACCENT, fontSize: 12 }}>✦</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: ACCENT }}>THEME</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#5a5a54', flex: 1 }}>{desc}</div>
      <div style={{ fontSize: 10, color: '#8c8a84', letterSpacing: '0.1em', marginTop: 12 }}>SPATIAL ENCODING</div>
    </div>
  );
}

function AiCard({ x, y, w, h, userTurn, reply, highlight }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        background: '#F4F1ED',
        border: `1px solid ${highlight ? ACCENT : BORDER}`,
        boxShadow: highlight ? '0 0 0 2px rgba(194,65,12,0.3), 0 14px 32px rgba(0,0,0,0.1)' : '0 10px 24px rgba(0,0,0,0.06)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {userTurn ? (
        <div
          style={{
            fontSize: 13,
            color: '#1a1a1a',
            borderLeft: `3px solid ${ACCENT}`,
            paddingLeft: 10,
            marginBottom: 12,
            background: 'rgba(255,255,255,0.5)',
            padding: '8px 10px',
            borderRadius: '0 6px 6px 0',
          }}
        >
          {userTurn}
        </div>
      ) : null}
      <div style={{ fontSize: 14, lineHeight: 1.55, color: '#4a4a44', fontFamily: 'Georgia, serif', flex: 1 }}>{reply}</div>
    </div>
  );
}

function AgentNode({ x, y, agentId, label, active }) {
  const icon = AGENT_ICONS[agentId];
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 200,
        height: 88,
        background: active ? '#fff' : 'rgba(255,255,255,0.92)',
        border: `2px solid ${active ? ACCENT : BORDER}`,
        borderRadius: 12,
        boxShadow: active ? '0 12px 28px rgba(194,65,12,0.15)' : '0 8px 20px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        transform: active ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.35s',
      }}
    >
      <Img src={icon} style={{ width: 40, height: 40, objectFit: 'contain' }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.08em' }}>PERSONA</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

function Edge({ x1, y1, x2, y2, opacity = 0.45 }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ACCENT} strokeWidth={2} opacity={opacity} strokeLinecap="round" />
  );
}

function Sidebar({ activeTab, phase }) {
  const tabs = [
    { id: 'personal', label: 'Canvas', icon: '▣' },
    { id: 'reference', label: 'Long-form', icon: '▤' },
    { id: 'lab', label: 'Research', icon: '◎' },
    { id: 'agents', label: 'Personas', icon: '◇' },
  ];
  const tabMap = { 0: 'personal', 1: 'personal', 2: 'personal', 3: 'agents', 4: 'lab', 5: 'reference', 6: 'personal', 7: 'personal' };
  const current = tabMap[phase] ?? activeTab;

  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        background: BG_SIDEBAR,
        borderRight: `1px solid ${BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
      }}
    >
      <div style={{ padding: '0 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Img src={logoUrl} style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Spatial Notes</div>
          <div style={{ fontSize: 9, color: '#8c8a84', letterSpacing: '0.08em', marginTop: 2 }}>FOCUS MODE</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#8c8a84', letterSpacing: '0.12em', padding: '0 16px 10px' }}>MODULES</div>
      {tabs.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            fontSize: 13,
            color: current === t.id ? ACCENT : '#5a5a54',
            background: current === t.id ? '#fff' : 'transparent',
            borderTop: current === t.id ? `1px solid ${BORDER}` : '1px solid transparent',
            borderBottom: current === t.id ? `1px solid ${BORDER}` : '1px solid transparent',
            fontWeight: current === t.id ? 600 : 400,
          }}
        >
          <span style={{ opacity: 0.7 }}>{t.icon}</span>
          {t.label}
        </div>
      ))}
    </div>
  );
}

function CanvasToolbar({ visible, prompt }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '72%',
        maxWidth: 720,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(14px)',
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          flex: 1,
          fontSize: 14,
          color: '#5a5a54',
          fontFamily: 'Georgia, serif',
          borderLeft: `3px solid ${ACCENT}`,
          paddingLeft: 12,
        }}
      >
        {prompt}
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: ACCENT,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        →
      </div>
    </div>
  );
}

function ResearchPanel({ opacity }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '24px 32px 24px 24px',
        background: 'rgba(255,255,255,0.96)',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        opacity,
        display: 'flex',
        pointerEvents: 'none',
      }}
    >
      <div style={{ width: 280, borderRight: `1px solid ${BORDER}`, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em' }}>RESEARCH LAB</div>
        <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.6, color: '#5a5a54' }}>
          How does spatial layout change recall?
        </div>
        {['What is the core phenomenon?', 'Which studies support it?', 'What are design implications?'].map((s, i) => (
          <div
            key={s}
            style={{
              marginTop: 12,
              padding: 12,
              background: i === 0 ? 'rgba(194,65,12,0.08)' : '#FAF9F6',
              border: `1px solid ${i === 0 ? ACCENT : BORDER}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Research Report</div>
        <div style={{ fontSize: 13, lineHeight: 1.65, color: '#4a4a44' }}>
          Spatial metaphors help users externalize memory as navigable structure rather than linear chat logs…
        </div>
      </div>
    </div>
  );
}

function ReferencePanel({ opacity }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '20px 28px 20px 20px',
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        opacity,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: 220, borderRight: `1px solid ${BORDER}`, background: '#FAF9F6', padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8c8a84' }}>ARCHIVE</div>
        <div style={{ marginTop: 12, padding: 10, background: 'rgba(194,65,12,0.1)', borderRadius: 6, fontSize: 12, fontWeight: 600, color: ACCENT }}>
          Spatial Encoding
        </div>
      </div>
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Georgia, serif' }}>Spatial Encoding in Memory</div>
        <div style={{ marginTop: 20, fontSize: 14, lineHeight: 1.7, color: '#4a4a44' }}>
          Synthesized from canvas notes — linked back to source workspace.
        </div>
        <div style={{ marginTop: 24, padding: 12, background: '#F4F1ED', borderRadius: 8, fontSize: 12, color: ACCENT, fontWeight: 600 }}>
          → Open source canvas
        </div>
      </div>
    </div>
  );
}

export function SpatialNotesAppDemo({ phase, sec, morphLayout }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const scale = interpolate(enter, [0, 1], [0.94, 1]);
  const panX = interpolate(phase, [0, 1, 2, 3, 4, 5], [0, 0, -20, -40, -60, -80], { extrapolateRight: 'clamp' });
  const panY = interpolate(phase, [0, 1, 2, 3], [0, 0, -10, -20], { extrapolateRight: 'clamp' });

  const labOpacity = interpolate(sec, [30, 32, 37, 39], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const refOpacity = interpolate(sec, [38, 40, 45, 47], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const showCanvas = phase < 4 || phase === 6 || phase === 7;
  const canvasOpacity = showCanvas ? 1 - Math.max(labOpacity, refOpacity) * 0.92 : 0;

  const agentActive = Math.floor(interpolate(sec, [22, 30], [0, 4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 1680,
          height: 880,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(26,26,26,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
        }}
      >
        <div
          style={{
            height: 36,
            background: '#F4F1ED',
            borderBottom: `1px solid ${BORDER}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 8,
            fontSize: 12,
            color: '#5a5a54',
          }}
        >
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#eab308' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ marginLeft: 12, opacity: 0.7 }}>Spatial Notes — Canvas</span>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <Sidebar activeTab="personal" phase={phase} />
          <div style={{ flex: 1, position: 'relative', background: BG_CANVAS, overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: canvasOpacity,
                backgroundImage: 'radial-gradient(circle, #d6d3d1 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                transform: `translate(${panX}px, ${panY}px)`,
              }}
            >
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <Edge x1={520} y1={280} x2={720} y2={200} opacity={phase >= 1 ? 0.5 : 0.15} />
                <Edge x1={720} y1={200} x2={980} y2={320} opacity={phase >= 2 ? 0.55 : 0.12} />
                <Edge x1={520} y1={280} x2={420} y2={420} opacity={phase >= 2 ? 0.5 : 0.1} />
                <Edge x1={980} y1={320} x2={1180} y2={260} opacity={phase >= 3 ? 0.5 : 0.1} />
              </svg>

              <ThemeCard
                x={700}
                y={120}
                w={300}
                h={200}
                title="The Memory Architect"
                desc="Central research objective for the current workspace."
                highlight={phase <= 1}
              />

              <div style={{ position: 'absolute', left: 480, top: 220 }}>
                <PromoNoteCard layout={morphLayout} width={260} height={phase === 1 ? 200 : 160} highlight={phase === 1} />
              </div>

              <div style={{ position: 'absolute', left: 320, top: 380 }}>
                <PromoNoteCard layout={0} width={200} height={120} highlight={false} />
              </div>

              <div style={{ position: 'absolute', left: 900, top: 360 }}>
                <PromoNoteCard layout={2} width={180} height={100} highlight={false} />
              </div>

              {phase >= 2 && (
                <AiCard
                  x={1080}
                  y={240}
                  w={320}
                  h={220}
                  userTurn="How do these notes connect?"
                  reply="They form a spatial thread: theme anchors the field, observations orbit as movable evidence."
                  highlight={phase === 2}
                />
              )}

              {phase >= 3 && (
                <>
                  <AgentNode x={200} y={520} agentId="interviewer" label="Interviewer" active={agentActive === 0} />
                  <AgentNode x={430} y={500} agentId="synthesizer" label="Synthesizer" active={agentActive === 1} />
                  <AgentNode x={660} y={520} agentId="stylist" label="Stylist" active={agentActive === 2} />
                  <AgentNode x={890} y={500} agentId="futurist" label="Futurist" active={agentActive === 3} />
                </>
              )}

              <CanvasToolbar
                visible={phase >= 2}
                prompt="Help me see the pattern between these notes…"
              />

              {phase >= 6 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 24,
                    right: 28,
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.9)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 999,
                    fontSize: 12,
                    color: '#5a5a54',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  }}
                >
                  🔒 Local-first · IndexedDB in your browser
                </div>
              )}
            </div>

            <ResearchPanel opacity={labOpacity} />
            <ReferencePanel opacity={refOpacity} />
          </div>
        </div>
      </div>
    </div>
  );
}
