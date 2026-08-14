'use me';
'use client';

import React, { useState, useMemo } from 'react';
import { Quotation, EventItem } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  Sparkles,
  Info
} from 'lucide-react';

interface BookedDateInfo {
  dateStr: string; // YYYY-MM-DD
  clientName: string;
  quotationNumber: string;
  eventName: string;
  status: string;
  quotationId: string;
}

interface BookingCalendarProps {
  events: EventItem[];
  currentQuotationId?: string;
  onSelectEventDate: (eventIndex: number, dateStr: string) => void;
  onAutoFormatDateRange?: (rangeText: string) => void;
}

export function BookingCalendar({
  events,
  currentQuotationId,
  onSelectEventDate,
  onAutoFormatDateRange,
}: BookingCalendarProps) {
  // Current view month/year
  const [viewDate, setViewDate] = useState<Date>(() => {
    // If events have a date already, start at that month
    const firstWithDate = events.find((e) => e.eventDate);
    if (firstWithDate?.eventDate) {
      const parsed = new Date(firstWithDate.eventDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);

  // Fetch all existing quotations to compute booked dates map
  const bookedDatesMap = useMemo(() => {
    const map: Record<string, BookedDateInfo[]> = {};
    const allQuotations = storage.getQuotations();

    allQuotations.forEach((q) => {
      // Ignore current quotation if editing
      if (currentQuotationId && q.id === currentQuotationId) return;

      const isLocked = q.status === 'confirmed' || q.status === 'completed';

      q.events.forEach((evt) => {
        if (evt.eventDate) {
          const key = evt.eventDate;
          if (!map[key]) map[key] = [];
          map[key].push({
            dateStr: evt.eventDate,
            clientName: q.client.name,
            quotationNumber: q.quotationNumber,
            eventName: evt.name,
            status: q.status,
            quotationId: q.id,
          });
        }
      });
    });

    return map;
  }, [currentQuotationId]);

  // Selected dates for current quotation being created/edited
  const selectedDatesMap = useMemo(() => {
    const map: Record<string, { eventIndex: number; eventName: string }> = {};
    events.forEach((evt, idx) => {
      if (evt.eventDate) {
        map[evt.eventDate] = { eventIndex: idx, eventName: evt.name };
      }
    });
    return map;
  }, [events]);

  // Check for conflicts
  const clashes = useMemo(() => {
    const conflictList: { eventName: string; dateStr: string; bookedBy: BookedDateInfo }[] = [];
    events.forEach((evt) => {
      if (evt.eventDate && bookedDatesMap[evt.eventDate]) {
        bookedDatesMap[evt.eventDate].forEach((booked) => {
          if (booked.status === 'confirmed' || booked.status === 'completed') {
            conflictList.push({
              eventName: evt.name,
              dateStr: evt.eventDate!,
              bookedBy: booked,
            });
          }
        });
      }
    });
    return conflictList;
  }, [events, bookedDatesMap]);

  // Month Calendar Navigation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Calendar Grid Math
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust so week starts on Monday (0 = Mon, 6 = Sun)
  const startOffset = (firstDayOfMonth + 6) % 7;

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Handle Date Click
  const handleDayClick = (dayNum: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    onSelectEventDate(activeEventIndex, dateStr);

    // Auto update date range string (e.g. 15 Oct - 18 Oct 2026)
    if (onAutoFormatDateRange) {
      const updatedDates = events.map((e, idx) => (idx === activeEventIndex ? dateStr : e.eventDate)).filter(Boolean) as string[];
      if (updatedDates.length > 0) {
        updatedDates.sort();
        const first = formatDate(updatedDates[0]);
        const last = formatDate(updatedDates[updatedDates.length - 1]);
        const rangeStr = updatedDates.length === 1 ? first : `${first} - ${last}`;
        onAutoFormatDateRange(rangeStr);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#E5E0D5] p-5 shadow-sm space-y-4 font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#0D4F4F] text-[#D4AF37]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
              Interactive Studio Booking Calendar
            </h3>
            <p className="text-xs text-slate-500">
              Pick event dates & prevent booking clashes with locked client dates.
            </p>
          </div>
        </div>

        {/* Event Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {events.map((evt, idx) => (
            <button
              key={evt.id || idx}
              type="button"
              onClick={() => setActiveEventIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeEventIndex === idx
                  ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{evt.name || `Day ${idx + 1}`}</span>
              {evt.eventDate && (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                  {formatDate(evt.eventDate)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Same-day Multiple Booking Information Notice */}
      {clashes.length > 0 && (
        <div className="p-3.5 bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-xl text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-blue-950">
            <Info className="w-4 h-4 text-blue-600" />
            <span>SAME-DAY MULTIPLE BOOKINGS NOTICE (ADDITIONAL CREW NEEDED)</span>
          </div>
          {clashes.map((c, i) => (
            <div key={i} className="pl-5 text-[11px] text-blue-800">
              • <span className="font-bold">{c.eventName} ({formatDate(c.dateStr)})</span> coincides with existing booking for <span className="font-bold text-blue-950">{c.bookedBy.clientName}</span> (#{c.bookedBy.quotationNumber}). Ensure an additional photography crew team is deployed.
            </div>
          ))}
        </div>
      )}

      {/* Month Header & Controls */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors border border-slate-300"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-serif font-bold text-sm text-[#0D4F4F] uppercase tracking-wider">
          {monthName}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors border border-slate-300"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-600 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-[#0D4F4F] border border-[#D4AF37]" />
          <span>Selected for Active Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-emerald-800 text-white flex items-center justify-center text-[9px] font-bold">
            🔒
          </div>
          <span className="text-emerald-900 font-bold">Confirmed / Booked (Locked)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">
            ✖
          </div>
          <span className="text-red-700 font-bold">Not Confirmed (Hold / Inquired)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-white border border-slate-300" />
          <span>Available Date</span>
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {/* Weekday Labels */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="font-bold text-[10px] text-slate-400 uppercase py-1">
            {day}
          </div>
        ))}

        {/* Empty Offset Days */}
        {Array.from({ length: startOffset }).map((_, idx) => (
          <div key={`offset-${idx}`} className="h-12 bg-slate-50/50 rounded-lg border border-transparent" />
        ))}

        {/* Month Days */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const formattedMonth = String(month + 1).padStart(2, '0');
          const formattedDay = String(dayNum).padStart(2, '0');
          const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

          const allDayBookings = bookedDatesMap[dateStr] || [];
          const confirmedList = allDayBookings.filter((b) => b.status === 'confirmed' || b.status === 'completed');
          const unconfirmedList = allDayBookings.filter((b) => b.status === 'not_confirmed' || b.status === 'sent' || b.status === 'draft');

          const isConfirmed = confirmedList.length > 0;
          const isUnconfirmed = unconfirmedList.length > 0;

          const isSelectedForCurrent = selectedDatesMap[dateStr];
          const isActiveSelected = isSelectedForCurrent && isSelectedForCurrent.eventIndex === activeEventIndex;

          const tooltipParts: string[] = [];
          if (confirmedList.length > 0) {
            tooltipParts.push(`🟢 Confirmed (${confirmedList.length}): ${confirmedList.map((b) => b.clientName).join(', ')}`);
          }
          if (unconfirmedList.length > 0) {
            tooltipParts.push(`🔴 Not Confirmed (${unconfirmedList.length}): ${unconfirmedList.map((b) => b.clientName).join(', ')}`);
          }
          if (isSelectedForCurrent) {
            tooltipParts.push(`Selected for ${isSelectedForCurrent.eventName}`);
          }
          const tooltipText = tooltipParts.length > 0 ? tooltipParts.join(' | ') : `Click to select date for ${events[activeEventIndex]?.name}`;

          return (
            <button
              key={`day-${dayNum}`}
              type="button"
              onClick={() => handleDayClick(dayNum)}
              title={tooltipText}
              className={`min-h-[56px] rounded-xl border p-1 flex flex-col justify-between items-center transition-all relative overflow-hidden space-y-0.5 ${
                isActiveSelected
                  ? 'bg-[#0D4F4F] text-[#D4AF37] border-2 border-[#D4AF37] shadow-md font-bold z-10'
                  : isSelectedForCurrent
                  ? 'bg-blue-900 text-blue-100 border-blue-700 font-semibold'
                  : isConfirmed
                  ? 'bg-emerald-900/90 text-white border-emerald-900 shadow-xs'
                  : isUnconfirmed
                  ? 'bg-red-50 text-red-900 border-red-300 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold block self-start pl-0.5">{dayNum}</span>

              <div className="w-full space-y-0.5">
                {isSelectedForCurrent && (
                  <div className="w-full bg-[#D4AF37] text-[#0D4F4F] text-[8px] font-extrabold py-0.5 px-0.5 rounded truncate uppercase tracking-tighter shadow-2xs">
                    {isSelectedForCurrent.eventName}
                  </div>
                )}

                {/* Confirmed GREEN Badges */}
                {confirmedList.map((b, bIdx) => (
                  <div
                    key={`conf-${bIdx}`}
                    className="w-full bg-emerald-950/90 text-[8px] font-extrabold text-emerald-300 py-0.5 px-0.5 rounded truncate uppercase tracking-tighter flex items-center justify-center gap-0.5 border border-emerald-700"
                  >
                    <Lock className="w-2 h-2 text-[#D4AF37] shrink-0" />
                    <span className="truncate">{b.clientName}</span>
                  </div>
                ))}

                {/* Not Confirmed RED Badges */}
                {unconfirmedList.map((b, bIdx) => (
                  <div
                    key={`unconf-${bIdx}`}
                    className="w-full bg-red-700/90 text-[8px] font-extrabold text-red-100 py-0.5 px-0.5 rounded truncate uppercase tracking-tighter flex items-center justify-center gap-0.5 border border-red-600"
                  >
                    <span className="text-[9px] font-bold shrink-0">✖</span>
                    <span className="truncate">{b.clientName}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
