import requests
import json

r = requests.get('https://data.mendeley.com/datasets/n8jpkpfz5p/1', timeout=10)
idx = r.text.find('window.INITIAL_STATE = ')
if idx != -1:
    line = r.text[idx:].splitlines()[0]
    raw_json = line[len('window.INITIAL_STATE = '):].strip()
    if raw_json.endswith(';'):
        raw_json = raw_json[:-1]
    data = json.loads(raw_json)
    print("Keys in state:", list(data.keys()))
    for k in ['files', 'dataset', 'archive']:
        if k in data:
            print(k, "->", str(data[k])[:300])
