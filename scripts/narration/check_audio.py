"""Check that every narrated sentence is audible where the timeline says it is.

    python3 -I scripts/narration/check_audio.py \
        src/compositions/LangitBiru/timeline.generated.ts out/langit-biru.mp4

For each sentence: mean level during the sentence versus the 0.4 s of music that
precedes it. A sentence in the right place is much louder than that gap.

The gap column also exposes missing music: a gap of about -90 dB is digital
silence, so the background music has ended (<Audio> does not loop). That is how
a 64 s music file under a 120 s video was found.
"""
import re
import subprocess
import sys
from pathlib import Path

FPS = 30
CROSSFADE = 15

source = Path(sys.argv[1]).read_text(encoding="utf-8")
video = sys.argv[2]

total = int(re.search(r"TOTAL_DURATION_IN_FRAMES = (\d+)", source).group(1))
scenes = []
for block in re.finditer(r"^  (\w+): \{\s*durationInFrames: (\d+),\s*lines: \[(.*?)^    \],", source, flags=re.S | re.M):
    name, duration, lines_text = block.group(1), int(block.group(2)), block.group(3)
    lines = [
        (m.group(1), int(m.group(2)), int(m.group(3)))
        for m in re.finditer(r'id: "([a-z0-9-]+)",.*?from: (\d+),\s*durationInFrames: (\d+)', lines_text, flags=re.S)
    ]
    scenes.append((name, duration, lines))

assert len(scenes) == 8, f"parsed {len(scenes)} scenes"
assert sum(d for _, d, _ in scenes) - CROSSFADE * 7 == total, "scene lengths do not add up to the total"


def mean_db(start: float, length: float) -> float:
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-ss", f"{start:.3f}", "-t", f"{length:.3f}", "-i", video, "-vn", "-af", "volumedetect", "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    match = re.search(r"mean_volume: (-?\d+\.\d+) dB", result.stderr)
    return float(match.group(1)) if match else -99.0


scene_start = 0
previous_end = -1
failures = 0
print(f"{'sentence':<11} {'starts':>7} {'speech dB':>10} {'gap dB':>8} {'margin':>7}")
for name, duration, lines in scenes:
    for line_id, start, length in lines:
        begin = scene_start + start
        end = begin + length
        overlaps = begin < previous_end
        previous_end = end
        speech = mean_db(begin / FPS, length / FPS)
        gap = mean_db(max(begin / FPS - 0.45, 0), 0.4)
        margin = speech - gap
        ok = margin >= 6 and not overlaps
        failures += 0 if ok else 1
        print(f"{line_id:<11} {begin / FPS:6.1f}s {speech:10.1f} {gap:8.1f} {margin:6.1f}{'  OVERLAP' if overlaps else ''}{'' if ok else '  <-- check'}")
    scene_start += duration - CROSSFADE
print(f"\n{failures} sentence(s) need attention; total {total} frames = {total / FPS:.1f} s")
