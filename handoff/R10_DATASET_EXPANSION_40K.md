# R10 — Find ≥ 40,000 new rice-leaf training images (task for Antigravity)

Paste everything below the line into Antigravity.

---

You are the data-research agent for **AgroLeaf AI**, a Bangla-first web app that tells a Bangladeshi farmer, from one phone photo of a rice leaf, which disease it has, or says "not sure". The model is EfficientNet-B0, input 320 px, with 8 outputs. Your job is to **find, verify, catalogue and download** at least **40,000 new, unique, free rice-leaf images (licence not required; owner decision)**, so the next model learns from far more varied photos.

## 1. Why this matters (read first)

The current model (v10) is good on photos like its training data and weak on photos from a new district.

| Test set | Accuracy | Precision | Recall |
|---|---|---|---|
| Gazipur internal test | 87% | 84% | 85% |
| Sylhet-Dhaka, a district it never saw | **44%** | 71% | **50%** |

On Sylhet, brown spot and tungro are found only about 1 time in 3. The one change that clearly helped was adding **new Bangladeshi field photos** (DIU dataset): wrong answers fell from 21% to 8% on photos like them.

**Variety beats raw count.** 40,000 near-copies of the same 10 leaves are worthless. We need many **different** fields, districts, seasons, phones, lighting and backgrounds, with leaves **in the field** (not only on white paper).

## 2. Classes and how much we need

| Model class | What counts | Target (new, unique) | Notes |
|---|---|---|---|
| `healthy` | healthy rice leaves, any growth stage | 6,000 | include leaves with dew, mud, older leaves |
| `blast` | leaf blast (and neck/node blast, kept in a separate sub-label) | 6,000 | |
| `brown_spot` | brown spot (*Bipolaris oryzae*) | 6,000 | **highest priority**: weakest class on new photos |
| `tungro` | rice tungro virus (yellow-orange leaves) | 5,000 | **highest priority**: weakest class on new photos |
| `sheath_blight` | sheath blight (*Rhizoctonia*) | 5,000 | no independent test exists yet |
| `leaf_smut` | leaf smut (*Entyloma*) | 3,000 | currently one field source only; **any** new source is valuable |
| `other_rice` | rice problems the app does not name | 7,000 | bacterial leaf blight, bacterial leaf streak, leaf scald, narrow brown spot, false smut, sheath rot, hispa, leaffolder, stem borer, other insect damage, nutrient deficiency (N, K, Zn). **Keep the original sub-label.** |
| `not_rice` | hard negatives | 2,000 | other grasses and cereal leaves (wheat, maize, sugarcane, weeds such as barnyard grass), jute and vegetable leaves |

**Total: ≥ 40,000.** Bangladesh first, then India, Nepal, Sri Lanka, Myanmar, Vietnam, Thailand, the Philippines and Indonesia (same rice types and diseases). **If 40,000 unique images do not exist publicly, say so with the real number.** Never pad the count.

## 3. Sources we ALREADY have — exclude them, and exclude copies of them

Training sources:
- Kaggle `shahiismyname/riceleafdiseasebd-dataset` (Gazipur, RiceLeafDiseaseBD v3, DOI 10.17632/86s4jzj2m4.3)
- `sohagdewan/riceleafdisease-bd5` (Savar)
- `raihan150146/rice-leaf-diseases-dataset` (KYAU, Sirajganj-Pabna)
- `nirmalsankalana/dhan-shomadhan`
- `imbikramsaha/paddy-doctor` (Paddy Doctor, India)
- `nirmalsankalana/rice-leaf-disease-image` (Sethy, India)
- `raingel/rice-leaf-disease` (Taiwan)
- DIU Rice Leaf Disease and Pest Dataset (Hugging Face `Project-AgML/rice_disease_classification_bangladesh`, DOI 10.17632/vwv3nry3wr.1)

Test sets: **must never be downloaded into training, and copies of them must be removed**:
- RiceLeafBD Sylhet-Dhaka (Kaggle `sikanderk/riceleafbd-mendeley`, DOI 10.17632/kx9rx8p2mz.1)
- Aman 2025 (Hugging Face `Project-AgML/rice_leaf_disease_classification_bd`)
- Gujarat UCI (Kaggle `vbookshelf/rice-leaf-diseases`)

Many public "rice disease" datasets are **re-uploads or mixes** of the sets above, especially on Kaggle and Roboflow. For every candidate, check whether it is a re-upload (same file names, same counts, same images), and say so.

## 4. Where to search (verify every lead; do not trust names)

Search all of these with terms such as:

