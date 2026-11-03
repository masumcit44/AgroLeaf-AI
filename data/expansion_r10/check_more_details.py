import subprocess

for ref in [
    'hadiurrahmannabil/rice-leaf-spot-disease-annotated-dataset',
    'nashehannafii/datasetleafblast',
    'abuabdurrahman1101/rice-disease-leaves',
    'tairoooo/rice-leaf-disease-dataset',
    'xuzhangliu/ricepest-6-rice-pest-and-disease-dataset'
]:
    print(f"=== {ref} ===")
    p = subprocess.run(['kaggle', 'datasets', 'files', ref], capture_output=True, text=True)
    lines = [l.split()[0] for l in p.stdout.splitlines() if not l.startswith('Warning:') and not l.startswith('Next Page') and not l.startswith('name') and not l.startswith('--') and l.strip()]
    print(f"Found {len(lines)} files listed (first page). Sample:")
    print(lines[:8])
    print()

