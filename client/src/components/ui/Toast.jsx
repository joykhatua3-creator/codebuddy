import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={18} className="text-emerald-500 shrink-0" />,
  error: <XCircle size={18} className="text-rose-500 shrink-0" />,
  warning: <AlertCircle size={18} className="text-amber-500 shrink-0" />,
  info: <Info size={18} className="text-cyan-500 shrink-0" />,
};

const BG = {
  success: 'bg-white/90 dark:bg-[#0B1120]/90 border-emerald-300/70 dark:border-emerald-400/30',
  error: 'bg-white/90 dark:bg-[#0B1120]/90 border-rose-300/70 dark:border-rose-400/30',
  warning: 'bg-white/90 dark:bg-[#0B1120]/90 border-amber-300/70 dark:border-amber-400/30',
  info: 'bg-white/90 dark:bg-[#0B1120]/90 border-cyan-300/70 dark:border-cyan-400/30',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container positioned at bottom-right so it never overlaps top navbar header icons */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-lg ${BG[t.type]} animate-in slide-in-from-right-5`}
          >
            {ICONS[t.type]}
            <span className="text-sm text-slate-800 dark:text-slate-100 flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
};
