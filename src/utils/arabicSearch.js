/**
 * Arabic text normalization and search utilities for Beit El-Gomla
 * Handles: tashkeel, alef variants, taa marbuta/haa, ya/alef maqsura, tatweel, Arabic digits
 */

// Tashkeel / diacritics range (Arabic Unicode block diacritics)
const TASHKEEL_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;
// Tatweel (kashida)
const TATWEEL_RE = /\u0640/g;

function normalizeCharUnit(ch) {
  return ch
    .replace(TASHKEEL_RE, '')
    .replace(TATWEEL_RE, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .toLowerCase();
}

/**
 * Normalize Arabic text for search matching:
 * - Strip tashkeel/diacritics
 * - Unify alef variants (أ إ آ ٱ) → ا
 * - Unify taa marbuta (ة) and haa (ه)
 * - Unify ya (ي) and alef maqsura (ى)
 * - Convert Arabic-Indic digits (٠-٩) → 0-9
 * - Remove tatweel
 * - Lowercase Latin characters
 * - Trim and collapse whitespace
 */
export function normalizeArabic(text) {
  if (text === null || text === undefined) return '';
  return normalizeCharUnit(String(text))
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
 * Check whether an array of searchable text fields matches the search query.
 * Supports:
 * - Full normalized phrase match in any field
 * - Multi-word AND match across all provided fields (e.g. "ارز 25" or product name + category)
 */
export function matchesArabicFields(fields, query) {
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery) return true;

  const fieldList = Array.isArray(fields) ? fields : [fields];
  const normalizedFields = fieldList
    .map((field) => normalizeArabic(field))
    .filter(Boolean);

  if (normalizedFields.length === 0) return false;

  if (normalizedFields.some((field) => field.includes(normalizedQuery))) {
    return true;
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((token) =>
      normalizedFields.some((field) => field.includes(token))
    );
  }

  return false;
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
 * Build normalized string and character-by-character UTF-16 unit ranges
 * synchronized 1-to-1 with normalizeArabic(text).
 */
function buildNormalizedCharMap(str) {
  let normStr = '';
  const normToUnitRange = [];

  let unitIndex = 0;
  let started = false;
  let pendingSpaceRange = null;

  for (const ch of str) {
    const charLen = ch.length;
    const charStart = unitIndex;
    const charEnd = unitIndex + charLen;
    unitIndex = charEnd;

    if (/\s/.test(ch)) {
      if (started && !pendingSpaceRange) {
        pendingSpaceRange = { start: charStart, end: charEnd };
      }
      continue;
    }

    const normChar = normalizeCharUnit(ch);
    if (!normChar) {
      if (normToUnitRange.length > 0 && !pendingSpaceRange) {
        normToUnitRange[normToUnitRange.length - 1].end = charEnd;
      }
      continue;
    }

    if (pendingSpaceRange) {
      normStr += ' ';
      normToUnitRange.push(pendingSpaceRange);
      pendingSpaceRange = null;
    }

    started = true;
    for (const nCh of normChar) {
      normStr += nCh;
      normToUnitRange.push({ start: charStart, end: charEnd });
    }
  }

  return { normStr, normToUnitRange };
}

/**
 * Highlight matched parts of text for display.
 * Handles diacritics, space normalization, all non-overlapping matches, and multi-word tokens.
 * Returns an array of { text, highlighted } segments.
 */
export function highlightMatch(text, query) {
  const str = text === null || text === undefined ? '' : String(text);
  if (!str || !query) return [{ text: str, highlighted: false }];

  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery) return [{ text: str, highlighted: false }];

  const { normStr, normToUnitRange } = buildNormalizedCharMap(str);
  if (!normStr) return [{ text: str, highlighted: false }];

  const matchIntervals = [];

  const collectMatches = (needle) => {
    if (!needle) return;
    let startIdx = 0;
    while (startIdx < normStr.length) {
      const idx = normStr.indexOf(needle, startIdx);
      if (idx === -1) break;
      const endIdx = idx + needle.length - 1;
      const origStart = normToUnitRange[idx]?.start;
      const origEnd = normToUnitRange[endIdx]?.end;
      if (origStart !== undefined && origEnd !== undefined && origEnd > origStart) {
        matchIntervals.push([origStart, origEnd]);
      }
      startIdx = idx + needle.length;
    }
  };

  collectMatches(normalizedQuery);

  if (matchIntervals.length === 0) {
    const tokens = Array.from(new Set(normalizedQuery.split(' ').filter(Boolean)));
    if (tokens.length > 1) {
      for (const token of tokens) {
        collectMatches(token);
      }
    }
  }

  if (matchIntervals.length === 0) {
    return [{ text: str, highlighted: false }];
  }

  matchIntervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [matchIntervals[0]];
  for (let i = 1; i < matchIntervals.length; i++) {
    const [s, e] = matchIntervals[i];
    const last = merged[merged.length - 1];
    if (s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }

  const segments = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) {
      segments.push({ text: str.slice(cursor, start), highlighted: false });
    }
    segments.push({ text: str.slice(start, end), highlighted: true });
    cursor = end;
  }
  if (cursor < str.length) {
    segments.push({ text: str.slice(cursor), highlighted: false });
  }

  return segments;
}
