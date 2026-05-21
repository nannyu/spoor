import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import mirrorIcon from './assets/agents/mirror.png';
import weavingIcon from './assets/agents/weaving.png';
import ironIcon from './assets/agents/iron.png';
import compassIcon from './assets/agents/compass.png';

export const SpoorPromoDuration = 1680;

const AGENT_PERSONAS = [
  {
    id: 'interviewer',
    icon: mirrorIcon,
    name: 'The Mirror',
    role: 'Interview',
    reply: 'What assumption are you not naming yet?',
  },
  {
    id: 'synthesizer',
    icon: weavingIcon,
    name: 'The Weaver',
    role: 'Synthesize',
    reply: 'These notes share one thread — anchor, orbit, evidence.',
  },
  {
    id: 'stylist',
    icon: ironIcon,
    name: 'Smoothing Iron',
    role: 'Stylize',
    reply: 'Try: “The room remembers. The thread forgets.”',
  },
  {
    id: 'futurist',
    icon: compassIcon,
    name: 'Star-Gazer',
    role: 'Project forward',
    reply: 'In ten years, this canvas becomes an index.',
  },
];

const ACCENT = '#C2410C';
const ACCENT_SOFT = 'rgba(194,65,12,0.10)';
const ACCENT_LINE = 'rgba(194,65,12,0.32)';
const INK = '#1F1B18';
const INK_SOFT = '#3F3833';
const MUTED = '#8B847C';
const LINE = '#E5DDD3';
const PAPER = '#FBF8F2';
const SERIF = 'Georgia, "Noto Serif SC", serif';
const SANS = 'Inter, "Helvetica Neue", "Noto Sans SC", sans-serif';

const STAGE = {
  width: 1920,
  height: 1080,
  margin: 96,
  headerY: 72,
  appX: 856,
  appY: 188,
  appW: 968,
  appH: 612,
  copyX: 96,
  copyY: 248,
  copyW: 680,
  captionY: 856,
  captionH: 92,
  timelineY: 996,
};

const SCENES = [
  {
    id: 'opening',
    start: 0,
    end: 8,
    layout: 'hero',
    eyebrow: 'Spoor',
    title: 'Think in space.',
    caption: 'A quiet canvas for memory, synthesis, and AI-assisted thought.',
  },
  {
    id: 'graph',
    start: 8,
    end: 16,
    layout: 'split',
    eyebrow: 'Connect',
    title: 'Notes connect by hand.',
    caption: 'Draw the line — the thought becomes visible.',
  },
  {
    id: 'forms',
    start: 16,
    end: 24,
    layout: 'split',
    eyebrow: 'Forms',
    title: 'Every note finds its form.',
    caption: 'Five layouts for different ways of thinking out loud.',
  },
  {
    id: 'synth',
    start: 24,
    end: 36,
    layout: 'split',
    eyebrow: 'Synthesize',
    title: 'Selected notes become a draft.',
    caption: 'A long-form article remains linked to its source canvas.',
  },
  {
    id: 'privacy',
    start: 36,
    end: 40,
    layout: 'split',
    eyebrow: 'Local-first',
    title: 'Yours, and only yours.',
    caption: 'Your canvas, your notes, your drafts — kept in your browser.',
  },
  {
    id: 'agentChat',
    start: 40,
    end: 50,
    layout: 'split',
    eyebrow: 'Personas',
    title: 'Four minds, one canvas.',
    caption: 'Each persona reads your notes — and the images linked to them.',
  },
  {
    id: 'closing',
    start: 50,
    end: 56,
    layout: 'hero',
    eyebrow: 'Spoor',
    title: 'A place for thoughts to leave a trace.',
    caption: 'scribe-ai-canvas.netlify.app',
  },
];

