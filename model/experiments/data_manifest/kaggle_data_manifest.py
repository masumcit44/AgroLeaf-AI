"""AgroLeaf AI consolidated rice-leaf image manifest (CPU only; no training, no model).

For every image in the attached rice datasets (plus one Hugging Face set): source, licence, country,
capture type, role, raw folder label, mapped app class, MD5, pHash, size and a white-background score.
Then: exact duplicates (MD5) and near-duplicate clusters (pHash <= 4 bits) across ALL sources,
cross-source overlap, label conflicts inside clusters, and unique-image counts per class.

Roles: train_pool = may be used for training; final_test_used = Sylhet and Gujarat (already read once,
never train on them); test_diu = the v5/v6 DIU test (never train on it); mirror_check = a second copy
of a source kept only to measure overlap. Augmented folders are excluded everywhere.
Outputs (/kaggle/working/manifest): manifest.csv.gz, summary.json, summary.md.
"""
import csv, gzip, hashlib, io, json, os, sys, time, urllib.request
from collections import Counter, defaultdict
from multiprocessing import Pool
from subprocess import run

run([sys.executable, "-m", "pip", "install", "-q", "imagehash"])
import numpy as np, imagehash, pyarrow.parquet as pq
from PIL import Image, ImageOps

IN = "/kaggle/input" if os.path.isdir("/kaggle/input") else sys.argv[1]
W = "/kaggle/working" if os.path.isdir("/kaggle/working") else sys.argv[2]
OUT = f"{W}/manifest"; os.makedirs(OUT, exist_ok=True)
IMG = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
NEAR = 4

# token (in the path) -> source id, country, region, licence, capture, role. First match wins.
SOURCES = [
    ("riceleafdiseasebd", "gazipur_bd", "BD", "Gazipur", "CC BY 4.0 (Mendeley 10.17632/86s4jzj2m4.3)", "field", "train_pool"),
    ("riceleafdisease-bd5", "savar_bd", "BD", "Savar, Dhaka", "CC BY 4.0 (Mendeley 10.17632/sjkptpgv79; Kaggle copy says unknown)", "field", "train_pool"),
    ("riceleafbd-mendeley", "sylhet_bd", "BD", "Sylhet + Dhaka", "CC BY 4.0 (Mendeley 10.17632/kx9rx8p2mz)", "field", "final_test_used"),
    ("hasanmojumdar-rice", "diu_bd", "BD", "BRRI (DIU)", "CC BY 4.0 (Mendeley 10.17632/vwv3nry3wr)", "field", "test_diu"),
    ("rice-leaf-bacterial-and-fungal", "kyau_bd", "BD", "Sirajganj/Pabna", "CC BY 4.0 (Mendeley 10.17632/hx6f852hw4.2)", "field", "train_pool"),
    ("rice-leaf-diseases-dataset", "raihan_bd", "BD", "Sirajganj/Pabna (KYAU mirror)", "CC0 claimed by mirror", "field", "mirror_check"),
    ("dhan-shomadhan", "dhan_shomadhan_bd", "BD", "Dhaka Division", "CC BY 4.0 (Mendeley 10.17632/znsxdctwtt)", "path", "train_pool"),
    ("paddy-doctor", "paddy_doctor_in", "IN", "Tirunelveli, Tamil Nadu", "CC0 per mirror; original UNVERIFIED", "field", "train_pool"),
    ("rice-leaf-disease-image", "sethy_in", "IN", "India (region unverified)", "CC BY 4.0 (Mendeley 10.17632/fwcj7stb8r.2)", "unverified", "train_pool"),
    ("rice-leaf-diseases/", "gujarat_in", "IN", "Shertha, Gujarat", "CC BY 4.0 (UCI 486)", "white_bg", "final_test_used"),
    ("rice-crop-diseases", "karnataka_in", "IN", "Gangavathi, Karnataka", "MIT", "unverified", "train_pool"),
    ("raingel", "taiwan_tw", "TW", "Taiwan", "CC BY 4.0", "field", "train_pool"),
    ("rice-leaf-disease/", "taiwan_tw", "TW", "Taiwan", "CC BY 4.0", "field", "train_pool"),
    ("rice-blast-dataset", "shivas_blast", "??", "unverified", "CC BY 4.0", "unverified", "train_pool"),
    ("rice-leaf-blast", "iqbal_blast", "??", "unverified", "CC0", "field", "train_pool"),
    ("hf:aman2025", "aman2025_bd", "BD", "Bangladesh (Aman 2025, iPhone)", "CC BY 4.0 (Zenodo 10.5281/zenodo.21140529)", "field", "train_pool"),
]
PRIORITY = {s[1]: i for i, s in enumerate(SOURCES)}  # canonical copy of a duplicate = earliest source


