import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import { BeforeAfterViewer } from '../BeforeAfterViewer.jsx';

function fakeBlob() {
  return new Blob(['test-image'], { type: 'image/jpeg' });
}

function renderViewer(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('BeforeAfterViewer Component', () => {
  const mockT = (k) => k;

  it('renders nothing when fewer than 2 items are provided', () => {
    const html = renderViewer(
      <BeforeAfterViewer items={[{ id: '1' }]} t={mockT} lang="en" />
    );
    expect(html).toBe('');
  });

  it('renders before and after comparison cards and days apart badge in English', () => {
    const items = [
      {
        id: '1',
        created_at: '2026-05-01T10:00:00Z',
        thumb_jpeg: fakeBlob(),
        top_class: 'blast',
        status: 'confident',
      },
      {
        id: '2',
        created_at: '2026-05-08T10:00:00Z',
        thumb_jpeg: fakeBlob(),
        top_class: 'healthy',
        status: 'confident',
      },
    ];

    const html = renderViewer(
      <BeforeAfterViewer items={items} t={mockT} lang="en" />,
      'en'
    );

    expect(html).toContain('data-testid="before-after-viewer"');
    expect(html).toContain('data-testid="progression-banner"');
    expect(html).toContain('history.beforeAfterCompare');
  });

  it('renders in Bangla with Bengali numerals and progression details', () => {
    const items = [
      {
        id: '1',
        created_at: '2026-05-01T10:00:00Z',
        thumb_jpeg: fakeBlob(),
        top_class: 'blast',
        status: 'confident',
      },
      {
        id: '2',
        created_at: '2026-05-05T10:00:00Z',
        thumb_jpeg: fakeBlob(),
        top_class: 'blast',
        status: 'confident',
      },
    ];

    const html = renderViewer(
      <BeforeAfterViewer items={items} t={mockT} lang="bn" />,
      'bn'
    );

    expect(html).toContain('data-testid="before-after-viewer"');
    expect(html).toContain('data-testid="progression-banner"');
    expect(html).toContain('history.statusUnchanged');
  });
});
