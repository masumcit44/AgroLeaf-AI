import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import { LiveCameraScanner } from '../LiveCameraScanner.jsx';

function renderWithI18n(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('LiveCameraScanner Component', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('CAMERA_UNSUPPORTED')),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders scanner dialog container and accessible role', () => {
    const html = renderWithI18n(<LiveCameraScanner onCapture={() => {}} onClose={() => {}} />, 'bn');

    expect(html).toContain('role="dialog"');
    expect(html).toContain('data-testid="live-camera-scanner"');
    expect(html).toContain('লাইভ ক্যামেরা গাইড');
    expect(html).toContain('data-testid="scanner-capture-btn"');
  });

  it('renders in English when lang is en', () => {
    const html = renderWithI18n(<LiveCameraScanner onCapture={() => {}} onClose={() => {}} />, 'en');

    expect(html).toContain('Live Camera Guide');
    expect(html).toContain('Initializing camera...');
  });
});

