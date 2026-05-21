import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const SpatialNotesPromoDuration = 1800;

const ACCENT = '#C2410C';
const INK = '#1F1B18';
const MUTED = '#746D66';
const LINE = '#E8E0D7';
const FONT_SERIF = 'Georgia, "Noto Serif SC", serif';
const FONT_SANS = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const SCENES = [
  {
    id: 'opening',
    start: 0,
    end: 8,
    eyebrow: 'Spatial Notes',
    title: 'Think in space.',
    caption: 'A quiet canvas for memory, synthesis, and AI-assisted thought.',
  },
  {
    id: 'canvas',
    start: 8,
    end: 17,
    eyebrow: 'Canvas',
    title: 'Ideas hold their shape.',
    caption: 'Notes, themes, images, and context remain visible together.',
  },
  {
    id: 'ai',
    start: 17,
    end: 27,
    eyebrow: 'AI Partner',
    title: 'Ask without leaving the room.',
    caption: 'The assistant works inside the workspace, not above it.',
  },
  {
    id: 'personas',
    start: 27,
    end: 37,
    eyebrow: 'Personas',
    title: 'Different minds, same memory.',
    caption: 'Interview, synthesize, refine, and imagine from the same canvas.',
  },
  {
    id: 'research',
    start: 37,
    end: 48,
    eyebrow: 'Research',
    title: 'Long work becomes navigable.',
    caption: 'Research and long-form writing stay linked to their source material.',
  },
  {
    id: 'privacy',
    start: 48,
    end: 55,
    eyebrow: 'Local-first',
    title: 'Private by default.',
    caption: 'Your workspace starts in your browser.',
  },
  {
    id: 'closing',
    start: 55,
    end: 60,
    eyebrow: 'Spatial Notes',
    title: 'Build your spatial memory.',
    caption: 'scribe-ai-canvas.netlify.app',
  },
];

function activeSegmentAt(segments, sec) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  return (
    segments.find((seg) => sec >= Number(seg.startSec) && sec < Number(seg.endSec)) ||
    segments[segments.length - 1]
  );
}

function clampProgress(value) {
  return Math.max(0, Math.min(1, value));
}

function sceneProgress(scene, sec) {
  return clampProgress((sec - scene.start) / (scene.end - scene.start));
}

