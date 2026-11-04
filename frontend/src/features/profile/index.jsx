import React, { useState, useEffect, useMemo } from 'react';
import useT from '../../i18n/useT.js';
import BigButton from '../../components/BigButton.jsx';
import districts from './districts.json';
import { getProfile, saveProfile, deleteProfile } from './profileStore.js';
import { locateAndSaveProfile, PROFILE_CHANGED_EVENT } from './gpsLocation.js';
import { DIVISIONS, DISTRICT_TO_DIVISION, getUpazilasForDistrict } from './bangladeshAdmin.js';
import { getVarietiesForSeason } from './riceVarieties.js';
import { CropCalendarView } from './CropCalendarView.jsx';

export * from './profileStore.js';
export * from './cropCalendarEngine.js';
export * from './bangladeshAdmin.js';
export * from './riceVarieties.js';
export { CropCalendarView };

const SEASONS = ['boro', 'aman', 'aus'];

function normalize(str) {
  return (str || '').toLowerCase().trim();
}

/** Button that fills the profile from GPS; shows its own progress and error text. */
export function GpsLocateButton({ onLocated, className = '' }) {
  const { t } = useT();
  const [state, setState] = useState({ busy: false, message: '' });

  const handleClick = async () => {
    setState({ busy: true, message: '' });
    try {
      const result = await locateAndSaveProfile();
      setState({ busy: false, message: result.approximate ? t('profile.gpsApprox') : t('profile.gpsSaved') });
      onLocated?.(result);
    } catch (err) {
      const key = {
        denied: 'profile.gpsDenied',
        timeout: 'profile.gpsTimeout',
        unsupported: 'profile.gpsUnsupported',
      }[err.message] || 'profile.gpsUnavailable';
      setState({ busy: false, message: t(key) });
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state.busy}
        data-testid="gps-locate"
        className="min-h-[44px] px-4 py-2 rounded-xl border border-leaf-300 bg-leaf-50 hover:bg-leaf-100 text-leaf-800 text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-1.5 w-full sm:w-auto"
      >
        <span>📍</span>
        <span>{state.busy ? t('profile.gpsLocating') : t('profile.gpsButton')}</span>
      </button>
      {state.message && (
        <p className="mt-1.5 text-xs text-gray-700" role="status">{state.message}</p>
      )}
    </div>
  );
}

/** [home] Short prompt to set district / season (optional). */
export function ProfilePrompt({ _scan, _context }) {
  const { t, lang } = useT();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = () => getProfile().then(setProfile);
    load();
    window.addEventListener(PROFILE_CHANGED_EVENT, load);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, load);
  }, []);

  const district = districts.find((d) => d.code === profile?.district_code);
  const name = lang === 'bn' ? district?.district_name_bn : district?.district_name_en;

  return (
    <div className="w-full text-center text-sm text-gray-700 my-2 space-y-1.5">
      {district ? (
        <div>
          <span className="font-medium">{name}</span>
          {profile.location_source === 'gps' && (
            <span className="ml-1 text-xs text-gray-500">({t('profile.gpsTag')})</span>
          )}{' '}
          <a
            href="#/profile"
            className="text-leaf-700 underline hover:text-leaf-800 font-semibold"
          >
            {t('profile.promptEdit')}
          </a>
        </div>
      ) : (
        <a
          href="#/profile"
          className="block text-leaf-700 underline font-medium hover:text-leaf-800"
        >
          {t('profile.prompt')}
        </a>
      )}
      <GpsLocateButton />
    </div>
  );
}

