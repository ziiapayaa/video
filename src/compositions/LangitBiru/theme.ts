import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Nunito is a rounded, friendly sans-serif that suits explainer videos. It ships
// with the repo in public/fonts (SIL Open Font License, see Nunito-OFL.txt)
// instead of being fetched from Google Fonts: remote files can fail to load in
// sandboxed render environments, a local one always loads.
// loadFont() holds the render with delayRender() until the font is ready, so it
// is safe to call once at module level.
const FAMILY_NAME = "Nunito";

void loadFont({
  family: FAMILY_NAME,
  url: staticFile("fonts/nunito-latin-wght-normal.woff2"),
  // A variable font: one file covers every weight in this range.
  weight: "200 1000",
});

export const FONT_FAMILY = `${FAMILY_NAME}, system-ui, sans-serif`;

export const COLORS = {
  ink: "#16324F",
  white: "#FFFFFF",
  sun: "#FFD43B",
  sunSoft: "#FFE066",
  blue: "#2F7BFF",
  red: "#FF4D4D",
  violet: "#A66BFF",
  ground: "#4CB96A",
} as const;

// The visible spectrum from red to violet, in the order a prism spreads it.
export const SPECTRUM = [
  { name: "Merah", color: "#FF4D4D" },
  { name: "Jingga", color: "#FF9F43" },
  { name: "Kuning", color: "#FFD93D" },
  { name: "Hijau", color: "#4ADE80" },
  { name: "Biru", color: "#3B9BFF" },
  { name: "Nila", color: "#5B6CFF" },
  { name: "Ungu", color: "#A66BFF" },
] as const;
