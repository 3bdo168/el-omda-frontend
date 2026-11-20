import React, { useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

const ACCENT_STYLES = {
  emerald: {
    input: 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
    iconActive: 'text-emerald-600',
    loader: 'text-emerald-500',
    clearBtn: 'hover:bg-emerald-50 hover:text-emerald-700',
  },
  purple: {
    input: 'focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20',
    iconActive: 'text-purple-700',
    loader: 'text-purple-600',
    clearBtn: 'hover:bg-purple-50 hover:text-purple-700',
  },
  amber: {
    input: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20',
    iconActive: 'text-amber-600',
    loader: 'text-amber-600',
    clearBtn: 'hover:bg-amber-50 hover:text-amber-700',
  },
};

const SIZE_STYLES = {
  sm: 'py-2 text-xs rounded-xl',
  md: 'py-2.5 text-sm rounded-2xl',
};

/**
 * Reusable RTL-friendly SearchInput component matching Beit El-Gomla's design language.
 *
 * Contract:
 * - value: string
 * - onChange: (nextValue: string) => void
 * - onClear?: () => void (falls back to onChange(''))
 * - placeholder?: string (Arabic placeholder)
 * - ariaLabel?: string (Arabic aria-label, falls back to placeholder)
 * - accent?: 'emerald' | 'purple' | 'amber'
 * - size?: 'sm' | 'md'
 */
export const SearchInput = ({
  value = '',
  onChange,
  onClear,
  placeholder = 'ابحث...',
  ariaLabel,
  clearAriaLabel = 'مسح البحث',
  accent = 'emerald',
  size = 'md',
  isLoading = false,
  autoFocus = false,
  disabled = false,
  id,
  name,
  className = '',
  inputClassName = '',
  ref,
}) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;

  const palette = ACCENT_STYLES[accent] || ACCENT_STYLES.emerald;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;
  const hasValue = Boolean(value && String(value).length > 0);
  const hasBothLeftIcons = isLoading && hasValue;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange?.('');
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && hasValue) {
      e.stopPropagation();
      handleClear();
    }
  };

  return (
    <div dir="rtl" className={`relative w-full min-w-0 ${className}`}>
      <Search
        aria-hidden="true"
        className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-smooth ${
          hasValue ? palette.iconActive : 'text-slate-400'
        }`}
      />

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        dir="rtl"
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className={`w-full min-w-0 bg-white/95 border border-slate-200/90 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-smooth shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed pr-10 ${
          hasBothLeftIcons ? 'pl-16' : 'pl-10'
        } ${sizeClass} ${palette.input} ${inputClassName}`}
      />

      {(isLoading || hasValue) && (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2
              aria-hidden="true"
              className={`w-4 h-4 animate-spin ${palette.loader}`}
            />
          )}
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={clearAriaLabel}
              title={clearAriaLabel}
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 transition-smooth ${palette.clearBtn}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
