import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  random,
  useCurrentFrame,
} from "remotion";
import { Captions, type CaptionChunk } from "../Caption";
import { toRadians } from "../geometry";
import { COLORS } from "../theme";

const CHUNKS: readonly CaptionChunk[] = [
  {
    text: "Biru yang tersebar itu sampai ke mata kita dari segala arah.",
    from: 18,
    to: 108,
  },
  { text: "Karena itu seluruh langit tampak biru.", from: 114, to: 194 },
];

const EYE = { x: 972, y: 572 };

// Points of scattered blue light spread over the whole sky.
const SOURCES = Array.from({ length: 18 }, (_, i) => {
  const angle = 190 + (i * 160) / 17;
  const scale = 0.72 + (i % 3) * 0.14;
  const jitter = (random(`source-${i}`) - 0.5) * 50;
  return {
    x: EYE.x + 760 * scale * Math.cos(toRadians(angle)) + jitter,
    y: EYE.y + 470 * scale * Math.sin(toRadians(angle)) + jitter,
  };
});

const DUST = Array.from({ length: 40 }, (_, i) => ({
  x: 70 + random(`dust-x-${i}`) * 1780,
  y: 50 + random(`dust-y-${i}`) * 470,
  r: 3 + random(`dust-r-${i}`) * 6,
  base: 0.3 + random(`dust-o-${i}`) * 0.4,
}));

export const EyeScene: React.FC = () => {
  const frame = useCurrentFrame();

  const skyTop = interpolateColors(frame, [0, 150], ["#CFE9FF", "#2E9BFF"]);
  const skyBottom = interpolateColors(frame, [0, 150], ["#EAF6FF", "#9AD2FF"]);
  const dustGrowth = interpolate(frame, [90, 170], [0.25, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 70%)`,
      }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Scattered blue light filling the sky */}
        {DUST.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={COLORS.blue}
            opacity={Math.min(
              1,
              (dot.base + Math.sin(frame / 9 + i * 1.7) * 0.15) * dustGrowth,
            )}
          />
        ))}

        {/* Light travelling from every direction to the eye */}
        {SOURCES.map((source, i) => {
          const dx = EYE.x - source.x;
          const dy = EYE.y - source.y;
          const length = Math.hypot(dx, dy);
          const endX = EYE.x - (dx / length) * 56;
          const endY = EYE.y - (dy / length) * 56;
          const start = 22 + i * 3;
          const appear = interpolate(frame, [start, start + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <g key={i} opacity={appear}>
              <circle
                cx={source.x}
                cy={source.y}
                r={32 + Math.sin(frame / 8 + i) * 6}
                fill={COLORS.blue}
                opacity={0.25}
              />
              <circle cx={source.x} cy={source.y} r={14} fill={COLORS.blue} />
              <line
                x1={source.x}
                y1={source.y}
                x2={endX}
                y2={endY}
                stroke={COLORS.blue}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray="22 30"
                strokeDashoffset={-frame * 3}
              />
            </g>
          );
        })}

        {/* Ground */}
        <path
          d="M0 700 C 400 625, 780 640, 960 650 S 1500 640, 1920 700 L1920 1080 L0 1080 Z"
          fill={COLORS.ground}
        />
        <path
          d="M0 800 C 420 735, 900 760, 1240 790 S 1700 800, 1920 770 L1920 1080 L0 1080 Z"
          fill="#3FAE5A"
        />

        {/* Person looking up at the sky */}
        <rect x={938} y={606} width={44} height={50} rx={16} fill="#FF7A59" />
        <circle cx={960} cy={578} r={32} fill="#FFD1A6" />
        <path
          d="M928 574 A32 32 0 0 1 992 574 Q960 548 928 574 Z"
          fill="#3A2A20"
        />
        <ellipse cx={972} cy={578} rx={9} ry={11} fill="white" />
        <circle cx={974} cy={573} r={5} fill="#16324F" />
      </svg>
      <Captions chunks={CHUNKS} />
    </AbsoluteFill>
  );
};
