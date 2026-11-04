import React, { useState, useEffect, useRef, useMemo } from 'react';
import useT from '../../i18n/useT.js';
import PageContainer from '../../components/PageContainer.jsx';
import { getProfile } from '../profile/profileStore.js';
import { enqueueAreaReport } from '../../lib/store/sync.js';
import { getIsoWeek } from './isoWeek.js';
import districtsData from '../profile/districts.json';
import CommunityAlertCard from '../communityAlerts/CommunityAlertCard.jsx';

const CLASSES = [
  { key: 'blast', bn: 'ব্লাস্ট', en: 'Blast' },
  { key: 'brown_spot', bn: 'বাদামী দাগ', en: 'Brown Spot' },
  { key: 'sheath_blight', bn: 'শীথ ব্লাইট', en: 'Sheath Blight' },
  { key: 'tungro', bn: 'টুংরো', en: 'Tungro' },
  { key: 'healthy', bn: 'সুস্থ পাতা', en: 'Healthy' },
];

function formatNumber(num, lang) {
  const str = String(num);
  if (lang !== 'bn') return str;
  return str.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
}

function getBinColor(reports) {
  if (reports === null || reports === undefined || reports === 0) return '#e2e8f0'; // grey
  if (reports <= 5) return '#fef08a'; // yellow (3-5)
  if (reports <= 10) return '#fb923c'; // orange (6-10)
  if (reports <= 20) return '#ef4444'; // red (11-20)
  return '#991b1b'; // dark red (> 20)
}