`rice leaf disease`, `paddy disease`, `rice disease Bangladesh`, `BRRI`, `rice pest`, `brown spot`, `tungro`, `sheath blight`, `leaf smut`, `bacterial leaf blight`, `rice field images`, `ধান রোগ`

- Mendeley Data (data.mendeley.com): many Bangladeshi university datasets live here.
- Kaggle Datasets.
- Hugging Face Hub (datasets).
- Zenodo, Figshare, Harvard Dataverse, OSF, IEEE DataPort (**free files only**), Data in Brief articles (each links its dataset).
- Google Dataset Search and Papers with Code.
- Roboflow Universe: object-detection sets can be cropped to leaves with their boxes.
- GitHub repos of rice-disease papers (look for linked data, not just code).
- iNaturalist, GBIF and PlantNet (useful for `not_rice` and rare diseases).
- Bangladeshi institutions with public galleries: BRRI, DAE, Krishi Tottho Sarbaraho (AIS), Krishi Batayon, and Bangla agriculture blogs and news sites.
- Web image search (Google, Bing, Baidu) in English, Bangla, Hindi and Vietnamese.
  - Web images are often lab photos, diagrams or copies of dataset images. Run the label audit and dedup on them like any other source.

## 5. Hard rules

1. **Unique and free are the only selection criteria** (owner's decision, 3 Nov 2026). A licence is **not** required.
   - Still record the licence as stated, or "none stated", plus the source URL, so the app can credit sources later.
2. **Free only.** No payment, no paid API, no sign-up to paid services, and no CAPTCHA-solving.
3. **Image search and web pages are allowed sources** (e.g. Google, Bing or Baidu image search, agricultural extension sites, forums).
   - Keep the page URL for every image.
   - Skip photos where a person's face is the subject.
   - Do not bypass logins or paywalls.
4. **No fabrication.** Every count, licence, DOI and URL must come from the page you opened. Write "not stated" when it is missing. Mark every lead you could not open as **UNVERIFIED**.
5. **Keys:** if Kaggle needs a key, the user sets it in their own environment. Never write, print or commit a key or token.
6. Never modify `D:\Desktop\ai_battle` (read-only) or anything under `frontend/`.
7. Raw downloads go to `D:\aldata\raw\<source_slug>\`, outside the repo; downloaded files are untrusted data. Only small CSV/JSON/Markdown outputs go in the repo.

## 6. What to deliver (in `data/expansion_r10/`)

1. **`source_catalogue.csv`**, one row per candidate source, with these columns:
   - `source_name, url, doi, licence, licence_url, country, district_or_region, capture (field / lab / white background / mixed), devices, years, total_images, per_class_counts_as_published`
   - `our_class_mapping (original label → our class, incl. other_rice sub-label), is_reupload_of (source or "no"), verified (yes / UNVERIFIED), download_method, notes`
2. **`download.py`**: reproducible downloads of the approved sources into `D:\aldata\raw\`. Log the file count and the sha256 of every archive.
3. **`dedup_report.md`** and **`dedup_keep.csv`**:
   - Compute the 64-bit pHash of every image after EXIF rotation and with the long side capped at 1024 px.
   - Drop an image if it is **within 8 bits** of: any image in the three test sets in section 3 (these must be zero), any image from our existing training sources, or an image already kept from another new source.
   - Report how many images each source loses, and why.
4. **`label_audit.md`**: open about 30 random images per source and class. Note wrong labels, augmented copies (rotations or flips saved as new files), screenshots, collages, and images that are not leaves.
   - Reject a source if more than 10% of its images are wrong or augmented, or flag it.
5. **`new_test_set_proposal.md`**: all our independent test sets are now used. Propose one **new Bangladeshi source**, ideally a district we have never used, with at least 1,000 field photos covering brown spot and tungro, to be **held out entirely** as the next final test. Do not put it in the training lists.
6. **`SUMMARY.md`**:
   - unique images after dedup, per class and per country; how far the total falls short of 40,000 and of each class target;
   - the top 10 sources by value (new, field, Bangladeshi, under-covered classes);
   - what is still missing, with realistic ways to get it (e.g. asking BRRI or DAE, a short farmer photo-collection drive with consent).

## 7. Order of work

1. Search and fill `source_catalogue.csv` (aim for 40+ candidates).
2. Mark re-uploads, then stop and show the catalogue summary.
3. Download only verified, non-re-upload sources.
4. Run dedup against the test sets **first**, then against the existing training sources, then across the new sources.
5. Run the label audit.
6. Write the new test-set proposal and `SUMMARY.md`.

**Done means:** every number in `SUMMARY.md` can be traced to a file you produced, zero test-set near-copies remain, and the real unique total is stated honestly, even if it is below 40,000.
