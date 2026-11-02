"""Generate the calm background music used by the LangitBiru video.

An original track, so there is nothing to license: a soft pad playing the chord
progression C - Am - F - G, a music-box style arpeggio, and a quiet bass, all
run through a synthetic reverb. Only numpy and the standard library are used;
ffmpeg encodes the MP3 and measures its loudness.

    python3 scripts/music/make_music.py public/audio/langit-biru-music.mp3

Change BPM, CHORDS or the arrangement below and run it again to get a different
track. The output is deterministic (fixed random seeds).
"""
import argparse
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

SAMPLE_RATE = 44100
BPM = 92
BEAT = 60.0 / BPM
BAR = 4 * BEAT

# One chord per bar: (bass note, pad notes, arpeggio notes), as MIDI numbers.
# The pad moves by at most a step between chords, which keeps it calm.
CHORDS = [
    (36, [52, 55, 59, 64], [72, 76, 79, 83]),  # Cmaj7: C2 | E3 G3 B3 E4 | C5 E5 G5 B5
    (33, [52, 55, 60, 64], [69, 72, 76, 79]),  # Am7:   A1 | E3 G3 C4 E4 | A4 C5 E5 G5
    (41, [52, 57, 60, 64], [65, 69, 72, 76]),  # Fmaj7: F2 | E3 A3 C4 E4 | F4 A4 C5 E5
    (43, [50, 55, 59, 64], [67, 71, 74, 76]),  # G6:    G2 | D3 G3 B3 E4 | G4 B4 D5 E5
]
# Which chord tone each of the eight eighth-notes in a bar plays.
ARPEGGIO_PATTERN = [0, 1, 2, 3, 2, 1, 0, 1]

PAD_ENTRY_BAR = 0
ARPEGGIO_ENTRY_BAR = 2
BASS_ENTRY_BAR = 4


def midi_to_hz(note: int) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def pad_note(freq: float, duration: float, detune_cents: float) -> np.ndarray:
    """A mellow sustained tone: three harmonics with a slow attack and release."""
    t = np.arange(int(duration * SAMPLE_RATE)) / SAMPLE_RATE
    f = freq * 2 ** (detune_cents / 1200)
    tone = (
        np.sin(2 * np.pi * f * t)
        + 0.35 * np.sin(2 * np.pi * 2 * f * t)
        + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    )
    envelope = np.clip(t / 0.7, 0, 1) * np.clip((duration - t) / 1.2, 0, 1)
    return tone * envelope


def pluck_note(freq: float, duration: float = 1.8) -> np.ndarray:
    """A bright, short note whose upper harmonics die away first (music box)."""
    t = np.arange(int(duration * SAMPLE_RATE)) / SAMPLE_RATE
    tone = np.zeros_like(t)
    for harmonic, (amplitude, decay) in enumerate(
        [(1.0, 2.2), (0.42, 3.6), (0.2, 5.6), (0.09, 8.5)], start=1
    ):
        tone += amplitude * np.sin(2 * np.pi * freq * harmonic * t) * np.exp(-decay * t)
    return tone * np.minimum(t / 0.004, 1.0)


def bass_note(freq: float, duration: float) -> np.ndarray:
    t = np.arange(int(duration * SAMPLE_RATE)) / SAMPLE_RATE
    tone = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t)
    envelope = np.clip(t / 0.05, 0, 1) * np.clip((duration - t) / 0.5, 0, 1)
    return tone * envelope


def add(buffer: np.ndarray, start: float, signal: np.ndarray, gain: float) -> None:
    """Mix `signal` into `buffer` starting at `start` seconds (clipped at the end)."""
    first = int(start * SAMPLE_RATE)
    last = min(len(buffer), first + len(signal))
    if first < len(buffer):
        buffer[first:last] += gain * signal[: last - first]


def fft_convolve(signal: np.ndarray, impulse: np.ndarray) -> np.ndarray:
    length = len(signal) + len(impulse) - 1
    size = 1 << (length - 1).bit_length()
    spectrum = np.fft.rfft(signal, size) * np.fft.rfft(impulse, size)
    return np.fft.irfft(spectrum, size)[:length]


