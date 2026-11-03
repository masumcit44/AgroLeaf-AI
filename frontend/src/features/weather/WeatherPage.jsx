// Weather tab (#/weather): the same BAMIS-based chips as the home page, with an explanation.
import React from 'react';
import useT from '../../i18n/useT.js';
import { WeatherChips } from './index.jsx';

export default function WeatherPage() {
  const { t } = useT();
  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 text-center">{t('weather.title')}</h1>
      <p className="text-sm text-gray-700 leading-relaxed">{t('weather.pageIntro')}</p>
      <WeatherChips scan={null} context="home" />
      <p className="text-xs text-gray-500 leading-relaxed">{t('weather.pageRulesNote')}</p>
    </div>
  );
}
