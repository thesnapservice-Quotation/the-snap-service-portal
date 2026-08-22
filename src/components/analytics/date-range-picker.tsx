'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X,
  Clock
} from 'lucide-react';

export type DatePresetKey = 
  | 'all_time'
  | 'today'
  | 'yesterday'
  | 'today_yesterday'
  | 'last_7_days'
  | 'last_14_days'
  | 'last_28_days'
  | 'last_30_days'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  preset: DatePresetKey;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (newRange: DateRange) => void;
}

const PRESETS: { key: DatePresetKey; label: string }[] = [
  { key: 'all_time', label: 'Maximum (All Time)' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'today_yesterday', label: 'Today and yesterday' },
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'last_14_days', label: 'Last 14 days' },
  { key: 'last_28_days', label: 'Last 28 days' },
  { key: 'last_30_days', label: 'Last 30 days' },
  { key: 'this_week', label: 'This week' },
  { key: 'last_week', label: 'Last week' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
];

function normalizeDate(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

export function computePresetRange(preset: DatePresetKey): { start: Date | null; end: Date | null } {
  const now = new Date();
  const today = normalizeDate(now);

  switch (preset) {
    case 'all_time':
      return { start: null, end: null };

    case 'today':
      return { start: today, end: today };

    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { start: y, end: y };
    }

    case 'today_yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { start: y, end: today };
    }

    case 'last_7_days': {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { start: s, end: today };
    }

    case 'last_14_days': {
      const s = new Date(today);
      s.setDate(s.getDate() - 13);
      return { start: s, end: today };
    }

    case 'last_28_days': {
      const s = new Date(today);
      s.setDate(s.getDate() - 27);
      return { start: s, end: today };
    }

    case 'last_30_days': {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { start: s, end: today };
    }

    case 'this_week': {
      const day = today.getDay(); // 0 is Sun, 1 is Mon
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(today);
      mon.setDate(diff);
      return { start: mon, end: today };
    }

    case 'last_week': {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const lastMon = new Date(today);
      lastMon.setDate(diff);
      const lastSun = new Date(lastMon);
      lastSun.setDate(lastMon.getDate() + 6);
      return { start: lastMon, end: lastSun };
    }

    case 'this_month': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: s, end: today };
    }

    case 'last_month': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: s, end: e };
    }

    default:
      return { start: null, end: null };
  }
}

