'use client';

import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export default function LoadingState({
  message = 'Loading...',
  className = ''
}: LoadingStateProps) {
  return (
    <div
      className={`min-h-[260px] flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-agri-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-3 animate-pulse">
        {message}
      </p>
    </div>
  );
}
