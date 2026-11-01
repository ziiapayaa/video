/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import fs from "node:fs";
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Sandboxed/cloud environments (e.g. Claude Code on the web) often cannot
// download the Chrome that Remotion normally fetches on first render, but ship a
// Playwright "chrome-headless-shell" instead. Use it when it exists. Anywhere
// else (a laptop, CI) this finds nothing and Remotion's default applies.
// A `--browser-executable` flag on the command line still takes precedence.
const findPlaywrightHeadlessShell = (): string | null => {
  const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!browsersDir || !fs.existsSync(browsersDir)) {
    return null;
  }

  for (const entry of fs.readdirSync(browsersDir).sort().reverse()) {
    if (!entry.startsWith("chromium_headless_shell-")) {
      continue;
    }

    const executable = path.join(
      browsersDir,
      entry,
      "chrome-headless-shell-linux64",
      "chrome-headless-shell",
    );
    if (fs.existsSync(executable)) {
      return executable;
    }
  }

  return null;
};

const playwrightHeadlessShell = findPlaywrightHeadlessShell();
if (playwrightHeadlessShell) {
  Config.setBrowserExecutable(playwrightHeadlessShell);
}
