import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { classNames } from '@lib/utils';

const ToastContext = createContext(null);

const variants = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-sky-500 text-white',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, variant = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[3000] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={classNames(
                'px-5 py-3.5 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-3 pointer-events-auto animate-toast-in',
                variants[toast.variant]
              )}
            >
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}