def norm_key(name):
    """Folder name -> app class. Diseases the app does not cover -> other_rice. Unknown -> None."""
    n = name.lower().replace("_", " ").replace("-", " ")
    if n in ("bo",): return "brown_spot"           # Taiwan: Bipolaris oryzae
    if n in ("mo",): return "blast"                # Taiwan: Magnaporthe oryzae
    if n in ("he",): return "other_rice"           # Taiwan: herbicide damage
    if "healthy" in n or "normal" in n or n == "no disease": return "healthy"
    if "false smut" in n: return "other_rice"
    if "smut" in n: return "leaf_smut"
    if "tungro" in n or "turgro" in n: return "tungro"
    if "sheath" in n or "shath" in n: return "sheath_blight"
    if "narrow" in n: return "other_rice"
    if any(k in n for k in ("collar", "neck", "node")): return "other_rice"
    if "blast" in n: return "blast"
    if "brown" in n or "browon" in n: return "brown_spot"
    if any(k in n for k in ("bacterial", "blight", "streak", "hispa", "dead heart", "downy", "scald", "scaled",
                            "panicle", "leaffolder", "stripe", "insect")): return "other_rice"
    return None


def source_of(path):
    pl = path.lower().replace("\\", "/") + "/"
    for s in SOURCES:
        if s[0] in pl: return s
    return None


def label_of(rel):
    parts = rel.replace("\\", "/").split("/")[:-1]
    for d in reversed(parts):
        k = norm_key(d.strip())
        if k: return d.strip(), k
    return None, None


ROWS, skipped = [], Counter()
for root, _, files in os.walk(IN):
    for f in files:
        if not f.lower().endswith(IMG): continue
        p = os.path.join(root, f); rel = os.path.relpath(p, IN); rl = rel.lower()
        s = source_of(p)
        if s is None: skipped["no source"] += 1; continue
        if "augment" in rl: skipped[f"{s[1]}: augmented"] += 1; continue
        if s[1] == "gazipur_bd" and "annotated" in rl: skipped["gazipur_bd: annotated copies"] += 1; continue
        if s[1] == "diu_bd" and "original dataset" not in rl: skipped["diu_bd: not original"] += 1; continue
        raw, key = label_of(rel)
        if key is None: skipped[f"{s[1]}: unmapped folder {os.path.basename(root)}"] += 1; continue
        cap = s[5]
        if cap == "path": cap = "white_bg" if "white" in rl else "field"
        ROWS.append({"source": s[1], "path": p, "rel": rel, "raw_label": raw, "class": key, "country": s[2],
                     "region": s[3], "licence": s[4], "capture": cap, "role": s[6]})

# Hugging Face: Bangladesh Aman 2025 (not on Kaggle). Downloaded once; bytes kept for hashing.
HF = "Project-AgML/rice_leaf_disease_classification_bd"
try:
    if os.environ.get("NO_HF"): raise RuntimeError("skipped (local test)")
    urls = json.load(urllib.request.urlopen(f"https://huggingface.co/api/datasets/{HF}/parquet"))["default"]["train"]
    os.makedirs(f"{W}/hf_aman", exist_ok=True); s = next(x for x in SOURCES if x[1] == "aman2025_bd")
    for ui, u in enumerate(urls):
        local = f"{W}/hf_aman/{ui}.parquet"; urllib.request.urlretrieve(u, local)
        pf = pq.ParquetFile(local)
        info = json.loads((pf.schema_arrow.metadata or {}).get(b"huggingface", b"{}")).get("info", {}).get("features", {})
        names = info["label"]["names"]; tbl = pf.read()
        for i, (img, lab) in enumerate(zip(tbl["image"].to_pylist(), tbl["label"].to_pylist())):
            raw = names[lab]; key = norm_key(raw)
            p = f"{W}/hf_aman/{ui}_{i:05d}_{raw}.jpg"
            with open(p, "wb") as fh: fh.write(img["bytes"])
            ROWS.append({"source": s[1], "path": p, "rel": f"hf:{HF}/{ui}/{i}", "raw_label": raw, "class": key,
                         "country": s[2], "region": s[3], "licence": s[4], "capture": s[5], "role": s[6]})
except Exception as e:
    print("HF Aman 2025 download failed:", repr(e), flush=True); skipped["aman2025_bd: download failed"] += 1

