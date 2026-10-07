import React, { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 2000 }) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!duration || duration <= 0) return;
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration]);
  const icons = {
    info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
  };

  const borders = {
    info: 'border-blue-200 bg-white text-slate-800',
    success: 'border-emerald-200 bg-white text-slate-800',
    warning: 'border-amber-200 bg-white text-slate-800',
    error: 'border-rose-200 bg-white text-slate-800',
  };

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg max-w-sm w-full mx-auto ${borders[type]} animate-slide-down`}
      role="status"
    >
      {icons[type]}
      <span className="text-xs font-semibold flex-1 text-left">{message}</span>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