function smoothFade(sec, [a, b, c, d]) {
  return Math.min(
    interpolate(sec, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(sec, [c, d], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  );
}

function currentScene(sec) {
  return SCENES.find((scene) => sec >= scene.start && sec < scene.end) || SCENES[SCENES.length - 1];
}

function scenePresence(scene, sec) {
  const fade = 1.1;
  return smoothFade(sec, [scene.start, scene.start + fade, scene.end - fade, scene.end]);
}

function findCaption(segments, sec) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  return (
    segments.find((seg) => sec >= Number(seg.startSec) && sec < Number(seg.endSec)) ||
    segments[segments.length - 1]
  );
}

function HeroCopy({ scene, sec }) {
  const presence = scenePresence(scene, sec);
  const lift = interpolate(presence, [0, 1], [28, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 380,
        textAlign: 'center',
        opacity: presence,
        transform: `translateY(${lift}px)`,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 18,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: ACCENT,
          fontWeight: 600,
          marginBottom: 36,
        }}
      >
        {scene.eyebrow}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 116,
          lineHeight: 1.02,
          letterSpacing: '-0.045em',
          color: INK,
          fontWeight: 500,
          margin: '0 auto',
          maxWidth: 1240,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          marginTop: 38,
          fontFamily: SANS,
          fontSize: 26,
          lineHeight: 1.5,
          color: MUTED,
          maxWidth: 820,
          margin: '38px auto 0',
        }}
      >
        {scene.caption}
      </div>
    </div>
  );
}

function SplitCopy({ scene, sec }) {
  const presence = scenePresence(scene, sec);
  const lift = interpolate(presence, [0, 1], [22, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: STAGE.copyX,
        top: STAGE.copyY,
        width: STAGE.copyW,
        opacity: presence,
        transform: `translateY(${lift}px)`,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 17,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: ACCENT,
          fontWeight: 600,
          marginBottom: 28,
        }}
      >
        {scene.eyebrow}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 78,
          lineHeight: 0.99,
          letterSpacing: '-0.04em',
          color: INK,
          fontWeight: 500,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: SANS,
          fontSize: 23,
          lineHeight: 1.55,
          color: MUTED,
          maxWidth: 600,
        }}
      >
        {scene.caption}
      </div>
    </div>
  );
}

function SceneLayer({ window: [a, b, c, d], sec, children }) {
  const opacity = smoothFade(sec, [a, b, c, d]);
  if (opacity < 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        transition: 'opacity 0.4s ease',
      }}
    >
      {children}
    </div>
  );
}

