import os
import glob
import io
import json
import hashlib
import math
from collections import Counter
from pathlib import Path
import numpy as np
import pyarrow.parquet as pq
from PIL import Image, ImageOps
import imagehash
import onnxruntime as ort

CLASSES = ['healthy', 'blast', 'brown_spot', 'leaf_smut', 'tungro', 'sheath_blight', 'other_rice', 'not_rice']
DIU_MAP = {
    'healthy': 'healthy',
    'rice blast': 'blast',
    'rice tungro': 'tungro',
    'leaf scald': 'other_rice',
    'insect': 'other_rice',
    'rice leaffolder': 'other_rice',
    'rice stripes': 'other_rice'
}

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

def diu_half(ph):
    return 'A' if int(hashlib.md5(ph[:-1].encode()).hexdigest(), 16) % 2 == 0 else 'B'

def wilson_ci(k, n, z=1.95996):
    if n == 0:
        return 0.0, 0.0
    p = k / n
    denominator = 1.0 + (z**2) / n
    center = (p + (z**2) / (2 * n)) / denominator
    margin = (z / denominator) * math.sqrt((p * (1 - p) / n) + (z**2) / (4 * (n**2)))
    return max(0.0, center - margin), min(1.0, center + margin)

def preprocess_image(img_bytes, target_size=320):
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(img_bytes))).convert('RGB')
    w, h = im.size
    if max(w, h) > 1024:
        s = 1024.0 / max(w, h)
        im = im.resize((round(w * s), round(h * s)), Image.BILINEAR)
    
    ph = str(imagehash.phash(im))
    if diu_half(ph) != 'A':
        return None, ph
    
    # Resize shorter side to round(target_size * 8 / 7) = 366
    resize_shorter = round(target_size * 8 / 7)
    w, h = im.size
    if w < h:
        new_w, new_h = resize_shorter, round(h * resize_shorter / w)
    else:
        new_w, new_h = round(w * resize_shorter / h), resize_shorter
    
    im_resized = im.resize((new_w, new_h), Image.BILINEAR)
    
    # Center crop
    left = (new_w - target_size) // 2
    top = (new_h - target_size) // 2
    crop = im_resized.crop((left, top, left + target_size, top + target_size))
    
    arr = (np.asarray(crop).astype(np.float32) / 255.0 - MEAN) / STD
    chw = arr.transpose(2, 0, 1)
    return chw, ph

