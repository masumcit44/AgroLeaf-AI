"""Pre-generate genuine Bengali audio for every FIXED copilot answer.

The copilot's answers come from a fixed knowledge base, so each one can be voiced in advance with
the same engine as the result-screen clips (edge-tts, bn-BD-NabanitaNeural, via
generate_tts_edge.synthesize). The browser then plays the MP3 whose key matches the answer shown
on screen (first 16 hex of SHA-256 of the cleaned text; see voiceService.audioKeyFor).

Usage (from the repo root, with edge-tts installed):
  node frontend/scripts/collect_copilot_texts.mjs copilot_texts.json
  python ml/tools/build_copilot_audio.py copilot_texts.json
Writes frontend/public/audio/copilot/<key>.mp3 and manifest.json; existing files are kept
(only missing ones are generated), so reruns are cheap.
Note: edge-tts uses Microsoft's online voice service without an account; it is free but not a
guaranteed service. Files are generated once at build time; the app never calls it.
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_tts_edge import synthesize  # noqa: E402  (same proven generator as the result clips)

VOICE = "bn-BD-NabanitaNeural"
RATE = "-10%"
RETRIES = 3


async def build(items, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest, failures, generated, short = {}, [], 0, []
    for i, item in enumerate(items, 1):
        key, text = item["key"], item["text"]
        mp3 = out_dir / f"{key}.mp3"
        if not (mp3.exists() and mp3.stat().st_size > 1000):
            for attempt in range(1, RETRIES + 1):
                try:
                    spoken = await synthesize(text, VOICE, RATE, mp3)
                    # completeness: the service reports the sentences it actually spoke
                    said = len("".join("".join(spoken).split()))
                    if said < 0.85 * len("".join(text.split())):
                        short.append(key)
                    if mp3.stat().st_size > 1000:
                        generated += 1
                        break
                except Exception as err:  # network hiccup / NoAudioReceived: retry
                    print(f"  retry {attempt} {key}: {err}", file=sys.stderr)
                    await asyncio.sleep(2 * attempt)
            else:
                failures.append(key)
                continue
        manifest[key] = f"/audio/copilot/{key}.mp3"
        if i % 20 == 0:
            print(f"  {i}/{len(items)}")
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=0, sort_keys=True), encoding="utf-8")
    total = sum(p.stat().st_size for p in out_dir.glob("*.mp3"))
    biggest = max((p.stat().st_size for p in out_dir.glob("*.mp3")), default=0)
    return {"answers": len(items), "in_manifest": len(manifest), "generated_now": generated,
            "failed": failures, "spoken_shorter_than_text": short, "total_mb": round(total / 2**20, 2), "largest_kb": round(biggest / 1024)}


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    items = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out_dir = Path(__file__).resolve().parents[2] / "frontend" / "public" / "audio" / "copilot"
    report = asyncio.run(build(items, out_dir))
    print(json.dumps(report))
    return 1 if report["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
