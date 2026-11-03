import requests, re, json
r = requests.get('https://data.mendeley.com/datasets/n8jpkpfz5p/1', timeout=10)
# search for script tags with json
scripts = re.findall(r'<script[^>]*>(.*?)</script>', r.text, re.DOTALL)
for s in scripts:
    if 'n8jpkpfz5p' in s or 'download' in s:
        print('Found script of length', len(s))
        for line in s.splitlines():
            if any(k in line.lower() for k in ['download', 'file', 'direct_url', 'zip', 'size']):
                print('  ', line[:120])
