import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Narration, cue } from "../Narration";
import { COLORS, FONT_FAMILY } from "../theme";
import { TIMELINE } from "../timeline.generated";

const X0 = 400;
const X1 = 1820;
const AMPLITUDE = 70;
const OFFSET_Y = 90;
// How far the waves have travelled when they stop moving. The wavelength
// brackets are placed from this value so they line up with the crests.
const FINAL_PHASE = 10;

const WAVES = [
  { name: "Merah", color: COLORS.red, cy: 300, lambda: 420, note: "panjang" },
  { name: "Biru", color: COLORS.blue, cy: 600, lambda: 168, note: "pendek" },
] as const;

const wavePath = (
  cy: number,
  lambda: number,
  phase: number,
  xEnd: number,
): string => {
  let d = "";
  for (let x = X0; x <= xEnd; x += 8) {
    const y =
      cy - AMPLITUDE * Math.sin((2 * Math.PI * (x - X0)) / lambda - phase);
    d += `${d === "" ? "M" : "L"}${x} ${y.toFixed(1)} `;
  }
  return d;
};

// x of the first crest at or after `minX` for the wave drawn by wavePath().
const crestAfter = (lambda: number, phase: number, minX: number): number => {
  const base = X0 + (lambda * (Math.PI / 2 + phase)) / (2 * Math.PI);
  return base + Math.ceil((minX - base) / lambda) * lambda;
};

export const WavesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { lines } = TIMELINE.waves;
  const [, compare] = lines;

  // The waves keep moving until the comparison starts, then hold still so the
  // wavelength can be measured: red when "panjang" is said, blue for "pendek".
  const holdStill = cue(compare, 0);
  const bracketStarts = [cue(compare, 0.08), cue(compare, 0.58)];

  const reveal = interpolate(frame, [18, 70], [X0, X1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phase = interpolate(frame, [0, holdStill], [0, FINAL_PHASE], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(frame, [10, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #F4FAFF 0%, #D9EDFF 100%)",
      }}
    >
      <Narration lines={lines} />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <g transform={`translate(0 ${OFFSET_Y})`}>
          {WAVES.map((wave, i) => {
            const crest1 = crestAfter(wave.lambda, FINAL_PHASE, 600);
            const crest2 = crest1 + wave.lambda;
            const bracketY = wave.cy - AMPLITUDE - 40;
            const crestY = wave.cy - AMPLITUDE - 6;
            const bracketOpacity = interpolate(
              frame,
              [bracketStarts[i], bracketStarts[i] + 18],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <g key={wave.name}>
                <circle
                  cx={86}
                  cy={wave.cy}
                  r={22}
                  fill={wave.color}
                  opacity={labelOpacity}
                />
                <text
                  x={126}
                  y={wave.cy + 22}
                  fontFamily={FONT_FAMILY}
                  fontSize={64}
                  fontWeight={900}
                  fill={wave.color}
                  opacity={labelOpacity}
                >
                  {wave.name}
                </text>
                <path
                  d={wavePath(wave.cy, wave.lambda, phase, reveal)}
                  fill="none"
                  stroke={wave.color}
                  strokeWidth={14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Wavelength: the distance from one crest to the next */}
                <g
                  opacity={bracketOpacity}
                  stroke={COLORS.ink}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                >
                  <line x1={crest1} y1={bracketY} x2={crest2} y2={bracketY} />
                  <path
                    d={`M${crest1 + 22} ${bracketY - 14} L${crest1} ${bracketY} L${crest1 + 22} ${bracketY + 14}`}
                  />
                  <path
                    d={`M${crest2 - 22} ${bracketY - 14} L${crest2} ${bracketY} L${crest2 - 22} ${bracketY + 14}`}
                  />
                  <line x1={crest1} y1={bracketY} x2={crest1} y2={crestY} />
                  <line x1={crest2} y1={bracketY} x2={crest2} y2={crestY} />
                </g>
                <text
                  x={(crest1 + crest2) / 2}
                  y={bracketY - 26}
                  textAnchor="middle"
                  fontFamily={FONT_FAMILY}
                  fontSize={60}
                  fontWeight={900}
                  fill={COLORS.ink}
                  opacity={bracketOpacity}
                >
                  {wave.note}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
