import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from "remotion";
import { Captions, type CaptionChunk } from "../Caption";
import { Glow } from "../Glow";
import { toRadians } from "../geometry";
import { COLORS, FONT_FAMILY } from "../theme";

const CHUNKS: readonly CaptionChunk[] = [
  {
    text: "Saat senja, Matahari rendah di dekat cakrawala.",
    from: 18,
    to: 104,
  },
  {
    text: "Cahayanya menempuh jalur yang lebih panjang di atmosfer.",
    from: 110,
    to: 194,
  },
  {
    text: "Biru sudah tersebar habis, tersisa jingga dan merah.",
    from: 200,
    to: 284,
  },
];

// Side view of the Earth (a huge circle whose top edge is the ground) wrapped in
// a thicker-than-real atmosphere so the light's path through it is easy to see.
const EARTH = { x: 960, y: 1840, r: 1200 };
const ATMOSPHERE_R = 1350;
const EYE = { x: 960, y: 598 };
const SUN_DISTANCE = 600;

// How far a ray arriving at the eye from direction (dx, dy), a unit vector
// pointing towards the Sun, travels inside the atmosphere.
const pathInAtmosphere = (dx: number, dy: number): number => {
  const ox = EYE.x - EARTH.x;
  const oy = EYE.y - EARTH.y;
  const b = ox * dx + oy * dy;
  const c = ox * ox + oy * oy - ATMOSPHERE_R * ATMOSPHERE_R;
  return -b + Math.sqrt(b * b - c);
};

const ArrowHead: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly ux: number;
  readonly uy: number;
}> = ({ x, y, ux, uy }) => {
  // (ux, uy) is the unit direction the arrow points in.
  const back = { x: x - ux * 30, y: y - uy * 30 };
  const nx = -uy;
  const ny = ux;
  return (
    <polygon
      points={`${x},${y} ${back.x + nx * 15},${back.y + ny * 15} ${back.x - nx * 15},${back.y - ny * 15}`}
      fill={COLORS.ink}
    />
  );
};

