import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  scrollRtl,
  checkRtlScrollBounds,
  scrollElementIntoCenterRtl,
} from '../utils/rtlScroll';

const THEME_CONFIG = {
  purple: {
    button:
      'bg-white/95 border-purple-200 text-purple-800 hover:bg-purple-50 hover:border-purple-400 shadow-md focus-visible:ring-purple-500',
    tableButton:
      'bg-white border-purple-200 text-purple-800 hover:bg-purple-50 hover:border-purple-400 shadow-2xs focus-visible:ring-purple-500',
    tableHeaderBg: 'bg-purple-50/55 border-purple-100',
    trackRing: 'focus-visible:ring-purple-500/40',
    hintDot: 'bg-purple-600',
    hintText: 'text-purple-900',
    fadeRightTabs: 'from-[#f8f5ff] via-[#f8f5ff]/85 to-transparent',
    fadeLeftTabs: 'from-[#f8f5ff] via-[#f8f5ff]/85 to-transparent',
  },
  amber: {
    button:
      'bg-white/95 border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-400 shadow-md focus-visible:ring-amber-500',
    tableButton:
      'bg-white border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-400 shadow-2xs focus-visible:ring-amber-500',
    tableHeaderBg: 'bg-amber-50/55 border-amber-100',
    trackRing: 'focus-visible:ring-amber-500/40',
    hintDot: 'bg-amber-600',
    hintText: 'text-amber-900',
    fadeRightTabs: 'from-[#fffbeb] via-[#fffbeb]/85 to-transparent',
    fadeLeftTabs: 'from-[#fffbeb] via-[#fffbeb]/85 to-transparent',
  },
  emerald: {
    button:
      'bg-white/95 border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400 shadow-md focus-visible:ring-emerald-500',
    tableButton:
      'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400 shadow-2xs focus-visible:ring-emerald-500',
    tableHeaderBg: 'bg-emerald-50/55 border-emerald-100',
    trackRing: 'focus-visible:ring-emerald-500/40',
    hintDot: 'bg-emerald-600',
    hintText: 'text-emerald-900',
    fadeRightTabs: 'from-[#ecfdf5] via-[#ecfdf5]/85 to-transparent',
    fadeLeftTabs: 'from-[#ecfdf5] via-[#ecfdf5]/85 to-transparent',
  },
  slate: {
    button:
      'bg-white/95 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300 shadow-md focus-visible:ring-slate-500',
    tableButton:
      'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300 shadow-2xs focus-visible:ring-slate-500',
    tableHeaderBg: 'bg-slate-50/90 border-slate-200',
    trackRing: 'focus-visible:ring-slate-500/40',
    hintDot: 'bg-slate-600',
    hintText: 'text-slate-700',
    fadeRightTabs: 'from-slate-100 via-slate-100/85 to-transparent',
    fadeLeftTabs: 'from-slate-100 via-slate-100/85 to-transparent',
  },
};

const findActiveElement = (container, activeKey, activeSelector) => {
  if (!container) return null;

  if (activeSelector) {
    try {
      const explicit = container.querySelector(activeSelector);
      if (explicit) return explicit;
    } catch {
      // Ignore malformed custom selectors gracefully
    }
  }

  if (activeKey !== null && activeKey !== undefined && activeKey !== '') {
    const targetValue = String(activeKey);
    const items = container.querySelectorAll('[data-scroll-item]');
    for (const item of items) {
      if (item.getAttribute('data-scroll-item') === targetValue) {
        return item;
      }
    }
  }

  return (
    container.querySelector('[aria-selected="true"]') ||
    container.querySelector('[data-tab-active="true"]') ||
    container.querySelector('[aria-current="page"]') ||
    null
  );
};

