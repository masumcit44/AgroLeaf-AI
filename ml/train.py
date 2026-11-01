#!/usr/bin/env python3
"""
Train MobileNetV3 (Large or Small) with two-stage transfer learning,
class weighting, label smoothing, and validation macro-F1 early stopping.
"""

import argparse
import csv
import json
from collections import Counter
from pathlib import Path
from typing import Tuple

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, f1_score
from torch.utils.data import DataLoader
from torchvision.models import (
    MobileNet_V3_Large_Weights,
    MobileNet_V3_Small_Weights,
    mobilenet_v3_large,
    mobilenet_v3_small,
)

from common import (
    CLASS_KEYS,
    PREPROCESS_CONFIG,
    RiceLeafDataset,
    get_eval_transforms,
    get_train_transforms,
    set_seed,
)


def build_model(arch: str, num_classes: int, pretrained: bool = True) -> nn.Module:
    if arch == "mnv3_large":
        weights = MobileNet_V3_Large_Weights.IMAGENET1K_V2 if pretrained else None
        model = mobilenet_v3_large(weights=weights)
    elif arch == "mnv3_small":
        weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1 if pretrained else None
        model = mobilenet_v3_small(weights=weights)
    else:
        raise ValueError(f"Unsupported architecture: {arch}. Choose 'mnv3_large' or 'mnv3_small'.")

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    return model


def evaluate_split(model: nn.Module, loader: DataLoader, criterion: nn.Module, device: torch.device) -> Tuple[float, float, float]:
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels, _ in loader:
            images = images.to(device)
            labels = labels.to(device)
            logits = model(images)
            loss = criterion(logits, labels)

            total_loss += loss.item() * len(labels)
            preds = logits.argmax(dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_targets.extend(labels.cpu().numpy())

    avg_loss = total_loss / max(len(all_targets), 1)
    acc = accuracy_score(all_targets, all_preds)
    macro_f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0)
    return avg_loss, acc, macro_f1


