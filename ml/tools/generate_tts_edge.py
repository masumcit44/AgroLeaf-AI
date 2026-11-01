#!/usr/bin/env python3
"""
AgroLeaf AI — offline Bangla voice clips with edge-tts (no key, no account).

A one-time local tool: it reads each class's approved `voice_script_bn` from
disease_knowledge/disease_information_bn.json, unchanged, and writes
<class>-v1.mp3 plus manifest.json in the format the app reads
({class: {file, voice, chars, generated_at}}). The website never calls a
speech service; it only plays these fixed files.

Requires: pip install edge-tts (run it in a throwaway virtual environment).
Usage: python ml/tools/generate_tts_edge.py [--voice bn-BD-NabanitaNeural] [--rate=-10%] [--out-dir DIR]
"""

import argparse
import asyncio
import datetime
import json
import sys
from pathlib import Path

import edge_tts

VOICES = ["bn-BD-NabanitaNeural", "bn-BD-PradeepNeural"]


async def synthesize(text: str, voice: str, rate: str, out: Path) -> None:
    await edge_tts.Communicate(text, voice, rate=rate).save(str(out))


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    ap = argparse.ArgumentParser(description="Generate the fixed Bangla MP3 clips with edge-tts.")
    ap.add_argument("--voice", default=VOICES[0], choices=VOICES)
    ap.add_argument("--rate", default="-10%", help="speaking rate relative to default, e.g. -10%%")
    ap.add_argument("--out-dir", type=Path, default=repo_root / "frontend" / "public" / "audio")
    args = ap.parse_args()

    classes = json.loads((repo_root / "disease_knowledge" / "disease_information_bn.json").read_text(encoding="utf-8"))["classes"]
    args.out_dir.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for key, info in classes.items():
        text = info.get("voice_script_bn", "")
        if not text:
            print(f"skip {key}: no voice_script_bn", file=sys.stderr)
            continue
        name = f"{key}-v1.mp3"
        asyncio.run(synthesize(text, args.voice, args.rate, args.out_dir / name))
        manifest[key] = {
            "file": f"/audio/{name}",
            "voice": f"{args.voice} (edge-tts, rate {args.rate})",
            "chars": len(text),
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        }
        print(f"{name}: {(args.out_dir / name).stat().st_size} bytes")
    (args.out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