/**
 * ScrollableRow — Reusable RTL/LTR horizontal scroll container for both
 * tab/filter strips (`mode="tabs"`) and data tables (`mode="table"`).
 *
 * Features:
 * - >= 44x44px accessible arrow buttons with Arabic aria-labels & focus rings
 * - Scrolls smoothly by 70–80% of visible width (default 75%)
 * - Dynamic start/end detection via scroll, ResizeObserver (container + inner content), MutationObserver, and resize
 * - Gradient edge fades indicating remaining overflowing content
 * - Native touch inertia preserved on phones (no touchMove mutation conflict)
 * - Auto-centers active tab cleanly across Chrome, Firefox, and Safari/iOS without jumping vertical page scroll
 */
export const ScrollableRow = ({
  children,
  mode = 'tabs', // 'tabs' | 'table'
  variant = 'purple', // 'purple' | 'amber' | 'emerald' | 'slate'
  activeKey = null,
  activeSelector = '',
  className = '',
  containerClassName = '',
  scrollAmountRatio = 0.75,
  hasStickyStart = false,
  hideDisabledArrows,
  enableDragScroll,
  ariaLabel = '',
  ariaLabelRight,
  ariaLabelLeft,
  tableHintText = 'مرّر لليسار أو استخدم الأسهم لعرض باقي الأعمدة',
}) => {
  const scrollRef = useRef(null);
  const rafRef = useRef(0);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
    suppressNextClick: false,
  });

  const [bounds, setBounds] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  });

  const isTable = mode === 'table';
  const shouldHideDisabledArrows =
    hideDisabledArrows !== undefined ? hideDisabledArrows : !isTable;
  const allowMouseDrag =
    enableDragScroll !== undefined ? enableDragScroll : !isTable;

  const theme = THEME_CONFIG[variant] || THEME_CONFIG.slate;

  const rightLabel =
    ariaLabelRight ||
    (isTable ? 'التمرير لليمين لعرض الأعمدة السابقة' : 'التمرير لليمين (السابق)');
  const leftLabel =
    ariaLabelLeft ||
    (isTable ? 'التمرير لليسار لعرض الأعمدة التالية' : 'التمرير لليسار (التالي)');

  const updateBounds = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const next = checkRtlScrollBounds(el);
    setBounds((prev) =>
      prev.canScrollLeft === next.canScrollLeft &&
      prev.canScrollRight === next.canScrollRight &&
      prev.hasOverflow === next.hasOverflow
        ? prev
        : {
            canScrollLeft: next.canScrollLeft,
            canScrollRight: next.canScrollRight,
            hasOverflow: next.hasOverflow,
          }
    );
  }, []);

  const scheduleUpdateBounds = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      updateBounds();
    });
  }, [updateBounds]);

  // Observe scroll, window resize, container + content ResizeObserver, DOM mutations, and webfont load
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    scheduleUpdateBounds();

    const handleScroll = () => scheduleUpdateBounds();
    const handleResize = () => scheduleUpdateBounds();

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    let ro;
    let observedChild = el.firstElementChild;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(scheduleUpdateBounds);
      ro.observe(el);
      if (observedChild) {
        ro.observe(observedChild);
      }
    }

    let mo;
    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => {
        if (ro && el.firstElementChild && el.firstElementChild !== observedChild) {
          observedChild = el.firstElementChild;
          ro.observe(observedChild);
        }
        scheduleUpdateBounds();
      });
      mo.observe(el, { childList: true, subtree: isTable });
    }

    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) scheduleUpdateBounds();
      });
    }

    return () => {
      cancelled = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [scheduleUpdateBounds, isTable]);

  // Re-evaluate bounds when children change dynamically (e.g. async query rows or badge counts)
  useEffect(() => {
    scheduleUpdateBounds();
    const timer = window.setTimeout(scheduleUpdateBounds, 120);
    return () => window.clearTimeout(timer);
  }, [scheduleUpdateBounds, children]);

  // Auto-scroll active tab into horizontal center on mount & whenever active tab changes
  useEffect(() => {
    if (isTable) return undefined;
    const container = scrollRef.current;
    if (!container) return undefined;

    let outerFrame = 0;
    let innerFrame = 0;

    outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        const activeEl = findActiveElement(container, activeKey, activeSelector);
        if (activeEl) {
          scrollElementIntoCenterRtl(container, activeEl, 'smooth');
        }
        scheduleUpdateBounds();
      });
    });

    return () => {
      window.cancelAnimationFrame(outerFrame);
      window.cancelAnimationFrame(innerFrame);
    };
  }, [isTable, activeKey, activeSelector, scheduleUpdateBounds]);

  const handleScroll = useCallback(
    (direction) => {
      const el = scrollRef.current;
      if (!el) return;
      scrollRtl(el, direction, el.clientWidth * scrollAmountRatio, scrollAmountRatio);
    },
    [scrollAmountRatio]
  );

  // Keyboard support: ArrowLeft / ArrowRight when focused on scroller or tabs
  const handleKeyDown = useCallback(
    (e) => {
      const tagName = e.target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (bounds.canScrollLeft) {
          e.preventDefault();
          handleScroll('left');
        }
      } else if (e.key === 'ArrowRight') {
        if (bounds.canScrollRight) {
          e.preventDefault();
          handleScroll('right');
        }
      }
    },
    [bounds.canScrollLeft, bounds.canScrollRight, handleScroll]
  );

  // Auto-center any keyboard-focused tab item inside tab bars
  const handleFocusCapture = useCallback(
    (e) => {
      if (isTable) return;
      const container = scrollRef.current;
      if (!container || !e.target || e.target === container) return;
      if (typeof e.target.closest === 'function') {
        const scrollItem = e.target.closest('[data-scroll-item], button, a');
        if (scrollItem && container.contains(scrollItem)) {
          scrollElementIntoCenterRtl(container, scrollItem, 'smooth');
        }
      }
    },
    [isTable]
  );

  // Optional gentle desktop mouse-drag panning (only starts after >5px movement so normal clicks never drop)
  const handleMouseDown = useCallback(
    (e) => {
      if (!allowMouseDrag || e.button !== 0 || !scrollRef.current) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      dragStateRef.current = {
        active: true,
        startX: e.pageX,
        startScroll: scrollRef.current.scrollLeft,
        moved: false,
        suppressNextClick: false,
      };
    },
    [allowMouseDrag]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!allowMouseDrag || !dragStateRef.current.active || !scrollRef.current) return;
      const dx = dragStateRef.current.startX - e.pageX;
      if (!dragStateRef.current.moved && Math.abs(dx) <= 5) return;

      if (!dragStateRef.current.moved) {
        dragStateRef.current.moved = true;
        scrollRef.current.classList.add('is-grabbing');
      }
      e.preventDefault();
      scrollRef.current.scrollLeft = dragStateRef.current.startScroll + dx;
    },
    [allowMouseDrag]
  );

  const endMouseDrag = useCallback(() => {
    if (!dragStateRef.current.active) return;
    if (dragStateRef.current.moved) {
      dragStateRef.current.suppressNextClick = true;
      window.setTimeout(() => {
        dragStateRef.current.suppressNextClick = false;
      }, 60);
    }
    dragStateRef.current.active = false;
    dragStateRef.current.moved = false;
    scrollRef.current?.classList.remove('is-grabbing');
    scheduleUpdateBounds();
  }, [scheduleUpdateBounds]);

  const handleClickCapture = useCallback((e) => {
    if (dragStateRef.current.suppressNextClick) {
      e.preventDefault();
      e.stopPropagation();
      dragStateRef.current.suppressNextClick = false;
    }
  }, []);

  if (isTable) {
    return (
      <div className={`relative w-full min-w-0 ${containerClassName}`}>
        {/* Top Table Navigation Bar (rendered automatically when table overflows horizontally) */}
        {bounds.hasOverflow && (
          <div
            className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b ${theme.tableHeaderBg}`}
          >
            <div className={`flex items-center gap-2 text-[11px] font-bold ${theme.hintText}`}>
              <span
                className={`inline-block w-2 h-2 rounded-full ${theme.hintDot} shrink-0 animate-pulse`}
                aria-hidden="true"
              />
              <span>{tableHintText}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mr-auto">
              {(!shouldHideDisabledArrows || bounds.canScrollRight) && (
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  disabled={!bounds.canScrollRight}
                  aria-label={rightLabel}
                  title={rightLabel}
                  className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 ${theme.tableButton}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {(!shouldHideDisabledArrows || bounds.canScrollLeft) && (
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  disabled={!bounds.canScrollLeft}
                  aria-label={leftLabel}
                  title={leftLabel}
                  className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 ${theme.tableButton}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Viewport + Vertical Edge Gradient Fades */}
        <div className="relative w-full min-w-0">
          {bounds.canScrollRight && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-9 bg-gradient-to-l from-white/95 via-white/60 to-transparent ${
                hasStickyStart ? 'z-10' : 'z-30'
              }`}
            />
          )}

          {bounds.canScrollLeft && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white/95 via-white/65 to-transparent z-30"
            />
          )}

          <div
            ref={scrollRef}
            role={ariaLabel ? 'region' : undefined}
            aria-label={ariaLabel || undefined}
            tabIndex={bounds.hasOverflow ? 0 : undefined}
            onKeyDown={handleKeyDown}
            className={`w-full overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${theme.trackRing} ${className}`}
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorX: 'contain',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Default Mode: Tabs / Chips Horizontal Scroller
  return (
    <div
      className={`relative flex items-center w-full min-w-0 select-none ${containerClassName}`}
    >
      {/* Visual Right Fade + Arrow (Scrolls towards RTL Start / Previous) */}
      {(bounds.canScrollRight || (!shouldHideDisabledArrows && bounds.hasOverflow)) && (
        <div
          className={`absolute right-0 inset-y-0 flex items-center z-30 pointer-events-none pr-0.5 ${
            bounds.canScrollRight ? 'opacity-100' : 'opacity-90'
          }`}
        >
          {bounds.canScrollRight && (
            <div
              aria-hidden="true"
              className={`absolute right-0 inset-y-0 w-14 sm:w-16 bg-gradient-to-l ${theme.fadeRightTabs} pointer-events-none`}
            />
          )}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!bounds.canScrollRight}
            aria-label={rightLabel}
            title={rightLabel}
            className={`pointer-events-auto relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 disabled:opacity-35 disabled:cursor-not-allowed ${theme.button}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Visual Left Fade + Arrow (Scrolls towards RTL End / Next) */}
      {(bounds.canScrollLeft || (!shouldHideDisabledArrows && bounds.hasOverflow)) && (
        <div
          className={`absolute left-0 inset-y-0 flex items-center z-30 pointer-events-none pl-0.5 ${
            bounds.canScrollLeft ? 'opacity-100' : 'opacity-90'
          }`}
        >
          {bounds.canScrollLeft && (
            <div
              aria-hidden="true"
              className={`absolute left-0 inset-y-0 w-14 sm:w-16 bg-gradient-to-r ${theme.fadeLeftTabs} pointer-events-none`}
            />
          )}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!bounds.canScrollLeft}
            aria-label={leftLabel}
            title={leftLabel}
            className={`pointer-events-auto relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center transition-smooth active:scale-95 focus:outline-none focus-visible:ring-2 disabled:opacity-35 disabled:cursor-not-allowed ${theme.button}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Horizontally Scrollable Track (Scrollbar Visually Hidden, Native Touch Swipe Active) */}
      <div
        ref={scrollRef}
        role={ariaLabel ? 'region' : undefined}
        aria-label={ariaLabel || undefined}
        onKeyDown={handleKeyDown}
        onFocusCapture={handleFocusCapture}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endMouseDrag}
        onMouseLeave={endMouseDrag}
        onClickCapture={handleClickCapture}
        className={`w-full overflow-x-auto scrollbar-none flex items-center min-h-[46px] scroll-px-12 ${className}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
        }}
      >
        {children}
      </div>
    </div>
  );
};
