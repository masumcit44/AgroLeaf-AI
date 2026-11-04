// Verifies frontend/public/geo/bd_districts.json against frontend/src/features/profile/districts.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

const geoPath = path.join(frontendDir, 'public', 'geo', 'bd_districts.json');
const distPath = path.join(frontendDir, 'src', 'features', 'profile', 'districts.json');

if (!fs.existsSync(geoPath)) {
  console.error(`FAIL: Geo file not found: ${geoPath}`);
  process.exit(1);
}

const stat = fs.statSync(geoPath);
const sizeMb = stat.size / (1024 * 1024);
console.log(`[check_geo_districts] File size: ${stat.size} bytes (${sizeMb.toFixed(3)} MB)`);

if (stat.size > 1.5 * 1024 * 1024) {
  console.error(`FAIL: Geo file exceeds 1.5 MB limit: ${sizeMb.toFixed(3)} MB`);
  process.exit(1);
}

const geo = JSON.parse(fs.readFileSync(geoPath, 'utf-8'));
const districts = JSON.parse(fs.readFileSync(distPath, 'utf-8'));

if (!geo.features || geo.features.length !== 64) {
  console.error(`FAIL: Expected 64 features in geojson, got ${geo.features?.length}`);
  process.exit(1);
}

const distByCode = new Map(districts.map((d) => [d.code, d]));
const mismatches = [];

for (const f of geo.features) {
  const code = f.properties?.district_code || f.properties?.code;
  const target = distByCode.get(code);
  if (!target) {
    mismatches.push(`Unknown district code ${code} (${f.properties?.district_name_en})`);
    continue;
  }
  if (f.properties.district_name_en !== target.district_name_en) {
    mismatches.push(`Name mismatch for code ${code}: geo='${f.properties.district_name_en}' vs dist='${target.district_name_en}'`);
  }
  if (f.properties.district_name_bn !== target.district_name_bn) {
    mismatches.push(`Bangla name mismatch for code ${code}: geo='${f.properties.district_name_bn}' vs dist='${target.district_name_bn}'`);
  }
}

if (mismatches.length > 0) {
  console.error(`FAIL: Found ${mismatches.length} mismatches:\n${mismatches.join('\n')}`);
  process.exit(1);
}

console.log(`PASS: All 64 features matched districts.json exactly with 0 mismatches.`);