def train(args):
    set_seed(args.seed)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Determine device
    if args.device == "auto":
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    else:
        device = torch.device(args.device)

    print(f"Training using device: {device}, architecture: {args.arch}")

    # Datasets and Loaders
    train_dataset = RiceLeafDataset(
        data_root=args.data_root,
        splits_csv=args.splits,
        split="train",
        transform=get_train_transforms(),
    )
    val_dataset = RiceLeafDataset(
        data_root=args.data_root,
        splits_csv=args.splits,
        split="val",
        transform=get_eval_transforms(),
    )

    print(f"Train samples: {len(train_dataset)}, Val samples: {len(val_dataset)}")

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch,
        shuffle=True,
        num_workers=args.num_workers,
        pin_memory=(device.type == "cuda"),
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch,
        shuffle=False,
        num_workers=args.num_workers,
        pin_memory=(device.type == "cuda"),
    )

    # Calculate class imbalance weighting
    train_labels = [CLASS_KEYS.index(s["class_key"]) for s in train_dataset.samples]
    label_counts = Counter(train_labels)
    num_classes = len(CLASS_KEYS)

    # Handle potentially missing classes in very small datasets safely
    for c in range(num_classes):
        label_counts.setdefault(c, 1)

    max_c, min_c = max(label_counts.values()), max(min(label_counts.values()), 1)
    if max_c / min_c > 2.0:
        inv_sqrt = [1.0 / np.sqrt(label_counts[i]) for i in range(num_classes)]
        sum_weights = sum(inv_sqrt)
        class_weights = torch.tensor(
            [w / sum_weights * num_classes for w in inv_sqrt],
            dtype=torch.float32,
            device=device,
        )
        print(f"Class imbalance ratio {max_c/min_c:.2f} > 2.0. Applying class weights: {class_weights.tolist()}")
        criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=0.1)
    else:
        print(f"Class imbalance ratio {max_c/min_c:.2f} <= 2.0. Uniform weights.")
        criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    # Model initialization
    model = build_model(args.arch, num_classes=num_classes, pretrained=(not args.no_pretrained))
    model.to(device)

    # Two-stage schedule
    total_epochs = args.epochs
    if total_epochs <= 3:
        stage1_epochs = min(1, total_epochs)
        stage2_epochs = total_epochs - stage1_epochs
    else:
        stage1_epochs = 3
        stage2_epochs = total_epochs - stage1_epochs

    history = []
    best_macro_f1 = -1.0
    best_epoch = -1
    patience = 5
    patience_counter = 0

    best_pt_path = out_dir / "best.pt"

    current_epoch = 1

    # Stage 1: Freeze features, train classifier
    if stage1_epochs > 0:
        print(f"\n--- Stage 1: Frozen backbone ({stage1_epochs} epochs, lr 1e-3) ---")
        for p in model.features.parameters():
            p.requires_grad = False
        optimizer_s1 = torch.optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)

        for ep in range(stage1_epochs):
            model.train()
            train_loss = 0.0
            for images, labels, _ in train_loader:
                images, labels = images.to(device), labels.to(device)
                optimizer_s1.zero_grad()
                logits = model(images)
                loss = criterion(logits, labels)
                loss.backward()
                optimizer_s1.step()
                train_loss += loss.item() * len(labels)

            train_loss /= max(len(train_dataset), 1)
            val_loss, val_acc, val_f1 = evaluate_split(model, val_loader, criterion, device)
            print(
                f"Epoch {current_epoch:02d} [Stage 1] | Train Loss: {train_loss:.4f} | "
                f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f} | Val Macro-F1: {val_f1:.4f}"
            )
            history.append(
                {
                    "epoch": current_epoch,
                    "stage": 1,
                    "train_loss": round(train_loss, 4),
                    "val_loss": round(val_loss, 4),
                    "val_acc": round(val_acc, 4),
                    "val_macro_f1": round(val_f1, 4),
                    "lr": 1e-3,
                }
            )

            if val_f1 > best_macro_f1:
                best_macro_f1 = val_f1
                best_epoch = current_epoch
                torch.save({"model_state_dict": model.state_dict(), "arch": args.arch}, best_pt_path)

            current_epoch += 1

    # Stage 2: Unfreeze backbone with cosine decay
    if stage2_epochs > 0:
        print(f"\n--- Stage 2: Full fine-tuning ({stage2_epochs} epochs, lr 1e-4, cosine schedule) ---")
        for p in model.features.parameters():
            p.requires_grad = True

        optimizer_s2 = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer_s2, T_max=stage2_epochs, eta_min=1e-6)

        for ep in range(stage2_epochs):
            model.train()
            train_loss = 0.0
            for images, labels, _ in train_loader:
                images, labels = images.to(device), labels.to(device)
                optimizer_s2.zero_grad()
                logits = model(images)
                loss = criterion(logits, labels)
                loss.backward()
                optimizer_s2.step()
                train_loss += loss.item() * len(labels)

            train_loss /= max(len(train_dataset), 1)
            val_loss, val_acc, val_f1 = evaluate_split(model, val_loader, criterion, device)
            current_lr = scheduler.get_last_lr()[0]
            scheduler.step()

            print(
                f"Epoch {current_epoch:02d} [Stage 2] | Train Loss: {train_loss:.4f} | "
                f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f} | Val Macro-F1: {val_f1:.4f} | LR: {current_lr:.2e}"
            )
            history.append(
                {
                    "epoch": current_epoch,
                    "stage": 2,
                    "train_loss": round(train_loss, 4),
                    "val_loss": round(val_loss, 4),
                    "val_acc": round(val_acc, 4),
                    "val_macro_f1": round(val_f1, 4),
                    "lr": current_lr,
                }
            )

            if val_f1 > best_macro_f1:
                best_macro_f1 = val_f1
                best_epoch = current_epoch
                patience_counter = 0
                torch.save({"model_state_dict": model.state_dict(), "arch": args.arch}, best_pt_path)
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"Early stopping triggered after {patience} epochs without validation macro-F1 gain.")
                    break

            current_epoch += 1

    print(f"\nTraining completed. Best validation macro-F1: {best_macro_f1:.4f} at epoch {best_epoch}")

    # Ensure best checkpoint exists (if no epoch beat initial -1)
    if not best_pt_path.exists():
        torch.save({"model_state_dict": model.state_dict(), "arch": args.arch}, best_pt_path)

    # Save history.csv
    history_csv = out_dir / "history.csv"
    with open(history_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["epoch", "stage", "train_loss", "val_loss", "val_acc", "val_macro_f1", "lr"]
        )
        writer.writeheader()
        writer.writerows(history)
    print(f"Saved training history to {history_csv}")

    # Save class_index.json
    class_index_path = out_dir / "class_index.json"
    with open(class_index_path, "w", encoding="utf-8") as f:
        json.dump({"classes": CLASS_KEYS, "version": "v1"}, f, indent=2)
    print(f"Saved class index to {class_index_path}")

    # Save preprocess.json
    preprocess_path = out_dir / "preprocess.json"
    with open(preprocess_path, "w", encoding="utf-8") as f:
        json.dump(PREPROCESS_CONFIG, f, indent=2)
    print(f"Saved preprocess config to {preprocess_path}")


def main():
    parser = argparse.ArgumentParser(description="Train MobileNetV3 for AgroLeaf AI")
    parser.add_argument("--data-root", type=str, required=True, help="Root folder of image dataset")
    parser.add_argument("--splits", type=str, required=True, help="Path to splits.csv")
    parser.add_argument("--out", type=str, required=True, help="Output directory for model artefacts")
    parser.add_argument("--arch", type=str, choices=["mnv3_large", "mnv3_small"], default="mnv3_large", help="Model architecture")
    parser.add_argument("--epochs", type=int, default=20, help="Total epochs")
    parser.add_argument("--batch", type=int, default=32, help="Batch size")
    parser.add_argument("--device", type=str, default="auto", help="auto, cpu, or cuda")
    parser.add_argument("--num-workers", type=int, default=0, help="DataLoader num_workers")
    parser.add_argument("--no-pretrained", action="store_true", help="Initialize without pretrained ImageNet weights")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    train(args)


if __name__ == "__main__":
    main()