export const SunsetScene: React.FC = () => {
  const frame = useCurrentFrame();

  // The Sun sinks from high in the sky to the horizon.
  const elevation = interpolate(frame, [20, 230], [62, 3], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const progress = (62 - elevation) / 59;

  const angle = toRadians(elevation);
  const dir = { x: -Math.cos(angle), y: -Math.sin(angle) };
  // Unit vector at right angles to the ray, pointing up away from the ground.
  const up = { x: Math.sin(angle), y: -Math.cos(angle) };

  const length = pathInAtmosphere(dir.x, dir.y);
  const entry = { x: EYE.x + dir.x * length, y: EYE.y + dir.y * length };
  const sun = {
    x: EYE.x + dir.x * SUN_DISTANCE,
    y: EYE.y + dir.y * SUN_DISTANCE,
  };

  const rayColor = interpolateColors(
    Math.min(470, Math.max(120, length)),
    [120, 300, 470],
    ["#FFF3C4", "#FFB347", "#FF5A36"],
  );
  const skyTop = interpolateColors(
    progress,
    [0, 0.55, 1],
    ["#3AA6FF", "#7A6FD0", "#2A2E75"],
  );
  const skyBottom = interpolateColors(
    progress,
    [0, 0.55, 1],
    ["#CDEAFF", "#FFB27A", "#FF7E5F"],
  );

  const noteOpacity = interpolate(frame, [122, 138], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const arrowFrom = {
    x: entry.x + up.x * 60,
    y: entry.y + up.y * 60,
  };
  const arrowTo = { x: EYE.x + up.x * 60, y: EYE.y + up.y * 60 };
  const arrowDir = { x: -dir.x, y: -dir.y };
  const noteCenter = {
    x: (arrowFrom.x + arrowTo.x) / 2 + up.x * 120,
    y: (arrowFrom.y + arrowTo.y) / 2 + up.y * 120,
  };

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 62%)`,
      }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient
            id="sunset-ray-inside"
            gradientUnits="userSpaceOnUse"
            x1={entry.x}
            y1={entry.y}
            x2={EYE.x}
            y2={EYE.y}
          >
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor={rayColor} />
          </linearGradient>
        </defs>

        {/* The atmosphere */}
        <circle
          cx={EARTH.x}
          cy={EARTH.y}
          r={ATMOSPHERE_R}
          fill="rgba(255, 255, 255, 0.2)"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth={4}
        />

        {/* Blue light drifting out of the beam as it crosses the atmosphere */}
        {Array.from({ length: 12 }, (_, i) => {
          const phase = ((frame + i * 7) % 54) / 54;
          const along = (i + 0.5) / 12;
          const side = i % 2 === 0 ? 1 : -1;
          return (
            <circle
              key={i}
              cx={
                entry.x + (EYE.x - entry.x) * along + up.x * phase * 90 * side
              }
              cy={
                entry.y + (EYE.y - entry.y) * along + up.y * phase * 90 * side
              }
              r={8}
              fill="#3FA0FF"
              opacity={(1 - phase) * 0.9}
            />
          );
        })}

        {/* Sunlight: white in space, then changing colour inside the atmosphere */}
        <line
          x1={sun.x}
          y1={sun.y}
          x2={entry.x}
          y2={entry.y}
          stroke="#FFF6D0"
          strokeWidth={12}
          strokeLinecap="round"
          opacity={0.9}
        />
        <line
          x1={entry.x}
          y1={entry.y}
          x2={EYE.x}
          y2={EYE.y}
          stroke="url(#sunset-ray-inside)"
          strokeWidth={16}
          strokeLinecap="round"
        />

        {/* Sun */}
        <Glow id="sunset-sun-glow" cx={sun.x} cy={sun.y} r={170} />
        <circle cx={sun.x} cy={sun.y} r={58} fill={COLORS.sun} />
        <circle cx={sun.x} cy={sun.y} r={44} fill={COLORS.sunSoft} />

        {/* The Earth's surface and a person watching */}
        <circle
          cx={EARTH.x}
          cy={EARTH.y}
          r={EARTH.r}
          fill="#2E7D57"
          stroke="#58B27F"
          strokeWidth={6}
        />
        <rect x={936} y={628} width={48} height={32} rx={14} fill="#FF7A59" />
        <circle cx={960} cy={606} r={26} fill="#FFD1A6" />
        <path
          d="M934 602 A26 26 0 0 1 986 602 Q960 580 934 602 Z"
          fill="#3A2A20"
        />

        {/* Label for the atmosphere */}
        <line
          x1={1560}
          y1={532}
          x2={1560}
          y2={628}
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <rect x={1440} y={452} width={240} height={80} rx={40} fill="white" />
        <text
          x={1560}
          y={508}
          textAnchor="middle"
          fontFamily={FONT_FAMILY}
          fontSize={48}
          fontWeight={800}
          fill={COLORS.ink}
        >
          Atmosfer
        </text>

        {/* The long path, measured */}
        <g opacity={noteOpacity}>
          <line
            x1={arrowFrom.x}
            y1={arrowFrom.y}
            x2={arrowTo.x}
            y2={arrowTo.y}
            stroke={COLORS.ink}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <ArrowHead
            x={arrowTo.x}
            y={arrowTo.y}
            ux={arrowDir.x}
            uy={arrowDir.y}
          />
          <ArrowHead
            x={arrowFrom.x}
            y={arrowFrom.y}
            ux={-arrowDir.x}
            uy={-arrowDir.y}
          />
          <rect
            x={noteCenter.x - 300}
            y={noteCenter.y - 40}
            width={600}
            height={80}
            rx={40}
            fill="white"
          />
          <text
            x={noteCenter.x}
            y={noteCenter.y + 17}
            textAnchor="middle"
            fontFamily={FONT_FAMILY}
            fontSize={48}
            fontWeight={800}
            fill={COLORS.ink}
          >
            jalur di atmosfer
          </text>
        </g>
      </svg>
      <Captions chunks={CHUNKS} />
    </AbsoluteFill>
  );
};
