'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon | string;
  actionHref?: string;
  actionLabel?: string;
  badge?: string;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  actionHref,
  actionLabel,
  badge,
  className = ''
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 pb-4 mb-5 border-b border-slate-200/80 ${className}`}
    >
      <div>
        {badge && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-agri-700 bg-agri-50 px-2 py-0.5 rounded mb-1">
            {badge}
          </span>
        )}
        <div className="flex items-center gap-2">
          {typeof Icon === 'string' ? (
            <span className="text-xl sm:text-2xl leading-none">{Icon}</span>
          ) : Icon ? (
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-agri-700 shrink-0" />
          ) : null}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-agri-700 hover:text-agri-800 transition-colors group shrink-0"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
