'use client';

import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title,
  message,
  onRetry,
  className = ''
}: ErrorStateProps) {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  return (
    <div
      className={`bg-white rounded-3xl p-8 sm:p-10 text-center border border-rose-200/80 shadow-2xs max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="text-base font-extrabold text-slate-900">
        {title || (isTa ? 'ஏற்றுவதில் பிழை ஏற்பட்டது' : 'Unable to load data')}
      </h3>

      {message && (
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {message}
        </p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry'}</span>
        </button>
      )}
    </div>
  );
}
