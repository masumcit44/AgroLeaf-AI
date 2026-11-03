import React, { useState, useEffect, useRef, useCallback } from 'react';
import useT from '../../i18n/useT.js';
import BigButton from '../../components/BigButton.jsx';
import { getProfile } from '../profile/profileStore.js';
import { getDiseaseKnowledge } from '../../lib/diseaseKnowledge.js';

// Local fallback if profile feature not available
async function getProfileFallback() {
  return null;
}

const getProfileSafe = typeof getProfile === 'function' ? getProfile : getProfileFallback;

function getReasonText(reason, t, _lang) {
  switch (reason) {
    case 'not_leaf':
      return t('help.reasonNotLeaf');
    case 'other_problem':
      return t('help.reasonOtherProblem');
    case 'low_confidence':
      return t('help.reasonLowConfidence');
    case 'healthy_needs_high_confidence':
      return t('help.reasonHealthyCaution');
    case 'suppressed':
      return t('help.reasonSuppressed');
    default:
      return t('help.reasonLowConfidence');
  }
}

function formatDate(dateString, lang) {
  const date = new Date(dateString);
  return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export { getReasonText, formatDate, createSummaryImage };

/**
 * Create a summary image on canvas for sharing/downloading
 */
async function createSummaryImage(scan, diseaseName, dateStr, districtName, lang) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 400;
  const height = 500;
  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 20px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('AgroLeaf AI', width / 2, 40);

  // Subtitle
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px system-ui';
  ctx.fillText(lang === 'bn' ? 'পাতা স্ক্রিনিং সারাংশ' : 'Leaf Screening Summary', width / 2, 70);

  // Thumbnail
  if (scan.canvas) {
    const thumbSize = 180;
    const thumbX = (width - thumbSize) / 2;
    const thumbY = 90;
    ctx.drawImage(scan.canvas, thumbX, thumbY, thumbSize, thumbSize);
    // Border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(thumbX, thumbY, thumbSize, thumbSize);
  }

  // Result name
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(diseaseName, width / 2, 300);

  // Date
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px system-ui';
  ctx.fillText(`${lang === 'bn' ? 'তারিখ' : 'Date'}: ${dateStr}`, width / 2, 340);

  // District
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px system-ui';
  ctx.fillText(`${lang === 'bn' ? 'জেলা' : 'District'}: ${districtName || (lang === 'bn' ? 'সেট করা নেই' : 'Not set')}`, width / 2, 370);

  // Footer
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px system-ui';
  ctx.fillText(lang === 'bn' ? 'আরও তথ্যের জন্য ১৬১২৩ এ কল করুন' : 'Call 16123 for more info', width / 2, 450);

  return canvas;
}