def reverb_impulse(seed: int, seconds: float = 1.8, decay_seconds: float = 0.55) -> np.ndarray:
    rng = np.random.default_rng(seed)
    t = np.arange(int(seconds * SAMPLE_RATE)) / SAMPLE_RATE
    impulse = rng.standard_normal(len(t)) * np.exp(-t / decay_seconds)
    impulse = np.convolve(impulse, np.ones(10) / 10, mode="same")  # soften the highs
    impulse[0] = 0.0
    return impulse / np.sqrt(np.sum(impulse**2))


def build_track(seconds: float) -> np.ndarray:
    """Return a stereo float array of shape (samples, 2)."""
    total = int(seconds * SAMPLE_RATE)
    left = np.zeros(total)
    right = np.zeros(total)
    rng = np.random.default_rng(7)
    bars = int(np.ceil(seconds / BAR)) + 1

    for bar in range(bars):
        bass, pad, arpeggio = CHORDS[bar % len(CHORDS)]
        start = bar * BAR

        if bar >= PAD_ENTRY_BAR:
            for note in pad:
                # Slightly different tuning per ear gives the pad some width.
                add(left, start, pad_note(midi_to_hz(note), BAR + 1.2, +4), 0.16)
                add(right, start, pad_note(midi_to_hz(note), BAR + 1.2, -4), 0.16)

        if bar >= BASS_ENTRY_BAR:
            tone = bass_note(midi_to_hz(bass), BAR * 0.92)
            add(left, start, tone, 0.2)
            add(right, start, tone, 0.2)

        if bar >= ARPEGGIO_ENTRY_BAR:
            for step, index in enumerate(ARPEGGIO_PATTERN):
                accent = 1.0 if step % 4 == 0 else 0.62 + 0.14 * (step % 2)
                humanize = rng.uniform(-0.006, 0.006)
                tone = pluck_note(midi_to_hz(arpeggio[index]))
                onset = start + step * BEAT / 2 + humanize
                pan = 0.35 + 0.3 * (step % 2)  # alternate between the two ears
                add(left, max(onset, 0.0), tone, 0.2 * accent * (1 - pan))
                add(right, max(onset, 0.0), tone, 0.2 * accent * pan)

    dry = np.stack([left, right], axis=1)
    wet = np.stack(
        [
            fft_convolve(dry[:, 0], reverb_impulse(1))[:total],
            fft_convolve(dry[:, 1], reverb_impulse(2))[:total],
        ],
        axis=1,
    )
    mix = 0.8 * dry + 0.4 * wet
    mix -= mix.mean(axis=0)  # remove any DC offset
    return mix


def apply_fades(track: np.ndarray, fade_in: float, fade_out: float) -> np.ndarray:
    t = np.arange(len(track)) / SAMPLE_RATE
    duration = len(track) / SAMPLE_RATE
    gain = np.clip(t / fade_in, 0, 1) * np.clip((duration - t) / fade_out, 0, 1)
    return track * gain[:, None]


def write_wav(path: Path, track: np.ndarray) -> None:
    pcm = (np.clip(track, -1.0, 1.0) * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(pcm.tobytes())


def measure_lufs(path: Path) -> float:
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    # The summary at the end of the log has a line like "    I:         -18.2 LUFS".
    matches = re.findall(r"^\s+I:\s+(-?\d+\.\d+) LUFS", result.stderr, flags=re.M)
    return float(matches[-1])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("output", type=Path, help="MP3 file to write")
    parser.add_argument("--seconds", type=float, default=64.0, help="track length")
    parser.add_argument("--lufs", type=float, default=-18.0, help="target integrated loudness")
    args = parser.parse_args()

    track = apply_fades(build_track(args.seconds), fade_in=1.5, fade_out=3.0)

    with tempfile.TemporaryDirectory() as folder:
        wav = Path(folder) / "music.wav"
        write_wav(wav, track)
        gain = 10 ** ((args.lufs - measure_lufs(wav)) / 20)
        peak = float(np.max(np.abs(track * gain)))
        if peak > 0.89:  # keep about 1 dB of headroom
            gain *= 0.89 / peak
        write_wav(wav, track * gain)

        args.output.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(wav),
                "-codec:a", "libmp3lame", "-q:a", "2",
                str(args.output),
            ],
            check=True,
        )
        print(f"wrote {args.output} ({args.seconds:.0f}s, {measure_lufs(args.output):.1f} LUFS)")


if __name__ == "__main__":
    main()
