#!/usr/bin/env python3
"""
AgroLeaf AI — offline Bangla voice clips with edge-tts (no key, no account).

A one-time local tool: it reads each approved `voice_script_bn`, unchanged, from
disease_knowledge/disease_information_bn.json (one per class) and
disease_knowledge/voice_outcomes_bn.json (screens that name no disease: not a rice
leaf, other rice problem, healthy caution). It writes <key>-v1.mp3 plus manifest.json
in the format the app reads ({key: {file, voice, chars, script, generated_at}}).
The website never calls a speech service; it only plays these fixed files.

Every clip is checked: the words edge-tts reports speaking must cover the script
(word-boundary events), so a cut-off or wrong clip fails loudly.

Requires: pip install edge-tts (run it in a throwaway virtual environment).
Usage: python ml/tools/generate_tts_edge.py [--voice bn-BD-NabanitaNeural] [--rate=-10%]
           [--only key1,key2] [--out-dir DIR]
  --only regenerates just those clips and keeps the other manifest entries as they are.
"""

import argparse
import asyncio
import datetime
import json
import re
import sys
from pathlib import Path

import edge_tts

VOICES = ["bn-BD-NabanitaNeural", "bn-BD-PradeepNeural"]


async def synthesize(text: str, voice: str, rate: str, out: Path) -> list[str]:
    """Write the MP3 and return the sentences edge-tts reports speaking.
    The Bangla voices report sentence boundaries, not word boundaries. The service
    sometimes answers with no audio, so each clip gets three tries."""
    for attempt in range(3):
        audio, spoken = bytearray(), []
        try:
            async for chunk in edge_tts.Communicate(text, voice, rate=rate, boundary="SentenceBoundary").stream():
                if chunk["type"] == "audio":
                    audio += chunk["data"]
                elif chunk["type"] == "SentenceBoundary":
                    spoken.append(chunk["text"])
        except edge_tts.exceptions.NoAudioReceived:
            if attempt == 2:
                raise
            await asyncio.sleep(2)
            continue
        out.write_bytes(bytes(audio))
        return spoken


def tokens(s: str) -> list[str]:
    return re.findall(r"[\wঀ-৿]+", s)


def load_scripts(repo_root: Path) -> dict:
    kb = repo_root / "disease_knowledge"
    classes = json.loads((kb / "disease_information_bn.json").read_text(encoding="utf-8"))["classes"]
    outcomes = json.loads((kb / "voice_outcomes_bn.json").read_text(encoding="utf-8"))["outcomes"]
    scripts = {k: v.get("voice_script_bn", "") for k, v in classes.items()}
    clash = set(scripts) & set(outcomes)
    if clash:
        sys.exit(f"keys defined twice: {sorted(clash)}")
    scripts.update({k: v["voice_script_bn"] for k, v in outcomes.items()})
    return scripts


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    ap = argparse.ArgumentParser(description="Generate the fixed Bangla MP3 clips with edge-tts.")
    ap.add_argument("--voice", default=VOICES[0], choices=VOICES)
    ap.add_argument("--rate", default="-10%", help="speaking rate relative to default, e.g. -10%%")
    ap.add_argument("--only", default="", help="comma-separated keys to (re)generate; others are kept")
    ap.add_argument("--out-dir", type=Path, default=repo_root / "frontend" / "public" / "audio")
    args = ap.parse_args()

    scripts = load_scripts(repo_root)
    only = [k for k in args.only.split(",") if k]
    unknown = [k for k in only if k not in scripts]
    if unknown:
        sys.exit(f"unknown keys: {unknown}")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = args.out_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    for key, text in scripts.items():
        if not text:
            print(f"skip {key}: no voice_script_bn", file=sys.stderr)
            continue
        if only and key not in only:
            if key in manifest:
                manifest[key]["script"] = text  # the transcript the app shows next to this clip
            continue
        name = f"{key}-v1.mp3"
        spoken = asyncio.run(synthesize(text, args.voice, args.rate, args.out_dir / name))
        missing = [w for w in tokens(text) if w not in set(tokens(" ".join(spoken)))]
        if missing:
            sys.exit(f"{name}: words not spoken: {missing}")
        manifest[key] = {
            "file": f"/audio/{name}",
            "voice": f"{args.voice} (edge-tts, rate {args.rate})",
            "chars": len(text),
            "script": text,
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        }
        print(f"{name}: {(args.out_dir / name).stat().st_size} bytes, {len(spoken)} sentences spoken, every script word covered")
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
