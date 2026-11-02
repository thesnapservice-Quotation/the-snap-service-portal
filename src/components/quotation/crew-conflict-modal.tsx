'use client';

import React from 'react';
import { AlertTriangle, Clock, Calendar, User, ArrowRight, X, ShieldAlert, Check } from 'lucide-react';
import { formatDate, formatEventTiming } from '@/lib/utils';
import { CrewConflictItem, getTimingSlot } from '@/lib/crew-overlap';

interface CrewConflictModalProps {
  isOpen: boolean;
  crewName: string;
  targetEventName: string;
  targetEventDate: string;
  targetEventTiming?: string;
  conflicts: CrewConflictItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function CrewConflictModal({
  isOpen,
  crewName,
  targetEventName,
  targetEventDate,
  targetEventTiming,
  conflicts,
  onConfirm,
  onCancel,
}: CrewConflictModalProps) {
  if (!isOpen) return null;

  const targetSlot = getTimingSlot(targetEventTiming);
  const targetSlotLabel =
    targetSlot === 'day'
      ? 'Day Shift (Daytime Event)'
      : targetSlot === 'night'
      ? 'Night Shift (Evening / Night Event)'
      : targetSlot === 'full_day'
      ? 'Full Day Coverage'
      : 'Timing Unspecified / TBD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 font-sans">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-red-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 stroke-[2.5] text-amber-100" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-0.5">
                Schedule Overlap Alert
              </div>
              <h3 className="font-serif font-bold text-lg text-white leading-tight">
                Team Member Already Assigned!
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close / Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Main Warning Box */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wider">
                Same Date &amp; Shift Clash Detected
              </span>
            </div>
            <p className="text-slate-700 text-xs leading-relaxed">
              <strong className="text-amber-950 font-bold">{crewName}</strong> is already booked on{' '}
              <strong className="text-slate-900">{formatDate(targetEventDate)}</strong> during the same timing window.
              Day and Night shifts are respected, but an overlap was found on this slot.
            </p>
          </div>

          {/* New Event Target Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Event You Are Assigning To:
            </span>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-bold text-sm text-[#0D4F4F] block">{targetEventName}</span>
                <span className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(targetEventDate)}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>{formatEventTiming(targetEventTiming) || 'Timing Unspecified'}</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{targetSlotLabel}</span>
              </div>
            </div>
          </div>

          {/* Conflicting Existing Bookings List */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider block flex items-center gap-1">
              <span>Existing Overlapping Booking(s) for {crewName}:</span>
            </span>

            <div className="space-y-2">
              {conflicts.map((conf, idx) => (
                <div
                  key={conf.eventId || idx}
                  className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-red-950">{conf.clientName}</span>
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono text-[10.5px] font-bold">
                          #{conf.quotationNumber}
                        </span>
                      </div>
                      <span className="text-slate-600 text-xs block mt-0.5 font-medium">
                        Event: <strong className="text-slate-900">{conf.eventName}</strong>
                        {conf.role ? ` (${conf.role})` : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-200/80 text-red-900 font-bold text-[11px]">
                        <Clock className="w-3 h-3 text-red-700" />
                        <span>{formatEventTiming(conf.timing) || 'Timing Unspecified'}</span>
                      </span>
                      <span className="text-[10px] text-red-700 font-semibold block mt-0.5">
                        {conf.reason}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Urdu / Bilingual Advice Notice */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            💡 <strong>Rahnnumai (Guidance):</strong> Agar yeh event alag shift ka hai (maslan ek Day aur doosra Night) toh overlap nahi hota. Magar kyunki dono ka time slot same ya unspecified hai, is bande ko assign karne se double booking ho sakti hai.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Cancel / Choose Another Member</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Proceed Anyway (Override Warning)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