export function formatSimpleDate(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatInputDate(d: Date | null): string {
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DateRangePicker({ dateRange, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary staging state while picker is open
  const [tempPreset, setTempPreset] = useState<DatePresetKey>(dateRange.preset);
  const [tempStart, setTempStart] = useState<Date | null>(dateRange.startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(dateRange.endDate);

  // Month navigation: viewDate represents the right calendar month
  const [viewDate, setViewDate] = useState<Date>(() => {
    return dateRange.endDate ? new Date(dateRange.endDate) : new Date();
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Sync staging state on open
  const handleOpen = () => {
    setTempPreset(dateRange.preset);
    setTempStart(dateRange.startDate);
    setTempEnd(dateRange.endDate);
    if (dateRange.endDate) {
      setViewDate(new Date(dateRange.endDate));
    } else {
      setViewDate(new Date());
    }
    setIsOpen(!isOpen);
  };

  const handleSelectPreset = (pKey: DatePresetKey) => {
    setTempPreset(pKey);
    const { start, end } = computePresetRange(pKey);
    setTempStart(start);
    setTempEnd(end);
    if (end) {
      setViewDate(new Date(end));
    }
  };

  const handleDayClick = (clickedDate: Date) => {
    setTempPreset('custom');
    const normalized = normalizeDate(clickedDate);

    if (!tempStart || (tempStart && tempEnd)) {
      // Start a new range selection
      setTempStart(normalized);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      // Complete range
      if (normalized < tempStart) {
        setTempEnd(tempStart);
        setTempStart(normalized);
      } else {
        setTempEnd(normalized);
      }
    }
  };

  const handleApply = () => {
    onChange({
      startDate: tempStart,
      endDate: tempEnd,
      preset: tempPreset,
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  // Label for trigger button
  const getTriggerLabel = () => {
    if (dateRange.preset === 'all_time' || (!dateRange.startDate && !dateRange.endDate)) {
      return 'Maximum (All Time)';
    }
    const startStr = formatSimpleDate(dateRange.startDate);
    const endStr = formatSimpleDate(dateRange.endDate);
    const presetObj = PRESETS.find((p) => p.key === dateRange.preset);
    const prefix = presetObj && presetObj.key !== 'custom' ? `${presetObj.label}: ` : '';

    if (startStr === endStr) {
      return `${prefix}${startStr}`;
    }
    return `${prefix}${startStr} – ${endStr}`;
  };

  // Calendar rendering helpers
  const leftMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  const rightMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const renderMonthCalendar = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthName = monthDate.toLocaleString('en-US', { month: 'short' });

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push(new Date(year, month, d));
    }

    return (
      <div className="w-56 sm:w-60 select-none">
        {/* Month Header */}
        <div className="flex items-center justify-center pb-2 mb-2 border-b border-slate-100">
          <span className="font-bold text-xs text-slate-800">
            {monthName} {year}
          </span>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center text-xs">
          {days.map((d, idx) => {
            if (!d) {
              return <div key={`empty-${idx}`} className="h-7" />;
            }

            const norm = normalizeDate(d);
            const isStart = tempStart && norm.getTime() === tempStart.getTime();
            const isEnd = tempEnd && norm.getTime() === tempEnd.getTime();
            const isInRange = tempStart && tempEnd && norm > tempStart && norm < tempEnd;
            const isToday = norm.getTime() === normalizeDate(new Date()).getTime();

            let cellClass = 'h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer text-[11px]';

            if (isStart || isEnd) {
              cellClass = 'h-7 w-7 mx-auto flex items-center justify-center rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold shadow-xs cursor-pointer text-[11px]';
            } else if (isInRange) {
              cellClass = 'h-7 w-full flex items-center justify-center bg-[#0D4F4F]/10 text-[#0D4F4F] font-semibold cursor-pointer text-[11px] rounded-none';
            } else if (isToday) {
              cellClass += ' border border-[#0D4F4F] text-[#0D4F4F] font-bold';
            }

            return (
              <div
                key={d.toISOString()}
                onClick={() => handleDayClick(d)}
                className="flex items-center justify-center"
              >
                <div className={cellClass}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button (placed next to Lock Cost & Profit) */}
      <button
        type="button"
        onClick={handleOpen}
        className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-[#0D4F4F]" />
        <span className="max-w-[240px] truncate">{getTriggerLabel()}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {/* Popover Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 w-[640px] max-w-[95vw] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left Column: Presets List */}
            <div className="w-full md:w-44 p-3 bg-slate-50/70 shrink-0 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 pb-1">
                Recently used
              </span>
              <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
                {PRESETS.map((p) => {
                  const isSelected = tempPreset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleSelectPreset(p.key)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                        isSelected
                          ? 'bg-[#0D4F4F] text-[#D4AF37] font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#D4AF37] bg-[#D4AF37]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#0D4F4F]" />}
                      </span>
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Dual Month Interactive Calendar */}
            <div className="p-3.5 flex-1 space-y-3">
              {/* Navigation Header */}
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-xs font-bold text-slate-700">
                  Select Custom Date Range
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Side-by-side Dual Calendar Months */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4">
                {renderMonthCalendar(leftMonth)}
                {renderMonthCalendar(rightMonth)}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Inputs & Actions */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Input display */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="date"
                value={formatInputDate(tempStart)}
                onChange={(e) => {
                  setTempPreset('custom');
                  setTempStart(e.target.value ? new Date(e.target.value) : null);
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
              />
              <span className="text-slate-400 font-bold">–</span>
              <input
                type="date"
                value={formatInputDate(tempEnd)}
                onChange={(e) => {
                  setTempPreset('custom');
                  setTempEnd(e.target.value ? new Date(e.target.value) : null);
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            {/* Timezone Note & Action Buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-[10px] text-slate-400 hidden lg:inline">
                Dates are in Pakistan Time (PKT)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] hover:brightness-110 font-bold transition-all shadow-xs"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
