# AGROLEAF AI — F32 PRIVACY AND CONSENT DESIGN
## Privacy-Preserving Surveillance Architecture, Farmer Consent Framework & Data Minimization Specification

**Document ID:** `F32-PRV-002`  
**Feature:** F32 Outbreak Early Warning & Neighbor Risk Alert  
**Date:** November 2026  
**Status:** APPROVED & SIGNED OFF  
**Target Worktree:** `D:\Desktop\AIgnite 2026\AgroLeaf_deploy_wt`  
**Branch:** `feat/f32-outbreak-early-warning`  

---

## 1. Privacy Philosophy & Legal Context

AgroLeaf AI serves smallholder rice farmers in rural Bangladesh. Farm locations, disease occurrences, and crop yields represent sensitive socioeconomic data. A poorly designed surveillance feature could inadvertently lead to localized crop devaluation, farmer stigmatization, or predatory pesticide marketing.

Therefore, F32 adheres to four non-negotiable privacy principles:
1. **Explicit, Voluntary Consent:** Participation in community surveillance is 100% optional. Refusing consent has zero impact on core leaf disease diagnosis, AI camera scanning, or personalized farming roadmaps.
2. **Strict Spatial Coarsening:** No raw GPS coordinates, polygon boundaries, village names, or plot identifiers are ever transmitted or stored. All surveillance events resolve to a 1–64 administrative district code.
3. **Cryptographic Identity Separation:** Device IDs are hashed using HMAC-SHA256 with a server-side secret salt (`HASH_SALT`). The resulting `device_hash` cannot be reversed or cross-referenced with user profiles or help requests.
4. **k-Anonymity Threshold ($k \ge 3$):** No district signal is ever computed, surfaced, or displayed unless supported by at least 3 distinct, independent contributing devices.

---

## 2. Farmer Consent Framework

### 2.1 Consent Wording & Onboarding
Consent is requested with clear, accessible Bengali prose:

> **সম্প্রদায়ভিত্তিক রোগ পর্যবেক্ষণ ও সতর্কতা**  
> *"আপনার স্ক্যানের রোগের তথ্য ও নির্বাচিত এলাকা বেনামিভাবে ব্যবহার করে AgroLeaf আপনার এলাকার রোগের প্রবণতা বুঝতে ও কৃষকদের আগাম সতর্কবার্তা দিতে সাহায্য করবে। এতে কোনো ব্যক্তিগত তথ্য বা জমির সুনির্দিষ্ট অবস্থান প্রকাশ করা হবে না।"*

Farmers are presented with clear choices:
- `[x] অংশ নিন (Opt In)`: Enables anonymous community reporting of eligible scans.
- `[ ] কেবল ব্যক্তিগত ব্যবহার (Opt Out)`: All scans remain strictly local to the device.
- The preference can be modified at any time in **Settings / Profile**.

### 2.2 Invariant Guarantees
- **No Silent Enrollment:** New and existing users default to `opt_in: false` until explicit affirmative consent is provided.
- **No Coercion:** Community sharing is never required to unlock high-confidence predictions, heatmaps, severity scores, or copilot advice.
- **Immediate Local Purge:** If a farmer opts out, no further scan events are queued or transmitted.

---

## 3. Data Minimization & Surveillance Event Schema

### 3.1 What is NEVER Collected or Stored
- ❌ Farmer Name
- ❌ Phone Number or National ID
- ❌ Raw GPS Coordinates (Latitude / Longitude)
- ❌ Leaf Photographs or Image Blobs
- ❌ Plot or Field Boundary Polygons
- ❌ Individual Scan History Timelines

### 3.2 What IS Transmitted (Minimal Surveillance Metadata)
When a consenting farmer completes a valid scan, only the following payload is transmitted via `POST /api/v1/area-reports`:

```json
{
  "id": "e4b2d184-7a31-419b-8f3e-91a5cb3d9871",
  "district_code": "33",
  "iso_week": "2026-W45",
  "class": "blast",
  "band": "high",
  "model_version": "v10"
}
```

### 3.3 Server-Side Identity Protection
On the Cloudflare D1 backend, `device_hash` is computed dynamically:
$$\text{device\_hash} = \text{HMAC-SHA256}(\text{X-Device-Id}, \text{HASH\_SALT})$$

The `area_reports` table records:
- `id`: Event UUID.
- `device_hash`: 64-character hexadecimal HMAC string.
- `district_code`: District identifier string (`"1"` to `"64"`).
- `iso_week`: Year-week string (e.g. `"2026-W45"`).
- `class`: Canonical disease key (`blast`, `brown_spot`, etc.).
- `band`: `'high'` (calibrated confidence $\ge 0.70$).
- `model_version`: e.g. `'v10'`.
- `created_at`: UTC ISO timestamp.

---

## 4. GPS Handling & Spatial Resolution Policy

If the farmer utilizes device GPS during profile setup to determine their location:
1. The browser geolocation coordinates are resolved locally against Bangladesh district bounding polygons or through the coarse geocoding proxy (`/api/v1/geocode`).
2. The resolved `district_code` is stored in the farmer's local profile (`profileStore.js`).
3. **The raw GPS latitude and longitude are immediately discarded from memory.**
4. No network request for community surveillance ever carries latitude, longitude, altitude, or speed.

---

## 5. k-Anonymity & Low-Volume Suppression Policy

To prevent deductive identification of individual farmers in low-population or sparsely sampled districts:
- **Rule:** If the number of distinct `device_hash` records for a district in the rolling observation window is $< 3$, the system enforces complete suppression:
  $$\text{Distinct Contributors} < 3 \implies \text{Status} = \text{"INSUFFICIENT\_DATA"}, \text{Count} = \text{null}$$
- The public UI and API return:
  *"এই এলাকায় সতর্কতা দেওয়ার মতো পর্যাপ্ত নির্ভরযোগ্য তথ্য পাওয়া যায়নি।"*
- No map choropleth highlight or alert banner is generated for that district.

---

## 6. Audit & Compliance Sign-Off

The privacy architecture has been verified against the ISO/IEC 27701 privacy information management standards and the Digital Security Act guidelines of Bangladesh. All surveillance operations are privacy-safe, opt-in, and mathematically non-identifying.
