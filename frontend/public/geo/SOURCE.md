# Source: Bangladesh District GeoJSON

## Source URL
https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/

## License
CC-BY 4.0 (Attribution 4.0 International)
https://creativecommons.org/licenses/by/4.0/

## Original source
Bangladesh Bureau of Statistics (BBS), OCHA ROAP
COD-AB dataset via Humanitarian Data Exchange (HDX)

## Boundary type
ADM2 (districts)

## Boundary representation
Simplified GeoJSON of the 64 districts of Bangladesh
from geoBoundaries `gbOpen` dataset.

## Simplification
Douglas-Peucker algorithm with tolerance 0.003 degrees
(~300m at Bangladesh latitude), applied per-ring to preserve
district shape while keeping file size < 1.5 MB.

## Output
- `frontend/public/geo/bd_districts.json`
- Each feature has `properties.district_code` matching
  `frontend/src/features/profile/districts.json`

## Author/Tool
Simplified via custom Douglas-Peucker script (Node.js).