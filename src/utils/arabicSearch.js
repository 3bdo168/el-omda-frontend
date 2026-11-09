/**
 * Arabic text normalization and search utilities for Beit El-Gomla
 * Handles: tashkeel, alef variants, taa marbuta/haa, ya/alef maqsura, tatweel
 */

// Tashkeel / diacritics range (Arabic Unicode block diacritics)
const TASHKEEL_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;
// Tatweel (kashida)
const TATWEEL_RE = /\u0640/g;

/**
 * Normalize Arabic text for search matching:
 * - Strip tashkeel/diacritics
 * - Unify alef variants (أ إ آ ا) → ا
 * - Unify taa marbuta (ة) and haa (ه)
 * - Unify ya (ي) and alef maqsura (ى)
 * - Remove tatweel
 * - Lowercase Latin characters
 * - Trim and collapse whitespace
 */
export function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(TASHKEEL_RE, '')
    .replace(TATWEEL_RE, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if normalized haystack contains normalized needle.
 * Returns the index of the match, or -1.
 */
export function arabicContains(haystack, needle) {
  const h = normalizeArabic(haystack);
  const n = normalizeArabic(needle);
  if (!n) return -1;
  return h.indexOf(n);
}

/**
 * Check if normalized haystack starts with normalized needle.
 */
export function arabicStartsWith(haystack, needle) {
  const h = normalizeArabic(haystack);
  const n = normalizeArabic(needle);
  if (!n) return false;
  return h.startsWith(n);
}

/**
 * Simple Levenshtein distance for short strings (typo tolerance).
 * Only used for strings up to ~30 chars to keep it fast.
 */
function levenshtein(a, b) {
  if (a.length > 30 || b.length > 30) return Infinity;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Score a product/category against a search query.
 * Returns a score (lower = better match), or null if no match.
 * - Prefix match on name: score 0
 * - Contains match on name: score 1
 * - Contains match on description/sku/category: score 2
 * - Fuzzy match (Levenshtein ≤ 2 on words): score 3
 */
export function scoreMatch(item, normalizedQuery, fields = ['name']) {
  if (!normalizedQuery) return null;

  for (const field of fields) {
    const value = typeof item === 'string' ? item : item[field];
    if (!value) continue;
    const normalized = normalizeArabic(value);

    // Prefix match
    if (normalized.startsWith(normalizedQuery)) {
      return { score: field === 'name' || field === fields[0] ? 0 : 1, field };
    }

    // Contains match
    if (normalized.includes(normalizedQuery)) {
      return { score: field === 'name' || field === fields[0] ? 1 : 2, field };
    }
  }

  // Fuzzy: check if any word in name is close to any query word
  if (normalizedQuery.length >= 3) {
    const nameNorm = normalizeArabic(typeof item === 'string' ? item : item[fields[0]] || '');
    const nameWords = nameNorm.split(' ');
    const queryWords = normalizedQuery.split(' ');
    for (const qw of queryWords) {
      if (qw.length < 3) continue;
      for (const nw of nameWords) {
        if (nw.length < 2) continue;
        const dist = levenshtein(qw, nw);
        if (dist <= 2 && dist < Math.min(qw.length, nw.length) * 0.5) {
          return { score: 3, field: fields[0] };
        }
      }
    }
  }

  return null;
}

/**
 * Highlight matched parts of text for display.
 * Returns an array of { text, highlighted } segments.
 */
export function highlightMatch(text, query) {
  if (!text || !query) return [{ text: text || '', highlighted: false }];

  const normalizedText = normalizeArabic(text);
  const normalizedQuery = normalizeArabic(query);

  if (!normalizedQuery) return [{ text, highlighted: false }];

  // Find the match position in normalized text
  const matchIndex = normalizedText.indexOf(normalizedQuery);
  if (matchIndex === -1) return [{ text, highlighted: false }];

  // Map normalized indices back to original text indices
  // Since normalization can change character positions, we do a character-level mapping
  const origChars = [...text];
  const normChars = [];
  const normToOrig = []; // normIndex → origIndex

  for (let i = 0; i < origChars.length; i++) {
    const normChar = normalizeArabic(origChars[i]);
    for (let j = 0; j < normChar.length; j++) {
      normChars.push(normChar[j]);
      normToOrig.push(i);
    }
  }

  const origStart = normToOrig[matchIndex] ?? 0;
  const lastNormIdx = matchIndex + normalizedQuery.length - 1;
  const origEnd = (normToOrig[lastNormIdx] ?? origChars.length - 1) + 1;

  const segments = [];
  if (origStart > 0) {
    segments.push({ text: text.slice(0, origStart), highlighted: false });
  }
  segments.push({ text: text.slice(origStart, origEnd), highlighted: true });
  if (origEnd < text.length) {
    segments.push({ text: text.slice(origEnd), highlighted: false });
  }
  return segments;
}
