# District Data Source

**Source:** OCHA/HDX COD-AB (Common Operational Dataset — Administrative Boundaries) for Bangladesh
**Dataset:** Bangladesh - Subnational Administrative Boundaries (COD-AB)
**URL:** https://data.humdata.org/dataset/cod-ab-bgd
**Resource:** bgd_admin_boundaries.geojson.zip (GeoJSON format, Admin 0–3)

**License:** Creative Commons Attribution 3.0 IGO (CC BY-IGO 3.0)
**License URL:** http://creativecommons.org/licenses/by/3.0/igo/legalcode

**Date Retrieved:** 2026-11-03
**Dataset Version:** 03 (reviewed 2025-06-01, valid from 2023-05-21)
**Contributor:** OCHA Regional Office for Asia and the Pacific (ROAP)
**Publisher:** Humanitarian Data Exchange (HDX)
**Boundary Authority:** Bangladesh Bureau of Statistics (BBS) as of March 2025

**Processing Method:**
The 64 districts (Admin-2) were derived by dissolving the Admin-3 (Upazila) polygons from the COD-AB dataset (geoBoundaries gbOpen Bangladesh ADM3 simplified, CC BY 4.0, boundary year 2020, underlying BBS/OCHA ROAP). Each district polygon is the union of its constituent upazila polygons. Centroids were computed as the area-weighted average of the constituent polygon centroids (using the shoelace formula for each ring). This yields the geometric centroid of each district's full polygon, not the city/town centre.

**District Codes:** Match the OCHA P-code system (1–64) as used in the COD-AB gazetteer.
**Bangla Names:** Taken from the `ADM2_NAME1` / `district_bn_name` field in the source data.
**English Names:** Taken from the `ADM2_NAME` / `district_name` field in the source data.

**Attribution:**
Contains information from "Bangladesh - Subnational Administrative Boundaries (COD-AB)" made available by OCHA ROAP and HDX under CC BY-IGO 3.0, and from geoBoundaries gbOpen Bangladesh ADM3 (CC BY 4.0, underlying BBS/OCHA ROAP).

**Verification Notes (spot check):**
| District | Old (city centre) | New (polygon centroid) | Δlat | Δlon |
|---|---|---|---|---|
| Dhaka (1) | 23.7115, 90.4111 | 23.7864, 90.2083 | +0.075 | -0.203 |
| Chattogram (43) | 22.3351, 91.8341 | 22.4554, 91.8337 | +0.120 | -0.0004 |
| Sylhet (54) | 24.8898, 91.8698 | 24.6917, 91.9239 | -0.198 | +0.054 |

All 64 districts present with unique codes 1–64. All computed centroids fall within Bangladesh bounding box (lat 20.59–26.63, lon 88.01–92.68). Bangla names verified against source `district_bn_name` / `ADM2_NAME1` field.