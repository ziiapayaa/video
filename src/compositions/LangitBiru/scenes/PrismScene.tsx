import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Glow } from "../Glow";
import { polar } from "../geometry";
import { Narration, cue } from "../Narration";
import { COLORS, FONT_FAMILY, SPECTRUM } from "../theme";
import { TIMELINE } from "../timeline.generated";

const SUN = { x: 200, y: 400 };
const PRISM_POINTS = "810,530 960,270 1110,530";
// The beam meets the middle of the prism's left face and leaves the right one.
const ENTRY_X = 885;
const EXIT = { x: 1035, y: 400 };
// Degrees below horizontal for each colour. Red bends least, violet most.
const SPREAD_ANGLES = [7, 10.5, 14, 17.5, 21, 24.5, 28];
const OFFSET_Y = 40;
const RAINBOW = { x: 560, y: 880, width: 800, height: 56 };

export const PrismScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { lines } = TIMELINE.prism;
  const [white, split, mix] = lines;

  // "...tampak berwarna putih": the white beam reaches the prism as it is said.
  const beamArrives = cue(white, 0.9);
  // "...terpecah menjadi banyak warna": the beam splits on the word "terpecah".
  const splitStarts = cue(split, 0.62);
  // "...semua warna pelangi": a rainbow bar sweeps in.
  const rainbowStarts = cue(mix, 0.45);

  const prismOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const whiteBeamEnd = interpolate(frame, [14, beamArrives], [270, ENTRY_X], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const innerBeamEnd = interpolate(
    frame,
    [beamArrives, beamArrives + 16],
    [ENTRY_X, EXIT.x],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const rainbowReveal = interpolate(
    frame,
    [rainbowStarts, rainbowStarts + 36],
    [0, RAINBOW.width],
    {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0E2A4D 0%, #17406F 100%)",
      }}
    >
      <Narration lines={lines} />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <clipPath id="prism-rainbow-shape">
            <rect
              x={RAINBOW.x}
              y={RAINBOW.y}
              width={RAINBOW.width}
              height={RAINBOW.height}
              rx={RAINBOW.height / 2}
            />
          </clipPath>
          <clipPath id="prism-rainbow-reveal">
            <rect
              x={RAINBOW.x}
              y={RAINBOW.y}
              width={rainbowReveal}
              height={RAINBOW.height}
            />
          </clipPath>
        </defs>

        <g transform={`translate(0 ${OFFSET_Y})`}>
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
            const start = splitStarts + i * 5;
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
        </g>

        {/* "...campuran dari semua warna pelangi": the same seven colours side by side */}
        <g clipPath="url(#prism-rainbow-shape)">
          <g clipPath="url(#prism-rainbow-reveal)">
            {SPECTRUM.map((band, i) => (
              <rect
                key={band.name}
                x={RAINBOW.x + (i * RAINBOW.width) / SPECTRUM.length}
                y={RAINBOW.y}
                width={RAINBOW.width / SPECTRUM.length + 1}
                height={RAINBOW.height}
                fill={band.color}
              />
            ))}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