function scenePresence(scene, sec) {
  const fade = 1.2;
  return Math.min(
    interpolate(sec, [scene.start, scene.start + fade], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    interpolate(sec, [scene.end - fade, scene.end], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
}

function currentScene(sec) {
  return SCENES.find((scene) => sec >= scene.start && sec < scene.end) || SCENES[SCENES.length - 1];
}

function useSoftScene(scene) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  const presence = scenePresence(scene, sec);
  const progress = sceneProgress(scene, sec);
  const lift = interpolate(presence, [0, 1], [22, 0], { extrapolateRight: 'clamp' });
  const softSpring = spring({
    frame: frame - scene.start * fps,
    fps,
    config: { damping: 24, mass: 0.7, stiffness: 70 },
  });

  return { presence, progress, lift, softSpring };
}

function SceneCopy({ scene, align = 'left' }) {
  const { presence, lift } = useSoftScene(scene);

  return (
    <div
      className="flex flex-col"
      style={{
        opacity: presence,
        transform: `translateY(${lift}px)`,
        textAlign: align,
        maxWidth: align === 'center' ? 960 : 780,
      }}
    >
      <div
        className="uppercase tracking-[0.24em]"
        style={{
          fontFamily: FONT_SANS,
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: ACCENT,
          marginBottom: 28,
        }}
      >
        {scene.eyebrow}
      </div>
      <div
        style={{
          fontSize: align === 'center' ? 92 : 82,
          lineHeight: 0.98,
          letterSpacing: '-0.055em',
          color: INK,
          fontWeight: 500,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: FONT_SANS,
          fontSize: 24,
          lineHeight: 1.5,
          color: MUTED,
          maxWidth: align === 'center' ? 760 : 650,
          alignSelf: align === 'center' ? 'center' : 'flex-start',
        }}
      >
        {scene.caption}
      </div>
    </div>
  );
}

function FloatingCard({ children, style, delay = 0, emphasis = false }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame: frame - delay * fps,
    fps,
    config: { damping: 26, mass: 0.65, stiffness: 62 },
  });

  return (
    <div
      className="rounded-3xl border bg-white/80 shadow-2xl"
      style={{
        position: 'absolute',
        borderRadius: 28,
        border: `1px solid ${emphasis ? 'rgba(194, 65, 12, 0.3)' : 'rgba(232, 224, 215, 0.92)'}`,
        background: emphasis ? 'rgba(255, 251, 247, 0.92)' : 'rgba(255, 255, 255, 0.82)',
        boxShadow: emphasis
          ? '0 34px 90px rgba(121, 75, 48, 0.16), 0 0 0 1px rgba(194, 65, 12, 0.08)'
          : '0 30px 90px rgba(31, 27, 24, 0.1)',
        backdropFilter: 'blur(18px)',
        opacity: interpolate(entrance, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(entrance, [0, 1], [18, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function AppFrame({ sec }) {
  const frame = useCurrentFrame();
  const scene = currentScene(sec);
  const sceneIndex = SCENES.findIndex((item) => item.id === scene.id);
  const drift = interpolate(sec, [0, 60], [0, -44], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zoom = interpolate(sec, [0, 60], [0.985, 1.035], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = interpolate(Math.sin(frame / 42), [-1, 1], [0.16, 0.32]);
  const activeAgent = Math.floor(interpolate(sec, [27, 37], [0, 4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const researchReveal = interpolate(sec, [37, 39.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const longFormReveal = interpolate(sec, [42, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      className="relative overflow-hidden"
      style={{
        position: 'relative',
        width: 1180,
        height: 720,
        borderRadius: 38,
        overflow: 'hidden',
        background: '#FBFAF7',
        border: '1px solid rgba(232, 224, 215, 0.9)',
        boxShadow: '0 48px 120px rgba(65, 48, 37, 0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
        transform: `translateX(${drift}px) scale(${zoom})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(31,27,24,0.12) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          opacity: 0.36,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 68,
          display: 'flex',
          alignItems: 'center',
          padding: '0 26px',
          borderBottom: `1px solid ${LINE}`,
          background: 'rgba(250, 248, 243, 0.78)',
          backdropFilter: 'blur(14px)',
          fontFamily: FONT_SANS,
        }}
      >
        <div style={{ display: 'flex', gap: 9 }}>
          {['#E8AAA0', '#E9D2A1', '#BFD8B8'].map((color) => (
            <span key={color} style={{ width: 12, height: 12, borderRadius: 999, background: color }} />
          ))}
        </div>
        <div style={{ marginLeft: 24, fontSize: 14, color: MUTED }}>Spatial Notes / Memory Architecture</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 12, color: MUTED }}>
          {['Canvas', 'Research', 'Long-form'].map((label, index) => (
            <span
              key={label}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                background: sceneIndex === index + 1 ? 'rgba(194, 65, 12, 0.08)' : 'transparent',
                color: sceneIndex === index + 1 ? ACCENT : MUTED,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <svg width="1180" height="720" style={{ position: 'absolute', inset: 0 }}>
        <path d="M410 256 C515 178 635 184 740 266" fill="none" stroke={ACCENT} strokeWidth="2" opacity={sceneIndex >= 1 ? 0.28 : 0.08} />
        <path d="M520 410 C645 355 750 360 878 438" fill="none" stroke={ACCENT} strokeWidth="2" opacity={sceneIndex >= 2 ? 0.25 : 0.08} />
        <path d="M358 430 C500 540 720 540 890 450" fill="none" stroke={ACCENT} strokeWidth="2" opacity={sceneIndex >= 3 ? 0.2 : 0.06} />
      </svg>

      <FloatingCard delay={0.2} emphasis={sceneIndex === 1} style={{ left: 340, top: 172, width: 310, padding: 26 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, letterSpacing: '0.18em', color: ACCENT, textTransform: 'uppercase' }}>
          Theme
        </div>
        <div style={{ marginTop: 18, fontSize: 31, lineHeight: 1.08, letterSpacing: '-0.04em', color: INK }}>
          Spatial memory
        </div>
        <div style={{ marginTop: 16, fontFamily: FONT_SANS, fontSize: 14, lineHeight: 1.65, color: MUTED }}>
          Structure becomes a way to remember.
        </div>
      </FloatingCard>

      <FloatingCard delay={0.55} style={{ left: 700, top: 204, width: 260, padding: 22 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: ACCENT }}>Observation</div>
        <div style={{ marginTop: 14, fontSize: 19, lineHeight: 1.45, color: INK }}>
          Memory is not storage. It is navigation.
        </div>
      </FloatingCard>

      <FloatingCard delay={0.8} style={{ left: 250, top: 410, width: 270, padding: 22 }}>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: MUTED }}>Source note</div>
        <div style={{ marginTop: 13, fontFamily: FONT_SANS, fontSize: 15, lineHeight: 1.55, color: INK }}>
          The layout preserves context that a chat thread usually discards.
        </div>
      </FloatingCard>

      <FloatingCard
        delay={1.1}
        emphasis={scene.id === 'ai'}
        style={{
          right: 82,
          bottom: 86,
          width: 430,
          padding: 24,
          opacity: sceneIndex >= 2 ? 1 : 0.32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT_SANS }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: `rgba(194,65,12,${pulse})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: ACCENT,
              fontWeight: 700,
            }}
          >
            AI
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>Thinking with the canvas</div>
        </div>
        <div style={{ marginTop: 18, fontSize: 20, lineHeight: 1.45, color: INK }}>
          These notes share a spatial pattern: anchor, orbit, evidence.
        </div>
      </FloatingCard>

      <div
        style={{
          position: 'absolute',
          left: 118,
          bottom: 84,
          display: 'flex',
          gap: 12,
          opacity: interpolate(sec, [27, 29], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        {['Interview', 'Synthesize', 'Refine', 'Imagine'].map((label, index) => (
          <div
            key={label}
            style={{
              width: 118,
              padding: '14px 12px',
              borderRadius: 18,
              border: `1px solid ${activeAgent === index ? 'rgba(194,65,12,0.34)' : LINE}`,
              background: activeAgent === index ? 'rgba(255, 247, 237, 0.9)' : 'rgba(255,255,255,0.72)',
              boxShadow: activeAgent === index ? '0 18px 42px rgba(194,65,12,0.12)' : '0 14px 34px rgba(31,27,24,0.06)',
              fontFamily: FONT_SANS,
              fontSize: 13,
              color: activeAgent === index ? ACCENT : MUTED,
              textAlign: 'center',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: '98px 74px 66px 74px',
          borderRadius: 34,
          background: 'rgba(255,255,255,0.9)',
          border: `1px solid ${LINE}`,
          boxShadow: '0 34px 90px rgba(31,27,24,0.12)',
          opacity: researchReveal,
          transform: `translateY(${interpolate(researchReveal, [0, 1], [18, 0])}px)`,
          display: 'grid',
          gridTemplateColumns: '330px 1fr',
          overflow: 'hidden',
          fontFamily: FONT_SANS,
        }}
      >
        <div style={{ borderRight: `1px solid ${LINE}`, padding: 30, background: '#FBFAF7' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT }}>Research</div>
          {['Question', 'Evidence', 'Synthesis'].map((label, index) => (
            <div
              key={label}
              style={{
                marginTop: 20,
                padding: 18,
                borderRadius: 18,
                background: index === 1 ? 'rgba(194,65,12,0.08)' : '#fff',
                border: `1px solid ${index === 1 ? 'rgba(194,65,12,0.26)' : LINE}`,
                color: index === 1 ? ACCENT : MUTED,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div style={{ padding: 38 }}>
          <div style={{ fontSize: 36, lineHeight: 1.12, letterSpacing: '-0.04em', fontFamily: FONT_SERIF, color: INK }}>
            A report that remembers where it came from.
          </div>
          <div style={{ marginTop: 28, width: '82%', height: 12, borderRadius: 999, background: '#ECE6DF' }} />
          <div style={{ marginTop: 16, width: '68%', height: 12, borderRadius: 999, background: '#ECE6DF' }} />
          <div style={{ marginTop: 34, opacity: longFormReveal }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '12px 18px',
                borderRadius: 999,
                background: 'rgba(194,65,12,0.08)',
                color: ACCENT,
                border: '1px solid rgba(194,65,12,0.22)',
              }}
            >
              Linked to source canvas
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 34,
          top: 92,
          padding: '12px 16px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.78)',
          border: `1px solid ${LINE}`,
          fontFamily: FONT_SANS,
          fontSize: 13,
          color: MUTED,
          opacity: interpolate(sec, [48, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Local-first. Private by default.
      </div>
    </div>
  );
}

function Timeline({ sec }) {
  const active = currentScene(sec);

  return (
    <div
      className="flex items-center"
      style={{
        position: 'absolute',
        left: 92,
        right: 92,
        bottom: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: FONT_SANS,
        color: MUTED,
      }}
    >
      {SCENES.map((scene) => {
        const progress = sceneProgress(scene, sec);
        const isActive = scene.id === active.id;

        return (
          <div key={scene.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: isActive ? 1.6 : 1 }}>
            <div
              style={{
                position: 'relative',
                flex: 1,
                height: 2,
                borderRadius: 999,
                background: 'rgba(116,109,102,0.18)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${isActive ? progress * 100 : sec > scene.end ? 100 : 0}%`,
                  height: '100%',
                  background: isActive || sec > scene.end ? ACCENT : 'transparent',
                }}
              />
            </div>
            {isActive ? (
              <span style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT }}>
                {scene.eyebrow}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export const SpatialNotesPromo = ({
  title = 'Spatial Notes',
  subtitle = 'Spatial Thinking & Knowledge Synthesis',
  brandLabel = 'SPATIAL NOTES',
  ctaUrl = 'scribe-ai-canvas.netlify.app',
  ctaText = 'Try the web app',
  audioUrl = '',
  timestampSegments = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  const active = activeSegmentAt(timestampSegments, sec);
  const activeCopy = currentScene(sec);
  const opening = SCENES[0];
  const closing = SCENES[SCENES.length - 1];
  const titlePresence = scenePresence(opening, sec);
  const closingPresence = scenePresence(closing, sec);
  const productPresence = interpolate(sec, [5.5, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitlePresence = interpolate(frame, [24, 54], [0, 1], { extrapolateRight: 'clamp' });
  const cameraY = interpolate(sec, [0, 60], [0, -18], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 58% at 50% 24%, rgba(255,247,237,0.9) 0%, rgba(250,248,243,0.96) 44%, #EFE7DD 100%)',
        fontFamily: FONT_SERIF,
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
            'linear-gradient(115deg, rgba(255,255,255,0.7), transparent 34%), radial-gradient(circle at 12% 18%, rgba(194,65,12,0.1), transparent 24%)',
          opacity: 0.9,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${cameraY}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 104,
            top: 104,
            width: 570,
            height: 570,
            borderRadius: '50%',
            border: '1px solid rgba(194,65,12,0.12)',
            opacity: 0.62,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 122,
            top: 122,
            right: 122,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: FONT_SANS,
            fontSize: 14,
            color: MUTED,
          }}
        >
          <div style={{ letterSpacing: '0.18em', textTransform: 'uppercase', color: ACCENT, fontWeight: 600 }}>
            {brandLabel}
          </div>
          <div style={{ opacity: 0.78 }}>{subtitle}</div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 122,
            top: 226,
            width: 780,
            opacity: titlePresence,
            transform: `translateY(${interpolate(titlePresence, [0, 1], [24, 0])}px)`,
          }}
        >
          <SceneCopy scene={{ ...opening, title, caption: opening.caption }} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 120,
            top: 238,
            opacity: productPresence * (1 - closingPresence),
          }}
        >
          <SceneCopy scene={activeCopy} />
        </div>

        <div
          style={{
            position: 'absolute',
            right: 110,
            top: 206,
            opacity: productPresence * (1 - closingPresence * 0.86),
          }}
        >
          <AppFrame sec={sec} />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            opacity: closingPresence,
            pointerEvents: 'none',
          }}
        >
          <div>
            <SceneCopy scene={{ ...closing, title: 'Build your spatial memory.', caption: ctaUrl }} align="center" />
            <div
              style={{
                marginTop: 44,
                display: 'inline-flex',
                padding: '15px 26px',
                borderRadius: 999,
                background: ACCENT,
                color: '#fff',
                fontFamily: FONT_SANS,
                fontSize: 17,
                letterSpacing: '0.04em',
                boxShadow: '0 22px 54px rgba(194,65,12,0.22)',
              }}
            >
              {ctaText}
            </div>
          </div>
        </div>

        <Timeline sec={sec} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 122,
          right: 122,
          bottom: 96,
          opacity: subtitlePresence * (1 - closingPresence),
          fontFamily: FONT_SANS,
          fontSize: 16,
          lineHeight: 1.55,
          color: 'rgba(31,27,24,0.56)',
          maxWidth: 820,
        }}
      >
        <span>{active?.en || 'Spatial Notes product intro.'}</span>
        <span style={{ marginLeft: 18, color: 'rgba(31,27,24,0.38)' }}>
          {active?.zh || '产品介绍双语字幕。'}
        </span>
      </div>
    </AbsoluteFill>
  );
};