function NoteCard({ kind, x, y, w = 200, h = 120, title, body, highlight }) {
  const styles = {
    base: {
      width: w,
      height: h,
      borderRadius: 12,
      border: `1px solid ${highlight ? ACCENT_LINE : LINE}`,
      background: '#FFFFFF',
      boxShadow: highlight
        ? '0 0 0 1px rgba(194,65,12,0.18), 0 16px 36px rgba(31,27,24,0.10)'
        : '0 10px 26px rgba(31,27,24,0.06)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: SANS,
      color: INK,
    },
    glass: {
      width: w,
      height: h,
      borderRadius: 18,
      border: `1px solid ${ACCENT_LINE}`,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.86), rgba(255,237,213,0.7))',
      boxShadow:
        '0 14px 36px rgba(31,27,24,0.10), inset 0 0 0 1px rgba(255,255,255,0.6)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(10px)',
      fontFamily: SANS,
      color: INK,
    },
    minimal: {
      width: w,
      height: h,
      borderRadius: 8,
      border: `1px solid ${LINE}`,
      background: '#F4F1ED',
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
      color: INK_SOFT,
      boxShadow: '0 6px 18px rgba(31,27,24,0.04)',
    },
    neo: {
      width: w,
      height: h,
      borderRadius: 4,
      border: '2px solid #1B1B1C',
      background: '#FFFFFF',
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '6px 6px 0 0 #1B1B1C',
      fontFamily: SERIF,
      color: INK,
    },
    receipt: {
      width: w,
      height: h,
      background: '#F5F0E8',
      border: '1px dashed #C7C5BD',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'ui-monospace, monospace',
      fontSize: 12,
      color: '#2C281F',
      boxShadow: '0 8px 18px rgba(31,27,24,0.06)',
    },
  };

  const style = styles[kind] || styles.base;

  return (
    <div style={{ position: 'absolute', left: x, top: y }}>
      <div style={style}>
        {title ? (
          <div
            style={{
              fontSize: kind === 'minimal' ? 9 : 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: kind === 'neo' ? '#fff' : ACCENT,
              background: kind === 'neo' ? '#1B1B1C' : 'transparent',
              alignSelf: kind === 'neo' ? 'flex-start' : 'auto',
              padding: kind === 'neo' ? '3px 7px' : 0,
              marginBottom: 10,
              fontWeight: 700,
              fontFamily: SANS,
            }}
          >
            {title}
          </div>
        ) : null}
        <div
          style={{
            fontSize: kind === 'neo' ? 17 : kind === 'minimal' ? 12 : 14,
            lineHeight: 1.45,
            color: kind === 'minimal' ? INK_SOFT : INK,
            flex: 1,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

const EDGE_GRAY = '#d1cfca';

/** Straight connector — matches canvas node-connector lines. */
function AgentConnector({ x1, y1, x2, y2 }) {
  return (
    <svg width="768" height="568" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ACCENT} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
    </svg>
  );
}

function AppEdges({ progress }) {
  const segments = [
    { x1: 250, y1: 126, x2: 170, y2: 256, delay: 0.0 },
    { x1: 250, y1: 126, x2: 395, y2: 282, delay: 0.18 },
    { x1: 380, y1: 79, x2: 400, y2: 78, delay: 0.34 },
    { x1: 170, y1: 364, x2: 238, y2: 380, delay: 0.5 },
  ];

  return (
    <svg width="768" height="568" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {segments.map((seg, i) => {
        const local = Math.max(0, Math.min(1, (progress - seg.delay) / 0.32));
        const length = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
        const dash = length - local * length;
        return (
          <line
            key={i}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={EDGE_GRAY}
            strokeWidth={2}
            strokeDasharray={length}
            strokeDashoffset={dash}
          />
        );
      })}
    </svg>
  );
}

function CanvasGraphScene({ sec }) {
  const t = interpolate(sec, [8, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <>
      <NoteCard
        kind="base"
        x={120}
        y={32}
        w={260}
        h={94}
        title="Theme"
        body="Memory as a navigable space."
        highlight
      />
      <NoteCard kind="base" x={400} y={28} w={170} h={100} title="Image" body="Linked artifact" />
      <NoteCard
        kind="glass"
        x={70}
        y={256}
        w={200}
        h={108}
        title="Thought"
        body="The room remembers what the thread forgets."
      />
      <NoteCard
        kind="minimal"
        x={290}
        y={282}
        w={210}
        h={88}
        title="Observation"
        body="Each placement is a memory cue."
      />
      <NoteCard
        kind="base"
        x={88}
        y={380}
        w={300}
        h={90}
        title="Quote"
        body="Memory is not storage. It is navigation."
      />
      <AppEdges progress={t} />
    </>
  );
}

function FormsScene({ sec }) {
  const layouts = [
    { kind: 'base', body: 'Memory is not storage. It is navigation through overlapping spaces.', title: 'Note' },
    { kind: 'glass', body: 'The room remembers what the thread forgets.', title: 'Thought' },
    { kind: 'minimal', body: 'each placement / a small / memory cue', title: 'Observation' },
    { kind: 'neo', body: 'MEMORY HAS A SHAPE.', title: 'Manifesto' },
    { kind: 'receipt', body: 'THOUGHT × 1\nROOM      00.00\nPAID', title: 'Receipt' },
  ];

  const idx = Math.min(layouts.length - 1, Math.floor((sec - 16) / 1.6));
  const localT = ((sec - 16) % 1.6) / 1.6;
  const current = layouts[Math.max(0, idx)];
  const next = layouts[Math.max(0, Math.min(layouts.length - 1, idx + 1))];

  const showNext = localT > 0.7 && idx < layouts.length - 1;
  const crossfade = interpolate(localT, [0.7, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const items = ['Standard', 'Glass', 'Minimal', 'Neo-brut', 'Receipt'];

  return (
    <>
      <div style={{ position: 'absolute', left: 248, top: 96, width: 320, height: 220 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: showNext ? 1 - crossfade : 1,
            transition: 'opacity 0.3s',
          }}
        >
          <NoteCard kind={current.kind} x={0} y={0} w={320} h={220} title={current.title} body={current.body} highlight />
        </div>
        {showNext ? (
          <div style={{ position: 'absolute', inset: 0, opacity: crossfade }}>
            <NoteCard kind={next.kind} x={0} y={0} w={320} h={220} title={next.title} body={next.body} highlight />
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 56,
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        {items.map((label, i) => (
          <div
            key={label}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${i === idx ? ACCENT_LINE : LINE}`,
              color: i === idx ? ACCENT : MUTED,
              background: i === idx ? ACCENT_SOFT : 'transparent',
              transition: 'all 0.25s ease',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </>
  );
}

function AgentNodeCard({ x, y, persona, active, width = 158 }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        padding: '12px 12px 14px',
        borderRadius: 16,
        border: `1px solid ${active ? ACCENT_LINE : LINE}`,
        background: active ? 'rgba(255,247,237,0.96)' : 'rgba(255,255,255,0.88)',
        boxShadow: active ? '0 16px 36px rgba(194,65,12,0.14)' : '0 10px 24px rgba(31,27,24,0.06)',
        fontFamily: SANS,
        transition: 'all 0.35s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Img src={persona.icon} style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{persona.name}</div>
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: '0.1em', marginTop: 2 }}>{persona.role.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}

function AgentChatScene({ sec }) {
  const chatPhase = interpolate(sec, [40, 46], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const studioPhase = interpolate(sec, [45.2, 47.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const activeChat = Math.min(
    AGENT_PERSONAS.length - 1,
    Math.floor(interpolate(sec, [40.5, 45.5], [0, 4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })),
  );
  const persona = AGENT_PERSONAS[activeChat];

  const note = { x: 264, y: 36, w: 240, h: 108 };
  const noteBottom = { x: note.x + note.w / 2, y: note.y + note.h };
  const agentW = 158;
  const agentY = 248;
  const gap = 18;
  const rowWidth = AGENT_PERSONAS.length * agentW + (AGENT_PERSONAS.length - 1) * gap;
  const rowStartX = (768 - rowWidth) / 2;
  const agentPositions = AGENT_PERSONAS.map((_, i) => ({
    x: rowStartX + i * (agentW + gap),
    y: agentY,
    cx: rowStartX + i * (agentW + gap) + agentW / 2,
    cy: agentY,
  }));
  const activePos = agentPositions[activeChat];

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - studioPhase * 0.15 }}>
        <NoteCard
          kind="glass"
          x={note.x}
          y={note.y}
          w={note.w}
          h={note.h}
          title="Observation"
          body="How does spatial layout change recall?"
          highlight
        />

        <AgentConnector x1={noteBottom.x} y1={noteBottom.y} x2={activePos.cx} y2={activePos.cy} />

        {agentPositions.map((pos, i) => (
          <AgentNodeCard
            key={AGENT_PERSONAS[i].id}
            x={pos.x}
            y={pos.y}
            width={agentW}
            persona={AGENT_PERSONAS[i]}
            active={i === activeChat}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            left: 56,
            right: 56,
            bottom: 24,
            padding: '14px 16px',
            borderRadius: 18,
            border: `1px solid ${ACCENT_LINE}`,
            background: 'rgba(255,247,237,0.96)',
            boxShadow: '0 18px 42px rgba(194,65,12,0.12)',
            opacity: chatPhase * (1 - studioPhase * 0.6),
            fontFamily: SANS,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Img src={persona.icon} style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>You · on canvas</div>
              <div style={{ fontSize: 13, color: INK_SOFT, marginBottom: 8, borderLeft: `2px solid ${LINE}`, paddingLeft: 10 }}>
                How do these notes connect?
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.5, color: INK, fontFamily: SERIF }}>{persona.reply}</div>
              <div style={{ marginTop: 8, fontSize: 10, color: ACCENT, letterSpacing: '0.12em' }}>{persona.name.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: '12px 14px 12px 14px',
          borderRadius: 22,
          background: 'rgba(255,255,255,0.94)',
          border: `1px solid ${LINE}`,
          boxShadow: '0 28px 70px rgba(31,27,24,0.14)',
          opacity: studioPhase,
          transform: `translateY(${interpolate(studioPhase, [0, 1], [16, 0])}px)`,
          display: 'grid',
          gridTemplateColumns: '200px 1fr',
          overflow: 'hidden',
          fontFamily: SANS,
        }}
      >
        <div style={{ borderRight: `1px solid ${LINE}`, padding: '18px 14px', background: '#F4EFE6' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: ACCENT, fontWeight: 700 }}>PERSONAS</div>
          {AGENT_PERSONAS.map((p, i) => (
            <div
              key={p.id}
              style={{
                marginTop: 10,
                padding: '10px 10px',
                borderRadius: 12,
                border: `1px solid ${i === activeChat ? ACCENT_LINE : 'transparent'}`,
                background: i === activeChat ? '#fff' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: INK_SOFT,
              }}
            >
              <Img src={p.icon} style={{ width: 22, height: 22, objectFit: 'contain' }} />
              <span>{p.name}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 12,
              padding: '12px 10px',
              borderRadius: 12,
              border: `2px dashed ${ACCENT}`,
              background: ACCENT_SOFT,
              fontSize: 11,
              fontWeight: 600,
              color: ACCENT,
              textAlign: 'center',
            }}
          >
            + Custom persona
          </div>
        </div>
        <div style={{ padding: '22px 24px' }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: '0.14em' }}>DEFINE YOUR OWN</div>
          <div style={{ marginTop: 14, fontSize: 22, fontWeight: 600, color: INK, fontFamily: SERIF }}>Field Ethnographer</div>
          <div style={{ marginTop: 6, fontSize: 12, color: ACCENT }}>Role · Qualitative lens</div>
          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 12,
              background: '#FAF8F3',
              border: `1px solid ${LINE}`,
              fontSize: 12,
              lineHeight: 1.55,
              color: INK_SOFT,
            }}
          >
            Ask one sharp question at a time. Surface what the notes imply but never say aloud.
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <span style={{ padding: '6px 12px', borderRadius: 999, background: ACCENT_SOFT, fontSize: 10, color: ACCENT }}>Temperature</span>
            <span style={{ padding: '6px 12px', borderRadius: 999, background: '#EFE7DC', fontSize: 10, color: MUTED }}>Creativity</span>
          </div>
        </div>
      </div>
    </>
  );
}

function SynthScene({ sec }) {
  const selectionStart = 24;
  const articleStart = 28;
  const linkStart = 34;

  const selectGlow = smoothFade(sec, [selectionStart, selectionStart + 0.8, articleStart, articleStart + 0.6]);
  const article = smoothFade(sec, [articleStart, articleStart + 1.2, 36, 36.1]);
  const linkChip = smoothFade(sec, [linkStart, linkStart + 0.8, 36, 36.1]);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 1 - article * 0.55,
        }}
      >
        <NoteCard
          kind="base"
          x={70}
          y={48}
          w={210}
          h={92}
          title="Theme"
          body="Memory as space"
          highlight={selectGlow > 0.4}
        />
        <NoteCard
          kind="glass"
          x={70}
          y={170}
          w={210}
          h={102}
          title="Observation"
          body="The room remembers. The thread forgets."
          highlight={selectGlow > 0.4}
        />
        <NoteCard
          kind="minimal"
          x={70}
          y={302}
          w={210}
          h={86}
          title="Linked image"
          body="(canvas artifact)"
          highlight={selectGlow > 0.4}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          right: 36,
          top: 32,
          width: 420,
          height: 500,
          borderRadius: 18,
          background: '#FFFFFF',
          border: `1px solid ${LINE}`,
          boxShadow: '0 28px 70px rgba(31,27,24,0.14)',
          padding: '26px 28px',
          opacity: article,
          transform: `translateY(${interpolate(article, [0, 1], [22, 0])}px)`,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: SANS,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: ACCENT, fontWeight: 700 }}>REFERENCE / GEN-742</div>
        <div
          style={{
            marginTop: 18,
            fontFamily: SERIF,
            fontSize: 30,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            color: INK,
            fontWeight: 500,
          }}
        >
          The Architecture of Spatial Memory
        </div>
        <div style={{ marginTop: 18, fontSize: 14, lineHeight: 1.6, color: INK_SOFT }}>
          A field synthesized from a small canvas: anchor themes, orbiting observations, and the artifacts that hold them in place.
        </div>
        <div style={{ marginTop: 14, width: '78%', height: 8, borderRadius: 999, background: '#EFE7DC' }} />
        <div style={{ marginTop: 10, width: '64%', height: 8, borderRadius: 999, background: '#EFE7DC' }} />
        <div style={{ marginTop: 10, width: '71%', height: 8, borderRadius: 999, background: '#EFE7DC' }} />

        <div
          style={{
            marginTop: 22,
            opacity: linkChip,
            display: 'inline-flex',
            alignSelf: 'flex-start',
            padding: '9px 14px',
            borderRadius: 999,
            background: ACCENT_SOFT,
            border: `1px solid ${ACCENT_LINE}`,
            color: ACCENT,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          ↗ Linked to source canvas
        </div>
      </div>
    </>
  );
}

function PrivacyOverlay({ sec }) {
  const opacity = smoothFade(sec, [36, 36.8, 40, 40.1]);
  if (opacity < 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(251,248,242,0.62) 100%)',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
}

function AppWindow({ sec }) {
  const scene = currentScene(sec);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - 0.4 * fps,
    fps,
    config: { damping: 22, mass: 0.7, stiffness: 65 },
  });
  const enterOffset = interpolate(entrance, [0, 1], [28, 0]);
  const drift = interpolate(sec, [0, 60], [-10, 10], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zoom = interpolate(sec, [0, 60], [0.985, 1.025], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sidebarActive = (() => {
    if (scene.id === 'synth') return 'reference';
    if (scene.id === 'agentChat') return 'agents';
    if (scene.id === 'privacy') return 'canvas';
    return 'canvas';
  })();

  return (
    <div
      style={{
        position: 'absolute',
        left: STAGE.appX,
        top: STAGE.appY,
        width: STAGE.appW,
        height: STAGE.appH,
        borderRadius: 28,
        overflow: 'hidden',
        background: '#FBF8F2',
        border: `1px solid ${LINE}`,
        boxShadow: '0 48px 110px rgba(40,28,18,0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
        opacity: interpolate(entrance, [0, 1], [0, 1]) * (1 - scenePresence(SCENES[SCENES.length - 1], sec) * 0.92),
        transform: `translate(${drift}px, ${enterOffset}px) scale(${zoom})`,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          height: 44,
          background: 'rgba(244, 239, 232, 0.82)',
          borderBottom: `1px solid ${LINE}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 10,
        }}
      >
        {['#E8AAA0', '#E9D2A1', '#BFD8B8'].map((c) => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c }} />
        ))}
        <span style={{ marginLeft: 14, fontSize: 12, color: MUTED }}>Spoor · Memory Architecture</span>
      </div>

      <div style={{ position: 'absolute', top: 44, bottom: 0, left: 0, width: 200, background: '#F4EFE6', borderRight: `1px solid ${LINE}`, padding: '22px 16px', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700 }}>Spoor</div>
        <div style={{ marginTop: 6, fontSize: 10, color: MUTED, letterSpacing: '0.16em' }}>FOCUS MODE</div>
        <div style={{ marginTop: 22, fontSize: 10, color: MUTED, letterSpacing: '0.16em' }}>MODULES</div>
        {[
          { id: 'canvas', label: 'Canvas' },
          { id: 'reference', label: 'Reference' },
          { id: 'lab', label: 'Research' },
          { id: 'agents', label: 'Personas' },
        ].map((tab) => {
          const active = sidebarActive === tab.id;
          return (
            <div
              key={tab.id}
              style={{
                marginTop: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: active ? '#FFFFFF' : 'transparent',
                border: `1px solid ${active ? LINE : 'transparent'}`,
                color: active ? ACCENT : INK_SOFT,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
              }}
            >
              {tab.label}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 44,
          bottom: 0,
          left: 200,
          right: 0,
          background: PAPER,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(31,27,24,0.10) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.42,
          }}
        />

        <SceneLayer window={[7.5, 9, 16, 16.6]} sec={sec}>
          <CanvasGraphScene sec={sec} />
        </SceneLayer>
        <SceneLayer window={[15.4, 16.4, 24, 24.6]} sec={sec}>
          <FormsScene sec={sec} />
        </SceneLayer>
        <SceneLayer window={[23.4, 24.4, 36, 36.6]} sec={sec}>
          <SynthScene sec={sec} />
        </SceneLayer>
        <SceneLayer window={[35.4, 36.4, 40, 40.6]} sec={sec}>
          <CanvasGraphScene sec={sec} />
        </SceneLayer>
        <SceneLayer window={[39.4, 40.4, 50, 50.6]} sec={sec}>
          <AgentChatScene sec={sec} />
        </SceneLayer>

        <PrivacyOverlay sec={sec} />

        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 18,
            display: 'flex',
            gap: 8,
            opacity: smoothFade(sec, [36, 36.8, 40, 40.1]),
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.94)',
              border: `1px solid ${LINE}`,
              fontSize: 11,
              color: MUTED,
              letterSpacing: '0.06em',
            }}
          >
            Local-first · IndexedDB
          </div>
        </div>
      </div>
    </div>
  );
}

function EnglishCaption({ caption, sec }) {
  const closing = scenePresence(SCENES[SCENES.length - 1], sec);
  const opening = scenePresence(SCENES[0], sec);
  const opacity = (1 - closing) * (1 - opening * 0.6);
  if (opacity < 0.02 || !caption?.en) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: STAGE.captionY,
        opacity,
        textAlign: 'center',
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: 1320,
          fontSize: 34,
          lineHeight: 1.42,
          fontWeight: 450,
          color: INK_SOFT,
          letterSpacing: '0.01em',
        }}
      >
        {caption.en}
      </div>
    </div>
  );
}

function ClosingCTA({ scene, sec, ctaText, ctaUrl }) {
  const presence = scenePresence(scene, sec);
  if (presence < 0.02) return null;
  const lift = interpolate(presence, [0, 1], [24, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        opacity: presence,
        transform: `translateY(${lift}px)`,
      }}
    >
      <div style={{ maxWidth: 1100 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 17,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: ACCENT,
            fontWeight: 600,
            marginBottom: 30,
          }}
        >
          {scene.eyebrow}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 116,
            lineHeight: 1.02,
            letterSpacing: '-0.045em',
            color: INK,
            fontWeight: 500,
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: SANS,
            fontSize: 22,
            color: MUTED,
          }}
        >
          {ctaUrl}
        </div>
        <div
          style={{
            marginTop: 42,
            display: 'inline-flex',
            padding: '16px 30px',
            borderRadius: 999,
            background: ACCENT,
            color: '#fff',
            fontFamily: SANS,
            fontSize: 16,
            letterSpacing: '0.06em',
            fontWeight: 600,
            boxShadow: '0 24px 50px rgba(194,65,12,0.24)',
          }}
        >
          {ctaText}
        </div>
      </div>
    </div>
  );
}

