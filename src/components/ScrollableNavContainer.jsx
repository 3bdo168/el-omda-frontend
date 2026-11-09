import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { scrollRtl, checkRtlScrollBounds } from '../utils/rtlScroll';

export const ScrollableNavContainer = ({
  children,
  className = '',
  containerClassName = '',
  variant = 'amber', // 'amber' | 'emerald' | 'purple' | 'slate'
  scrollAmountRatio = 0.65,
}) => {
  const scrollRef = useRef(null);
  const swipeStartRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const bounds = checkRtlScrollBounds(el);
    setCanScrollLeft(bounds.canScrollLeft);
    setCanScrollRight(bounds.canScrollRight);
  }, []);

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
  }, [updateArrows]);

  useEffect(() => {
    const timer = setTimeout(updateArrows, 100);
    return () => clearTimeout(timer);
  }, [updateArrows, children]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    scrollRtl(el, direction, el.clientWidth * scrollAmountRatio);
  };

  // Touch swipe support
  const handleTouchStart = (e) => {
    swipeStartRef.current = {
      x: e.touches[0].clientX,
      scrollLeft: scrollRef.current?.scrollLeft || 0,
    };
  };

  const handleTouchMove = (e) => {
    if (!swipeStartRef.current || !scrollRef.current) return;
    const dx = swipeStartRef.current.x - e.touches[0].clientX;
    scrollRef.current.scrollLeft = swipeStartRef.current.scrollLeft + dx;
  };

  const handleTouchEnd = () => {
    swipeStartRef.current = null;
    updateArrows();
  };

  // Mouse drag support
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    scrollRef.current._isDragging = true;
    scrollRef.current._startX = e.pageX;
    scrollRef.current._startScroll = scrollRef.current.scrollLeft;
    scrollRef.current.classList.add('is-grabbing');
  };

  const handleMouseMove = (e) => {
    if (!scrollRef.current?._isDragging) return;
    e.preventDefault();
    const dx = scrollRef.current._startX - e.pageX;
    scrollRef.current.scrollLeft = scrollRef.current._startScroll + dx;
  };

  const handleMouseUp = () => {
    if (scrollRef.current) {
      scrollRef.current._isDragging = false;
      scrollRef.current.classList.remove('is-grabbing');
      updateArrows();
    }
  };

  const themeConfig = {
    purple: {
      button: 'bg-white/95 border-purple-200 text-purple-700 hover:bg-purple-50 shadow-md',
      fadeRight: 'from-purple-100/90 via-purple-50/40 to-transparent',
      fadeLeft: 'from-purple-100/90 via-purple-50/40 to-transparent',
    },
    amber: {
      button: 'bg-white/95 border-amber-200 text-amber-800 hover:bg-amber-50 shadow-md',
      fadeRight: 'from-amber-100/90 via-amber-50/40 to-transparent',
      fadeLeft: 'from-amber-100/90 via-amber-50/40 to-transparent',
    },
    emerald: {
      button: 'bg-white/95 border-emerald-200 text-emerald-800 hover:bg-emerald-50 shadow-md',
      fadeRight: 'from-emerald-100/90 via-emerald-50/40 to-transparent',
      fadeLeft: 'from-emerald-100/90 via-emerald-50/40 to-transparent',
    },
    slate: {
      button: 'bg-white/95 border-slate-200 text-slate-800 hover:bg-slate-100 shadow-md',
      fadeRight: 'from-slate-100/90 via-slate-50/40 to-transparent',
      fadeLeft: 'from-slate-100/90 via-slate-50/40 to-transparent',
    },
  }[variant] || {
    button: 'bg-white/95 border-slate-200 text-slate-800 hover:bg-slate-100 shadow-md',
    fadeRight: 'from-white/90 via-white/40 to-transparent',
    fadeLeft: 'from-white/90 via-white/40 to-transparent',
  };

  return (
    <div className={`relative flex items-center w-full min-w-0 select-none ${containerClassName}`}>
      {/* Right Arrow (Visual Right / Previous in RTL) */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center z-20 pointer-events-none pr-1">
          <div className={`absolute right-0 inset-y-0 w-9 bg-gradient-to-l ${themeConfig.fadeRight} pointer-events-none`} />
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="السابق"
            title="السابق"
            className={`pointer-events-auto relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-smooth active:scale-90 focus:outline-none focus-visible:ring-2 ${themeConfig.button}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Left Arrow (Visual Left / Next in RTL) */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center z-20 pointer-events-none pl-1">
          <div className={`absolute left-0 inset-y-0 w-9 bg-gradient-to-r ${themeConfig.fadeLeft} pointer-events-none`} />
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="التالي"
            title="التالي"
            className={`pointer-events-auto relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-smooth active:scale-90 focus:outline-none focus-visible:ring-2 ${themeConfig.button}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full overflow-x-auto scrollbar-none flex items-center ${className}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
};
