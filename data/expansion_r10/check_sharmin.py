from huggingface_hub import HfApi

api = HfApi()
files = api.list_repo_files('sharmin3/Rice-Leaf-Disease', repo_type='dataset')
print(f"sharmin3 files: {len(files)}")
print(files[:25])

