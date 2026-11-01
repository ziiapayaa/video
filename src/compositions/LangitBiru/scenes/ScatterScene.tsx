import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from "remotion";
import { Captions, type CaptionChunk } from "../Caption";
import { Glow } from "../Glow";
import { polar } from "../geometry";
import { COLORS, FONT_FAMILY } from "../theme";

const CHUNKS: readonly CaptionChunk[] = [
  { text: "Atmosfer penuh molekul gas yang sangat kecil.", from: 18, to: 94 },
  { text: "Cahaya biru mudah dihamburkan ke segala arah,", from: 100, to: 184 },
  { text: "sedangkan cahaya merah lewat hampir lurus.", from: 190, to: 284 },
];

const LANE_BLUE_1 = 330;
const LANE_BLUE_2 = 470;
const LANE_RED = 610;
const START_X = 140;
const HIT_1 = { x: 780, y: LANE_BLUE_1 };
const HIT_2 = { x: 1180, y: LANE_BLUE_2 };

// Direction (degrees) and reach (px) of the blue light a molecule scatters.
const BURST = [
  { angle: 10, distance: 200 },
  { angle: 46, distance: 160 },
  { angle: 82, distance: 220 },
  { angle: 118, distance: 170 },
  { angle: 154, distance: 230 },
  { angle: 190, distance: 180 },
  { angle: 226, distance: 210 },
  { angle: 262, distance: 160 },
  { angle: 298, distance: 225 },
  { angle: 334, distance: 175 },
] as const;

type Molecule = {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly index: number;
};

// Deterministic scatter of gas molecules that keeps clear of the three light lanes.
const MOLECULES: readonly Molecule[] = (() => {
  const result: Molecule[] = [];
  for (let i = 0; result.length < 30 && i < 400; i++) {
    const x = 200 + random(`molecule-x-${i}`) * 1520;
    const y = 255 + random(`molecule-y-${i}`) * 430;
    const nearLane = [LANE_BLUE_1, LANE_BLUE_2, LANE_RED].some(
      (lane) => Math.abs(y - lane) < 36,
    );
    if (!nearLane) {
      result.push({
        x,
        y,
        r: 9 + random(`molecule-r-${i}`) * 8,
        index: result.length,
      });
    }
  }
  return result;
})();

const Photon: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly color: string;
}> = ({ x, y, color }) => (
  <g>
    {[4, 3, 2, 1].map((k) => (
      <circle
        key={k}
        cx={x - k * 16}
        cy={y}
        r={17 - k * 3}
        fill={color}
        opacity={0.5 - k * 0.1}
      />
    ))}
    <circle cx={x} cy={y} r={17} fill={color} />
  </g>
);

// A blue photon flies in, hits a molecule and is thrown out in every direction.
const BlueLane: React.FC<{
  readonly hit: { readonly x: number; readonly y: number };
  readonly start: number;
  readonly speed: number;
  readonly period: number;
}> = ({ hit, start, speed, period }) => {
  const frame = useCurrentFrame();
  if (frame < start) {
    return null;
  }

  const t = (frame - start) % period;
  const travelFrames = (hit.x - START_X) / speed;
  if (t < travelFrames) {
    return <Photon x={START_X + t * speed} y={hit.y} color={COLORS.blue} />;
  }

  const progress = interpolate(t, [travelFrames, travelFrames + 42], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <g>
      <circle
        cx={hit.x}
        cy={hit.y}
        r={26 + progress * 56}
        fill="none"
        stroke={COLORS.blue}
        strokeWidth={8}
        opacity={(1 - progress) * 0.8}
      />
      {BURST.map((spark) => {
        // Each spark is a short streak: its head flies out from the molecule and
        // its tail follows, so the direction of the scattered light is easy to read.
        const reach = polar(hit.x, hit.y, spark.distance, spark.angle);
        const tail = Math.max(0, progress - 0.3);
        const headX = hit.x + (reach.x - hit.x) * progress;
        const headY = hit.y + (reach.y - hit.y) * progress;
        return (
          <g
            key={spark.angle}
            opacity={1 - Math.max(0, (progress - 0.6) / 0.4)}
          >
            <line
              x1={hit.x + (reach.x - hit.x) * tail}
              y1={hit.y + (reach.y - hit.y) * tail}
              x2={headX}
              y2={headY}
              stroke={COLORS.blue}
              strokeWidth={12}
              strokeLinecap="round"
              opacity={0.55}
            />
            <circle cx={headX} cy={headY} r={14} fill={COLORS.blue} />
          </g>
        );
      })}
    </g>
  );
};

