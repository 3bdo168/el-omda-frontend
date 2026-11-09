import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, Tag, Clock, ArrowLeft } from 'lucide-react';
import { normalizeArabic, scoreMatch, highlightMatch } from '../utils/arabicSearch';
import { api, getImageUrl } from '../services/api';

const RECENT_SEARCHES_KEY = 'elomda_recent_searches';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 200;

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  if (!query?.trim()) return;
  const trimmed = query.trim();
  const existing = getRecentSearches().filter((s) => s !== trimmed);
  const updated = [trimmed, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

const HighlightedText = ({ text, query }) => {
  const segments = highlightMatch(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark key={i} className="bg-emerald-100 text-emerald-900 rounded-sm px-0.5 font-extrabold" style={{ textDecoration: 'none' }}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
};

/**
 * SearchSuggestions — Full-featured search input with live suggestions dropdown.
 * Uses portal for dropdown to avoid overflow clipping issues.
 */
export const SearchSuggestions = ({
  products = [],
  categories = [],
  onSearch,
  onSelectProduct,
  onSelectCategory,
  initialQuery = '',
  className = '',
  inputClassName = '',
  variant = 'default',
  autoFocus = false,
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const [serverResults, setServerResults] = useState(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const wrapperRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync with external initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
    setDebouncedQuery(initialQuery);
  }, [initialQuery]);

  // Debounce input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Update portal position
  const updatePosition = useCallback(() => {
    if (wrapperRef.current && variant === 'default') {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPortalPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [variant]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Client-side filtering
  const useClientSide = products.length > 0;

  const clientResults = useMemo(() => {
    if (!useClientSide || !debouncedQuery) return { products: [], categories: [] };
    const normalizedQ = normalizeArabic(debouncedQuery);
    if (!normalizedQ) return { products: [], categories: [] };

    const scoredProducts = [];
    for (const p of products) {
      const result = scoreMatch(p, normalizedQ, ['name', 'description', 'sku']);
      if (!result) {
        const catResult = scoreMatch({ name: p.category?.name || '' }, normalizedQ, ['name']);
        if (catResult) {
          scoredProducts.push({ ...p, _score: catResult.score + 0.5 });
        }
        continue;
      }
      scoredProducts.push({ ...p, _score: result.score });
    }
    scoredProducts.sort((a, b) => a._score - b._score);

    const scoredCategories = [];
    for (const c of categories) {
      const result = scoreMatch(c, normalizedQ, ['name']);
      if (result) {
        scoredCategories.push({ ...c, _score: result.score });
      }
    }
    scoredCategories.sort((a, b) => a._score - b._score);

    return {
      products: scoredProducts.slice(0, 6),
      categories: scoredCategories.slice(0, 3),
    };
  }, [useClientSide, debouncedQuery, products, categories]);

  // Server-side suggestions fetching with abort controller
  useEffect(() => {
    if (!debouncedQuery) {
      setServerResults(null);
      setIsLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    api.suggestProducts(debouncedQuery, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted && data && data.success) {
          setServerResults({
            products: data.products || [],
            categories: data.categories || [],
          });
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && err.message !== 'The user aborted a request.') {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const results = serverResults !== null ? serverResults : clientResults;
  const hasResults = results.products.length > 0 || results.categories.length > 0;
  const showRecent = isOpen && !debouncedQuery && recentSearches.length > 0;
  const showSuggestions = isOpen && debouncedQuery && (hasResults || !isLoading);
  const showLoading = isOpen && debouncedQuery && isLoading && !hasResults;

  const totalItems = useMemo(() => {
    if (showRecent) return recentSearches.length;
    if (!showSuggestions) return 0;
    let count = results.categories.length + results.products.length;
    if (hasResults) count += 1;
    return count;
  }, [showRecent, showSuggestions, results, hasResults, recentSearches]);

  useEffect(() => { setActiveIndex(-1); }, [debouncedQuery, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleSubmit = useCallback(
    (searchQuery) => {
      const q = (searchQuery ?? query).trim();
      if (q) {
        saveRecentSearch(q);
        setRecentSearches(getRecentSearches());
      }
      onSearch?.(q);
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [query, onSearch]
  );

  const handleSelectProduct = useCallback(
    (product) => {
      saveRecentSearch(product.name);
      setRecentSearches(getRecentSearches());
      onSelectProduct?.(product);
      setIsOpen(false);
    },
    [onSelectProduct]
  );

  const handleSelectCategory = useCallback(
    (cat) => {
      onSelectCategory?.(cat.id);
      setIsOpen(false);
    },
    [onSelectCategory]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
        if (onClose) onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(totalItems, 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex < 0 || !isOpen) { handleSubmit(); return; }
        if (showRecent) {
          const recent = recentSearches[activeIndex];
          if (recent) { setQuery(recent); handleSubmit(recent); }
          return;
        }
        let idx = activeIndex;
        if (idx < results.categories.length) { handleSelectCategory(results.categories[idx]); return; }
        idx -= results.categories.length;
        if (idx < results.products.length) { handleSelectProduct(results.products[idx]); return; }
        handleSubmit();
      }
    },
    [activeIndex, totalItems, isOpen, showRecent, recentSearches, results, handleSubmit, handleSelectProduct, handleSelectCategory, onClose]
  );

  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector(`[data-suggestion-index="${activeIndex}"]`);
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  // Build dropdown content
  const buildDropdownContent = () => {
    let suggestionIndex = 0;

    return (
      <>
        {showLoading && (
          <div className="p-6 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-bold">جاري البحث...</p>
          </div>
        )}

        {showRecent && (
          <div className="py-2">
            <div className="px-3 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                عمليات بحث سابقة
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearRecentSearches(); setRecentSearches([]); }}
                className="text-[10px] text-slate-400 hover:text-red-500 font-bold"
              >
                مسح الكل
              </button>
            </div>
            {recentSearches.map((s, i) => (
              <button
                key={s}
                type="button"
                data-suggestion-index={i}
                role="option"
                aria-selected={activeIndex === i}
                onClick={() => { setQuery(s); handleSubmit(s); }}
                className={`w-full text-right px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${
                  activeIndex === i ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="flex-1 truncate">{s}</span>
                <ArrowLeft className="w-3 h-3 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {debouncedQuery && !isLoading && !hasResults && (
          <div className="p-6 text-center">
            <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">مفيش نتائج لـ &ldquo;{debouncedQuery}&rdquo;</p>
            <p className="text-[11px] text-slate-400 mt-1">جرب كلمات بديلة أو تحقق من الإملاء</p>
          </div>
        )}

        {showSuggestions && hasResults && (
          <>
            {results.categories.length > 0 && (
              <div className="py-1.5 border-b border-slate-100">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">أقسام</div>
                {results.categories.map((cat) => {
                  const idx = suggestionIndex++;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-suggestion-index={idx}
                      role="option"
                      aria-selected={activeIndex === idx}
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full text-right px-3 py-2 flex items-center gap-2.5 transition-colors ${
                        activeIndex === idx ? 'bg-emerald-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          <HighlightedText text={cat.name} query={debouncedQuery} />
                        </div>
                        <div className="text-[10px] text-slate-400">{cat._count?.products || 0} منتج</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">قسم</span>
                    </button>
                  );
                })}
              </div>
            )}

            {results.products.length > 0 && (
              <div className="py-1.5">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">منتجات</div>
                {results.products.map((product) => {
                  const idx = suggestionIndex++;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      data-suggestion-index={idx}
                      role="option"
                      aria-selected={activeIndex === idx}
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full text-right px-3 py-2 flex items-center gap-2.5 transition-colors ${
                        activeIndex === idx ? 'bg-emerald-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {product.imageUrl ? (
                          <img src={getImageUrl(product.imageUrl)} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          <HighlightedText text={product.name} query={debouncedQuery} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-bold text-emerald-700">{parseFloat(product.retailPrice).toFixed(2)} ج.م</span>
                          {product.category?.name && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span>{product.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {hasResults && (() => {
              const idx = suggestionIndex++;
              return (
                <button
                  type="button"
                  data-suggestion-index={idx}
                  role="option"
                  aria-selected={activeIndex === idx}
                  onClick={() => handleSubmit()}
                  className={`w-full text-right px-3 py-2.5 flex items-center justify-center gap-2 border-t border-slate-100 transition-colors ${
                    activeIndex === idx ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-emerald-700'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">عرض كل النتائج لـ &ldquo;{debouncedQuery}&rdquo;</span>
                </button>
              );
            })()}
          </>
        )}
      </>
    );
  };

  const isDropdownVisible = isOpen && (showRecent || showSuggestions || showLoading || (debouncedQuery && !isLoading && !hasResults));

  const dropdownElement = isDropdownVisible ? (
    <div
      ref={dropdownRef}
      className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[60vh] overflow-y-auto overscroll-contain"
      role="listbox"
      id="search-suggestions-listbox"
      style={{ direction: 'rtl' }}
    >
      {buildDropdownContent()}
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setRecentSearches(getRecentSearches()); updatePosition(); }}
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن منتج، قسم، أو كود SKU..."
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={!!isDropdownVisible}
          aria-controls="search-suggestions-listbox"
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label="البحث في المنتجات"
          className={`w-full bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-smooth placeholder:text-slate-400 ${
            variant === 'mobile-overlay' ? 'pr-4 pl-20 text-base py-3' : 'pr-10 pl-10'
          } ${inputClassName}`}
        />

        {variant !== 'mobile-overlay' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
        )}

        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && debouncedQuery && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
          {query && (
            <button type="button" onClick={handleClear} className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-smooth" aria-label="مسح البحث">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {variant === 'mobile-overlay' && (
          <button type="button" onClick={() => handleSubmit()} className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-smooth">
            بحث
          </button>
        )}
      </div>

      {/* Dropdown: inline for mobile-overlay, portal for default */}
      {variant === 'mobile-overlay'
        ? dropdownElement && <div className="mt-1.5">{dropdownElement}</div>
        : dropdownElement && typeof document !== 'undefined' && createPortal(
            <div style={{ position: 'absolute', top: portalPos.top, left: portalPos.left, width: portalPos.width, zIndex: 9999 }}>
              {dropdownElement}
            </div>,
            document.body
          )}
    </div>
  );
};
