import subprocess
import io
import json
import pandas as pd
from huggingface_hub import HfApi

def query_kaggle():
    queries = [
        'rice leaf disease',
        'paddy disease',
        'rice disease bangladesh',
        'sheath blight',
        'rice tungro',
        'rice leaf smut',
        'rice pest',
        'rice blast',
        'bacterial leaf blight',
        'paddy leaf',
        'rice leaf',
        'crop disease bangladesh'
    ]
    seen_refs = set()
    all_rows = []
    for q in queries:
        try:
            p = subprocess.run(['kaggle', 'datasets', 'list', '-s', q, '--csv'], capture_output=True, text=True)
            lines = [l for l in p.stdout.splitlines() if not l.startswith('Warning:')]
            if len(lines) > 1:
                df = pd.read_csv(io.StringIO('\n'.join(lines)))
                for _, row in df.iterrows():
                    ref = row.get('ref')
                    if ref and ref not in seen_refs:
                        seen_refs.add(ref)
                        all_rows.append(row.to_dict())
        except Exception as e:
            print(f"Error querying kaggle for {q}: {e}")
    print(f"Total unique Kaggle datasets found: {len(all_rows)}")
    return all_rows

def query_hf():
    api = HfApi()
    queries = [
        'rice disease',
        'rice leaf',
        'paddy disease',
        'paddy leaf',
        'rice blast',
        'rice blight',
        'rice tungro',
        'rice smut'
    ]
    seen_ids = set()
    all_hf = []
    for q in queries:
        try:
            ds = list(api.list_datasets(search=q))
            for d in ds:
                if d.id not in seen_ids:
                    seen_ids.add(d.id)
                    all_hf.append({
                        'id': d.id,
                        'author': getattr(d, 'author', None),
                        'description': getattr(d, 'description', None),
                        'downloads': getattr(d, 'downloads', None),
                        'tags': getattr(d, 'tags', [])
                    })
        except Exception as e:
            print(f"Error querying HF for {q}: {e}")
    print(f"Total unique Hugging Face datasets found: {len(all_hf)}")
    return all_hf

if __name__ == '__main__':
    kaggle_data = query_kaggle()
    hf_data = query_hf()
    with open('data/expansion_r10/candidates_kaggle.json', 'w', encoding='utf-8') as f:
        json.dump(kaggle_data, f, indent=2)
    with open('data/expansion_r10/candidates_hf.json', 'w', encoding='utf-8') as f:
        json.dump(hf_data, f, indent=2)
    print("Done writing candidates.")

