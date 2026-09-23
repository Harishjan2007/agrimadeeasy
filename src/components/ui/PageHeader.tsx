'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/i18n';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  stats?: { label: string; value: string | number }[];
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  badge,
  icon: Icon,
  iconColor = 'text-agri-700',
  iconBg = 'bg-agri-50 border-agri-200/80',
  backHref,
  backLabel,
  actions,
  stats,
  className = ''
}: PageHeaderProps) {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  return (
    <div className={`bg-white border-b border-slate-200/80 ${className}`}>
      {/* Top back link if provided */}
      {backHref && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-agri-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel || (isTa ? 'பின்செல்க' : 'Back')}</span>
          </Link>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {Icon && (
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${iconBg} ${iconColor}`}
              >
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            )}

            <div className="space-y-1">
              {badge && (
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-agri-800 bg-agri-50 border border-agri-200/80 px-2.5 py-0.5 rounded-full mb-1">
                  {badge}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions or Quick Stats */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0 flex-wrap">
            {stats && stats.length > 0 && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className={`px-3 text-center ${
                      idx !== 0 ? 'border-l border-slate-200' : ''
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block">
                      {stat.label}
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
