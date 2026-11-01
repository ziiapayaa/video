import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Captions, type CaptionChunk } from "../Caption";
import { Glow } from "../Glow";
import { polar } from "../geometry";
import { COLORS, FONT_FAMILY, SPECTRUM } from "../theme";

const CHUNKS: readonly CaptionChunk[] = [
  { text: "Cahaya Matahari tampak putih…", from: 18, to: 116 },
  { text: "…tapi sebenarnya campuran banyak warna.", from: 122, to: 224 },
];

const SUN = { x: 200, y: 400 };
const PRISM_POINTS = "810,530 960,270 1110,530";
// The beam meets the middle of the prism's left face and leaves the right one.
const ENTRY_X = 885;
const EXIT = { x: 1035, y: 400 };
// Degrees below horizontal for each colour. Red bends least, violet most.
const SPREAD_ANGLES = [7, 10.5, 14, 17.5, 21, 24.5, 28];

export const PrismScene: React.FC = () => {
  const frame = useCurrentFrame();

  const prismOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const whiteBeamEnd = interpolate(frame, [18, 60], [270, ENTRY_X], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const innerBeamEnd = interpolate(frame, [58, 76], [ENTRY_X, EXIT.x], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0E2A4D 0%, #17406F 100%)",
      }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Sun */}
        <Glow id="prism-sun-glow" cx={SUN.x} cy={SUN.y} r={200} />
        <circle cx={SUN.x} cy={SUN.y} r={70} fill={COLORS.sun} />
        <circle cx={SUN.x} cy={SUN.y} r={52} fill={COLORS.sunSoft} />

        {/* White beam travelling to the prism */}
        <line
          x1={270}
          y1={SUN.y}
          x2={whiteBeamEnd}
          y2={SUN.y}
          stroke={COLORS.white}
          strokeWidth={46}
          strokeLinecap="round"
          opacity={0.22}
        />
        <line
          x1={270}
          y1={SUN.y}
          x2={whiteBeamEnd}
          y2={SUN.y}
          stroke={COLORS.white}
          strokeWidth={20}
          strokeLinecap="round"
        />

        {/* Prism */}
        <polygon
          points={PRISM_POINTS}
          fill="rgba(255, 255, 255, 0.14)"
          stroke="rgba(255, 255, 255, 0.92)"
          strokeWidth={6}
          strokeLinejoin="round"
          opacity={prismOpacity}
        />
        <line
          x1={ENTRY_X}
          y1={EXIT.y}
          x2={innerBeamEnd}
          y2={EXIT.y}
          stroke={COLORS.white}
          strokeWidth={16}
          strokeLinecap="round"
          opacity={0.9}
        />
        <text
          x={960}
          y={598}
          textAnchor="middle"
          fontFamily={FONT_FAMILY}
          fontSize={52}
          fontWeight={800}
          fill="rgba(255, 255, 255, 0.85)"
          opacity={prismOpacity}
        >
          Prisma
        </text>

        {/* The beam splits into seven colours, red on top */}
        {SPECTRUM.map((band, i) => {
          const start = 122 + i * 5;
          const length = interpolate(frame, [start, start + 26], [0, 690], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (length < 1) {
            return null;
          }
          const end = polar(EXIT.x, EXIT.y, length, SPREAD_ANGLES[i]);
          return (
            <line
              key={band.name}
              x1={EXIT.x}
              y1={EXIT.y}
              x2={end.x}
              y2={end.y}
              stroke={band.color}
              strokeWidth={18}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <Captions chunks={CHUNKS} />
    </AbsoluteFill>
  );
};
