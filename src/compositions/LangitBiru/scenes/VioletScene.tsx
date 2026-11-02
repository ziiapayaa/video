import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from "remotion";
import { Glow } from "../Glow";
import { Narration, cue } from "../Narration";
import { Photon } from "../Photon";
import { COLORS, FONT_FAMILY, SPECTRUM } from "../theme";
import { TIMELINE } from "../timeline.generated";

const CARD = {
  width: 500,
  height: 560,
  top: 340,
  lefts: [170, 710, 1250],
} as const;
// How strong each colour of sunlight is, red to violet. Violet is the weakest.
const BAR_HEIGHTS = [212, 230, 245, 250, 237, 200, 130] as const;

// 0 to 1 over `duration` frames from `from`.
const progress = (
  frame: number,
  from: number,
  duration: number,
  easing: (t: number) => number = Easing.linear,
): number =>
  interpolate(frame, [from, from + duration], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const sinePath = (
  x0: number,
  x1: number,
  cy: number,
  amplitude: number,
  lambda: number,
  phase: number,
): string => {
  let d = "";
  for (let x = x0; x <= x1; x += 6) {
    const y =
      cy - amplitude * Math.sin((2 * Math.PI * (x - x0)) / lambda - phase);
    d += `${d === "" ? "M" : "L"}${x} ${y.toFixed(1)} `;
  }
  return d;
};

// "Matahari memancarkan cahaya ungu yang lebih sedikit": bars of sunlight by colour.
const SunBars: React.FC<{
  readonly start: number;
  readonly emphasis: number;
}> = ({ start, emphasis }) => {
  const frame = useCurrentFrame();
  const ring =
    frame >= emphasis ? 0.55 + 0.45 * Math.sin((frame - emphasis) / 5) : 0;

  return (
    <g>
      <g transform="translate(250 100)">
        <Glow id="violet-card-sun-glow" cx={0} cy={0} r={130} />
        <g transform={`rotate(${frame * 0.5})`}>
          {Array.from({ length: 10 }, (_, i) => (
            <rect
              key={i}
              x={-5}
              y={-82}
              width={10}
              height={24}
              rx={5}
              fill={COLORS.sun}
              transform={`rotate(${i * 36})`}
            />
          ))}
        </g>
        <circle r={42} fill={COLORS.sun} />
        <circle r={32} fill={COLORS.sunSoft} />
      </g>
      {BAR_HEIGHTS.map((height, i) => {
        const grown =
          height *
          progress(frame, start + 14 + i * 4, 22, Easing.out(Easing.cubic));
        return (
          <rect
            key={SPECTRUM[i].name}
            x={48 + i * 60}
            y={500 - grown}
            width={44}
            height={grown}
            rx={10}
            fill={SPECTRUM[i].color}
          />
        );
      })}
      <rect
        x={48 + 6 * 60 - 7}
        y={500 - BAR_HEIGHTS[6] - 10}
        width={58}
        height={BAR_HEIGHTS[6] + 24}
        rx={14}
        fill="none"
        stroke="#5B2DB8"
        strokeWidth={5}
        opacity={ring}
      />
    </g>
  );
};

// "Sebagian cahaya ungu diserap oleh atmosfer": violet fades out inside the
// atmosphere while blue light passes straight through.
const Absorption: React.FC<{ readonly start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const begin = start + 26;
  const speed = 6.2;
  const cycle = frame >= begin ? (frame - begin) % 110 : 0;
  const x = -10 + cycle * speed;
  const absorbed = Math.min(1, Math.max(0, (x - 150) / 170));

  return (
    <g>
      <rect
        x={30}
        y={170}
        width={440}
        height={250}
        rx={36}
        fill="rgba(120, 190, 255, 0.28)"
        stroke="#7CC4FF"
        strokeWidth={5}
        strokeDasharray="14 10"
      />
      {frame >= begin ? (
        <>
          <Photon
            x={x}
            y={250}
            color={COLORS.violet}
            scale={1 - 0.7 * absorbed}
            opacity={1 - absorbed}
          />
          <Photon x={x - 14} y={340} color={COLORS.blue} />
        </>
      ) : null}
    </g>
  );
};

// "Mata kita kurang peka terhadap warna ungu": how sensitive an eye is to each colour.
const CURVE = "M50 482 Q170 476 232 346 Q300 220 350 340 Q400 470 450 480";
const EyeSensitivity: React.FC<{
  readonly start: number;
  readonly emphasis: number;
}> = ({ start, emphasis }) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [start + 18, start + 66], [0, 400], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mark =
    frame >= emphasis ? 0.5 + 0.5 * Math.sin((frame - emphasis) / 5) : 0;

  return (
    <g>
      <defs>
        <clipPath id="violet-curve-reveal">
          <rect x={50} y={200} width={reveal} height={300} />
        </clipPath>
        <clipPath id="violet-strip-shape">
          <rect x={50} y={500} width={400} height={34} rx={17} />
        </clipPath>
      </defs>

      {/* The eye */}
      <path
        d="M90 120 Q250 10 410 120 Q250 230 90 120 Z"
        fill="white"
        stroke={COLORS.ink}
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <circle cx={250} cy={120} r={56} fill="#4A78B5" />
      <circle cx={250} cy={120} r={26} fill={COLORS.ink} />
      <circle cx={234} cy={104} r={11} fill="white" />

      {/* Sensitivity across the colours, violet on the left, red on the right */}
      <g clipPath="url(#violet-strip-shape)">
        {[...SPECTRUM].reverse().map((band, i) => (
          <rect
            key={band.name}
            x={50 + (i * 400) / SPECTRUM.length}
            y={500}
            width={400 / SPECTRUM.length + 1}
            height={34}
            fill={band.color}
          />
        ))}
      </g>
      <g clipPath="url(#violet-curve-reveal)">
        <path
          d={`${CURVE} L450 500 L50 500 Z`}
          fill="rgba(166, 107, 255, 0.18)"
        />
        <path
          d={CURVE}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={7}
          strokeLinecap="round"
        />
      </g>
      <circle
        cx={62}
        cy={480}
        r={26}
        fill="none"
        stroke="#5B2DB8"
        strokeWidth={5}
        opacity={mark}
      />
    </g>
  );
};

