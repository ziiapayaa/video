import { Composition } from "remotion";
import { FirstVideo } from "./compositions/FirstVideo";
import { LangitBiru } from "./compositions/LangitBiru/LangitBiru";
import { TOTAL_DURATION_IN_FRAMES } from "./compositions/LangitBiru/timeline.generated";

// Register every video here as its own <Composition> with a literal `id` and
// inline metadata. Render one with: npx remotion render <id> out/<name>.mp4
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FirstVideo"
        component={FirstVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Its length follows the narration: it is generated, see LangitBiru.tsx */}
      <Composition
        id="LangitBiru"
        component={LangitBiru}
        durationInFrames={TOTAL_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
