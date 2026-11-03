// "Focus on the diseased leaf": the farmer moves/resizes a box over the photo, then the box is
// cut out on the phone and analysed by the unchanged pipeline. Touch (pointer events), mouse and
// keyboard all work; handles have a 44 px touch area. No network is used.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import useT from '../../i18n/useT.js';
import PageContainer from '../../components/PageContainer.jsx';
import BigButton from '../../components/BigButton.jsx';
import { clampBox, defaultBox, dragBox, isBoxTooSmall, keyStepBox } from './cropMath.js';

const HANDLES = ['nw', 'ne', 'sw', 'se'];
const ZOOMS = [1, 1.5, 2, 3];

export default function CropScreen({ canvas, initialBox = null, onConfirm, onCancel, onAnalyseFull }) {
  const { t } = useT();
  const imgW = canvas?.width || 1;
  const imgH = canvas?.height || 1;
  const [box, setBox] = useState(() => clampBox(initialBox || defaultBox(imgW, imgH), imgW, imgH));
  const [zoomIdx, setZoomIdx] = useState(0);
  const [displayW, setDisplayW] = useState(0);
  const mountRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const boxRef = useRef(null);

  // Draw the photo once into a display canvas (the source canvas itself is never modified)
  useEffect(() => {
    const mount = mountRef.current;
    if (!canvas || !mount) return undefined;
    const display = document.createElement('canvas');
    display.width = canvas.width;
    display.height = canvas.height;
    display.className = 'block w-full h-auto select-none';
    display.setAttribute('aria-hidden', 'true');
    display.getContext('2d')?.drawImage(canvas, 0, 0);
    mount.replaceChildren(display);
    imgRef.current = display;
    const measure = () => setDisplayW(display.getBoundingClientRect().width);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(display);
    return () => {
      ro?.disconnect();
      display.width = 0; // release the pixel buffer
      mount.replaceChildren();
      imgRef.current = null;
    };
  }, [canvas]);

  const scale = displayW > 0 ? displayW / imgW : 0; // display px per source px
  const tooSmall = isBoxTooSmall(box);
  const sizeText = t('user_guided_crop.boxSize').replace('{w}', String(box.w)).replace('{h}', String(box.h));

  const onPointerDown = (handle) => (e) => {
    if (!scale) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startBox: box };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || !scale) return;
    e.preventDefault();
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    setBox(dragBox(d.startBox, d.handle, dx, dy, imgW, imgH));
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!tooSmall) onConfirm(box);
      return;
    }
    const next = keyStepBox(box, e.key, e.shiftKey, imgW, imgH);
    if (next !== box) {
      e.preventDefault();
      setBox(next);
    }
  };

  const style = useMemo(() => ({
    left: box.x * scale,
    top: box.y * scale,
    width: box.w * scale,
    height: box.h * scale,
  }), [box, scale]);

  const zoom = ZOOMS[zoomIdx];

  return (
    <PageContainer className="items-center py-4">
      <h1 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 text-center">{t('user_guided_crop.title')}</h1>
      <p className="text-xs sm:text-sm text-gray-600 mb-1 text-center max-w-sm">{t('user_guided_crop.instructions')}</p>
      <p className="text-[11px] text-gray-500 mb-3 text-center max-w-sm">{t('user_guided_crop.keyboardHelp')}</p>

      {/* Zoom controls */}
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0}
          className="min-w-11 min-h-11 px-3 rounded-xl border-2 border-gray-700 bg-white text-gray-900 font-bold disabled:opacity-40 cursor-pointer"
          aria-label={t('user_guided_crop.zoomOut')}>−</button>
        <span className="text-xs text-gray-700 w-12 text-center" aria-live="polite">{zoom}×</span>
        <button type="button" onClick={() => setZoomIdx((i) => Math.min(ZOOMS.length - 1, i + 1))} disabled={zoomIdx === ZOOMS.length - 1}
          className="min-w-11 min-h-11 px-3 rounded-xl border-2 border-gray-700 bg-white text-gray-900 font-bold disabled:opacity-40 cursor-pointer"
          aria-label={t('user_guided_crop.zoomIn')}>+</button>
        <button type="button" onClick={() => setBox(defaultBox(imgW, imgH))}
          className="min-h-11 px-3 rounded-xl border-2 border-gray-700 bg-white text-gray-900 text-xs font-bold cursor-pointer">
          {t('user_guided_crop.reset')}
        </button>
      </div>

      {/* Photo with the selection box (scrolls when zoomed) */}
      <div className="w-full max-w-sm overflow-auto rounded-xl border border-gray-300 bg-gray-100 max-h-[60vh] touch-pan-x touch-pan-y" data-testid="crop-viewport">
        <div className="relative" style={{ width: `${zoom * 100}%` }} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <div ref={mountRef} />
          {scale > 0 && (
            <div
              ref={boxRef}
              role="group"
              tabIndex={0}
              aria-label={`${t('user_guided_crop.boxLabel')}. ${sizeText}`}
              aria-describedby="ugc-help"
              onKeyDown={onKeyDown}
              onPointerDown={onPointerDown('move')}
              className="absolute cursor-move touch-none outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
              style={{
                ...style,
                // dims everything outside the box; two outlines stay visible on light and dark photos
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                border: '3px solid #ffffff',
                outline: '2px solid #000000',
              }}
              data-testid="crop-box"
            >
              {HANDLES.map((h) => (
                <span
                  key={h}
                  onPointerDown={onPointerDown(h)}
                  className="absolute touch-none"
                  style={{
                    width: 44,
                    height: 44,
                    left: h.includes('w') ? -22 : undefined,
                    right: h.includes('e') ? -22 : undefined,
                    top: h.includes('n') ? -22 : undefined,
                    bottom: h.includes('s') ? -22 : undefined,
                    cursor: h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize',
                  }}
                  aria-hidden="true"
                  data-testid={`crop-handle-${h}`}
                >
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-black" />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p id="ugc-help" className="sr-only">{t('user_guided_crop.keyboardHelp')}</p>
      <p className="text-xs text-gray-700 mt-2" aria-live="polite">{sizeText}</p>
      {tooSmall && (
        <p role="alert" className="w-full max-w-sm mt-2 p-2.5 rounded-xl border-2 border-red-600 bg-red-50 text-red-800 text-xs font-semibold">
          {t('user_guided_crop.tooSmall')}
        </p>
      )}

      <div className="w-full max-w-sm space-y-3 mt-4">
        <BigButton variant="primary" onClick={() => onConfirm(box)} disabled={tooSmall} ariaLabel={t('user_guided_crop.analyse')}>
          {t('user_guided_crop.analyse')}
        </BigButton>
        <BigButton variant="secondary" onClick={onAnalyseFull} ariaLabel={t('user_guided_crop.analyseFull')}>
          {t('user_guided_crop.analyseFull')}
        </BigButton>
        <BigButton variant="secondary" onClick={onCancel} ariaLabel={t('user_guided_crop.cancel')}>
          {t('user_guided_crop.cancel')}
        </BigButton>
      </div>
    </PageContainer>
  );
}
