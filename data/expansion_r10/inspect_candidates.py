import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/expansion_r10/candidates_kaggle.json', 'r', encoding='utf-8') as f:
    k = json.load(f)
print(f"Kaggle total: {len(k)}")
for i, x in enumerate(k[:35]):
    ref = x.get('ref')
    title = x.get('title')
    sz = x.get('size')
    print(f"{i+1:2d}. {ref:55s} | {title} | {sz}")

print("\n" + "="*80 + "\n")

with open('data/expansion_r10/candidates_hf.json', 'r', encoding='utf-8') as f:
    h = json.load(f)
print(f"HF total: {len(h)}")
for i, x in enumerate(h[:35]):
    hid = x.get('id')
    desc = (x.get('description') or '')[:60].replace('\n', ' ')
    print(f"{i+1:2d}. {hid:45s} | {desc}")

