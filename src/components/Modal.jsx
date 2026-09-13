import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Reusable Modal component with:
 * - Outside click to close
 * - Stop event propagation inside content
 * - Escape key to close
 * - Smooth fade/scale enter & exit animations
 * - Body scroll lock
 * - Portal rendering
 */
export const Modal = ({
  isOpen,
  onClose,
  children,
  className = '',
  backdropClassName = 'bg-slate-900/60 backdrop-blur-sm',
  containerClassName = 'p-3 sm:p-4 md:p-6',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventScroll = true,
}) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle enter and exit animation lifecycle
  useEffect(() => {
    let timer;
    let animFrame1;
    let animFrame2;

    if (isOpen) {
      setIsMounted(true);
      // Double rAF ensures the initial DOM element is painted with initial styles before transitioning
      animFrame1 = requestAnimationFrame(() => {
        animFrame2 = requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      timer = setTimeout(() => {
        setIsMounted(false);
      }, 220); // 200ms transition + small buffer
    }

    return () => {
      cancelAnimationFrame(animFrame1);
      cancelAnimationFrame(animFrame2);
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!closeOnEscape || !isMounted) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMounted, closeOnEscape, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!preventScroll || !isMounted) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift from scrollbar disappearing
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isMounted, preventScroll]);

  if (!isMounted) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      e.stopPropagation();
      onClose?.();
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 overflow-y-auto flex min-h-full items-center justify-center text-center ${containerClassName}`}
    >
      {/* Animated Backdrop */}
      <div
        className={`fixed inset-0 transition-opacity duration-200 ease-out pointer-events-none ${backdropClassName} ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Animated Modal Content Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full text-right transform transition-all duration-200 ease-out my-auto pointer-events-auto ${
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

/**
 * Reusable Confirmation Dialog
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '????? ???????',
  message = '?? ??? ????? ?? ????? ?? ?????? ??? ????????',
  confirmText = '?????',
  cancelText = '?????',
  isDanger = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
      <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <span
            className={`p-2.5 rounded-2xl ${
              isDanger ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </span>
          <h3 className="font-bold text-sm text-slate-900">{title}</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{message}</p>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-smooth text-white ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                : 'bg-purple-700 hover:bg-purple-800 disabled:opacity-50'
            }`}
          >
            {isLoading ? '???? ???????...' : confirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-smooth"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
