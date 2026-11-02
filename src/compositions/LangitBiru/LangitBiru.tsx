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

// Peak volume of the background music, 0 to 1. Lower it (around 0.2) when a
// narration track is added on top.
const MUSIC_VOLUME = 1;

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

// "Kenapa langit berwarna biru?" - an explainer in eight scenes with a 15-frame
// crossfade between them. Total length = sum of scenes - 7 crossfades:
//   135 + 240 + 240 + 300 + 210 + 240 + 300 + 270 - 7 * 15 = 1830 frames (61 s).
// Keep this in sync with durationInFrames on the <Composition> in src/Root.tsx.
export const LangitBiru: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1226" }}>
      <BackgroundMusic />
      <TransitionSeries>
        <TransitionSeries.Sequence name="1 Judul" durationInFrames={135}>
          <TitleScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="2 Prisma" durationInFrames={240}>
          <PrismScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="3 Gelombang" durationInFrames={240}>
          <WavesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="4 Hamburan" durationInFrames={300}>
          <ScatterScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="5 Mata" durationInFrames={210}>
          <EyeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence
          name="6 Kenapa bukan ungu"
          durationInFrames={240}
        >
          <VioletScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="7 Senja" durationInFrames={300}>
          <SunsetScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence name="8 Bulan" durationInFrames={270}>
          <MoonScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
