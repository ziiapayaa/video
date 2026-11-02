import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { EyeScene } from "./scenes/EyeScene";
import { MoonScene } from "./scenes/MoonScene";
import { PrismScene } from "./scenes/PrismScene";
import { ScatterScene } from "./scenes/ScatterScene";
import { SunsetScene } from "./scenes/SunsetScene";
import { TitleScene } from "./scenes/TitleScene";
import { VioletScene } from "./scenes/VioletScene";
import { WavesScene } from "./scenes/WavesScene";
import { CROSSFADE_FRAMES, TIMELINE } from "./timeline.generated";

// Peak volume of the background music, 0 to 1. It sits well under the voice,
// which is normalised to about -16 LUFS against the music's -18 LUFS at 1.
const MUSIC_VOLUME = 0.22;

// Original calm music from scripts/music/make_music.py, faded in and out.
const BackgroundMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <Audio
      name="Background music"
      src={staticFile("audio/langit-biru-music.mp3")}
      volume={interpolate(
        frame,
        [0, 1.5 * fps, durationInFrames - 3 * fps, durationInFrames],
        [0, MUSIC_VOLUME, MUSIC_VOLUME, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )}
    />
  );
};

// The picture fades to black over the last second.
const EndFade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        opacity: interpolate(
          frame,
          [durationInFrames - fps, durationInFrames - 1],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        ),
      }}
    />
  );
};

// "Kenapa langit berwarna biru?" - an explainer in eight scenes with a crossfade
// between them. Each scene lasts as long as its narration, so the lengths come
// from the generated timeline (scripts/narration/make_narration.py), and so does
// the length of the whole composition registered in src/Root.tsx.
export const LangitBiru: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1226" }}>
      <BackgroundMusic />
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="1 Judul"
          durationInFrames={TIMELINE.title.durationInFrames}
        >
          <TitleScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence
          name="2 Prisma"
          durationInFrames={TIMELINE.prism.durationInFrames}
        >
          <PrismScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence
          name="3 Gelombang"
          durationInFrames={TIMELINE.waves.durationInFrames}
        >
          <WavesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence
          name="4 Hamburan"
          durationInFrames={TIMELINE.scatter.durationInFrames}
        >
          <ScatterScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence
          name="5 Mata"
          durationInFrames={TIMELINE.eye.durationInFrames}
        >
          <EyeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence
          name="6 Kenapa bukan ungu"
          durationInFrames={TIMELINE.violet.durationInFrames}
        >
          <VioletScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence
          name="7 Senja"
          durationInFrames={TIMELINE.sunset.durationInFrames}
        >
          <SunsetScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_FRAMES })}
        />
        <TransitionSeries.Sequence
          name="8 Bulan"
          durationInFrames={TIMELINE.moon.durationInFrames}
        >
          <MoonScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <EndFade />
    </AbsoluteFill>
  );
};