export const VioletScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { lines } = TIMELINE.violet;
  const [question, sun, atmosphere, eye, conclusion] = lines;

  const moveAt = cue(question, 1) + 6;
  const cardStarts = [cue(sun, 0) - 6, cue(atmosphere, 0) - 6, cue(eye, 0) - 6];
  const concludeAt = cue(conclusion, 0);

  // The question mark pops in, then shrinks to the top while the reasons appear.
  const pop = progress(frame, 14, 26, Easing.spring({ damping: 200 }));
  const move = progress(frame, moveAt, 26, Easing.inOut(Easing.cubic));
  const bubbleY = 430 - 270 * move + Math.sin(frame / 12) * 8 * (1 - move);
  const bubbleScale = pop * (1 - 0.5 * move);

  // "...yang paling banyak sampai ke mata kita adalah cahaya biru": the question
  // turns into a blue tick and the reasons step back.
  const conclude = progress(frame, concludeAt, 24, Easing.out(Easing.cubic));
  const tick = progress(frame, concludeAt + 10, 24, Easing.out(Easing.cubic));
  const bubbleColor = interpolateColors(
    conclude,
    [0, 1],
    [COLORS.violet, COLORS.blue],
  );
  const bubbleInner = interpolateColors(
    conclude,
    [0, 1],
    ["#B98BFF", "#5A9BFF"],
  );
  const cardOpacity = 1 - 0.7 * conclude;

  // "Ungu punya gelombang yang lebih pendek lagi": blue, then a shorter violet wave.
  const wavesOpacity = 1 - move;
  const blueReveal = interpolate(
    frame,
    [cue(question, 0.08), cue(question, 0.08) + 40],
    [610, 1310],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const violetReveal = interpolate(
    frame,
    [cue(question, 0.22), cue(question, 0.22) + 40],
    [610, 1310],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #F6F0FF 0%, #E2D5FF 100%)",
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
          <clipPath id="violet-card-clip">
            <rect width={CARD.width} height={CARD.height} rx={48} />
          </clipPath>
        </defs>

        {/* The two waves being compared */}
        <g opacity={wavesOpacity}>
          <path
            d={sinePath(610, blueReveal, 720, 30, 168, frame / 6)}
            fill="none"
            stroke={COLORS.blue}
            strokeWidth={10}
            strokeLinecap="round"
          />
          <path
            d={sinePath(610, violetReveal, 830, 30, 100, frame / 4)}
            fill="none"
            stroke={COLORS.violet}
            strokeWidth={10}
            strokeLinecap="round"
          />
        </g>

        {/* The three reasons, drawn rather than written */}
        {[0, 1, 2].map((index) => {
          const enter = progress(
            frame,
            cardStarts[index],
            22,
            Easing.out(Easing.cubic),
          );
          return (
            <g
              key={index}
              transform={`translate(${CARD.lefts[index]} ${CARD.top + (1 - enter) * 60})`}
              opacity={enter * cardOpacity}
            >
              <rect
                width={CARD.width}
                height={CARD.height}
                rx={48}
                fill="white"
                stroke="#D2BCFF"
                strokeWidth={5}
              />
              <g clipPath="url(#violet-card-clip)">
                {index === 0 ? (
                  <SunBars start={cardStarts[0]} emphasis={cue(sun, 0.55)} />
                ) : null}
                {index === 1 ? <Absorption start={cardStarts[1]} /> : null}
                {index === 2 ? (
                  <EyeSensitivity
                    start={cardStarts[2]}
                    emphasis={cue(eye, 0.55)}
                  />
                ) : null}
              </g>
            </g>
          );
        })}

        {/* The question mark */}
        <g transform={`translate(960 ${bubbleY}) scale(${bubbleScale})`}>
          <circle r={190} fill={bubbleColor} opacity={0.2} />
          <circle r={150} fill={bubbleColor} />
          <circle r={118} fill={bubbleInner} />
          <text
            y={72}
            textAnchor="middle"
            fontFamily={FONT_FAMILY}
            fontSize={210}
            fontWeight={900}
            fill="white"
            opacity={1 - conclude}
          >
            ?
          </text>
          <path
            d="M-64 8 L-18 56 L70 -44"
            fill="none"
            stroke="white"
            strokeWidth={30}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - tick}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
