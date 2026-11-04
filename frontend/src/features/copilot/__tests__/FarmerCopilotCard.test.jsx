import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import FarmerCopilotCard from '../FarmerCopilotCard.jsx';
import CopilotPage from '../CopilotPage.jsx';

function renderWithI18n(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('F30 FarmerCopilotCard Component', () => {
  it('renders the copilot card container and voice activation button in Bengali', () => {
    const html = renderWithI18n(<FarmerCopilotCard />);

    expect(html).toContain('data-testid="farmer-copilot-card"');
    expect(html).toContain('এগ্রোলিফ ভয়েস সহকারী');
    expect(html).toContain('মুখে বাংলায় প্রশ্ন করুন, উত্তর শুনুন');
    expect(html).toContain('কথা বলতে চাপুন');
  });

  it('displays the active disease badge when scan context is provided', () => {
    const html = renderWithI18n(<FarmerCopilotCard scan={{ classKey: 'blast' }} />);

    expect(html).toContain('blast');
  });

  it('renders quick suggestion chips for the farmer', () => {
    const html = renderWithI18n(<FarmerCopilotCard scan={{ classKey: 'blast' }} />);

    expect(html).toContain('কী ওষুধ দেব?');
    expect(html).toContain('সার দেওয়া যাবে?');
    expect(html).toContain('পানি ব্যবস্থাপনা কেমন হবে?');
    expect(html).toContain('জৈব প্রতিকার কী?');
  });

  it('renders typed input fallback option', () => {
    const html = renderWithI18n(<FarmerCopilotCard />);

    expect(html).toContain('বাংলায়/Banglish-এ লিখুন');
  });

  it('renders bilingual content when English language is selected', () => {
    const html = renderWithI18n(<FarmerCopilotCard />, 'en');

    expect(html).toContain('AgroLeaf Voice Copilot');
    expect(html).toContain('Ask questions in spoken Bangla');
    expect(html).toContain('Suggested questions:');
  });

  it('handles null scan and empty props gracefully without throwing', () => {
    expect(() => renderWithI18n(<FarmerCopilotCard scan={null} />)).not.toThrow();
    expect(() => renderWithI18n(<FarmerCopilotCard scan={{}} />)).not.toThrow();
  });
});

describe('F30 CopilotPage Standalone Route Component', () => {
  it('renders the dedicated copilot page with header, card, and BRRI evidence footer', () => {
    const html = renderWithI18n(<CopilotPage />);

    expect(html).toContain('এগ্রোলিফ কৃষক সহকারী');
    expect(html).toContain('বাংলাদেশ ধান গবেষণা ইনস্টিটিউট');
    expect(html).toContain('১৬১২৩');
    expect(html).toContain('data-testid="farmer-copilot-card"');
  });
});