def main():
    repo_root = Path(__file__).resolve().parents[2]
    model_path = repo_root / 'frontend' / 'public' / 'models' / 'rice-effb0-v10-320.onnx'
    calib_path = repo_root / 'frontend' / 'public' / 'data' / 'calibration.json'

    with open(calib_path) as f:
        calib = json.load(f)

    temp = calib.get('temperature', 0.66)
    threshold = calib.get('threshold', 0.30)
    suppress = calib.get('suppress', ['leaf_smut'])
    healthy_thresh = calib.get('healthy_threshold', 0.90)

    cache_file = repo_root / 'model' / 'experiments' / 'f14_reliability' / 'results' / 'diu_half_a_v10_evaluated.json'
    if cache_file.exists():
        print(f'Loading cached predictions from {cache_file}...')
        with open(cache_file) as f:
            evaluated = json.load(f)
    else:
        # Load and run inference
        hf_pattern = 'C:/Users/DREAMER/.cache/huggingface/hub/datasets--Project-AgML--rice_disease_classification_bangladesh/**/raw/*.parquet'
        parquet_files = sorted(glob.glob(hf_pattern, recursive=True))
        if not parquet_files:
            raise FileNotFoundError('DIU parquet files not found in HF cache')

        sess = ort.InferenceSession(str(model_path), providers=['CPUExecutionProvider'])
        input_name = sess.get_inputs()[0].name

        names = ['Healthy', 'Insect', 'Leaf Scald', 'Rice', 'Rice Blast', 'Rice Leaffolder', 'Rice Stripes', 'Rice Tungro']

        print(f'Streaming DIU Half A and running inference row-by-row...')
        evaluated = []
        count = 0
        
        for p in parquet_files:
            pf = pq.ParquetFile(p)
            for batch in pf.iter_batches(batch_size=32):
                imgs = batch['image']
                labs = batch['label']
                for i in range(len(batch)):
                    raw_label = names[labs[i].as_py()]
                    key = DIU_MAP.get(raw_label.strip().lower().replace('_', ' '))
                    if key is None:
                        continue
                    img_bytes = imgs[i].as_py()['bytes']
                    chw, ph = preprocess_image(img_bytes)
                    if chw is None:
                        continue
                    
                    count += 1
                    # Run inference for this single sample
                    logits_1 = sess.run(None, {input_name: chw[None]})[0][0] # shape (8,)

                    # Temperature-scaled softmax
                    scaled = logits_1 / temp
                    scaled -= np.max(scaled)
                    exp = np.exp(scaled)
                    p_row = exp / np.sum(exp)

                    prob_map = {CLASSES[idx]: float(p_row[idx]) for idx in range(len(CLASSES))}
                    sorted_entries = sorted(prob_map.items(), key=lambda x: x[1], reverse=True)
                    top1_key, top1_prob = sorted_entries[0]

                    # Apply decide.js logic
                    if top1_key in ['not_rice', 'other_rice']:
                        decision = {'status': 'not_sure', 'reason': 'other_problem' if top1_key == 'other_rice' else 'not_leaf'}
                    elif top1_key in suppress:
                        decision = {'status': 'not_sure', 'reason': 'suppressed'}
                    elif top1_key == 'healthy' and top1_prob < healthy_thresh:
                        decision = {'status': 'not_sure', 'reason': 'healthy_needs_high_confidence'}
                    elif top1_prob < threshold:
                        decision = {'status': 'not_sure', 'reason': 'low_confidence'}
                    else:
                        decision = {'status': 'confident'}

                    is_correct = (top1_key == key)
                    evaluated.append({
                        'true_key': key,
                        'pred_key': top1_key,
                        'top_prob': round(float(top1_prob), 4),
                        'status': decision['status'],
                        'is_correct': is_correct,
                        'reason': decision.get('reason')
                    })
                    if count % 200 == 0:
                        print(f'Processed {count} / 1378 items...', flush=True)

        print(f'Total DIU Half A samples processed: {len(evaluated)}')
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'w') as f:
            json.dump(evaluated, f)
        print(f'Cached predictions to {cache_file}')

    # Search cut points
    # Candidate confident predictions
    conf_samples = [e for e in evaluated if e['status'] == 'confident']
    print(f'Confident samples: {len(conf_samples)} / {len(evaluated)} ({len(conf_samples)/len(evaluated):.1%})')

    # Joint search for cut points:
    # High: accuracy >= 0.95 and Wilson lower bound >= 0.90
    # Medium: accuracy >= 0.80 in [m, h)
    # Objective: maximize total confident coverage (n_high + n_med)
    candidates = []
    for h_int in range(50, 99):
        h = round(h_int / 100.0, 2)
        high_sub = [e for e in conf_samples if e['top_prob'] >= h]
        if not high_sub:
            continue
        k_h = sum(1 for e in high_sub if e['is_correct'])
        n_h = len(high_sub)
        acc_h = k_h / n_h
        ci_lo_h, ci_hi_h = wilson_ci(k_h, n_h)
        if acc_h < 0.95 or ci_lo_h < 0.90:
            continue
        
        for m_int in range(30, h_int):
            m = round(m_int / 100.0, 2)
            med_sub = [e for e in conf_samples if m <= e['top_prob'] < h]
            if not med_sub:
                continue
            k_m = sum(1 for e in med_sub if e['is_correct'])
            n_m = len(med_sub)
            acc_m = k_m / n_m
            ci_lo_m, ci_hi_m = wilson_ci(k_m, n_m)
            if acc_m >= 0.80:
                candidates.append({
                    'h': h,
                    'm': m,
                    'high': {
                        'cut': h,
                        'n': n_h,
                        'correct': k_h,
                        'accuracy': round(acc_h, 4),
                        'ci_low': round(ci_lo_h, 4),
                        'ci_high': round(ci_hi_h, 4)
                    },
                    'medium': {
                        'cut': m,
                        'n': n_m,
                        'correct': k_m,
                        'accuracy': round(acc_m, 4),
                        'ci_low': round(ci_lo_m, 4),
                        'ci_high': round(ci_hi_m, 4)
                    },
                    'total_coverage': n_h + n_m
                })

    print(f'Total candidate pairs satisfying criteria: {len(candidates)}')
    if not candidates:
        raise ValueError('No cut point pair satisfied high >= 0.95 (CI >= 0.90) and med >= 0.80')

    # Sort primarily by total coverage, then by high band count
    candidates.sort(key=lambda x: (x['total_coverage'], x['high']['n']), reverse=True)
    best_pair = candidates[0]
    best_high = best_pair['high']
    best_med = best_pair['medium']

    print(f"Selected Best High: {best_high}")
    print(f"Selected Best Medium: {best_med}")
    print(f"Total coverage in High + Medium: {best_pair['total_coverage']} / {len(conf_samples)}")

    # Compute stats for all 3 bands
    high_items = [e for e in conf_samples if e['top_prob'] >= best_high['cut']]
    med_items = [e for e in conf_samples if best_med['cut'] <= e['top_prob'] < best_high['cut']]
    not_sure_items = [e for e in evaluated if e['status'] == 'not_sure' or e['top_prob'] < best_med['cut']]

    def band_stats(items):
        n = len(items)
        k = sum(1 for e in items if e['is_correct'])
        acc = k / n if n > 0 else 0.0
        ci_lo, ci_hi = wilson_ci(k, n)
        return {
            'n': n,
            'correct': k,
            'accuracy': round(acc, 4),
            'ci_low': round(ci_lo, 4),
            'ci_high': round(ci_hi, 4)
        }

    bands_data = {
        'model': 'rice-effb0-v10-320',
        'dataset': 'DIU Bangladesh (Project-AgML) Half A',
        'dataset_n': len(evaluated),
        'cut_points': {
            'high': best_high['cut'],
            'medium': best_med['cut'] if best_med else None
        },
        'bands': {
            'high': {
                'condition': f"top_prob >= {best_high['cut']}",
                **band_stats(high_items),
                'per_class': dict(Counter(e['pred_key'] for e in high_items))
            },
            'medium': {
                'condition': f"{best_med['cut']} <= top_prob < {best_high['cut']}" if best_med else None,
                **(band_stats(med_items) if best_med else {}),
                'per_class': dict(Counter(e['pred_key'] for e in med_items)) if best_med else {}
            },
            'not_sure': {
                'condition': f"top_prob < {best_med['cut'] if best_med else best_high['cut']} or abstained by decide.js",
                **band_stats(not_sure_items),
                'reasons': dict(Counter(e.get('reason') or 'below_medium_cut' for e in not_sure_items))
            }
        }
    }

    print('\n=== FINAL BANDS RESULTS ===')
    print(json.dumps(bands_data, indent=2))

    # Save to model/experiments/f14_reliability/results/bands_v10.json
    out_dir = repo_root / 'model' / 'experiments' / 'f14_reliability' / 'results'
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / 'bands_v10.json', 'w') as f:
        json.dump(bands_data, f, indent=2)

    # Save to frontend/src/features/reliability/bands_v10.json
    fe_dir = repo_root / 'frontend' / 'src' / 'features' / 'reliability'
    fe_dir.mkdir(parents=True, exist_ok=True)
    with open(fe_dir / 'bands_v10.json', 'w') as f:
        json.dump(bands_data, f, indent=2)

    print(f'Saved bands_v10.json to {out_dir} and {fe_dir}')

if __name__ == '__main__':
    main()
