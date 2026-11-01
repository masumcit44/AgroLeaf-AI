#!/usr/bin/env python3
"""
Resize raw dataset images to 320x320 (short side 320 + center crop, JPEG quality 92)
preserving directory structure for fast Kaggle upload. Never modifies the source.
"""

import argparse
from pathlib import Path
from PIL import Image

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def resize_image(src_path: Path, dest_path: Path, size: int = 320, quality: int = 92) -> None:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src_path) as img:
        img_rgb = img.convert("RGB")
        w, h = img_rgb.size
        # Resize shorter side to size
        if w < h:
            new_w = size
            new_h = int(round(h * (size / w)))
        else:
            new_h = size
            new_w = int(round(w * (size / h)))

        resized = img_rgb.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Center crop to size x size
        left = (new_w - size) // 2
        top = (new_h - size) // 2
        cropped = resized.crop((left, top, left + size, top + size))

        # Always save as .jpg
        dest_jpg = dest_path.with_suffix(".jpg")
        cropped.save(dest_jpg, format="JPEG", quality=quality)


def main():
    parser = argparse.ArgumentParser(description="Resize dataset images for fast upload")
    parser.add_argument("--src", type=Path, required=True, help="Path to raw dataset root")
    parser.add_argument("--out", type=Path, required=True, help="Destination directory")
    parser.add_argument("--size", type=int, default=320, help="Target crop size (default: 320)")
    parser.add_argument("--quality", type=int, default=92, help="JPEG quality (default: 92)")
    args = parser.parse_args()

    src_root = args.src.resolve()
    out_root = args.out.resolve()

    if not src_root.exists():
        raise FileNotFoundError(f"Source directory does not exist: {src_root}")

    image_paths = sorted([p for p in src_root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS])
    print(f"Found {len(image_paths)} images in {src_root}")

    success_count = 0
    fail_count = 0

    for idx, p in enumerate(image_paths):
        rel_path = p.relative_to(src_root)
        dest_path = out_root / rel_path
        try:
            resize_image(p, dest_path, size=args.size, quality=args.quality)
            success_count += 1
        except Exception as e:
            print(f"Failed to process {rel_path}: {e}")
            fail_count += 1

        if (idx + 1) % 500 == 0 or (idx + 1) == len(image_paths):
            print(f"Processed {idx + 1}/{len(image_paths)} images...")

    print(f"Done. Successfully resized: {success_count}, Failed: {fail_count}. Output saved to {out_root}")


if __name__ == "__main__":
    main()
