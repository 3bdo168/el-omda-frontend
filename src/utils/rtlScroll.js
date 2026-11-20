/**
 * Utility for robust, cross-browser RTL & LTR horizontal scrolling.
 * Accurately handles Chromium, Gecko (Firefox), and WebKit (Safari / iOS Safari).
 */

let cachedRtlScrollType = null;

/**
 * Detect how the current browser reports `scrollLeft` inside a `dir="rtl"` element:
 * - 'negative' (Chrome 85+, Firefox, Safari 15.4+): 0 at start (right), -maxScroll at end (left)
 * - 'reverse'  (Safari < 15.4, older WebKit):      maxScroll at start (right), 0 at end (left)
 * - 'positive' (Legacy IE/EdgeHTML):               0 at start (right), +maxScroll at end (left)
 */
export const getRtlScrollType = () => {
  if (cachedRtlScrollType) return cachedRtlScrollType;
  if (typeof document === 'undefined' || !document.body) return 'negative';

  const container = document.createElement('div');
  container.dir = 'rtl';
  container.style.direction = 'rtl';
  container.style.width = '10px';
  container.style.height = '10px';
  container.style.overflow = 'scroll';
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.visibility = 'hidden';

  const content = document.createElement('div');
  content.style.width = '30px';
  content.style.height = '10px';
  container.appendChild(content);

  document.body.appendChild(container);

  if (container.scrollLeft > 0) {
    cachedRtlScrollType = 'reverse';
  } else {
    container.scrollLeft = 1;
    if (container.scrollLeft > 0) {
      cachedRtlScrollType = 'positive';
    } else {
      cachedRtlScrollType = 'negative';
    }
  }

  document.body.removeChild(container);
  return cachedRtlScrollType;
};

const getElementDirection = (el) => {
  if (!el) return 'rtl';
  if (el.dir === 'ltr' || el.dir === 'rtl') return el.dir;
  if (typeof getComputedStyle === 'function') {
    return getComputedStyle(el).direction || 'rtl';
  }
  return 'rtl';
};

const safeScrollBy = (el, deltaLeft, behavior = 'smooth') => {
  if (!el || !deltaLeft) return;
  try {
    if (typeof el.scrollBy === 'function') {
      el.scrollBy({ left: deltaLeft, behavior });
      return;
    }
  } catch {
    // Fallback for older browsers without options object support
  }
  el.scrollLeft += deltaLeft;
};

/**
 * Scroll horizontally in an RTL (or LTR) container towards visual 'left' or visual 'right'.
 * In RTL:
 * - visual 'right' moves toward the START of content (e.g. first tab / first table column)
 * - visual 'left' moves toward the END of content (e.g. later tabs / later table columns)
 *
 * @param {HTMLElement} el
 * @param {'left'|'right'} direction - visual direction
 * @param {number|null} amount - pixels to scroll (defaults to 75% of clientWidth)
 * @param {number} ratio - default ratio of clientWidth (0.75 = 75%)
 */
export const scrollRtl = (el, direction, amount = null, ratio = 0.75) => {
  if (!el) return;
  const scrollAmount = Math.max(40, Math.round(amount ?? el.clientWidth * ratio));
  const dir = getElementDirection(el);

  if (dir === 'ltr') {
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;
    safeScrollBy(el, delta, 'smooth');
    return;
  }

  const type = getRtlScrollType();
  let delta = 0;

  if (direction === 'left') {
    delta = type === 'positive' ? scrollAmount : -scrollAmount;
  } else {
    delta = type === 'positive' ? -scrollAmount : scrollAmount;
  }

  safeScrollBy(el, delta, 'smooth');
};

/**
 * Check if the RTL (or LTR) container can scroll towards visual left or visual right.
 * Uses a 3px tolerance to handle fractional HiDPI / Retina scaling drift in Chrome & Safari iOS.
 *
 * @param {HTMLElement} el
 * @returns {{ canScrollLeft: boolean, canScrollRight: boolean, hasOverflow: boolean, maxScroll: number }}
 */
export const checkRtlScrollBounds = (el) => {
  if (!el) {
    return { canScrollLeft: false, canScrollRight: false, hasOverflow: false, maxScroll: 0 };
  }

  const { scrollLeft, scrollWidth, clientWidth } = el;
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  const EDGE_TOLERANCE = 3;

  if (maxScroll <= EDGE_TOLERANCE) {
    return { canScrollLeft: false, canScrollRight: false, hasOverflow: false, maxScroll: 0 };
  }

  const dir = getElementDirection(el);
  if (dir === 'ltr') {
    const canScrollLeft = scrollLeft > EDGE_TOLERANCE;
    const canScrollRight = scrollLeft < maxScroll - EDGE_TOLERANCE;
    return {
      canScrollLeft,
      canScrollRight,
      hasOverflow: true,
      maxScroll,
    };
  }

  const type = getRtlScrollType();

  if (type === 'positive') {
    return {
      canScrollRight: scrollLeft > EDGE_TOLERANCE,
      canScrollLeft: scrollLeft < maxScroll - EDGE_TOLERANCE,
      hasOverflow: true,
      maxScroll,
    };
  }

  if (type === 'reverse') {
    return {
      canScrollRight: scrollLeft < maxScroll - EDGE_TOLERANCE,
      canScrollLeft: scrollLeft > EDGE_TOLERANCE,
      hasOverflow: true,
      maxScroll,
    };
  }

  const absScroll = Math.abs(scrollLeft);
  return {
    canScrollRight: absScroll > EDGE_TOLERANCE,
    canScrollLeft: absScroll < maxScroll - EDGE_TOLERANCE,
    hasOverflow: true,
    maxScroll,
  };
};

/**
 * Scroll a child element horizontally into the visual center of its scroll container
 * using pure getBoundingClientRect() deltas.
 * Works identically across Chrome, Firefox, and Safari/iOS without jumping vertical page scroll
 * or suffering from RTL `offsetLeft` quirks.
 *
 * @param {HTMLElement} container
 * @param {HTMLElement} targetEl
 * @param {'smooth'|'auto'} behavior
 */
export const scrollElementIntoCenterRtl = (container, targetEl, behavior = 'smooth') => {
  if (!container || !targetEl) return;
  if (container.scrollWidth <= container.clientWidth + 2) return;

  const containerRect = container.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  if (containerRect.width === 0 || targetRect.width === 0) return;

  const containerCenterX = containerRect.left + containerRect.width / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const visualDeltaX = targetCenterX - containerCenterX;

  if (Math.abs(visualDeltaX) <= 2) return;

  const dir = getElementDirection(container);
  const type = getRtlScrollType();
  const deltaLeft = dir === 'rtl' && type === 'positive' ? -visualDeltaX : visualDeltaX;

  safeScrollBy(container, Math.round(deltaLeft), behavior);
};
