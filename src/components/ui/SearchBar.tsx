'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  size = 'md',
  autoFocus = false,
  onClear
}: SearchBarProps) {
  const sizeClasses = {
    sm: 'py-1.5 pl-8 pr-7 text-xs',
    md: 'py-2.5 pl-10 pr-8 text-xs sm:text-sm',
    lg: 'py-3.5 pl-11 pr-9 text-sm sm:text-base'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3.5',
    lg: 'w-5 h-5 left-4'
  };

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <Search
        className={`text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${iconSizes[size]}`}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200/90 rounded-2xl text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${sizeClasses[size]}`}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors"
          aria-label="Clear search input"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
  );
}
