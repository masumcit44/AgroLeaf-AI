#!/usr/bin/env python3
"""
AgroLeaf AI — Offline Bangla TTS Audio Generator
Uses Azure Cognitive Services Speech REST API (Free F0 Tier)
Only standard library (urllib.request, json, xml.sax.saxutils, argparse, os, sys)
"""

import argparse
import datetime
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape


def parse_env_file(env_path: Path) -> dict:
    """Tiny zero-dependency .env parser."""
    env_vars = {}
    if not env_path.exists():
        return env_vars
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip("'\"")
    except Exception as e:
        print(f"Warning: Failed to parse .env file: {e}", file=sys.stderr)
    return env_vars


def get_azure_credentials(repo_root: Path) -> tuple[str, str]:
    """Retrieve Azure speech key and region from env or .env file."""
    env_file = repo_root / ".env"
    file_vars = parse_env_file(env_file)

    key = os.environ.get("AZURE_SPEECH_KEY") or file_vars.get("AZURE_SPEECH_KEY", "")
    region = os.environ.get("AZURE_SPEECH_REGION") or file_vars.get("AZURE_SPEECH_REGION", "")

    return key.strip(), region.strip()


def build_ssml(text: str, voice_name: str, prosody_rate: str = "-5%") -> str:
    """Build valid SSML document escaping raw text entities."""
    escaped_text = escape(text)
    return (
        f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="bn-BD">'
        f'<voice name="{voice_name}">'
        f'<prosody rate="{prosody_rate}">{escaped_text}</prosody>'
        f'</voice>'
        f'</speak>'
    )


def synthesize_speech(
    text: str, key: str, region: str, voice_name: str
) -> bytes:
    """Call Azure Speech REST API to generate MP3 audio bytes."""
    endpoint = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    ssml = build_ssml(text, voice_name)

    headers = {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "agroleaf-tts",
    }

    req = urllib.request.Request(
        endpoint,
        data=ssml.encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 200:
                return resp.read()
            raise RuntimeError(f"Azure Speech returned HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Azure Speech API Error (HTTP {e.code}): {err_body}") from e


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Bangla TTS MP3s for AgroLeaf AI.")
    parser.add_argument(
        "--voice",
        default="bn-BD-NabanitaNeural",
        choices=["bn-BD-NabanitaNeural", "bn-BD-PradeepNeural"],
        help="Azure Neural TTS voice (default: bn-BD-NabanitaNeural)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Calculate and print character counts without invoking Azure API",
    )
    parser.add_argument(
        "--only",
        type=str,
        default=None,
        help="Synthesize audio only for a specific class key (e.g. blast)",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent.parent
    bn_json_path = repo_root / "disease_knowledge" / "disease_information_bn.json"
    output_dir = repo_root / "frontend" / "public" / "audio"
    manifest_path = output_dir / "manifest.json"

    if not bn_json_path.exists():
        print(f"Error: {bn_json_path} does not exist.", file=sys.stderr)
        return 1

    with open(bn_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    classes_dict = data.get("classes", {})
    keys_to_process = list(classes_dict.keys())
    if args.only:
        if args.only not in classes_dict:
            print(f"Error: Class '{args.only}' not found in disease_information_bn.json", file=sys.stderr)
            return 1
        keys_to_process = [args.only]

    total_chars = 0
    items = []

    for k in keys_to_process:
        info = classes_dict[k]
        script = info.get("voice_script_bn", "")
        if not script:
            print(f"Warning: Class '{k}' has no voice_script_bn defined.", file=sys.stderr)
            continue
        c_count = len(script)
        total_chars += c_count
        items.append((k, script, c_count))

    print("=" * 60)
    print("AgroLeaf AI — Bangla TTS Voice Synthesis Plan")
    print(f"Selected Voice: {args.voice}")
    print(f"Total Targets:  {len(items)} classes")
    print("-" * 60)
    for k, _, c_count in items:
        print(f"  • {k:<15}: {c_count:>4} characters")
    print("-" * 60)
    print(f"Total Characters: {total_chars} / 500,000 monthly free tier quota")
    print("=" * 60)

    # Budget guard: Refuse API execution if total exceeds 20,000 characters
    if total_chars > 20000:
        print("Error: Total character count exceeds safety cap of 20,000.", file=sys.stderr)
        return 1

    if args.dry_run:
        print("\n[Dry-run] Character count audit passed. No external network requests made.")
        return 0

    key, region = get_azure_credentials(repo_root)
    if not key or not region:
        print("\nError: Azure credentials missing. Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION", file=sys.stderr)
        print("either as environment variables or in a root '.env' file.", file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = {}
    if manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            manifest = {}

    print(f"\nSynthesizing {len(items)} audio files using Azure Speech region '{region}'...")

    for k, script, c_count in items:
        out_filename = f"{k}-v1.mp3"
        out_filepath = output_dir / out_filename
        print(f"  Generating {k} -> {out_filename} ({c_count} chars)...", end="", flush=True)

        try:
            mp3_bytes = synthesize_speech(script, key, region, args.voice)
            with open(out_filepath, "wb") as f_out:
                f_out.write(mp3_bytes)
            print(" [OK]")

            manifest[k] = {
                "file": f"/audio/{out_filename}",
                "voice": args.voice,
                "chars": c_count,
                "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }
        except Exception as e:
            print(f" [FAILED: {e}]")
            return 1

    with open(manifest_path, "w", encoding="utf-8") as f_man:
        json.dump(manifest, f_man, indent=2, ensure_ascii=False)

    print(f"\nManifest successfully updated at: {manifest_path}")
    print("All audio files ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
