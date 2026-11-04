import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEATURES, isFeatureOn, PRODUCTION_HOST } from '../flags.js';
import { FeatureSlot, FeaturePage, SlotBoundary } from '../slots.jsx';
import { SLOT_LAYOUT, FEATURE_ROUTES } from '../slotLayout.js';
import { mergeFeatureTexts } from '../../i18n/mergeFeatureTexts.js';
import bn from '../../i18n/bn.js';
import en from '../../i18n/en.js';

const FEATURES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUB_FLAGS = ['weatherReport'];
const featureNames = Object.keys(FEATURES).filter((n) => !SUB_FLAGS.includes(n));

const SHIPPED = { ...FEATURES };
afterEach(() => {
  Object.assign(FEATURES, SHIPPED);
  vi.unstubAllGlobals();
});

describe('feature flags', () => {
  it('only released features are on; unbuilt ones stay off', () => {
    const released = ['pwa', 'history', 'profile', 'weather', 'user_guided_crop', 'reliability', 'help', 'actionPlan', 'reminders', 'yieldRisk', 'explainableAi', 'confidenceScore', 'liveScanner', 'diseaseSeverity'];
    expect(featureNames.filter((n) => FEATURES[n]).sort()).toEqual([...released].sort());
    expect(isFeatureOn('not_a_feature')).toBe(false);
  });

  it('preview testers can switch a feature on with ?features=, production cannot', () => {
    const store = {};
    vi.stubGlobal('localStorage', { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } });
    vi.stubGlobal('window', { location: { hostname: 'feat-x.agroleaf-ai.pages.dev', search: '?features=feedback,help' } });
    expect(isFeatureOn('feedback')).toBe(true);
    expect(isFeatureOn('help')).toBe(true);
    expect(isFeatureOn('areaMap')).toBe(false);
    vi.stubGlobal('window', { location: { hostname: PRODUCTION_HOST, search: '?features=feedback' } });
    expect(isFeatureOn('feedback')).toBe(false);
  });

  it('preview testers can switch a released feature off with ?features=!feature, production cannot', () => {
    const store = {};
    vi.stubGlobal('localStorage', { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } });
    vi.stubGlobal('window', { location: { hostname: 'feat-x.agroleaf-ai.pages.dev', search: '?features=!pwa' } });
    expect(isFeatureOn('pwa')).toBe(false);
    expect(isFeatureOn('history')).toBe(true);
    vi.stubGlobal('window', { location: { hostname: PRODUCTION_HOST, search: '?features=!pwa' } });
    expect(isFeatureOn('pwa')).toBe(true);
  });
});

describe('feature slots', () => {
  it('every slot entry and route points to a real component of a known feature', () => {
    for (const entries of Object.values(SLOT_LAYOUT)) {
      for (const [name, Component] of entries) {
        expect(featureNames, name).toContain(name);
        expect(typeof Component, name).toBe('function');
      }
    }
    for (const [route, [name, Page]] of Object.entries(FEATURE_ROUTES)) {
      expect(route.startsWith('#/')).toBe(true);
      expect(featureNames).toContain(name);
      expect(typeof Page).toBe('function');
    }
  });

  it('render nothing while features are off', () => {
    for (const k of featureNames) FEATURES[k] = false;
    for (const slot of Object.keys(SLOT_LAYOUT)) {
      expect(renderToString(<>{FeatureSlot({ slot, scan: null })}</>)).toBe('');
    }
    expect(FeaturePage({ route: '#/history', fallback: 'home' })).toBe('home');
  });

  it('render a feature once its flag is on', () => {
    for (const k of featureNames) FEATURES[k] = false;
    FEATURES.history = true;
    const items = FeatureSlot({ slot: 'result', scan: {} });
    expect(items.map((el) => el.key)).toEqual(['result-history']);
    expect(FeaturePage({ route: '#/history', fallback: 'home' })).not.toBe('home');
  });

  it('an error in a feature hides that feature instead of the page', () => {
    expect(SlotBoundary.getDerivedStateFromError(new Error('x'))).toEqual({ failed: true });
  });
});

describe('per-feature texts', () => {
  const modules = Object.fromEntries(featureNames.map((n) => [n, null]));
  for (const name of featureNames) {
    modules[name] = fs.existsSync(path.join(FEATURES_DIR, name, 'i18n.js'));
  }

  it('every feature has its own i18n file', () => {
    expect(Object.entries(modules).filter(([, ok]) => !ok).map(([n]) => n)).toEqual([]);
  });

  it('keys start with the feature name, exist in both languages, and never shadow app texts', async () => {
    // the same glob the I18nProvider uses (a template-string import cannot resolve every folder name)
    const all = import.meta.glob('../*/i18n.js', { eager: true, import: 'default' });
    for (const name of featureNames) {
      const texts = all[`../${name}/i18n.js`];
      const bnKeys = Object.keys(texts.bn).sort();
      expect(Object.keys(texts.en).sort(), name).toEqual(bnKeys);
      for (const key of bnKeys) {
        expect(key.startsWith(`${name}.`), key).toBe(true);
        expect(key in bn || key in en, key).toBe(false);
      }
    }
  });

  it('merging adds feature texts without changing app texts', () => {
    const merged = mergeFeatureTexts(bn, { a: { bn: { 'history.title': 'ইতিহাস' }, en: {} } }, 'bn');
    expect(merged['history.title']).toBe('ইতিহাস');
    expect(merged.appName).toBe(bn.appName);
  });
});
