'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50/95 border-emerald-200 text-emerald-950',
    error: 'bg-rose-50/95 border-rose-200 text-rose-950',
    info: 'bg-blue-50/95 border-blue-200 text-blue-950',
  };

  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto z-50 flex justify-center px-4 pointer-events-none pb-safe">
      <div
        className={`pointer-events-auto animate-fade-in flex items-center space-x-2 px-4 py-2.5 rounded-full border shadow-elevated text-xs sm:text-sm font-medium backdrop-blur-md max-w-[90vw] ${bgStyles[type]}`}
      >
        {icons[type]}
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
}
