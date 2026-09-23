'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Navigation,
  Tractor,
  Play,
  Check
} from 'lucide-react';
import { BookingStatus } from '@/types';
import { useLanguage } from '@/i18n';

interface StatusBadgeProps {
  status: BookingStatus | 'verified' | 'available' | 'unavailable' | 'active' | 'completed' | 'new';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  labelOverride?: string;
}

export default function StatusBadge({
  status,
  className = '',
  size = 'md',
  showIcon = true,
  labelOverride
}: StatusBadgeProps) {
  const { translateBookingStatus, language } = useLanguage();
  const isTa = language === 'ta';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  // Resolve config for status
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let IconComponent = Clock;
  let label = labelOverride || status;

  switch (status) {
    case 'pending':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200/80';
      IconComponent = Clock;
      label = labelOverride || translateBookingStatus('pending');
      break;

    case 'accepted':
      bgClass = 'bg-blue-50 text-blue-800 border-blue-200/80';
      IconComponent = CheckCircle2;
      label = labelOverride || translateBookingStatus('accepted');
      break;

    case 'on_the_way':
      bgClass = 'bg-amber-500 text-white border-amber-600 shadow-xs animate-pulse';
      IconComponent = Navigation;
      label = labelOverride || translateBookingStatus('on_the_way');
      break;

    case 'arrived':
      bgClass = 'bg-indigo-600 text-white border-indigo-700 shadow-xs';
      IconComponent = Check;
      label = labelOverride || translateBookingStatus('arrived');
      break;

    case 'in_progress':
      bgClass = 'bg-purple-600 text-white border-purple-700 shadow-xs';
      IconComponent = Tractor;
      label = labelOverride || translateBookingStatus('in_progress');
      break;

    case 'completed':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      IconComponent = CheckCircle2;
      label = labelOverride || translateBookingStatus('completed');
      break;

    case 'cancelled':
      bgClass = 'bg-slate-100 text-slate-600 border-slate-200';
      IconComponent = AlertCircle;
      label = labelOverride || translateBookingStatus('cancelled');
      break;

    case 'rejected':
      bgClass = 'bg-rose-50 text-rose-800 border-rose-200/80';
      IconComponent = XCircle;
      label = labelOverride || translateBookingStatus('rejected');
      break;

    case 'available':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      IconComponent = CheckCircle2;
      label = labelOverride || (isTa ? 'கிடைக்கும்' : 'Available');
      break;

    case 'unavailable':
      bgClass = 'bg-slate-100 text-slate-500 border-slate-200';
      IconComponent = XCircle;
      label = labelOverride || (isTa ? 'கிடைக்கவில்லை' : 'Unavailable');
      break;

    case 'verified':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      IconComponent = CheckCircle2;
      label = labelOverride || (isTa ? 'அங்கீகரிக்கப்பட்டது' : 'Verified');
      break;

    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${sizeClasses[size]} ${bgClass} ${className}`}
    >
      {showIcon && <IconComponent className={`${iconSizes[size]} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
}
