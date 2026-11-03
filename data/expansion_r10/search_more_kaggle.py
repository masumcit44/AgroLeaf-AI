import subprocess
import io
import json
import pandas as pd

def search(q):
    p = subprocess.run(['kaggle', 'datasets', 'list', '-s', q, '--csv'], capture_output=True, text=True)
    lines = [l for l in p.stdout.splitlines() if not l.startswith('Warning:')]
    if len(lines) > 1:
        return pd.read_csv(io.StringIO('\n'.join(lines)))
    return pd.DataFrame()

queries = [
    'rice leaf diseases',
    'rice blast',
    'rice brown spot',
    'rice tungro',
    'rice sheath blight',
    'rice bacterial blight',
    'paddy leaf blast',
    'paddy pest',
    'rice pest',
    'rice false smut',
    'rice hispa'
]

results = []
seen = set()
for q in queries:
    df = search(q)
    for _, row in df.iterrows():
        ref = row.get('ref')
        if ref and ref not in seen:
            seen.add(ref)
            results.append({
                'ref': ref,
                'title': str(row.get('title')),
                'size': int(row.get('size')) if pd.notnull(row.get('size')) else 0,
                'lastUpdated': str(row.get('lastUpdated')),
                'query': q
            })

with open('data/expansion_r10/candidates_kaggle_specialized.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print(f"Total datasets found: {len(results)}")
for r in results[:30]:
    print(f"{r['ref']:45s} | {r['size']:10d} | {r['title']}")
