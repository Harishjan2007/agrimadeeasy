'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Search, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Search,
  actionLabel,
  actionHref,
  onAction,
  className = ''
}: EmptyStateProps) {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  return (
    <div
      className={`bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-2xs max-w-lg mx-auto ${className}`}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-400 flex items-center justify-center mx-auto mb-4 shadow-2xs">
        <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      )}

      {(actionLabel || onAction || actionHref) && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              {actionLabel || (isTa ? 'மீட்டமை' : 'Reset')}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              {actionLabel || (isTa ? 'மீட்டமை' : 'Reset')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
