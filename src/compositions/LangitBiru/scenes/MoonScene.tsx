import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from "remotion";
import { Captions, type CaptionChunk } from "../Caption";
import { Glow } from "../Glow";
import { COLORS } from "../theme";

const CHUNKS: readonly CaptionChunk[] = [
  {
    text: "Di Bulan tidak ada atmosfer, jadi tidak ada hamburan.",
    from: 18,
    to: 100,
  },
  { text: "Langitnya hitam, bahkan saat siang hari.", from: 106, to: 184 },
  {
    text: "Sekarang kamu tahu kenapa langit di Bumi biru!",
    from: 190,
    to: 270,
    hold: true,
  },
];

const STARS = Array.from({ length: 110 }, (_, i) => ({
  x: random(`star-x-${i}`) * 1920,
  y: random(`star-y-${i}`) * 660,
  r: 1.5 + random(`star-r-${i}`) * 2.8,
  speed: 8 + random(`star-s-${i}`) * 10,
}));

const CRATERS = [
  { x: 190, y: 790, rx: 60, ry: 15 },
  { x: 560, y: 742, rx: 84, ry: 20 },
  { x: 1010, y: 770, rx: 112, ry: 26 },
  { x: 1490, y: 735, rx: 78, ry: 18 },
  { x: 1750, y: 776, rx: 64, ry: 15 },
];

export const MoonScene: React.FC = () => {
  const frame = useCurrentFrame();

  const earthPop = interpolate(frame, [186, 214], [0, 1], {
    easing: Easing.spring({ damping: 200 }),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #02040A 0%, #0A1128 100%)",
      }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <clipPath id="moon-scene-earth-clip">
            <circle r={84} />
          </clipPath>
        </defs>

        {/* Stars: visible in the daytime sky because there is no air to scatter light */}
        {STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="white"
            opacity={0.55 + 0.45 * Math.sin(frame / star.speed + i * 1.7)}
          />
        ))}

        {/* Sun */}
        <g transform="translate(330 240)">
          <Glow id="moon-sun-glow" cx={0} cy={0} r={330} />
          <g transform={`rotate(${frame * 0.3})`}>
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x={-8}
                y={-158}
                width={16}
                height={44}
                rx={8}
                fill={COLORS.sun}
                transform={`rotate(${i * 30})`}
              />
            ))}
          </g>
          <circle r={92} fill={COLORS.sun} />
          <circle r={72} fill={COLORS.sunSoft} />
        </g>

        {/* The Earth, small in the black sky */}
        <g transform={`translate(1560 230) scale(${earthPop})`}>
          <Glow id="moon-earth-glow" cx={0} cy={0} r={200} color="#4D9BFF" />
          <circle r={84} fill={COLORS.blue} />
          <g clipPath="url(#moon-scene-earth-clip)">
            <ellipse cx={-26} cy={-18} rx={34} ry={24} fill="#4ADE80" />
            <ellipse cx={34} cy={34} rx={26} ry={18} fill="#4ADE80" />
            <ellipse
              cx={18}
              cy={-44}
              rx={30}
              ry={8}
              fill="white"
              opacity={0.8}
            />
            <ellipse
              cx={-30}
              cy={52}
              rx={34}
              ry={7}
              fill="white"
              opacity={0.7}
            />
          </g>
        </g>

        {/* Moon surface */}
        <path
          d="M0 720 C 300 680, 640 700, 960 722 S 1560 690, 1920 716 L1920 1080 L0 1080 Z"
          fill="#C9CCD6"
        />
        <path
          d="M0 800 C 360 770, 760 790, 1100 806 S 1700 790, 1920 800 L1920 1080 L0 1080 Z"
          fill="#AEB2C0"
        />
        {CRATERS.map((crater) => (
          <ellipse
            key={crater.x}
            cx={crater.x}
            cy={crater.y}
            rx={crater.rx}
            ry={crater.ry}
            fill="#A4A8B6"
            stroke="#DADCE4"
            strokeWidth={4}
          />
        ))}
      </svg>
      <Captions chunks={CHUNKS} />
    </AbsoluteFill>
  );
};
