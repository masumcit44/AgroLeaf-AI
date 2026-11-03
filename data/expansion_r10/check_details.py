import subprocess
import json
import sys
from huggingface_hub import HfApi

sys.stdout.reconfigure(encoding='utf-8')

print("=== Checking HF Sharmin ===")
api = HfApi()
try:
    info = api.dataset_info('sharmin3/Rice-Leaf-Disease')
    print('sharmin3/Rice-Leaf-Disease:', info.description, info.tags)
except Exception as e:
    print('sharmin error:', e)

print("\n=== Checking HF LeafNet75 ===")
try:
    info = api.dataset_info('LeafNet75/Rice-Disease-Classification-Dataset')
    print('LeafNet75:', info.description, info.tags)
except Exception as e:
    print('LeafNet75 error:', e)

print("\n=== Checking HF minhhungg ===")
try:
    info = api.dataset_info('minhhungg/rice-disease-dataset')
    print('minhhungg:', (info.description or '')[:200], info.tags)
except Exception as e:
    print('minhhungg error:', e)

print("\n=== Checking Kaggle nafishamoin/new-bangladeshi-crop-disease ===")
try:
    p = subprocess.run(['kaggle', 'datasets', 'files', 'nafishamoin/new-bangladeshi-crop-disease'], capture_output=True, text=True)
    for line in p.stdout.splitlines()[:20]:
        print(line)
except Exception as e:
    print('kaggle nafishamoin error:', e)

print("\n=== Checking Kaggle alamshihab075/rice-leaf-disease-an-images-dataset ===")
try:
    p = subprocess.run(['kaggle', 'datasets', 'files', 'alamshihab075/rice-leaf-disease-an-images-dataset'], capture_output=True, text=True)
    for line in p.stdout.splitlines()[:20]:
        print(line)
except Exception as e:
    print('kaggle alamshihab error:', e)

