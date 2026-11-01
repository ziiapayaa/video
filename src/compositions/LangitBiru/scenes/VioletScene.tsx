import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Captions, type CaptionChunk } from "../Caption";
import { COLORS, FONT_FAMILY } from "../theme";

const CHUNKS: readonly CaptionChunk[] = [
  {
    text: "Ungu lebih pendek lagi. Kenapa langit tidak ungu?",
    from: 18,
    to: 148,
  },
  {
    text: "Jadi biru yang paling banyak sampai ke mata kita.",
    from: 156,
    to: 224,
  },
];

const REASONS = [
  { text: "Matahari memberi sedikit ungu", start: 62 },
  { text: "Sebagian ungu diserap atmosfer", start: 102 },
  { text: "Mata kita kurang peka pada ungu", start: 142 },
] as const;

export const VioletScene: React.FC = () => {
  const frame = useCurrentFrame();

  const pop = interpolate(frame, [16, 42], [0, 1], {
    easing: Easing.spring({ damping: 200 }),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bob = Math.sin(frame / 12) * 8;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #F6F0FF 0%, #E2D5FF 100%)",
      }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* The violet question mark */}
        <g transform={`translate(330 ${400 + bob}) scale(${pop})`}>
          <circle r={190} fill={COLORS.violet} opacity={0.2} />
          <circle r={150} fill={COLORS.violet} />
          <circle r={118} fill="#B98BFF" />
          <text
            y={72}
            textAnchor="middle"
            fontFamily={FONT_FAMILY}
            fontSize={210}
            fontWeight={900}
            fill="white"
          >
            ?
          </text>
        </g>

        {/* Three reasons, one after another */}
        {REASONS.map((reason, i) => {
          const y = 190 + i * 190;
          const slide = interpolate(
            frame,
            [reason.start, reason.start + 22],
            [220, 0],
            {
              easing: Easing.spring({ damping: 200 }),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          const opacity = interpolate(
            frame,
            [reason.start, reason.start + 14],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <g
              key={reason.text}
              transform={`translate(${slide} 0)`}
              opacity={opacity}
            >
              <rect
                x={620}
                y={y}
                width={1180}
                height={140}
                rx={40}
                fill="white"
                stroke="#D2BCFF"
                strokeWidth={5}
              />
              <circle cx={704} cy={y + 70} r={46} fill={COLORS.violet} />
              <text
                x={704}
                y={y + 70 + 19}
                textAnchor="middle"
                fontFamily={FONT_FAMILY}
                fontSize={54}
                fontWeight={900}
                fill="white"
              >
                {i + 1}
              </text>
              <text
                x={780}
                y={y + 70 + 19}
                fontFamily={FONT_FAMILY}
                fontSize={60}
                fontWeight={800}
                fill={COLORS.ink}
              >
                {reason.text}
              </text>
            </g>
          );
        })}
      </svg>
      <Captions chunks={CHUNKS} />
    </AbsoluteFill>
  );
};
