/**
 * Utility for robust, cross-browser RTL horizontal scrolling.
 * Accurately handles Chromium, Gecko (Firefox), and WebKit (Safari / iOS).
 */

let cachedRtlScrollType = null;

export const getRtlScrollType = () => {
  if (cachedRtlScrollType) return cachedRtlScrollType;
  if (typeof document === 'undefined') return 'negative';

  const container = document.createElement('div');
  container.dir = 'rtl';
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

/**
 * Scroll horizontally in an RTL container towards visual 'left' or visual 'right'
 * @param {HTMLElement} el
 * @param {'left'|'right'} direction - visual direction
 * @param {number|null} amount - pixels to scroll (defaults to 70% of clientWidth)
 */
export const scrollRtl = (el, direction, amount = null) => {
  if (!el) return;
  const scrollAmount = amount || el.clientWidth * 0.7;
  const type = getRtlScrollType();

  let delta = 0;
  if (direction === 'left') {
    delta = type === 'positive' ? scrollAmount : -scrollAmount;
  } else {
    delta = type === 'positive' ? -scrollAmount : scrollAmount;
  }

  el.scrollBy({ left: delta, behavior: 'smooth' });
};

/**
 * Check if the RTL container can scroll towards visual left or visual right
 * @param {HTMLElement} el
 * @returns {{ canScrollLeft: boolean, canScrollRight: boolean }}
 */
export const checkRtlScrollBounds = (el) => {
  if (!el) return { canScrollLeft: false, canScrollRight: false };

  const { scrollLeft, scrollWidth, clientWidth } = el;
  const maxScroll = scrollWidth - clientWidth;

  if (maxScroll <= 2) {
    return { canScrollLeft: false, canScrollRight: false };
  }

  const type = getRtlScrollType();

  if (type === 'positive') {
    return {
      canScrollRight: scrollLeft > 4,
      canScrollLeft: scrollLeft < maxScroll - 4,
    };
  }

  if (type === 'reverse') {
    return {
      canScrollRight: scrollLeft < maxScroll - 4,
      canScrollLeft: scrollLeft > 4,
    };
  }

  const absScroll = Math.abs(scrollLeft);
  return {
    canScrollRight: absScroll > 4,
    canScrollLeft: absScroll < maxScroll - 4,
  };
};
