const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Validate an input file before decoding.
 * Pure function.
 *
 * @param {File} file
 * @returns {{ ok: boolean, errorKey?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { ok: false, errorKey: 'errDecodeFailed' };
  }

  // 1. File size check (max 10 MB)
  if (file.size > MAX_BYTES) {
    return { ok: false, errorKey: 'errTooLarge' };
  }

  // 2. MIME type & extension check
  const mimeType = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';

  const mimeValid = ALLOWED_MIME_TYPES.has(mimeType);
  const extValid = ALLOWED_EXTENSIONS.has(ext);

  // Some Android file pickers send empty MIME type (""), so allow valid extension
  if (!mimeValid && !(mimeType === '' && extValid)) {
    return { ok: false, errorKey: 'errUnsupportedType' };
  }

  return { ok: true };
}