print("rows:", len(ROWS), "| skipped:", dict(skipped), flush=True)
print("found sources:", dict(Counter(r["source"] for r in ROWS)), flush=True)


def prep(i):
    p = ROWS[i]["path"]
    try:
        md5 = hashlib.md5(open(p, "rb").read()).hexdigest()
        with Image.open(p) as im0:
            w0, h0 = im0.size
            im0.draft("RGB", (512, 512))
            im = ImageOps.exif_transpose(im0).convert("RGB")
        ph = str(imagehash.phash(im))
        a = np.asarray(im.resize((128, 128))).astype(np.int16)
        border = np.concatenate([a[:16].reshape(-1, 3), a[-16:].reshape(-1, 3), a[:, :16].reshape(-1, 3), a[:, -16:].reshape(-1, 3)])
        white = float(np.mean((border.min(1) > 170) & (np.ptp(border, axis=1) < 40)))
        return i, (md5, ph, w0, h0, round(white, 3))
    except Exception as e:
        return i, repr(e)[:80]


t0 = time.time()
if os.name == "nt":  # local test on Windows: no fork, so no worker pool
    res = [prep(i) for i in range(len(ROWS))]
else:
    with Pool(os.cpu_count()) as pool:
        res = pool.map(prep, range(len(ROWS)), chunksize=64)
bad = Counter()
ok = []
for i, got in res:
    if isinstance(got, str): bad[ROWS[i]["source"]] += 1; continue
    r = ROWS[i]; r["md5"], r["phash"], r["width"], r["height"], r["white_border"] = got; ok.append(r)
ROWS = ok
print(f"hashed {len(ROWS)} in {time.time() - t0:.0f}s | unreadable: {dict(bad)}", flush=True)
ROWS.sort(key=lambda r: (PRIORITY[r["source"]], r["rel"]))
n = len(ROWS)

# exact duplicates
first_md5 = {}
for i, r in enumerate(ROWS):
    r["exact_dup_of"] = first_md5.get(r["md5"], "")
    first_md5.setdefault(r["md5"], i)

# near-duplicate clusters: 5 bands of the 64-bit pHash; any pair within 4 bits shares one band (pigeonhole)
H = np.array([int(r["phash"], 16) for r in ROWS], dtype=np.uint64)
LUT = np.array([bin(x).count("1") for x in range(256)], dtype=np.uint8)
parent = list(range(n))
def find(x):
    while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
    return x
def union(a, b):
    a, b = find(a), find(b)
    if a != b: parent[max(a, b)] = min(a, b)
edges = 0
for shift, width in ((0, 13), (13, 13), (26, 13), (39, 13), (52, 12)):
    band = (H >> np.uint64(shift)) & np.uint64((1 << width) - 1)
    order = np.argsort(band, kind="stable"); bs = band[order]
    cuts = np.flatnonzero(np.diff(bs)) + 1
    for g in np.split(order, cuts):
        if len(g) < 2: continue
        for s0 in range(0, len(g), 2048):
            a = g[s0:s0 + 2048]
            x = H[a][:, None] ^ H[g][None, :]
            d = LUT[x.view(np.uint8)].reshape(len(a), len(g), 8).sum(2)
            ii, jj = np.nonzero(d <= NEAR)
            for u, v in zip(a[ii], g[jj]):
                if u < v: union(int(u), int(v)); edges += 1
cluster = [find(i) for i in range(n)]
for r, c in zip(ROWS, cluster): r["cluster"] = c
print("near-duplicate pairs:", edges, "| clusters:", len(set(cluster)), flush=True)

members = defaultdict(list)
for i, c in enumerate(cluster): members[c].append(i)
srcs_of = {c: {ROWS[i]["source"] for i in m} for c, m in members.items()}
cls_of = {c: {ROWS[i]["class"] for i in m} for c, m in members.items()}
roles_of = {c: {ROWS[i]["role"] for i in m} for c, m in members.items()}

sources = sorted({r["source"] for r in ROWS}, key=PRIORITY.get)
classes = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight", "other_rice"]
per_source = {}
for s in sources:
    rs = [r for r in ROWS if r["source"] == s]
    cl = {r["cluster"] for r in rs}
    per_source[s] = {
        "role": rs[0]["role"], "country": rs[0]["country"], "region": rs[0]["region"], "licence": rs[0]["licence"],
        "files": len(rs), "files_by_class": dict(Counter(r["class"] for r in rs)),
        "exact_dups_within_or_earlier": sum(1 for r in rs if r["exact_dup_of"] != ""),
        "unique_scenes": len(cl),
        "unique_scenes_by_class": dict(Counter(k for k, _ in {(r["class"], r["cluster"]) for r in rs})),
        "white_bg_share": round(float(np.mean([r["white_border"] > 0.5 for r in rs])), 3),
        "clusters_shared_with": dict(Counter(o for c in cl for o in srcs_of[c] if o != s)),
    }
