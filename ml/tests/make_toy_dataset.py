#!/usr/bin/env python3
"""
Generate a tiny synthetic dataset of 6 class folders x 12 random 320x320 JPEGs
for offline pipeline smoke testing on CPU.
"""

import argparse
import os
import numpy as np
from PIL import Image

CLASSES = [
    "Healthy",
    "Blast",
    "Brown spot",
    "Leaf smut",
    "Rice Tungro",
    "Sheath blight"
]


def make_toy_dataset(out_dir: str, images_per_class: int = 12):
    os.makedirs(out_dir, exist_ok=True)
    rng = np.random.RandomState(42)

    for class_name in CLASSES:
        class_dir = os.path.join(out_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)

        for i in range(images_per_class):
            # Generate random 320x320 image with distinct color tint per class
            base_color = rng.randint(40, 210, size=(3,), dtype=np.uint8)
            noise = rng.randint(-30, 30, size=(320, 320, 3), dtype=np.int16)
            img_arr = np.clip(base_color.reshape(1, 1, 3) + noise, 0, 255).astype(np.uint8)

            img = Image.fromarray(img_arr)
            img_path = os.path.join(class_dir, f"img_{i:03d}.jpg")
            img.save(img_path, format="JPEG", quality=90)

    print(f"Created toy dataset in '{out_dir}' with {len(CLASSES)} classes x {images_per_class} images = {len(CLASSES) * images_per_class} images.")


def main():
    parser = argparse.ArgumentParser(description="Create toy dataset for smoke testing")
    parser.add_argument("--out", type=str, default="ml/toy_data/raw", help="Output directory")
    parser.add_argument("--count", type=int, default=12, help="Images per class")
    args = parser.parse_args()

    make_toy_dataset(args.out, args.count)


if __name__ == "__main__":
    main()
