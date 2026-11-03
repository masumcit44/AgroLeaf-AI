import json

with open('data/expansion_r10/candidates_kaggle_specialized.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Total: {len(items)}")
for i, r in enumerate(items[30:], 31):
    ref = r['ref']
    sz = r['size']
    title = r['title']
    print(f"{i:2d}. {ref:45s} | {sz:10d} | {title}")

