import React from 'react';
import { QuotationStatus } from '@/lib/types';

export const STATUS_CLASSES: Record<QuotationStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  sent: 'bg-blue-50 text-blue-700 border-blue-300',
  not_confirmed: 'bg-red-100 text-red-800 border-red-300 font-bold',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-300 line-through',
};

export function StatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full border text-[11px] uppercase tracking-wider ${
        STATUS_CLASSES[status] || STATUS_CLASSES.draft
      }`}
    >
      {status}
    </span>
  );
}