/** [result] Consented anonymous area report prompt. */
export function AreaReportPrompt({ scan }) {
  const { t } = useT();
  const [profile, setProfile] = useState(null);
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile().then((p) => {
      if (active && p?.district_code) setProfile(p);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (!scan?.isConfident || !profile?.district_code) {
    return null;
  }

  // Only report rice diseases and healthy
  const validClasses = ['blast', 'brown_spot', 'sheath_blight', 'tungro', 'healthy'];
  if (!validClasses.includes(scan.classKey)) {
    return null;
  }

  const handleSend = async () => {
    if (!optIn || submitting || sent) return;
    setSubmitting(true);
    try {
      await enqueueAreaReport({
        id: crypto.randomUUID(),
        district_code: String(profile.district_code),
        iso_week: getIsoWeek(),
        class: scan.classKey,
        band: 'high',
        model_version: 'v10',
      });
      setSent(true);
    } catch (err) {
      console.error('Failed to enqueue area report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="area-report-prompt"
      className="mt-3 p-4 rounded-2xl border border-sky-100 bg-sky-50/70 shadow-xs space-y-2.5 text-left"
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl">🗺️</span>
        <div className="space-y-1">
          <p className="text-xs font-bold text-sky-950">
            {t('areaMap.optInPrompt')}
          </p>
          <p className="text-[11px] text-sky-800 leading-relaxed">
            {t('areaMap.optInDesc')}
          </p>
        </div>
      </div>

      {sent ? (
        <div data-testid="area-report-saved" className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-white/80 p-2 rounded-xl border border-emerald-200">
          <span>✓</span>
          <span>{t('areaMap.savedOffline')}</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 select-none">
            <input
              type="checkbox"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300 cursor-pointer"
            />
            <span>{t('areaMap.sendReport')}</span>
          </label>

          <button
            type="button"
            disabled={!optIn || submitting}
            onClick={handleSend}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              optIn && !submitting
                ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? '...' : t('areaMap.sendReport')}
          </button>
        </div>
      )}
    </div>
  );
}

/** [route] Page at #/map. */
export function MapPage() {
  const { t, lang } = useT();
  const [selectedClass, setSelectedClass] = useState('blast');
  const [reportsMap, setReportsMap] = useState(new Map());
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoLayerRef = useRef(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch GeoJSON once
  useEffect(() => {
    let active = true;
    fetch('/geo/bd_districts.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load districts geojson');
        return res.json();
      })
      .then((data) => {
        if (active) setGeoJsonData(data);
      })
      .catch((err) => {
        console.error('GeoJSON load error:', err);
      });
    return () => { active = false; };
  }, []);

  // Fetch Summary when selectedClass changes
  useEffect(() => {
    let active = true;

    fetch(`/api/v1/area-summary?class=${selectedClass}&weeks=2`)
      .then(async (res) => {
        if (!res.ok) {
          setErrorStatus(res.status);
          throw new Error(`Summary API returned ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const map = new Map();
        const items = data.items || data;
        if (Array.isArray(items)) {
          for (const item of items) {
            map.set(String(item.district_code), item.reports);
          }
        }
        setReportsMap(map);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Summary fetch error:', err);
        setLoading(false);
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setIsOffline(true);
        } else {
          setErrorStatus(500);
        }
      });

    return () => { active = false; };
  }, [selectedClass]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || !geoJsonData) return;

    let isMounted = true;
    import('leaflet').then((LModule) => {
      if (!isMounted || !mapContainerRef.current) return;
      const L = LModule.default || LModule;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          attributionControl: false,
          zoomControl: true,
          scrollWheelZoom: false,
          minZoom: 6,
          maxZoom: 9,
        });

        map.fitBounds([
          [20.5, 88.0],
          [26.7, 92.7],
        ]);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      if (geoLayerRef.current) {
        map.removeLayer(geoLayerRef.current);
        geoLayerRef.current = null;
      }

      const layer = L.geoJSON(geoJsonData, {
        style: (feature) => {
          const code = feature.properties?.district_code || feature.properties?.code;
          const reports = reportsMap.get(code);
          const isSelected = selectedDistrict?.code === code;
          return {
            fillColor: getBinColor(reports),
            weight: isSelected ? 2.5 : 1,
            opacity: 1,
            color: isSelected ? '#0f172a' : '#64748b',
            fillOpacity: reports === null ? 0.65 : 0.88,
          };
        },
        onEachFeature: (feature, fLayer) => {
          fLayer.on({
            click: () => {
              const code = feature.properties?.district_code || feature.properties?.code;
              const nameEn = feature.properties?.district_name_en;
              const nameBn = feature.properties?.district_name_bn;
              const reports = reportsMap.get(code) ?? null;
              setSelectedDistrict({ code, nameEn, nameBn, reports });
            },
          });
        },
      });

      layer.addTo(map);
      geoLayerRef.current = layer;
    });

    return () => {
      isMounted = false;
    };
  }, [geoJsonData, reportsMap, selectedDistrict]);

  // Clean up Leaflet on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const filteredDistricts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return districtsData.filter((d) => {
      if (!q) return true;
      return (
        d.district_name_en.toLowerCase().includes(q) ||
        d.district_name_bn.includes(q) ||
        d.code === q
      );
    });
  }, [searchQuery]);

  return (
    <PageContainer className="py-4">
      <div className="bg-white border border-gray-200/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5 text-left">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-leaf-800">
            🗺️ {t('areaMap.title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            {t('areaMap.subtitle')}
          </p>
        </div>

        {/* Offline / Error Banners */}
        {isOffline && (
          <div data-testid="area-map-offline" className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
            <span>⚠️</span>
            <span>{t('areaMap.errorOffline')}</span>
          </div>
        )}

        {errorStatus === 503 && (
          <div data-testid="area-map-503" className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-center gap-2">
            <span>ℹ️</span>
            <span>{t('areaMap.errorService')}</span>
          </div>
        )}

        {/* Disease Class Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 block">
            {t('areaMap.classLabel')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CLASSES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  if (selectedClass !== c.key) {
                    setSelectedClass(c.key);
                    setLoading(true);
                    setErrorStatus(null);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedClass === c.key
                    ? 'bg-leaf-700 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {lang === 'bn' ? c.bn : c.en}
              </button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div
            ref={mapContainerRef}
            data-testid="leaflet-map-container"
            className="h-[360px] sm:h-[420px] w-full rounded-2xl border border-gray-200 bg-slate-50 overflow-hidden shadow-inner"
          />

          {loading && (
            <div data-testid="area-map-loading" className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center rounded-2xl z-[500]">
              <div className="text-xs font-semibold text-gray-700 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md border">
                <span className="animate-spin text-leaf-700">⌛</span>
                <span>{t('areaMap.loading')}</span>
              </div>
            </div>
          )}
        </div>

        {/* 4-Bin Choropleth Legend */}
        <div data-testid="area-map-legend" className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 text-xs">
          <span className="font-bold text-gray-700 block uppercase tracking-wider text-[11px]">
            {t('areaMap.tableReports')}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-gray-300 bg-[#e2e8f0] inline-block shrink-0" />
              <span className="text-gray-600">{t('areaMap.tooFewReports')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-yellow-300 bg-[#fef08a] inline-block shrink-0" />
              <span className="text-gray-700">{t('areaMap.legendLow')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-orange-300 bg-[#fb923c] inline-block shrink-0" />
              <span className="text-gray-700">{t('areaMap.legendMed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-red-300 bg-[#ef4444] inline-block shrink-0" />
              <span className="text-gray-700">{t('areaMap.legendHigh')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-red-900 bg-[#991b1b] inline-block shrink-0" />
              <span className="text-gray-700">{t('areaMap.legendVeryHigh')}</span>
            </div>
          </div>
        </div>

        {/* Selected District Callout */}
        {selectedDistrict && (
          <div data-testid="selected-district-info" className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500 block text-[11px]">{t('areaMap.selectedDistrict')}</span>
              <span className="font-bold text-sm text-emerald-950">
                {lang === 'bn' ? selectedDistrict.nameBn : selectedDistrict.nameEn}
              </span>
            </div>
            <div className="text-right">
              {selectedDistrict.reports !== null ? (
                <span className="font-extrabold text-sm text-emerald-800">
                  {t('areaMap.reportsCount').replace('{n}', formatNumber(selectedDistrict.reports, lang))}
                </span>
              ) : (
                <span className="text-slate-500 italic">
                  {t('areaMap.tooFewReports')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* F32: Outbreak Early Warning & Neighbor Risk Alert Card */}
        <CommunityAlertCard
          initialDistrictCode={selectedDistrict?.code}
          activeDisease={selectedClass}
        />

        {/* Keyboard Accessible Table of Districts */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-gray-900">
              📋 {t('areaMap.tableDistrict')} (64)
            </h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('areaMap.searchPlaceholder')}
              className="text-xs px-3 py-1.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-leaf-700 w-full sm:w-48"
            />
          </div>

          <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-2xl divide-y text-xs">
            {filteredDistricts.map((d) => {
              const count = reportsMap.get(d.code);
              const isSelected = selectedDistrict?.code === d.code;
              return (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => setSelectedDistrict({
                    code: d.code,
                    nameBn: d.district_name_bn,
                    nameEn: d.district_name_en,
                    reports: count ?? null,
                  })}
                  className={`w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/80 font-bold' : ''
                  }`}
                >
                  <span className="text-gray-800">
                    {lang === 'bn' ? d.district_name_bn : d.district_name_en}
                  </span>
                  <span>
                    {count !== null && count !== undefined ? (
                      <span className="px-2 py-0.5 rounded-md font-mono font-semibold bg-emerald-100 text-emerald-800 text-[11px]">
                        {formatNumber(count, lang)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">
                        {t('areaMap.tooFewReports')}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Attribution */}
        <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
          {t('areaMap.credit')}
        </div>
      </div>
    </PageContainer>
  );
}
