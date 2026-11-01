import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { COLORS, FONT_FAMILY } from "./theme";

// `from` and `to` are frames relative to the start of the scene. Keep chunks
// between frame 16 and (scene length - 16) so they do not collide with the
// 15-frame crossfade between scenes.
export type CaptionChunk = {
  readonly text: string;
  readonly from: number;
  readonly to: number;
  // Keep the caption on screen until `to` instead of fading it out. Use it for
  // the last line of the video so the final frame still has its text.
  readonly hold?: boolean;
};

const CaptionPill: React.FC<{
  readonly text: string;
  readonly durationInFrames: number;
  readonly hold: boolean;
}> = ({ text, durationInFrames, hold }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 56,
      }}
    >
      <div
        style={{
          maxWidth: 1640,
          padding: "20px 56px",
          borderRadius: 64,
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          boxShadow: "0 12px 40px rgba(10, 40, 80, 0.28)",
          color: COLORS.ink,
          fontFamily: FONT_FAMILY,
          fontSize: 76,
          fontWeight: 800,
          lineHeight: 1.2,
          textAlign: "center",
          textWrap: "balance",
          opacity: interpolate(
            frame,
            [0, 8, durationInFrames - 6, durationInFrames],
            [0, 1, 1, hold ? 1 : 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: interpolate(frame, [0, 12], ["0px 28px", "0px 0px"], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{
  readonly chunks: readonly CaptionChunk[];
}> = ({ chunks }) => {
  return (
    <>
      {chunks.map((chunk) => (
        <Sequence
          key={chunk.text}
          name={`Caption: ${chunk.text}`}
          from={chunk.from}
          durationInFrames={chunk.to - chunk.from}
          layout="none"
        >
          <CaptionPill
            text={chunk.text}
            durationInFrames={chunk.to - chunk.from}
            hold={chunk.hold ?? false}
          />
        </Sequence>
      ))}
    </>
  );
};
