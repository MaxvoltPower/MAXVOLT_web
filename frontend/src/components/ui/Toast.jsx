// ============================================================
// MAXVOLT — Toast system
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { classNames } from '@lib/utils';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    bg: 'bg-emerald-500',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-500',
    icon: '✕',
  },
  warning: {
    bg: 'bg-amber-500',
    icon: '!',
  },
  info: {
    bg: 'bg-sky-500',
    icon: 'i',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message, variant = 'info', duration = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);

      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[5000] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none"
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((toast) => {
            const v = VARIANTS[toast.variant] || VARIANTS.info;
            return (
              <div
                key={toast.id}
                role="status"
                className={classNames(
                  'px-4 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-start gap-3 pointer-events-auto animate-toast-in text-white',
                  v.bg
                )}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 w-5 h-5 rounded-full bg-white/25 grid place-items-center text-xs font-bold"
                >
                  {v.icon}
                </span>
                <span className="flex-1 leading-snug">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-base leading-none"
                  aria-label="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}