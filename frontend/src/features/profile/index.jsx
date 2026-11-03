import React, { useState, useEffect, useMemo } from 'react';
import useT from '../../i18n/useT.js';
import BigButton from '../../components/BigButton.jsx';
import districts from './districts.json';
import { getProfile, saveProfile, deleteProfile } from './profileStore.js';

const SEASONS = ['boro', 'aman', 'aus'];
const SEASON_LABELS = {
  boro: 'profile.seasonBoro',
  aman: 'profile.seasonAman',
  aus: 'profile.seasonAus',
};

function normalize(str) {
  return str.toLowerCase().trim();
}

function filterDistricts(query) {
  const q = normalize(query);
  if (!q) return districts;
  return districts.filter(
    (d) => normalize(d.district_name_en).includes(q) || normalize(d.district_name_bn).includes(q)
  );
}

/** [home] Short prompt to set district / season (optional). */
export function ProfilePrompt({ _scan, _context }) {
  const { t, lang } = useT();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  if (!profile?.district_code) {
    return (
      <div className="w-full text-center text-sm text-gray-600 my-2">
        <a
          href="#/profile"
          className="text-leaf-700 underline font-medium hover:text-leaf-800"
        >
          {t('profile.prompt')}
        </a>
      </div>
    );
  }

  const district = districts.find((d) => d.code === profile.district_code);
  const name = lang === 'bn' ? district?.district_name_bn : district?.district_name_en;

  return (
    <div className="w-full text-center text-sm text-gray-700 my-2">
      <span className="font-medium">{name}</span>{' '}
      <a
        href="#/profile"
        className="text-leaf-700 underline hover:text-leaf-800"
      >
        {t('profile.promptEdit')}
      </a>
    </div>
  );
}

/** [route] Page at #/profile. */
export function ProfilePage({ _scan, _context }) {
  const { t, lang } = useT();
  const [profile, setProfile] = useState({});
  const [districtQuery, setDistrictQuery] = useState('');
  const [status, setStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setProfile(p);
        const d = districts.find((x) => x.code === p.district_code);
        if (d) {
          setDistrictQuery(lang === 'bn' ? d.district_name_bn : d.district_name_en);
        }
      }
    });
  }, [lang]);

  const filteredDistricts = useMemo(() => filterDistricts(districtQuery), [districtQuery]);
  const selectedDistrict = districts.find((d) => d.code === profile.district_code);

  const handleDistrictSelect = (district) => {
    setProfile((prev) => ({
      ...prev,
      district_code: district.code,
      district_name_en: district.district_name_en,
      district_name_bn: district.district_name_bn,
      lat: district.lat,
      lon: district.lon,
    }));
    setDistrictQuery(lang === 'bn' ? district.district_name_bn : district.district_name_en);
  };

  const handleSave = async () => {
    await saveProfile(profile);
    setStatus('saved');
    setTimeout(() => setStatus(''), 2000);
  };

  const handleDelete = async () => {
    await deleteProfile();
    setProfile({});
    setDistrictQuery('');
    setShowDeleteConfirm(false);
    setStatus('deleted');
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 text-center">{t('profile.pageTitle')}</h1>

      <p className="text-xs text-gray-500 text-center">{t('profile.dataStaysLocal')}</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.districtLabel')}</label>
          <div className="relative">
            <input
              type="text"
              value={districtQuery}
              onChange={(e) => setDistrictQuery(e.target.value)}
              placeholder={t('profile.districtPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:border-transparent"
              autoComplete="off"
            />
            {filteredDistricts.length > 0 && districtQuery && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredDistricts.slice(0, 20).map((d) => (
                  <li
                    key={d.code}
                    onClick={() => handleDistrictSelect(d)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${selectedDistrict?.code === d.code ? 'bg-leaf-50' : ''}`}
                  >
                    <div className="font-medium">{lang === 'bn' ? d.district_name_bn : d.district_name_en}</div>
                    <div className="text-xs text-gray-500">{lang === 'bn' ? d.district_name_en : d.district_name_bn}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.seasonLabel')}</label>
          <div className="flex gap-2">
            {SEASONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setProfile((p) => ({ ...p, season: s }))}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-colors ${
                  profile.season === s
                    ? 'bg-leaf-700 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t(SEASON_LABELS[s])}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.varietyLabel')}</label>
          <input
            type="text"
            value={profile.variety || ''}
            onChange={(e) => setProfile((p) => ({ ...p, variety: e.target.value }))}
            placeholder={t('profile.varietyPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.transplantLabel')}</label>
          <input
            type="date"
            value={profile.transplant_date || ''}
            onChange={(e) => setProfile((p) => ({ ...p, transplant_date: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:border-transparent"
          />
        </div>
      </div>

      {status && (
        <div className="text-center text-sm text-leaf-700 font-medium animate-fade-in">
          {t(`profile.${status}`)}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <BigButton onClick={handleSave} variant="primary" type="button">
          {t('profile.save')}
        </BigButton>
        <BigButton
          onClick={() => setShowDeleteConfirm(true)}
          variant="secondary"
          type="button"
          className="text-red-700 border-red-300 hover:bg-red-50"
        >
          {t('profile.delete')}
        </BigButton>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('profile.delete')}</h3>
            <p className="text-gray-600 mb-4">আপনি কি নিশ্চিত? এটি প্রত্যাখ্যান করা যাবে না।</p>
            <div className="flex gap-3">
              <BigButton
                onClick={handleDelete}
                variant="primary"
                type="button"
                className="bg-red-600 hover:bg-red-700"
              >
                মুছুন
              </BigButton>
              <BigButton
                onClick={() => setShowDeleteConfirm(false)}
                variant="secondary"
                type="button"
              >
                বাতিল
              </BigButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}