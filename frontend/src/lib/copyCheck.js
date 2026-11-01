/**
 * Checks for prohibited words while explicitly exempting official negated disclaimers
 * per competition honesty guidelines (rule §4.2 and lead review 09:05).
 */

export const FORBIDDEN_WORDS = ['diagnosis', 'রোগ নির্ণয়', '100%', 'free call'];

export function checkForbiddenCopy(rawText, allowedPhrases = []) {
  if (!rawText) return { pass: true, found: [] };

  let cleaned = rawText;
  for (const phrase of allowedPhrases) {
    if (phrase && typeof phrase === 'string') {
      // Split and join to replace all occurrences without regex escaping issues
      cleaned = cleaned.split(phrase).join(' ');
    }
  }

  const lower = cleaned.toLowerCase();
  const found = [];
  for (const word of FORBIDDEN_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      found.push(word);
    }
  }

  return {
    pass: found.length === 0,
    found,
    cleaned,
  };
}