/** [route] Page at #/profile: Setup form or active Crop Calendar view */
export function ProfilePage({ _scan, _context }) {
  const { t, lang } = useT();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedUpazilaId, setSelectedUpazilaId] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);

  const [season, setSeason] = useState('boro');
  const [varietyId, setVarietyId] = useState('brri_28');
  const [customVariety, setCustomVariety] = useState('');
  const [cultivationMethod, setCultivationMethod] = useState('transplanted');
  const [plantDate, setPlantDate] = useState('');
  const [dateUnknown, setDateUnknown] = useState(false);
  const [cropStage, setCropStage] = useState('stage_tillering');

  const [status, setStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load existing profile
  const loadProfile = async () => {
    const p = await getProfile();
    if (p && p.district_code) {
      setProfile(p);
      setSelectedDistrictCode(p.district_code);
      setSelectedDivision(p.division_id || DISTRICT_TO_DIVISION[p.district_code] || '');
      setSelectedUpazilaId(p.upazila_id || '');
      setSeason(p.season || 'boro');
      setVarietyId(p.variety_id || 'brri_28');
      setCustomVariety(p.custom_variety_name || '');
      setCultivationMethod(p.cultivation_method || 'transplanted');
      setPlantDate(p.transplant_date || p.direct_seeding_date || '');
      setDateUnknown(!p.transplant_date && !p.direct_seeding_date && Boolean(p.crop_stage));
      setCropStage(p.crop_stage || 'stage_tillering');

      const d = districts.find((x) => x.code === p.district_code);
      if (d) {
        setDistrictQuery(lang === 'bn' ? d.district_name_bn : d.district_name_en);
      }
    } else {
      setProfile(null);
      setIsEditing(true);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [lang]);

  // Filter districts by selected division and search query
  const availableDistricts = useMemo(() => {
    let list = districts;
    if (selectedDivision) {
      list = list.filter((d) => DISTRICT_TO_DIVISION[d.code] === selectedDivision);
    }
    const q = normalize(districtQuery);
    if (!q) return list;
    return list.filter(
      (d) => normalize(d.district_name_en).includes(q) || normalize(d.district_name_bn).includes(q)
    );
  }, [selectedDivision, districtQuery]);

  // Available upazilas for selected district
  const selectedDistrictObj = districts.find((d) => d.code === selectedDistrictCode);
  const availableUpazilas = useMemo(() => {
    if (!selectedDistrictCode) return [];
    return getUpazilasForDistrict(
      selectedDistrictCode,
      selectedDistrictObj?.district_name_bn,
      selectedDistrictObj?.district_name_en
    );
  }, [selectedDistrictCode, selectedDistrictObj]);

  // Varieties for selected season
  const availableVarieties = useMemo(() => getVarietiesForSeason(season), [season]);

  const handleDistrictSelect = (district) => {
    setSelectedDistrictCode(district.code);
    setSelectedDivision(DISTRICT_TO_DIVISION[district.code] || selectedDivision);
    setSelectedUpazilaId('');
    setDistrictQuery(lang === 'bn' ? district.district_name_bn : district.district_name_en);
    setListOpen(false);
  };

  const handleSave = async () => {
    const dObj = selectedDistrictObj || districts.find((d) => d.code === '1'); // fallback Dhaka
    const divObj = DIVISIONS.find((div) => div.id === selectedDivision);
    const upzObj = availableUpazilas.find((u) => u.id === selectedUpazilaId);

    const varietyObj = availableVarieties.find((v) => v.id === varietyId);
    const chosenVarietyName = varietyId === 'other'
      ? (customVariety.trim() || 'অন্যান্য জাত')
      : (varietyObj?.name || 'ব্রি ধান');

    const updatedProfile = {
      ...(profile || {}),
      division_id: selectedDivision || (DISTRICT_TO_DIVISION[dObj.code] || 'dhaka'),
      division_name_bn: divObj?.name_bn || 'ঢাকা',
      division_name_en: divObj?.name_en || 'Dhaka',
      district_code: dObj.code,
      district_name_en: dObj.district_name_en,
      district_name_bn: dObj.district_name_bn,
      upazila_id: selectedUpazilaId || '',
      upazila_name_bn: upzObj?.name_bn || '',
      upazila_name_en: upzObj?.name_en || '',
      lat: dObj.lat,
      lon: dObj.lon,
      location_source: profile?.location_source === 'gps' ? 'gps' : 'district',
      season,
      variety: chosenVarietyName,
      variety_id: varietyId,
      custom_variety_name: customVariety.trim(),
      variety_duration_days: varietyObj?.duration || 145,
      cultivation_method: cultivationMethod,
      transplant_date: cultivationMethod === 'transplanted' && !dateUnknown ? plantDate : null,
      direct_seeding_date: cultivationMethod === 'direct_seeded' && !dateUnknown ? plantDate : null,
      crop_stage: dateUnknown ? cropStage : null,
      calendar_generated_at: new Date().toISOString(),
    };

    await saveProfile(updatedProfile);
    window.dispatchEvent(new Event(PROFILE_CHANGED_EVENT));
    setProfile(updatedProfile);
    setIsEditing(false);
    setStatus('saved');
    setTimeout(() => setStatus(''), 2500);
  };

  const handleDelete = async () => {
    await deleteProfile();
    setProfile(null);
    setSelectedDistrictCode('');
    setSelectedDivision('');
    setSelectedUpazilaId('');
    setDistrictQuery('');
    setIsEditing(true);
    setShowDeleteConfirm(false);
    setStatus('deleted');
    setTimeout(() => setStatus(''), 2500);
  };

  // If profile exists and user is not editing, show active Crop Calendar View!
  if (profile && profile.district_code && !isEditing) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900 text-center">
          {t('profile.pageTitle')}
        </h1>

        <CropCalendarView
          profile={profile}
          lang={lang}
          t={t}
          onEdit={() => setIsEditing(true)}
          onProfileUpdated={(updated) => setProfile(updated)}
        />

        <div className="pt-4 border-t border-gray-200">
          <BigButton
            onClick={() => setShowDeleteConfirm(true)}
            variant="secondary"
            type="button"
            className="text-red-700 border-red-300 hover:bg-red-50 text-xs py-2.5"
          >
            {t('profile.delete')}
          </BigButton>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{t('profile.delete')}</h3>
              <p className="text-sm text-gray-600">
                {lang === 'bn' ? 'আপনি কি নিশ্চিত? সংরক্ষিত ক্যালেন্ডার ও তথ্য মুছে যাবে।' : 'Are you sure? Saved calendar and profile will be deleted.'}
              </p>
              <div className="flex gap-3">
                <BigButton onClick={handleDelete} variant="primary" type="button" className="bg-red-600 hover:bg-red-700 text-sm">
                  {lang === 'bn' ? 'মুছুন' : 'Delete'}
                </BigButton>
                <BigButton onClick={() => setShowDeleteConfirm(false)} variant="secondary" type="button" className="text-sm">
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </BigButton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Redesigned Setup Flow
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="inline-block text-[10px] font-bold tracking-wider text-leaf-800 uppercase bg-leaf-100 px-2.5 py-0.5 rounded-full">
          AgroLeaf Smart Farming Planner
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          {t('profile.redesignTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
          {t('profile.redesignSubtitle')}
        </p>
      </div>

      {/* 4 Value Proposition Benefit Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white rounded-xl border border-leaf-200 p-2.5 flex items-center gap-2 shadow-2xs">
          <span className="text-xl">📅</span>
          <span className="text-xs font-bold text-leaf-900">{t('profile.benefitCalendar')}</span>
        </div>
        <div className="bg-white rounded-xl border border-leaf-200 p-2.5 flex items-center gap-2 shadow-2xs">
          <span className="text-xl">🌱</span>
          <span className="text-xs font-bold text-leaf-900">{t('profile.benefitStage')}</span>
        </div>
        <div className="bg-white rounded-xl border border-leaf-200 p-2.5 flex items-center gap-2 shadow-2xs">
          <span className="text-xl">⏰</span>
          <span className="text-xs font-bold text-leaf-900">{t('profile.benefitReminders')}</span>
        </div>
        <div className="bg-white rounded-xl border border-leaf-200 p-2.5 flex items-center gap-2 shadow-2xs">
          <span className="text-xl">🌦️</span>
          <span className="text-xs font-bold text-leaf-900">{t('profile.benefitWeather')}</span>
        </div>
      </div>

      {/* Local Storage Privacy Banner */}
      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
        <span className="text-base">🔒</span>
        <span>{t('profile.dataStaysLocal')}</span>
      </div>

      {/* Setup Form Sections */}
      <div className="space-y-5">
        {/* SECTION A: LOCATION */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-leaf-600" />
                {t('profile.locationHeading')}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{t('profile.locationSubtitle')}</p>
            </div>
          </div>

          <GpsLocateButton
            onLocated={({ profile: p }) => {
              setSelectedDistrictCode(p.district_code);
              setSelectedDivision(DISTRICT_TO_DIVISION[p.district_code] || '');
              const d = districts.find((x) => x.code === p.district_code);
              if (d) setDistrictQuery(lang === 'bn' ? d.district_name_bn : d.district_name_en);
              setListOpen(false);
            }}
          />

          <div className="space-y-2.5">
            {/* Division dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('profile.divisionLabel')}</label>
              <select
                value={selectedDivision}
                onChange={(e) => {
                  setSelectedDivision(e.target.value);
                  setSelectedDistrictCode('');
                  setSelectedUpazilaId('');
                  setDistrictQuery('');
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-leaf-600 focus:outline-none bg-white"
              >
                <option value="">{t('profile.divisionPlaceholder')}</option>
                {DIVISIONS.map((div) => (
                  <option key={div.id} value={div.id}>
                    {lang === 'bn' ? div.name_bn : div.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* District searchable combobox */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t('profile.districtLabel')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={districtQuery}
                  onChange={(e) => {
                    setDistrictQuery(e.target.value);
                    setListOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setListOpen(false);
                  }}
                  onBlur={() => setTimeout(() => setListOpen(false), 200)}
                  placeholder={t('profile.districtPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-leaf-600 focus:outline-none"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={listOpen && availableDistricts.length > 0 && Boolean(districtQuery)}
                  aria-controls="profile-district-list"
                />
                {listOpen && availableDistricts.length > 0 && districtQuery && (
                  <ul id="profile-district-list" role="listbox" className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {availableDistricts.slice(0, 15).map((d) => (
                      <li key={d.code} role="option" aria-selected={selectedDistrictCode === d.code}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleDistrictSelect(d)}
                          className={`w-full text-left px-3.5 py-2.5 hover:bg-leaf-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${selectedDistrictCode === d.code ? 'bg-leaf-100/70 font-bold' : ''}`}
                          data-testid="district-option"
                        >
                          <div>{lang === 'bn' ? d.district_name_bn : d.district_name_en}</div>
                          <div className="text-[10px] text-gray-500">{lang === 'bn' ? d.district_name_en : d.district_name_bn}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Upazila dropdown */}
            {selectedDistrictCode && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('profile.upazilaLabel')}</label>
                <select
                  value={selectedUpazilaId}
                  onChange={(e) => setSelectedUpazilaId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-leaf-600 focus:outline-none bg-white"
                >
                  <option value="">{t('profile.upazilaPlaceholder')}</option>
                  {availableUpazilas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {lang === 'bn' ? u.name_bn : u.name_en}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* SECTION B: RICE SEASON */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-leaf-600" />
            {t('profile.seasonHeading')}
          </h2>

          <div className="grid grid-cols-3 gap-2">
            {SEASONS.map((s) => {
              const isSel = season === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSeason(s);
                    // auto pick top variety of that season
                    const vars = getVarietiesForSeason(s);
                    setVarietyId(vars[0]?.id || 'unknown');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSel
                      ? 'border-leaf-600 bg-leaf-50 ring-2 ring-leaf-600 shadow-xs'
                      : 'border-gray-200 hover:border-leaf-300 bg-white'
                  }`}
                >
                  <div className="text-lg">{s === 'boro' ? '🌾' : s === 'aman' ? '🌧️' : '☀️'}</div>
                  <div className="mt-1">
                    <div className="font-extrabold text-sm text-gray-900">
                      {s === 'boro' ? t('profile.seasonBoro') : s === 'aman' ? t('profile.seasonAman') : t('profile.seasonAus')}
                    </div>
                    <div className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
                      {s === 'boro' ? 'নভেম্বর–মে' : s === 'aman' ? 'জুন–ডিসেম্বর' : 'মার্চ–জুলাই'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION C: RICE VARIETY */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-leaf-600" />
            {t('profile.varietyHeading')}
          </h2>

          <div className="space-y-2">
            <select
              value={varietyId}
              onChange={(e) => setVarietyId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-leaf-600 focus:outline-none bg-white font-medium"
            >
              {availableVarieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.duration} {lang === 'bn' ? 'দিন' : 'days'})
                </option>
              ))}
            </select>

            {varietyId === 'other' && (
              <input
                type="text"
                value={customVariety}
                onChange={(e) => setCustomVariety(e.target.value)}
                placeholder={t('profile.varietyCustomLabel')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-leaf-600 focus:outline-none"
              />
            )}
          </div>
        </section>

        {/* SECTION D: CULTIVATION METHOD & DATES */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3.5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-leaf-600" />
            {t('profile.methodHeading')}
          </h2>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCultivationMethod('transplanted')}
              className={`py-2.5 px-3 rounded-xl border text-center font-bold transition ${
                cultivationMethod === 'transplanted'
                  ? 'border-leaf-600 bg-leaf-50 text-leaf-900 ring-1 ring-leaf-600'
                  : 'border-gray-200 text-gray-700 bg-white'
              }`}
            >
              {t('profile.methodTransplant')}
            </button>
            <button
              type="button"
              onClick={() => setCultivationMethod('direct_seeded')}
              className={`py-2.5 px-3 rounded-xl border text-center font-bold transition ${
                cultivationMethod === 'direct_seeded'
                  ? 'border-leaf-600 bg-leaf-50 text-leaf-900 ring-1 ring-leaf-600'
                  : 'border-gray-200 text-gray-700 bg-white'
              }`}
            >
              {t('profile.methodDirect')}
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {!dateUnknown ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {cultivationMethod === 'transplanted' ? t('profile.transplantLabel') : t('profile.directDateLabel')}
                </label>
                <input
                  type="date"
                  value={plantDate}
                  onChange={(e) => setPlantDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-leaf-600 focus:outline-none bg-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('profile.cropStageLabel')}
                </label>
                <select
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-leaf-600 focus:outline-none bg-white font-medium"
                >
                  <option value="stage_establishment">চারা প্রতিষ্ঠা (Seedling Establishment)</option>
                  <option value="stage_tillering">সক্রিয় কুশি গজানো (Active Tillering)</option>
                  <option value="stage_booting">কাইচথোড় / থোড় (Panicle Initiation)</option>
                  <option value="stage_flowering">ফুল ফোটা (Flowering)</option>
                  <option value="stage_grain_filling">দানা গঠন (Grain Filling)</option>
                  <option value="stage_maturity">ধান পাকা (Ripening)</option>
                </select>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={dateUnknown}
                onChange={(e) => setDateUnknown(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-leaf-600 focus:ring-leaf-500"
              />
              <span>{t('profile.dateUnknown')}</span>
            </label>
          </div>
        </section>

        {/* SECTION E: CALENDAR PREVIEW */}
        <section className="bg-leaf-50/70 rounded-2xl border border-leaf-200 p-4 space-y-2 shadow-2xs">
          <h3 className="text-xs font-bold text-leaf-900 flex items-center gap-1.5">
            <span>📋</span> {t('profile.previewHeading')}
          </h3>
          <ul className="text-xs text-leaf-800 space-y-1 list-disc pl-4 leading-relaxed">
            <li>{t('profile.previewItem1')}</li>
            <li>{t('profile.previewItem2')}</li>
            <li>{t('profile.previewItem3')}</li>
            <li>{t('profile.previewItem4')}</li>
          </ul>
        </section>
      </div>

      {status && (
        <div className="text-center text-xs font-bold text-leaf-700 animate-fade-in">
          {t(`profile.${status}`)}
        </div>
      )}

      {/* Primary Actions */}
      <div className="space-y-2.5 pt-2">
        <BigButton onClick={handleSave} variant="primary" type="button">
          ✨ {t('profile.generateButton')}
        </BigButton>

        {profile && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="w-full py-2.5 text-xs text-gray-600 font-semibold hover:underline"
          >
            {t('profile.later')}
          </button>
        )}
      </div>
    </div>
  );
}