export const SpoorPromo = ({
  title = 'Spoor',
  subtitle = 'Notes that leave a trace',
  brandLabel = 'SPOOR',
  ctaUrl = 'scribe-ai-canvas.netlify.app',
  ctaText = 'Try the web app',
  audioUrl = '',
  timestampSegments = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  const scene = currentScene(sec);
  const caption = findCaption(timestampSegments, sec);
  const closingPresence = scenePresence(SCENES[SCENES.length - 1], sec);
  const openingPresence = scenePresence(SCENES[0], sec);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% 22%, #FFF6EA 0%, #FBF6EC 46%, #EFE6D9 100%)',
        fontFamily: SERIF,
        color: INK,
        overflow: 'hidden',
      }}
    >
      {audioUrl ? <Audio src={audioUrl} /> : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 16% 22%, rgba(194,65,12,0.07), transparent 32%), linear-gradient(120deg, rgba(255,255,255,0.6), transparent 36%)',
          opacity: 0.94,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 100,
          width: 540,
          height: 540,
          borderRadius: '50%',
          border: '1px solid rgba(194,65,12,0.10)',
          opacity: 1 - closingPresence * 0.9,
        }}
      />

      {scene.layout === 'hero' && scene.id === 'opening' ? (
        <HeroCopy scene={{ ...scene, title }} sec={sec} />
      ) : null}

      {scene.layout === 'split' ? (
        <>
          <SplitCopy scene={scene} sec={sec} />
          <AppWindow sec={sec} />
        </>
      ) : null}

      {scene.id !== 'closing' ? <EnglishCaption caption={caption} sec={sec} /> : null}

      <ClosingCTA scene={SCENES[SCENES.length - 1]} sec={sec} ctaText={ctaText} ctaUrl={ctaUrl} />
    </AbsoluteFill>
  );
};