overlap = {s: {t: per_source[s]["clusters_shared_with"].get(t, 0) for t in sources} for s in sources}
conflict = [c for c, k in cls_of.items() if len(k) > 1]
conflict_kinds = Counter(tuple(sorted(cls_of[c])) for c in conflict)

pool_clusters = {c for c, rl in roles_of.items() if rl == {"train_pool"} or rl <= {"train_pool", "mirror_check"}}
pool_clean = [c for c in pool_clusters if len(cls_of[c]) == 1]
leak = {role: sum(1 for c, rl in roles_of.items() if role in rl and "train_pool" in rl)
        for role in ("test_diu", "final_test_used")}

def table(groups):
    out = Counter()
    for c in groups:
        out[(next(iter(cls_of[c])), ROWS[c]["country"])] += 1
    return {k: {cty: out[(k, cty)] for cty in sorted({x[1] for x in out})} for k in classes}

summary = {
    "files_total": n, "unreadable": dict(bad), "skipped": dict(skipped),
    "exact_duplicate_files": sum(1 for r in ROWS if r["exact_dup_of"] != ""),
    "near_dup_clusters_total": len(members),
    "label_conflict_clusters": len(conflict), "label_conflict_kinds": {"|".join(k): v for k, v in conflict_kinds.most_common(20)},
    "train_pool_unique_scenes": len(pool_clusters), "train_pool_unique_scenes_label_consistent": len(pool_clean),
    "train_pool_unique_by_class_country": table(pool_clean),
    "test_clusters_also_in_train_pool": leak,
    "per_source": per_source, "cross_source_cluster_overlap": overlap,
    "near_dup_rule": f"pHash Hamming <= {NEAR} bits (64-bit pHash, EXIF-upright image)",
}
json.dump(summary, open(f"{OUT}/summary.json", "w"), indent=1)

with gzip.open(f"{OUT}/manifest.csv.gz", "wt", newline="", encoding="utf-8") as fh:
    cols = ["source", "rel", "raw_label", "class", "country", "region", "licence", "capture", "role",
            "md5", "phash", "width", "height", "white_border", "exact_dup_of", "cluster"]
    w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore"); w.writeheader(); w.writerows(ROWS)

md = ["# Rice-leaf image manifest summary", "",
      f"Files hashed: {n}; exact duplicate files: {summary['exact_duplicate_files']}; near-duplicate clusters (unique scenes): {len(members)}.",
      f"Clusters with conflicting labels: {len(conflict)}. Train-pool unique scenes (label-consistent): {len(pool_clean)}.",
      f"Test clusters that also appear in the train pool: {leak}.", "",
      "| source | role | country | files | unique scenes | white-bg share | " + " | ".join(classes) + " |",
      "|---|---|---|---|---|---|" + "---|" * len(classes)]
for s, v in per_source.items():
    md.append(f"| {s} | {v['role']} | {v['country']} | {v['files']} | {v['unique_scenes']} | {v['white_bg_share']} | "
              + " | ".join(str(v["unique_scenes_by_class"].get(k, 0)) for k in classes) + " |")
md += ["", "## Train pool: unique label-consistent scenes by class and country", "",
       "| class | " + " | ".join(sorted({c for d in summary['train_pool_unique_by_class_country'].values() for c in d})) + " |"]
ctys = sorted({c for d in summary["train_pool_unique_by_class_country"].values() for c in d})
md.append("|---|" + "---|" * len(ctys))
for k, d in summary["train_pool_unique_by_class_country"].items():
    md.append(f"| {k} | " + " | ".join(str(d.get(c, 0)) for c in ctys) + " |")
md += ["", "## Cross-source overlap (clusters of the row source that also contain the column source)", "",
       "| | " + " | ".join(sources) + " |", "|---|" + "---|" * len(sources)]
for s in sources:
    md.append(f"| {s} | " + " | ".join(str(overlap[s][t]) if s != t else "-" for t in sources) + " |")
open(f"{OUT}/summary.md", "w").write("\n".join(md) + "\n")
print("\n".join(md), flush=True)
print("MANIFEST_DONE", flush=True)
