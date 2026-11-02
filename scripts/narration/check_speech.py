"""Round-trip check: transcribe the generated narration with Whisper and compare
the transcript with the sentence that was meant to be said.

    PYTHONPATH=/tmp/tts-lib python3 scripts/narration/check_speech.py \
        <whisper_dir> scripts/narration/naskah.md public/audio/narration

Needs sherpa-onnx<2 (see make_narration.py) and the Whisper small model: download
sherpa-onnx-whisper-small.tar.bz2 (639 MB) from the sherpa-onnx "asr-models"
GitHub release and extract it; <whisper_dir> is the folder it creates.

A low word error rate means the speech is intelligible to a recogniser. It does
not say anything about how natural the voice sounds.
"""
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import sherpa_onnx


def normalise(text: str) -> list:
    return re.sub(r"[^a-z0-9 ]+", " ", text.lower()).split()


def word_error_rate(reference: list, hypothesis: list) -> float:
    rows, cols = len(reference) + 1, len(hypothesis) + 1
    table = np.zeros((rows, cols), dtype=int)
    table[:, 0] = np.arange(rows)
    table[0, :] = np.arange(cols)
    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if reference[i - 1] == hypothesis[j - 1] else 1
            table[i, j] = min(table[i - 1, j] + 1, table[i, j - 1] + 1, table[i - 1, j - 1] + cost)
    return table[-1, -1] / max(len(reference), 1)


def load_16k(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ar", "16000", "-ac", "1", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main() -> int:
    whisper_dir, script, audio_dir = (Path(arg) for arg in sys.argv[1:4])
    recognizer = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(whisper_dir / "small-encoder.int8.onnx"),
        decoder=str(whisper_dir / "small-decoder.int8.onnx"),
        tokens=str(whisper_dir / "small-tokens.txt"),
        language="id",
        task="transcribe",
        num_threads=4,
    )
    sentences = re.findall(r"^- `([a-z0-9-]+)`:\s*(.+?)\s*$", script.read_text(encoding="utf-8"), flags=re.M)
    total_errors = 0.0
    total_words = 0
    for line_id, text in sentences:
        stream = recognizer.create_stream()
        stream.accept_waveform(16000, load_16k(audio_dir / f"{line_id}.mp3"))
        recognizer.decode_stream(stream)
        heard = stream.result.text.strip()
        reference, hypothesis = normalise(text), normalise(heard)
        wer = word_error_rate(reference, hypothesis)
        total_errors += wer * len(reference)
        total_words += len(reference)
        flag = "" if wer <= 0.15 else "   <-- check"
        print(f"{line_id:<11} WER {wer:4.0%}{flag}\n   said : {text}\n   heard: {heard}")
    print(f"\noverall word error rate: {total_errors / total_words:.1%} over {total_words} words")
    return 0


if __name__ == "__main__":
    sys.exit(main())
