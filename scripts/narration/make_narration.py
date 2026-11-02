"""Generate the spoken narration for the LangitBiru video from naskah.md.

Every sentence in scripts/narration/naskah.md becomes one MP3 in
public/audio/narration/, and a timeline file is written for the video: the length
of each scene follows from how long its sentences take to say, so the pictures
always match the voice.

Needs, outside this repo (nothing here is a dependency of the video itself):
  - ffmpeg on the PATH and numpy
  - sherpa-onnx *1.x*. Version 2 dropped the built-in espeak-ng phonemizer that
    the voice needs:      pip install --target /tmp/tts-lib "sherpa-onnx<2"
  - the Indonesian Piper voice, a 67 MB download from the sherpa-onnx releases:
      curl -L -o /tmp/voice.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-id_ID-news_tts-medium.tar.bz2
      mkdir -p /tmp/tts-model && tar -xjf /tmp/voice.tar.bz2 -C /tmp/tts-model

Run from the repo root, then format the generated file:
  PYTHONPATH=/tmp/tts-lib python3 scripts/narration/make_narration.py \\
      --model-dir /tmp/tts-model/vits-piper-id_ID-news_tts-medium
  npx prettier --write src/compositions/LangitBiru/timeline.generated.ts

Licence note: the voice's licence could not be verified (the MODEL_CARD inside the
pack describes a different, Malayalam model). Check it before publishing a video
that uses this audio, or replace the files in public/audio/narration/ with a
human recording of the same sentences (same ids) and run this script's timeline
step again with --from-audio.
"""
import argparse
import json
import math
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

FPS = 30
CROSSFADE = 15  # frames of overlap between two scenes, see LangitBiru.tsx
LEAD = 20  # frames of picture before the first sentence of a scene
GAP = 14  # frames of silence between two sentences
TAIL = 30  # frames after the last sentence (the crossfade happens in here)
FINAL_TAIL = 90  # the last scene holds a little longer before the video ends
SCENE_ORDER = ["title", "prism", "waves", "scatter", "eye", "violet", "sunset", "moon"]

# Words this voice says badly, respelled for the voice only: naskah.md keeps the
# correct spelling. Found by transcribing the audio back with Whisper (the voice's
# "ng" before a vowel comes out as "m" or "n": "ungu" was heard as "umu").
PRONUNCIATION = {
    "ungu": "unggu",
    "dihamburkan": "dihambur kan",
    "jingga": "jing ga",
}


def for_the_voice(text: str) -> str:
    def swap(match: "re.Match") -> str:
        word = PRONUNCIATION[match.group(0).lower()]
        return word.capitalize() if match.group(0)[0].isupper() else word

    pattern = r"\b(" + "|".join(re.escape(word) for word in PRONUNCIATION) + r")\b"
    return re.sub(pattern, swap, text, flags=re.IGNORECASE)


def parse_script(path: Path) -> dict:
    """Read `## scene` headings and `- `id`: sentence` items from naskah.md."""
    scenes = {}
    current = None
    for line in path.read_text(encoding="utf-8").splitlines():
        heading = re.match(r"^##\s+([a-z]+)\b", line)
        if heading:
            current = heading.group(1)
            scenes[current] = []
            continue
        item = re.match(r"^- `([a-z0-9-]+)`:\s*(.+?)\s*$", line)
        if item and current:
            scenes[current].append((item.group(1), item.group(2)))
    missing = [scene for scene in SCENE_ORDER if not scenes.get(scene)]
    if missing:
        raise SystemExit(f"naskah.md has no sentences for: {', '.join(missing)}")
    return scenes


def build_tts(model_dir: Path):
    import sherpa_onnx  # imported here so --help works without it

    config = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=str(model_dir / "id_ID-news_tts-medium.onnx"),
                tokens=str(model_dir / "tokens.txt"),
                data_dir=str(model_dir / "espeak-ng-data"),
            ),
            num_threads=2,
            debug=False,
            provider="cpu",
        ),
        max_num_sentences=1,
    )
    return sherpa_onnx.OfflineTts(config)


def trim_and_fade(samples: np.ndarray, rate: int) -> np.ndarray:
    """Cut the silence the voice puts around a sentence and soften both ends."""
    # A low threshold and a generous lead-in keep soft consonants: with a stricter
    # one the "c" of a sentence-initial "Cahaya" was heard as "t".
    limit = float(np.max(np.abs(samples))) * 10 ** (-50 / 20)
    loud = np.flatnonzero(np.abs(samples) > limit)
    first = max(int(loud[0]) - int(0.10 * rate), 0)
    last = min(int(loud[-1]) + int(0.15 * rate), len(samples))
    clip = samples[first:last].copy()
    fade_in = int(0.005 * rate)
    fade_out = int(0.02 * rate)
    clip[:fade_in] *= np.linspace(0.0, 1.0, fade_in)
    clip[-fade_out:] *= np.linspace(1.0, 0.0, fade_out)
    return clip


def write_wav(path: Path, samples: np.ndarray, rate: int) -> None:
    pcm = (np.clip(samples, -1.0, 1.0) * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes(pcm.tobytes())


def measure_lufs(path: Path) -> float:
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(re.findall(r"^\s+I:\s+(-?\d+\.\d+) LUFS", result.stderr, flags=re.M)[-1])


def encode_mp3(wav: Path, mp3: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
            "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "2", str(mp3),
        ],
        check=True,
    )