/** [result] Help sheet: 16123 + case summary to share. */
export function HelpButton({ scan, _context }) {
  const { t, lang } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [diseaseName, setDiseaseName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  
  // Two refs: one for visible preview, one for share/download canvas
  const previewCanvasRef = useRef(null);
  const shareCanvasRef = useRef(null);
  const helpButtonRef = useRef(null);

  // Load disease knowledge and profile when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    async function loadData() {
      try {
        // Set current date string for display
        if (mounted) setCurrentDateStr(formatDate(new Date().toISOString(), lang));

        // Get disease name from scan
        if (scan?.decision) {
          const knowledge = await getDiseaseKnowledge(lang);
          const classes = knowledge?.classes || {};
          
          let name = t('help.notSure');
          if (scan.decision.top?.key && classes[scan.decision.top.key]) {
            name = lang === 'en' 
              ? (classes[scan.decision.top.key].name_en || scan.decision.top.key)
              : (classes[scan.decision.top.key].name_bn || scan.decision.top.key);
          }
          if (mounted) setDiseaseName(name);
        }

        // Get profile district
        const profile = await getProfileSafe();
        if (mounted && profile?.district_code) {
          const districts = await import('../profile/districts.json');
          const district = districts.default.find(d => d.code === profile.district_code);
          if (district) {
            setDistrictName(lang === 'en' ? district.district_name_en : district.district_name_bn);
          }
        }
      } catch (err) {
        console.error('HelpButton: failed to load data', err);
      }
    }

    loadData();

    return () => { mounted = false; };
  }, [isOpen, scan, lang, t]);

  // Create summary image when data is ready (for share/download)
  useEffect(() => {
    if (!isOpen || !scan?.canvas || !diseaseName) return;

    const dateStr = formatDate(new Date().toISOString(), lang);
    
    createSummaryImage(scan, diseaseName, dateStr, districtName, lang)
      .then((canvas) => {
        shareCanvasRef.current = canvas;
      })
      .catch((err) => console.error('HelpButton: failed to create summary image', err));
  }, [isOpen, scan, diseaseName, districtName, lang]);

  // Draw preview canvas when share canvas is ready
  useEffect(() => {
    if (!previewCanvasRef.current || !shareCanvasRef.current) return;
    
    const previewCtx = previewCanvasRef.current.getContext('2d');
    if (previewCtx) {
      previewCanvasRef.current.width = shareCanvasRef.current.width;
      previewCanvasRef.current.height = shareCanvasRef.current.height;
      previewCtx.drawImage(shareCanvasRef.current, 0, 0);
    }
  }, [shareCanvasRef.current]);

  // Handler for backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  }, []);

  // Handler for Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  }, []);

  // Focus management and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the dialog content
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      dialog.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to the help button
      if (helpButtonRef.current) {
        helpButtonRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  const handleShare = async () => {
    if (!shareCanvasRef.current) {
      setShareStatus(t('help.shareFailed'));
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const whatToDo = lang === 'en' ? 'Call 16123 for agricultural support.' : 'কৃষি পরামর্শের জন্য ১৬১২৩ নম্বরে কল করুন।';
    
    const shareText = `${lang === 'en' ? 'AgroLeaf AI: Possible condition' : 'এগ্রোলিফ এআই: সম্ভাব্য সমস্যা'} — ${diseaseName}. ${whatToDo} ${origin}`;

    const blob = await new Promise((resolve) => {
      shareCanvasRef.current.toBlob(resolve, 'image/png');
    });
    const file = new File([blob], 'agroleaf-summary.png', { type: 'image/png' });

    try {
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'AgroLeaf AI Summary',
          text: shareText,
          files: [file],
        });
        setShareStatus(t('help.shareCopied'));
      } else if (navigator.share) {
        await navigator.share({
          title: 'AgroLeaf AI Summary',
          text: shareText,
          url: origin,
        });
        setShareStatus(t('help.shareCopied'));
      } else {
        throw new Error('Web Share API not available');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      
      // Fallback: download image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agroleaf-summary.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShareStatus(t('help.shareCopied'));
    }

    setTimeout(() => setShareStatus(''), 2500);
  };

  const handleDownload = () => {
    if (!shareCanvasRef.current) return;
    
    const dataUrl = shareCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'agroleaf-summary.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShareStatus(t('help.shareCopied'));
    setTimeout(() => setShareStatus(''), 2500);
  };

  if (!scan) return null;

  return (
    <>
      <button
        ref={helpButtonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full max-w-sm py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl shadow-sm text-center flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label={t('help.title')}
      >
        <span>🆘</span>
        <span>{t('help.title')}</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="help-title"
          tabIndex="-1"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 id="help-title" className="text-lg font-bold text-gray-900">{t('help.title')}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label={t('help.close')}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* 1. Call 16123 */}
              <div className="space-y-2">
                <a
                  href="tel:16123"
                  className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-sm text-center flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-emerald-300 block"
                  aria-label={t('help.callKrishi')}
                >
                  <span>📞</span>
                  <span>{t('help.callKrishi')}</span>
                </a>
                <p className="text-[11px] text-gray-500 text-center">{t('help.callChargeNote')}</p>
              </div>

              <hr className="border-gray-200" />

              {/* 2. Case Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('help.caseSummary')}</h3>
                
                {/* Thumbnail - visible preview canvas */}
                {scan.canvas && (
                  <div className="flex items-center justify-center">
                    <canvas
                      ref={previewCanvasRef}
                      className="h-32 w-auto max-w-full object-contain rounded-2xl border border-gray-200 shadow-xs mx-auto"
                      aria-label={t('help.thumbnailAria')}
                    />
                  </div>
                )}

                {/* Result */}
                <div className="space-y-1 text-center">
                  <p className="text-sm text-gray-500">{t('help.resultLabel')}</p>
                  <p className="text-lg font-bold text-gray-900 break-words">{diseaseName || t('help.notSure')}</p>
                </div>

                {/* Reason (if not confident) */}
                {scan.decision?.status !== 'confident' && scan.decision?.reason && (
                  <div className="text-center text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
                    <span className="font-medium">{t('help.reasonLabel')}: </span>
                    <span>{getReasonText(scan.decision.reason, t, lang)}</span>
                  </div>
                )}

                {/* Date & District */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-gray-500">{t('help.dateLabel')}</p>
                    <p className="font-medium text-gray-900">{currentDateStr}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-gray-500">{t('help.districtLabel')}</p>
                    <p className="font-medium text-gray-900">{districtName || t('help.noDistrict')}</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* 3. Share Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('help.shareSummary')}</h3>
                <div className="flex gap-3">
                  <BigButton
                    onClick={handleShare}
                    variant="primary"
                    type="button"
                    className="flex-1"
                  >
                    <span>📤</span>
                    <span>{t('help.shareSummary')}</span>
                  </BigButton>
                  <BigButton
                    onClick={handleDownload}
                    variant="secondary"
                    type="button"
                    className="flex-1"
                  >
                    <span>⬇️</span>
                    <span>{t('help.downloadImage')}</span>
                  </BigButton>
                </div>
                {shareStatus && (
                  <p className="text-center text-sm text-leaf-700 font-medium animate-fade-in">{shareStatus}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}