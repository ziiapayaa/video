import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Starter video: a title card with a staggered entrance and a fade-out.
// It doubles as a reference for the conventions in .claude/skills/remotion-*:
// - every animation is driven by useCurrentFrame() + an inline interpolate()
//   (CSS transitions/animations do not render correctly in Remotion)
// - seconds are converted to frames with fps from useVideoConfig()
// - `scale` / `translate` are used instead of `transform`
// - editable elements are <Interactive.*> with a literal `name` and inline styles
export const FirstVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 25% 20%, #1c2f6b 0%, #0b1020 65%)",
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          padding: 160,
          opacity: interpolate(
            frame,
            [durationInFrames - 20, durationInFrames - 1],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      >
        <Interactive.Div
          name="Accent bar"
          style={{
            width: 240,
            height: 14,
            borderRadius: 7,
            backgroundColor: "#0b84f3",
            marginBottom: 56,
            scale: interpolate(frame, [0, 1 * fps], [0, 1], {
              easing: Easing.spring({ damping: 200 }),
              output: "perceptual-scale",
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
        <Interactive.Div
          name="Title"
          style={{
            fontFamily:
              'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: 160,
            fontWeight: 800,
            letterSpacing: -3,
            color: "white",
            opacity: interpolate(frame, [0.2 * fps, 1 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0.2 * fps, 1.2 * fps],
              ["0px 60px", "0px 0px"],
              {
                easing: Easing.spring({ damping: 200 }),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          Video pertama
        </Interactive.Div>
        <Interactive.Div
          name="Subtitle"
          style={{
            fontFamily:
              'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: 80,
            fontWeight: 500,
            color: "#9fb3d1",
            marginTop: 24,
            opacity: interpolate(frame, [0.6 * fps, 1.4 * fps], [0, 1], {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(
              frame,
              [0.6 * fps, 1.6 * fps],
              ["0px 40px", "0px 0px"],
              {
                easing: Easing.spring({ damping: 200 }),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            ),
          }}
        >
          Remotion + Claude Code
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
