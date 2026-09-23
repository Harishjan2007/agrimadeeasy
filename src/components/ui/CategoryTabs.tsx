'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface CategoryTabItem {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon | string;
}

interface CategoryTabsProps {
  tabs: CategoryTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
  size?: 'sm' | 'md';
}

export default function CategoryTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'pill',
  size = 'md'
}: CategoryTabsProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-xl',
    md: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2 rounded-xl'
  };

  return (
    <div
      role="tablist"
      className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-2 py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'border-agri-700 text-agri-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {typeof Icon === 'string' ? (
                <span className="text-base leading-none">{Icon}</span>
              ) : Icon ? (
                <Icon className="w-4 h-4 shrink-0" />
              ) : null}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-agri-100 text-agri-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center font-bold whitespace-nowrap transition-all shadow-2xs ${
              sizeClasses[size]
            } ${
              isActive
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90'
            }`}
          >
            {typeof Icon === 'string' ? (
              <span className="text-sm leading-none">{Icon}</span>
            ) : Icon ? (
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            ) : null}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
