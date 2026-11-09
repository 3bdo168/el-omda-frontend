import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { scrollRtl, checkRtlScrollBounds } from '../utils/rtlScroll';

/** Spring-animated sliding indicator that follows the active category tab */
const SlidingIndicator = ({ containerRef, activeSelector, variant = 'emerald' }) => {
  const [style, setStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      if (!container) return;
      const activeEl = container.querySelector(activeSelector);
      if (!activeEl) {
        setStyle((s) => ({ ...s, opacity: 0 }));
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setStyle({
        left: activeRect.left - containerRect.left + container.scrollLeft,
        width: activeRect.width,
        opacity: 1,
      });
    };
    update();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      }
    };
  }, [containerRef, activeSelector]);

  return (
    <div
      className={`liquid-indicator liquid-indicator--${variant}`}
      style={style}
    />
  );
};

/**
 * CategoryScrollBar — Horizontally scrollable category tabs with RTL arrow buttons.
 *
 * Requirements met:
 * - Left and right arrow buttons at ends of bar
 * - Each click scrolls smoothly by 60–80% (70%) of visible width
 * - Fully RTL aware (maps visual left to visual left and visual right to visual right)
 * - Show/enable arrows only when more content exists in that direction
 * - Auto-scroll active tab into view
 * - Native scrollbar hidden visually
 * - Touch swipe & mouse drag supported
 * - Subtle gradient edge fades
 * - Compact circular buttons (34px) with visible focus rings & aria-labels
 * - Liquid pills & sliding indicator underline preserved
 */
export const CategoryScrollBar = ({
  categories = [],
  selectedCategory = '',
  onSelect,
  onOpenSheet,
}) => {
  const scrollRef = useRef(null);
  const swipeStartRef = useRef(null);

  // canScrollLeft: content extends to the visual left
  // canScrollRight: content extends to the visual right
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll boundary in RTL
  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const bounds = checkRtlScrollBounds(el);
    setCanScrollLeft(bounds.canScrollLeft);
    setCanScrollRight(bounds.canScrollRight);
  }, []);

  // Event listeners for scroll, resize, and DOM changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateArrows();

    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateArrows);
      ro.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
      ro?.disconnect();
    };
  }, [updateArrows, categories.length]);

  // Auto-scroll active tab into view when selection changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const activeEl = container.querySelector(`[data-cat-id="${selectedCategory}"]`);
      if (activeEl) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        const scrollTarget = activeEl.offsetLeft - containerRect.width / 2 + activeRect.width / 2;
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
    });
  }, [selectedCategory]);

  // RTL-aware smooth scroll by ~70% of visible width
  const scrollInDirection = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;
    scrollRtl(el, direction);
  }, []);

  // Touch swipe support
  const handleTouchStart = useCallback((e) => {
    swipeStartRef.current = {
      x: e.touches[0].clientX,
      scrollLeft: scrollRef.current?.scrollLeft || 0,
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!swipeStartRef.current || !scrollRef.current) return;
    const dx = swipeStartRef.current.x - e.touches[0].clientX;
    scrollRef.current.scrollLeft = swipeStartRef.current.scrollLeft + dx;
  }, []);

  const handleTouchEnd = useCallback(() => {
    swipeStartRef.current = null;
    updateArrows();
  }, [updateArrows]);

  // Mouse drag support for desktop
  const handleMouseDown = useCallback((e) => {
    if (!scrollRef.current) return;
    scrollRef.current._isDragging = true;
    scrollRef.current._startX = e.pageX;
    scrollRef.current._startScroll = scrollRef.current.scrollLeft;
    scrollRef.current.classList.add('is-grabbing');
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!scrollRef.current?._isDragging) return;
    e.preventDefault();
    const dx = scrollRef.current._startX - e.pageX;
    scrollRef.current.scrollLeft = scrollRef.current._startScroll + dx;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current._isDragging = false;
      scrollRef.current.classList.remove('is-grabbing');
      updateArrows();
    }
  }, [updateArrows]);

  return (
    <div className="flex items-center gap-2 w-full md:w-auto relative select-none">
      {/* Category Bottom Sheet Trigger */}
      <button
        id="store-category-sheet-btn"
        onClick={onOpenSheet}
        title="عرض كل الأقسام"
        aria-label="عرض كل الأقسام"
        className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-300/30 text-emerald-700 flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>

      {/* Categories Bar with Left/Right Arrow Navigation */}
      <div className="relative flex-1 min-w-0 flex items-center">
        {/* Right Arrow (Visual Right = "السابق" / Previous in RTL) */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center z-20 pointer-events-none">
            {/* Edge fade */}
            <div className="absolute right-0 inset-y-0 w-12 bg-gradient-to-l from-emerald-50/95 via-emerald-50/60 to-transparent pointer-events-none" />
            <button
              type="button"
              onClick={() => scrollInDirection('right')}
              aria-label="السابق"
              title="السابق"
              className="pointer-events-auto relative w-[34px] h-[34px] rounded-full bg-white/95 border border-emerald-300/80 shadow-md hover:bg-emerald-50 hover:border-emerald-500 text-emerald-800 hover:text-emerald-950 flex items-center justify-center transition-smooth active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 mr-0.5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Left Arrow (Visual Left = "التالي" / Next in RTL) */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center z-20 pointer-events-none">
            {/* Edge fade */}
            <div className="absolute left-0 inset-y-0 w-12 bg-gradient-to-r from-emerald-50/95 via-emerald-50/60 to-transparent pointer-events-none" />
            <button
              type="button"
              onClick={() => scrollInDirection('left')}
              aria-label="التالي"
              title="التالي"
              className="pointer-events-auto relative w-[34px] h-[34px] rounded-full bg-white/95 border border-emerald-300/80 shadow-md hover:bg-emerald-50 hover:border-emerald-500 text-emerald-800 hover:text-emerald-950 flex items-center justify-center transition-smooth active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ml-0.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Container with Sliding Indicator */}
        <div
          ref={scrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cat-scroll-bar liquid-indicator-track w-full"
        >
          <button
            data-cat-id=""
            onClick={() => onSelect('')}
            className={`liquid-pill ${
              selectedCategory === '' ? 'liquid-pill--active-emerald' : ''
            }`}
          >
            جميع الأقسام
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              data-cat-id={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`liquid-pill ${
                selectedCategory === cat.id ? 'liquid-pill--active-emerald' : ''
              }`}
            >
              {cat.name} ({cat._count?.products || 0})
            </button>
          ))}

          {/* Sliding spring indicator */}
          <SlidingIndicator
            containerRef={scrollRef}
            activeSelector={`[data-cat-id="${selectedCategory}"]`}
            variant="emerald"
          />
        </div>
      </div>
    </div>
  );
};