// A red photon passes between the molecules almost untouched.
const RedLane: React.FC<{
  readonly start: number;
  readonly speed: number;
  readonly period: number;
}> = ({ start, speed, period }) => {
  const frame = useCurrentFrame();
  if (frame < start) {
    return null;
  }

  const x = START_X + ((frame - start) % period) * speed;
  if (x > 1820) {
    return null;
  }
  return <Photon x={x} y={LANE_RED} color={COLORS.red} />;
};

export const ScatterScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #EAF6FF 0%, #CBE6FF 100%)",
      }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Sun on the left */}
        <Glow id="scatter-sun-glow" cx={70} cy={470} r={160} />
        <circle cx={70} cy={470} r={46} fill={COLORS.sun} />

        {/* The atmosphere */}
        <rect
          x={140}
          y={130}
          width={1640}
          height={590}
          rx={44}
          fill="rgba(120, 190, 255, 0.28)"
          stroke="#7CC4FF"
          strokeWidth={5}
          strokeDasharray="18 12"
        />
        <text
          x={190}
          y={206}
          fontFamily={FONT_FAMILY}
          fontSize={60}
          fontWeight={900}
          fill="#2F6EA8"
        >
          Atmosfer
        </text>

        {/* Legend */}
        <circle cx={1340} cy={186} r={17} fill={COLORS.blue} />
        <text
          x={1370}
          y={206}
          fontFamily={FONT_FAMILY}
          fontSize={54}
          fontWeight={800}
          fill={COLORS.ink}
        >
          Biru
        </text>
        <circle cx={1540} cy={186} r={17} fill={COLORS.red} />
        <text
          x={1570}
          y={206}
          fontFamily={FONT_FAMILY}
          fontSize={54}
          fontWeight={800}
          fill={COLORS.ink}
        >
          Merah
        </text>

        {/* Faint guide for each light path */}
        {[LANE_BLUE_1, LANE_BLUE_2, LANE_RED].map((y) => (
          <line
            key={y}
            x1={START_X}
            y1={y}
            x2={1780}
            y2={y}
            stroke="rgba(22, 50, 79, 0.14)"
            strokeWidth={4}
            strokeDasharray="4 14"
            strokeLinecap="round"
          />
        ))}

        {/* Gas molecules */}
        {MOLECULES.map((molecule) => {
          const appear = 16 + (molecule.index % 10) * 3;
          return (
            <circle
              key={molecule.index}
              cx={molecule.x}
              cy={molecule.y + Math.sin(frame / 20 + molecule.index) * 4}
              r={molecule.r}
              fill="#7F96B8"
              opacity={interpolate(frame, [appear, appear + 14], [0, 0.9], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            />
          );
        })}
        {[HIT_1, HIT_2].map((hit) => (
          <circle
            key={hit.x}
            cx={hit.x}
            cy={hit.y}
            r={21}
            fill="#6C86AE"
            opacity={interpolate(frame, [30, 44], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
        ))}

        <BlueLane hit={HIT_1} start={96} speed={11} period={120} />
        <BlueLane hit={HIT_2} start={120} speed={14} period={130} />
        <RedLane start={190} speed={22} period={110} />
      </svg>
      <Captions chunks={CHUNKS} />
    </AbsoluteFill>
  );
};
