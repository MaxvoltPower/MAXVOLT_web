// ============================================================
// MAXVOLT — Modal
// ============================================================

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { classNames } from '@lib/utils';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}) {
  const panelRef = useRef(null);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Focus first focusable element
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] grid place-items-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      <div
        ref={panelRef}
        className={classNames(
          'bg-dark-elevated border border-dark-border rounded-2xl w-full max-h-[92vh] flex flex-col',
          'shadow-2xl',
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-dark-border shrink-0">
            <h2 className="text-lg sm:text-xl font-bold pr-2">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-1 rounded-lg hover:bg-dark-muted transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}