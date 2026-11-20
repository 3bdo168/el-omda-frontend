import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_STYLES = {
  success: {
    container: 'bg-white/95 border-emerald-200 text-slate-900 shadow-lg shadow-emerald-900/10',
    iconWrap: 'bg-emerald-100 text-emerald-700',
    accent: 'border-r-4 border-r-emerald-600',
    Icon: CheckCircle,
  },
  error: {
    container: 'bg-white/95 border-red-200 text-slate-900 shadow-lg shadow-red-900/10',
    iconWrap: 'bg-red-100 text-red-700',
    accent: 'border-r-4 border-r-red-600',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-white/95 border-amber-200 text-slate-900 shadow-lg shadow-amber-900/10',
    iconWrap: 'bg-amber-100 text-amber-700',
    accent: 'border-r-4 border-r-amber-500',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-white/95 border-purple-200 text-slate-900 shadow-lg shadow-purple-900/10',
    iconWrap: 'bg-purple-100 text-purple-700',
    accent: 'border-r-4 border-r-purple-600',
    Icon: Info,
  },
};

/**
 * Lightweight RTL Arabic toast hook — zero external dependencies.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration) => {
      if (!message) return null;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const ttl = duration ?? (type === 'error' ? 6000 : 4500);

      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);

      const timer = setTimeout(() => {
        dismissToast(id);
      }, ttl);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    const map = timersRef.current;
    return () => {
      for (const timer of map.values()) {
        clearTimeout(timer);
      }
      map.clear();
    };
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg, duration) => addToast(msg, 'success', duration),
      error: (msg, duration) => addToast(msg, 'error', duration),
      warning: (msg, duration) => addToast(msg, 'warning', duration),
      info: (msg, duration) => addToast(msg, 'info', duration),
    }),
    [addToast]
  );

  return { toasts, addToast, dismissToast, toast };
}

/**
 * Floating RTL toast viewport rendered into document.body above modals and sticky bars.
 */
export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return createPortal(
    <div
      dir="rtl"
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 left-3 right-3 sm:left-6 sm:right-auto sm:w-96 z-[80] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((item) => {
        const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;
        const IconComponent = style.Icon;
        return (
          <div
            key={item.id}
            role={item.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto backdrop-blur-md rounded-2xl border p-3.5 flex items-start gap-3 animate-fade-in ${style.container} ${style.accent}`}
          >
            <span className={`p-1.5 rounded-xl shrink-0 ${style.iconWrap}`}>
              <IconComponent className="w-4 h-4" />
            </span>
            <p className="text-xs font-bold leading-relaxed flex-1 text-right break-words pt-0.5">
              {item.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="إغلاق التنبيه"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-smooth shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
};
