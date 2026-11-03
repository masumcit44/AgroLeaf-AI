import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FEATURES } from '../../flags.js';
import { PwaStatus, InstallPrompt } from '../index.jsx';
import texts from '../i18n.js';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';

afterEach(() => {
  FEATURES.pwa = false;
  vi.unstubAllGlobals();
});

const renderBn = (node) => renderToString(<I18nProvider initialLang="bn">{node}</I18nProvider>);

describe('pwa texts', () => {
  it('uses pwa. keys and the same keys in Bangla and English', () => {
    const bnKeys = Object.keys(texts.bn).sort();
    expect(Object.keys(texts.en).sort()).toEqual(bnKeys);
    for (const key of bnKeys) expect(key.startsWith('pwa.')).toBe(true);
    expect(bnKeys.length).toBeGreaterThan(0);
  });
});

describe('PwaStatus', () => {
  it('renders nothing while the flag is off, so production is unchanged', () => {
    expect(renderBn(<PwaStatus scan={null} context="app" />)).toBe('');
  });

  it('renders nothing while online', () => {
    FEATURES.pwa = true;
    vi.stubGlobal('navigator', { onLine: true });
    expect(renderBn(<PwaStatus scan={null} context="app" />)).toBe('');
  });

  it('shows the offline banner when the browser is offline', () => {
    FEATURES.pwa = true;
    vi.stubGlobal('navigator', { onLine: false });
    const html = renderBn(<PwaStatus scan={null} context="app" />);
    expect(html).toContain('ইন্টারনেট নেই');
    expect(html).toContain('পরীক্ষা এখনও কাজ করে');
  });
});

describe('InstallPrompt', () => {
  it('renders nothing while the flag is off', () => {
    expect(renderBn(<InstallPrompt scan={null} context="home" />)).toBe('');
  });

  it('stays hidden until the browser offers an install prompt', () => {
    FEATURES.pwa = true;
    expect(renderBn(<InstallPrompt scan={null} context="home" />)).toBe('');
  });
});
