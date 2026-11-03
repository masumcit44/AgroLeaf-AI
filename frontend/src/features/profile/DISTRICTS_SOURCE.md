# District Data Source

**Source:** OCHA/HDX COD-AB (Common Operational Dataset - Administrative Boundaries) for Bangladesh
**Dataset:** Bangladesh - Subnational Administrative Boundaries (COD-AB)
**URL:** https://data.humdata.org/dataset/cod-ab-bgd
**Resource:** bgd_admin_boundaries.geojson.zip (GeoJSON format)

**License:** Creative Commons Attribution 3.0 IGO (CC BY-IGO 3.0)
**License URL:** http://creativecommons.org/licenses/by/3.0/igo/legalcode

**Date Retrieved:** 2026-11-03
**Dataset Version:** 03 (reviewed 2025-06-01, valid from 2023-05-21)
**Contributor:** OCHA Regional Office for Asia and the Pacific (ROAP)
**Publisher:** Humanitarian Data Exchange (HDX)
**Boundary Authority:** Bangladesh Bureau of Statistics (BBS) as of March 2025

**Processing:**
- The 64 districts (Admin-2) were extracted from the COD-AB dataset.
- Centroid coordinates (lat/lon) are provided by the source dataset as `center_lat` and `center_lon` fields.
- District codes match the OCHA P-code system (1-64).
- Bangla names are from the `adm2_name1` field in the source; English names from `adm2_name`.

**Attribution:**
Contains information from "Bangladesh - Subnational Administrative Boundaries (COD-AB)" made available by OCHA ROAP and HDX under CC BY-IGO 3.0.

**Verification Notes:**
- All 64 districts present with unique codes 1-64.
- All coordinates fall within Bangladesh bounding box (lat 20.59–26.63, lon 88.01–92.68).
- Bangla names verified against source `adm2_name1` field.
- Cox's Bazar (code 45) and Chattogram (code 43) use official post-2018 spellings.