import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

// One spoken sentence. `from` is the frame, counted from the start of its scene,
// where the voice starts. `text` is only for reference: nothing is shown on screen.
export type NarrationLine = {
  readonly id: string;
  readonly text: string;
  readonly file: string;
  readonly from: number;
  readonly durationInFrames: number;
};

export type SceneTimeline = {
  readonly durationInFrames: number;
  readonly lines: readonly NarrationLine[];
};

// A moment inside a sentence, as a frame of the scene: fraction 0 is where the
// voice starts the sentence and 1 is where it stops. Animations hang off this so
// the pictures change when the matching words are said.
export const cue = (line: NarrationLine, fraction = 0): number =>
  Math.round(line.from + fraction * line.durationInFrames);

// Plays the voice for a scene. The files come from scripts/narration/make_narration.py.
export const Narration: React.FC<{
  readonly lines: readonly NarrationLine[];
}> = ({ lines }) => {
  return (
    <>
      {lines.map((line) => (
        <Audio
          key={line.id}
          name={`Narration: ${line.id}`}
          src={staticFile(line.file)}
          from={line.from}
        />
      ))}
    </>
  );
};
