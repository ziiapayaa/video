import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Glow } from "../Glow";
import { COLORS, FONT_FAMILY } from "../theme";

const Cloud: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly size: number;
}> = ({ x, y, size }) => (
  <g transform={`translate(${x} ${y}) scale(${size})`} fill={COLORS.white}>
    <circle cx={0} cy={0} r={60} />
    <circle cx={80} cy={-34} r={82} />
    <circle cx={172} cy={0} r={60} />
    <rect x={-60} y={0} width={292} height={60} rx={30} />
  </g>
);

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #2E9BFF 0%, #7CC4FF 55%, #D6EEFF 100%)",
      }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Sun with slowly turning rays */}
        <g transform="translate(1700 150)">
          <Glow id="title-sun-glow" cx={0} cy={0} r={270} />
          <g transform={`rotate(${frame * 0.4})`}>
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x={-8}
                y={-162}
                width={16}
                height={46}
                rx={8}
                fill={COLORS.sun}
                transform={`rotate(${i * 30})`}
              />
            ))}
          </g>
          <circle r={88} fill={COLORS.sun} />
          <circle r={68} fill={COLORS.sunSoft} />
        </g>

        {/* Clouds drifting in opposite directions */}
        <Cloud x={interpolate(frame, [0, 135], [90, 170])} y={190} size={0.9} />
        <Cloud
          x={interpolate(frame, [0, 135], [1180, 1110])}
          y={96}
          size={0.7}
        />
        <Cloud
          x={interpolate(frame, [0, 135], [1590, 1660])}
          y={610}
          size={0.7}
        />

        {/* Hills */}
        <path
          d="M0 860 C 300 760, 620 760, 960 840 S 1600 900, 1920 800 L1920 1080 L0 1080 Z"
          fill="#5BC46D"
        />
        <path
          d="M0 940 C 360 860, 760 880, 1100 930 S 1700 980, 1920 900 L1920 1080 L0 1080 Z"
          fill="#3FAE5A"
        />
      </svg>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          paddingBottom: 80,
        }}
      >
        <Interactive.Div
          name="Title line 1"
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 160,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: "white",
            textShadow: "0 8px 0 rgba(15, 80, 160, 0.35)",
            opacity: interpolate(frame, [8, 24], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [8, 32], ["0px 90px", "0px 0px"], {
              easing: Easing.spring({ damping: 200 }),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Kenapa Langit
        </Interactive.Div>
        <Interactive.Div
          name="Title line 2"
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 160,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: "white",
            textShadow: "0 8px 0 rgba(15, 80, 160, 0.35)",
            opacity: interpolate(frame, [16, 32], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [16, 40], ["0px 90px", "0px 0px"], {
              easing: Easing.spring({ damping: 200 }),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Berwarna Biru?
        </Interactive.Div>
        <Interactive.Div
          name="Subtitle"
          style={{
            marginTop: 44,
            padding: "14px 48px",
            borderRadius: 60,
            backgroundColor: "white",
            fontFamily: FONT_FAMILY,
            fontSize: 72,
            fontWeight: 800,
            color: "#16324F",
            boxShadow: "0 10px 30px rgba(10, 60, 120, 0.25)",
            opacity: interpolate(frame, [40, 56], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [40, 64], ["0px 50px", "0px 0px"], {
              easing: Easing.spring({ damping: 200 }),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Penjelasan singkat soal cahaya
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