def probe_seconds(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(json.loads(result.stdout)["format"]["duration"])


def to_frames(seconds: float) -> int:
    return math.ceil(seconds * FPS) + 2


def synthesize_all(scenes: dict, args) -> dict:
    """Write one MP3 per sentence; return {id: seconds}."""
    tts = build_tts(args.model_dir)
    args.audio_dir.mkdir(parents=True, exist_ok=True)
    seconds = {}
    print(f"{'id':<12} {'sec':>5} {'chars/s':>8} {'raw LUFS':>9} {'gain dB':>8}")
    with tempfile.TemporaryDirectory() as folder:
        wav = Path(folder) / "line.wav"
        for scene in SCENE_ORDER:
            for line_id, text in scenes[scene]:
                audio = tts.generate(for_the_voice(text), sid=0, speed=args.speed)
                if audio.sample_rate == 0 or len(audio.samples) == 0:
                    raise SystemExit(f"the voice produced no audio for {line_id}: {text!r}")
                rate = audio.sample_rate
                clip = trim_and_fade(np.asarray(audio.samples, dtype=np.float32), rate)

                write_wav(wav, clip, rate)
                raw = measure_lufs(wav)
                gain_db = args.lufs - raw
                peak_limit = 10 ** (-1.5 / 20)
                gain = 10 ** (gain_db / 20)
                peak = float(np.max(np.abs(clip))) * gain
                if peak > peak_limit:
                    gain *= peak_limit / peak
                    gain_db = 20 * math.log10(gain)
                write_wav(wav, clip * gain, rate)

                mp3 = args.audio_dir / f"{line_id}.mp3"
                encode_mp3(wav, mp3)
                seconds[line_id] = max(len(clip) / rate, probe_seconds(mp3))
                print(
                    f"{line_id:<12} {seconds[line_id]:5.2f} "
                    f"{len(text) / seconds[line_id]:8.1f} {raw:9.1f} {gain_db:8.1f}"
                )
    return seconds


def measure_existing(scenes: dict, args) -> dict:
    """--from-audio: take the lengths from MP3 files that are already there."""
    seconds = {}
    for scene in SCENE_ORDER:
        for line_id, _ in scenes[scene]:
            mp3 = args.audio_dir / f"{line_id}.mp3"
            if not mp3.exists():
                raise SystemExit(f"missing {mp3}")
            seconds[line_id] = probe_seconds(mp3)
    return seconds


def build_timeline(scenes: dict, seconds: dict, audio_dir: Path) -> tuple:
    timeline = {}
    for index, scene in enumerate(SCENE_ORDER):
        cursor = LEAD
        lines = []
        for line_id, text in scenes[scene]:
            frames = to_frames(seconds[line_id])
            lines.append(
                {
                    "id": line_id,
                    "text": text,
                    "file": f"audio/narration/{line_id}.mp3",
                    "from": cursor,
                    "durationInFrames": frames,
                }
            )
            cursor += frames + GAP
        end = cursor - GAP
        last = index == len(SCENE_ORDER) - 1
        timeline[scene] = {"durationInFrames": end + (FINAL_TAIL if last else TAIL), "lines": lines}
    total = sum(item["durationInFrames"] for item in timeline.values()) - CROSSFADE * (len(SCENE_ORDER) - 1)
    return timeline, total


def write_typescript(path: Path, timeline: dict, total: int) -> None:
    body = json.dumps(timeline, ensure_ascii=False, indent=2)
    path.write_text(
        "// Generated by scripts/narration/make_narration.py from scripts/narration/naskah.md.\n"
        "// Do not edit by hand: change the script and generate it again.\n"
        'import type { SceneTimeline } from "./Narration";\n\n'
        f"export const CROSSFADE_FRAMES = {CROSSFADE};\n\n"
        "// Length of every scene, in frames. The video is the sum of these minus one\n"
        "// crossfade between each pair of scenes.\n"
        f"export const TOTAL_DURATION_IN_FRAMES = {total};\n\n"
        f"export const TIMELINE = {body} as const satisfies Record<string, SceneTimeline>;\n",
        encoding="utf-8",
    )


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--model-dir", type=Path, help="folder of the Piper voice pack")
    parser.add_argument("--script", type=Path, default=root / "scripts/narration/naskah.md")
    parser.add_argument("--audio-dir", type=Path, default=root / "public/audio/narration")
    parser.add_argument(
        "--timeline", type=Path, default=root / "src/compositions/LangitBiru/timeline.generated.ts"
    )
    parser.add_argument("--speed", type=float, default=0.95, help="1.0 is the voice's own pace")
    parser.add_argument("--lufs", type=float, default=-16.0, help="loudness of every sentence")
    parser.add_argument(
        "--from-audio",
        action="store_true",
        help="do not synthesize: rebuild the timeline from the MP3 files already in --audio-dir",
    )
    args = parser.parse_args()

    scenes = parse_script(args.script)
    if args.from_audio:
        seconds = measure_existing(scenes, args)
    else:
        if not args.model_dir:
            parser.error("--model-dir is required unless --from-audio is given")
        seconds = synthesize_all(scenes, args)

    timeline, total = build_timeline(scenes, seconds, args.audio_dir)
    write_typescript(args.timeline, timeline, total)
    print(f"\nwrote {args.timeline} | total {total} frames = {total / FPS:.1f} s")
    for scene in SCENE_ORDER:
        print(f"  {scene:<8} {timeline[scene]['durationInFrames']:4d} frames, {len(timeline[scene]['lines'])} sentences")


if __name__ == "__main__":
    main()
