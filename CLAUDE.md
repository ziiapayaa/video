# Video project (Remotion + Claude Code)

This repo makes videos with [Remotion](https://www.remotion.dev): a video is a React component that is rendered frame by frame. Remotion 4.0.539, React 19, TypeScript.

The owner works in Bahasa Indonesia, so reply in Indonesian unless asked otherwise. Code, identifiers and file names stay in English.

## How Claude is wired to Remotion

- `.agents/skills/remotion-*` are the official Remotion agent skills (vendored, pinned in `skills-lock.json`); `.claude/skills` is a symlink to that folder, which is how Claude Code finds them. They are the source of truth for *how* to write Remotion code. **Before writing or changing a composition, load `remotion-best-practices`** (it routes to `remotion-markup`, `remotion-create`, `remotion-captions`, ...).
- Don't edit `.agents/skills/**` by hand. Repo-specific rules go in this file, and this file wins where it conflicts with a skill. `npx remotion upgrade` upgrades Remotion and the skills together (it only looks in `.agents/skills`, so keep that layout).
- `src/index.ts` registers `src/Root.tsx`. `Root.tsx` lists every `<Composition>`; each video lives in `src/compositions/<Name>.tsx`. `FirstVideo.tsx` is the reference example.
- Assets (images, audio, video, fonts) go in `public/` and are referenced with `staticFile()`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run lint` | ESLint + `tsc`. Run after every code change. |
| `npx remotion compositions` | List registered compositions. |
| `npx remotion still <id> out/<name>.png --frame=<n>` | Render one frame to a PNG. |
| `npx remotion render <id> out/frames --frames=0,30,90 --image-format=png` | Render several frames as PNGs. |
| `npx remotion render <id> out/<name>.mp4` | Render the full video. |
| `npm run dev` | Remotion Studio (live preview at `localhost:3000`). Only useful when the user can open it, i.e. local sessions. |

`out/` is gitignored. Never commit rendered files.

## Workflow

The Remotion skills assume the user watches a live Studio preview, and say not to render unless asked. That does not hold in Claude Code on the web: the user cannot open the Studio there, so **rendering is the preview**. In cloud sessions:

1. Write or change the composition, then run `npm run lint`.
2. Check the frames yourself. Render stills at the first frame, where each animation has settled, a mid-scene frame and the last frame (`--frames` does several at once) and look at them with the Read tool. Check that text fits and isn't clipped, key text stays inside the safe area, contrast is readable and nothing overlaps unintentionally. To save context, tile several frames into one image, e.g. `ffmpeg -i a.png -i b.png -filter_complex "[0:v]scale=640:-1[a];[1:v]scale=640:-1[b];[a][b]hstack" out/sheet.png`.
3. Render the MP4 into `out/` and send it to the user as a file (in Claude Code on the web: the `SendUserFile` tool; the file has to be inside the repo directory, which `out/` is). State the duration, resolution and what happens when.
4. Commit the source (`src/`, `public/`, config), not `out/`.

In local sessions, start `npm run dev` and let the user watch the preview instead.

## Defaults

- 1920x1080 at 30 fps unless the request implies otherwise (1080x1920 for Reels, TikTok, Shorts).
- On-screen text is in the language of the request unless told otherwise.
- Follow the skills' rules. In particular, animate only through `useCurrentFrame()` + `interpolate()`/`Easing.spring()`: CSS transitions, CSS animations and Tailwind animation classes do not render correctly in Remotion.

## Environment notes (Claude Code on the web, as of setup)

- Remotion normally downloads its own Chrome from `remotion.media`, which the cloud network policy blocks. `remotion.config.ts` therefore uses the pre-installed Playwright `chrome-headless-shell` (found through `PLAYWRIGHT_BROWSERS_PATH`) when it exists, and does nothing elsewhere. A render failing with `ENOTFOUND remotion.media` means that fallback was not found.
- `www.remotion.dev` is blocked too, so the `remotion-docs` skill (Algolia search and `https://www.remotion.dev/docs/*.md`) does not work. Use the skills' own reference files and the type definitions in `node_modules/remotion/dist` and `node_modules/@remotion/*/dist` instead. Both hosts can be allowed in the cloud environment's network settings.
- npm, GitHub and Google Fonts were reachable. Other hosts may not be, so prefer assets committed in `public/` over remote URLs.
