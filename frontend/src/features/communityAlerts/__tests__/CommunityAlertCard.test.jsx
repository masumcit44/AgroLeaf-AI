import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import CommunityAlertCard from '../CommunityAlertCard.jsx';

function renderWithI18n(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('F32 CommunityAlertCard Component', () => {
  it('renders the card container, header title, and district selector in Bengali', () => {
    const html = renderWithI18n(<CommunityAlertCard initialDistrictCode="1" />);

    expect(html).toContain('data-testid="community-alert-card"');
    expect(html).toContain('এলাকাভিত্তিক রোগ সতর্কতা ও নজরদারি');
    expect(html).toContain('data-testid="district-select"');
  });

  it('renders disease filter chips for Blast, Brown Spot, Sheath Blight, and Tungro', () => {
    const html = renderWithI18n(<CommunityAlertCard initialDistrictCode="1" />);

    expect(html).toContain('data-testid="disease-filter-blast"');
    expect(html).toContain('data-testid="disease-filter-brown_spot"');
    expect(html).toContain('data-testid="disease-filter-sheath_blight"');
    expect(html).toContain('data-testid="disease-filter-tungro"');
    expect(html).toContain('ধানের ব্লাস্ট');
    expect(html).toContain('বাদামী দাগ');
    expect(html).toContain('শীথ ব্লাইট');
    expect(html).toContain('টুংরো ভাইরাস');
  });

  it('renders English header and selector in English mode', () => {
    const html = renderWithI18n(<CommunityAlertCard initialDistrictCode="1" />, 'en');

    expect(html).toContain('Community Outbreak Early Warning');
    expect(html).toContain('Select Rice Disease:');
    expect(html).toContain('Rice Blast');
  });

  it('handles null and empty props gracefully without throwing', () => {
    expect(() => renderWithI18n(<CommunityAlertCard />)).not.toThrow();
    expect(() => renderWithI18n(<CommunityAlertCard initialDistrictCode={null} activeDisease={null} />)).not.toThrow();
  });
});
