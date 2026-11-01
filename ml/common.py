"""Shared utilities, constants, dataset loader, and transforms for AgroLeaf AI ML pipeline."""

import csv
import os
import random
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

import numpy as np
import torch
import torchvision.transforms as T
from PIL import Image
from torch.utils.data import Dataset

# Contract: exact class order (index 0..5)
CLASS_KEYS = [
    "healthy",
    "blast",
    "brown_spot",
    "leaf_smut",
    "tungro",
    "sheath_blight",
]

CLASS_TO_IDX = {k: i for i, k in enumerate(CLASS_KEYS)}
IDX_TO_CLASS = {i: k for i, k in enumerate(CLASS_KEYS)}

# Preprocessing contract
PREPROCESS_CONFIG = {
    "resize_shorter": 256,
    "crop": 224,
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
    "color": "RGB",
    "layout": "NCHW",
}


def set_seed(seed: int = 42) -> None:
    """Set random seed across Python, NumPy, and PyTorch for deterministic behaviour."""
    random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def get_eval_transforms() -> Callable:
    """Deterministic validation/test preprocessing matching browser inference."""
    return T.Compose(
        [
            T.Resize(PREPROCESS_CONFIG["resize_shorter"]),
            T.CenterCrop(PREPROCESS_CONFIG["crop"]),
            T.ToTensor(),
            T.Normalize(
                mean=PREPROCESS_CONFIG["mean"],
                std=PREPROCESS_CONFIG["std"],
            ),
        ]
    )


def get_train_transforms() -> Callable:
    """Data augmentation for training split per dataset_preparation_plan.md §7."""
    return T.Compose(
        [
            T.RandomResizedCrop(
                PREPROCESS_CONFIG["crop"],
                scale=(0.6, 1.0),
            ),
            T.RandomHorizontalFlip(),
            T.RandomVerticalFlip(),
            T.RandomRotation(degrees=20),
            T.ColorJitter(
                brightness=0.3,
                contrast=0.3,
                saturation=0.2,
            ),
            T.RandomApply(
                [T.GaussianBlur(kernel_size=(3, 3), sigma=(0.1, 2.0))],
                p=0.2,
            ),
            T.ToTensor(),
            T.Normalize(
                mean=PREPROCESS_CONFIG["mean"],
                std=PREPROCESS_CONFIG["std"],
            ),
        ]
    )


class RiceLeafDataset(Dataset):
    """
    Dataset reading entries from splits.csv.
    Expected CSV columns: path, class_key, group_id, split
    """

    def __init__(
        self,
        data_root: str,
        splits_csv: str,
        split: Optional[str] = None,
        transform: Optional[Callable] = None,
    ):
        self.data_root = Path(data_root)
        self.transform = transform or get_eval_transforms()
        self.samples: List[Dict[str, str]] = []

        with open(splits_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if split is None or row.get("split") == split:
                    self.samples.append(row)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str]:
        item = self.samples[idx]
        rel_path = item["path"]
        full_path = self.data_root / rel_path

        with Image.open(full_path) as img:
            img_rgb = img.convert("RGB")

        tensor = self.transform(img_rgb)
        class_key = item.get("class_key", "")
        # -1 indicates __unseen__ or unknown class for OOD evaluation
        label = CLASS_TO_IDX.get(class_key, -1)

        return tensor, label, rel_path
