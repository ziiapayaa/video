import { Composition } from "remotion";
import { FirstVideo } from "./compositions/FirstVideo";
import { LangitBiru } from "./compositions/LangitBiru/LangitBiru";

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
      {/* 8 scenes, 15-frame crossfades: see the arithmetic in LangitBiru.tsx */}
      <Composition
        id="LangitBiru"
        component={LangitBiru}
        durationInFrames={1830}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
