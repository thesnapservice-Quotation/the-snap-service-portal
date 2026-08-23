'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';

interface DateTimePickerProps {
  value: string; // ISO string or YYYY-MM-DDTHH:mm
  onChange: (newValue: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date & time...',
  required = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date from value or fallback to now
  const parsedDate = value ? new Date(value) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  // Local calendar view state
  const [viewYear, setViewYear] = useState(validDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(validDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(validDate);

  // Time state (12-hour)
  const initialHours24 = validDate.getHours();
  const initialHours12 = initialHours24 % 12 || 12;
  const initialAmPm = initialHours24 >= 12 ? 'PM' : 'AM';
  const initialMinutes = validDate.getMinutes();

  const [hour12, setHour12] = useState<number>(initialHours12);
  const [minute, setMinute] = useState<number>(initialMinutes);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initialAmPm);

  // Synchronize when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        const h24 = d.getHours();
        setHour12(h24 % 12 || 12);
        setMinute(d.getMinutes());
        setAmpm(h24 >= 12 ? 'PM' : 'AM');
      }
    }
  }, [value]);

  // Close when clicking outside
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

  // Construct ISO string (YYYY-MM-DDTHH:mm) from selectedDate + hour12 + minute + ampm
  const buildIsoString = (d: Date, h12: number, min: number, period: 'AM' | 'PM'): string => {
    let h24 = h12 % 12;
    if (period === 'PM') h24 += 12;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(h24).padStart(2, '0');
    const minStr = String(min).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${minStr}`;
  };

  const applyChange = (d: Date, h12: number, min: number, period: 'AM' | 'PM') => {
    const iso = buildIsoString(d, h12, min, period);
    onChange(iso);
  };

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar Grid builder (Monday-based)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0

  const calendarDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  // Previous month padding
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth, i),
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill 42 cells (6 rows)
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      date: new Date(viewYear, viewMonth + 1, i),
      isCurrentMonth: false,
    });
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  // Quick Shortcuts Handler
  const applyQuickPreset = (offsetHours: number, fixedHour?: number, nextDay = false) => {
    const target = new Date();
    if (nextDay) {
      target.setDate(target.getDate() + 1);
    }
    if (fixedHour !== undefined) {
      target.setHours(fixedHour, 0, 0, 0);
    } else {
      target.setTime(target.getTime() + offsetHours * 3600000);
    }

    setSelectedDate(target);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());

    const h24 = target.getHours();
    const h12 = h24 % 12 || 12;
    const min = target.getMinutes();
    const period = h24 >= 12 ? 'PM' : 'AM';

    setHour12(h12);
    setMinute(min);
    setAmpm(period);

    applyChange(target, h12, min, period);
    setIsOpen(false);
  };

  // Formatted display text
  const displayFormatted = value
    ? (() => {
        try {
          const d = new Date(value);
          if (isNaN(d.getTime())) return value;
          return d.toLocaleString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        } catch {
          return value;
        }
      })()
    : placeholder;

  return (
    <div className="relative font-sans" ref={containerRef}>
      {label && <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
          isOpen
            ? 'border-[#0D4F4F] ring-2 ring-[#0D4F4F]/20 bg-white'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CalendarIcon className="w-4 h-4 text-[#0D4F4F] shrink-0" />
          <span className={value ? 'font-bold text-slate-900 truncate' : 'text-slate-400'}>
            {displayFormatted}
          </span>
        </div>
        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {/* Hidden input to satisfy form requirements */}
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          className="opacity-0 absolute -z-10 h-0 w-0"
          onChange={() => {}}
        />
      )}

      {/* LUXURY POPOVER DROPDOWN */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 z-50 bg-white rounded-3xl shadow-2xl border-2 border-[#D4AF37] p-4 w-[320px] sm:w-[350px] space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Shortcut Chips */}
          <div className="space-y-1">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
              ⚡ Quick Follow-up Shortcuts:
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => applyQuickPreset(0.5)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#0D4F4F] hover:text-[#D4AF37] text-[10px] font-bold text-slate-700 transition-all"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(1)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#0D4F4F] hover:text-[#D4AF37] text-[10px] font-bold text-slate-700 transition-all"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(2)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#0D4F4F] hover:text-[#D4AF37] text-[10px] font-bold text-slate-700 transition-all"
              >
                +2 Hours
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(4)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#0D4F4F] hover:text-[#D4AF37] text-[10px] font-bold text-slate-700 transition-all"
              >
                +4 Hours
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(0, 17, false)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#0D4F4F] hover:text-[#D4AF37] text-[10px] font-bold text-slate-700 transition-all"
              >
                Today 5 PM
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(0, 10, true)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#0D4F4F] hover:text-[#D4AF37] text-[10px] font-bold text-slate-700 transition-all"
              >
                Tomorrow 10 AM
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset(0, 14, true)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#0D4F4F] hover:text-[#D4AF37] text-[10px] font-bold text-slate-700 transition-all"
              >
                Tomorrow 2 PM
              </button>
            </div>
          </div>

          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between px-1 border-t border-slate-100 pt-2.5">
            <h4 className="font-serif font-bold text-sm text-[#0D4F4F]">
              {MONTHS[viewMonth]} {viewYear}
            </h4>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Days Grid */}
          <div className="space-y-1">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((wd) => (
                <span key={wd} className="text-[10px] font-bold text-slate-400 uppercase">
                  {wd}
                </span>
              ))}
            </div>

            {/* Day Tiles */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => {
                const isSelected = isSameDay(item.date, selectedDate);
                const isCurrentToday = isSameDay(item.date, today);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.date);
                      applyChange(item.date, hour12, minute, ampm);
                    }}
                    className={`h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all relative ${
                      isSelected
                        ? 'bg-[#0D4F4F] text-[#D4AF37] font-bold shadow-xs'
                        : item.isCurrentMonth
                        ? 'text-slate-800 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.date.getDate()}</span>
                    {isCurrentToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#0D4F4F] absolute bottom-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIME PICKER SECTION (12-Hour Luxury Styled) */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#0D4F4F]" /> Select Time:
              </span>
              <span className="font-mono font-extrabold text-xs text-[#0D4F4F]">
                {String(hour12).padStart(2, '0')}:{String(minute).padStart(2, '0')} {ampm}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Hour Dropdown */}
              <div className="flex-1">
                <select
                  value={hour12}
                  onChange={(e) => {
                    const h = parseInt(e.target.value, 10);
                    setHour12(h);
                    applyChange(selectedDate, h, minute, ampm);
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D4F4F]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')} Hour
                    </option>
                  ))}
                </select>
              </div>

              {/* Minute Dropdown */}
              <div className="flex-1">
                <select
                  value={minute}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setMinute(m);
                    applyChange(selectedDate, hour12, m, ampm);
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D4F4F]"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      :{String(m).padStart(2, '0')} Min
                    </option>
                  ))}
                </select>
              </div>

              {/* AM / PM Segmented Toggle */}
              <div className="flex items-center bg-slate-200 p-0.5 rounded-xl text-xs font-extrabold shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAmpm('AM');
                    applyChange(selectedDate, hour12, minute, 'AM');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    ampm === 'AM'
                      ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmpm('PM');
                    applyChange(selectedDate, hour12, minute, 'PM');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    ampm === 'PM'
                      ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setSelectedDate(now);
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
                const h24 = now.getHours();
                const h12 = h24 % 12 || 12;
                const min = now.getMinutes();
                const period = h24 >= 12 ? 'PM' : 'AM';
                setHour12(h12);
                setMinute(min);
                setAmpm(period);
                applyChange(now, h12, min, period);
              }}
              className="text-[11px] font-bold text-[#0D4F4F] hover:underline"
            >
              Set Current Time
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-sm hover:brightness-105"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
