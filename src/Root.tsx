import { Composition } from "remotion";
import { FirstVideo } from "./compositions/FirstVideo";

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
    </>
  );
};
