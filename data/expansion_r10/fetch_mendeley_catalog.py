import requests
import json
from collections import defaultdict

folders = [
    ('bacterial_leaf_blight', '5d9993f7-a2a8-4e09-9515-5459070966bd'),
    ('brown_spot', '4d18a347-e92d-4ce5-b179-2f781add2505'),
    ('Healthy', '74a999b1-fcb4-483b-aad2-02e1701dd7b8'),
    ('leaf_blast', 'a3e9be61-51ee-4794-a725-b73a9c9db468'),
    ('leaf_scald', '3a271352-7d29-48f7-b78e-aa251e6e830c'),
    ('narrow_brown_spot', 'c2dbfb59-e312-433f-a348-4b6efef8136a'),
    ('neck_blast', '05e36e69-0797-48d7-991b-fe21ffc584cf'),
    ('rice_hispa', '7510ee80-c24a-4dc0-ad94-d94dda320d85'),
    ('sheath_blight', '7901236a-e664-40f6-a709-53388107d49a'),
    ('tungro', '840a55fd-81f3-40d8-81b6-dc3ef4783bd8'),
]

headers = {'User-Agent': 'Mozilla/5.0'}
all_files = []

for name, fid in folders:
    url = f'https://data.mendeley.com/public-api/datasets/n8jpkpfz5p/files?folder_id={fid}&version=1'
    r = requests.get(url, headers=headers, timeout=15)
    if r.status_code == 200:
        items = r.json()
        print(f'{name:22s}: {len(items)} files. Sample names: {[x["filename"] for x in items[:3]]}')
        for it in items:
            it['folder_name'] = name
            all_files.append(it)
    else:
        print(f'{name}: Error {r.status_code}')

print(f'\nTotal files retrieved: {len(all_files)}')

# Check for aug or filename patterns
aug_count = 0
orig_count = 0
prefix_counts = defaultdict(int)

for it in all_files:
    fn = it['filename']
    if any(k in fn.lower() for k in ['aug', 'rot', 'flip', 'zoom']):
        aug_count += 1
    else:
        orig_count += 1
    prefix = fn.split('_')[0] if '_' in fn else 'none'
    prefix_counts[prefix] += 1

print(f'Augmented filename matches: {aug_count}, Non-augmented: {orig_count}')
print('Top filename prefixes:', sorted(prefix_counts.items(), key=lambda x: -x[1])[:15])

# Save catalog
with open('data/expansion_r10/mendeley_catalog.json', 'w') as f:
    json.dump(all_files, f, indent=2)
print('Saved data/expansion_r10/mendeley_catalog.json')
