'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Quotation, EventItem } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatDate, formatEventTiming, formatWhatsAppPhone, formatCurrency } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  Sparkles,
  Info,
  Phone,
  MessageSquare,
  MapPin,
  X,
  Clock,
  ExternalLink
} from 'lucide-react';

export interface BookedDateInfo {
  dateStr: string; // YYYY-MM-DD
  clientName: string;
  clientPhone?: string;
  quotationNumber: string;
  eventName: string;
  eventTiming?: string;
  eventVenue?: string;
  eventPrice?: number;
  packagePrice?: number;
  status: string;
  quotationId: string;
}

interface BookingCalendarProps {
  events?: EventItem[];
  quotationsList?: Quotation[];
  currentQuotationId?: string;
  onSelectEventDate?: (eventIndex: number, dateStr: string) => void;
  onAutoFormatDateRange?: (rangeText: string) => void;
}

export function BookingCalendar({
  events = [],
  quotationsList,
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

  // Selected date popup modal state (for mobile & desktop)
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    dateStr: string;
    dayNum: number;
    bookings: BookedDateInfo[];
  } | null>(null);

  // Fetch all existing quotations to compute booked dates map
  const bookedDatesMap = useMemo(() => {
    const map: Record<string, BookedDateInfo[]> = {};
    const allQuotations = quotationsList && quotationsList.length > 0 ? quotationsList : storage.getQuotations();

    allQuotations.forEach((q) => {
      // Ignore current quotation if editing
      if (currentQuotationId && q.id === currentQuotationId) return;

      (q.events || []).forEach((evt) => {
        if (evt.eventDate) {
          const key = evt.eventDate;
          if (!map[key]) map[key] = [];
          map[key].push({
            dateStr: evt.eventDate,
            clientName: q.client?.name || 'Unnamed Client',
            clientPhone: q.client?.phone || '',
            quotationNumber: q.quotationNumber,
            eventName: evt.name || 'Wedding Event',
            eventTiming: evt.timing,
            eventVenue: evt.venue,
            eventPrice: evt.price,
            packagePrice: q.payment?.grandTotal,
            status: q.status,
            quotationId: q.id,
          });
        }
      });
    });

    return map;
  }, [currentQuotationId, quotationsList]);

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

    if (onSelectEventDate) {
      onSelectEventDate(activeEventIndex, dateStr);
    }

    // Auto update date range string (e.g. 15 Oct - 18 Oct 2026)
    if (onAutoFormatDateRange && events.length > 0) {
      const updatedDates = events.map((e, idx) => (idx === activeEventIndex ? dateStr : e.eventDate)).filter(Boolean) as string[];
      if (updatedDates.length > 0) {
        updatedDates.sort();
        const first = formatDate(updatedDates[0]);
        const last = formatDate(updatedDates[updatedDates.length - 1]);
        const rangeStr = updatedDates.length === 1 ? first : `${first} - ${last}`;
        onAutoFormatDateRange(rangeStr);
      }
    }

    // Open date details popup modal so client details & names are immediately visible on mobile & desktop!
    const dayBookings = bookedDatesMap[dateStr] || [];
    setSelectedDayInfo({
      dateStr,
      dayNum,
      bookings: dayBookings,
    });
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

      {/* Days Legend & Mobile Helper */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-semibold text-slate-600 px-1">
          {events.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-[#0D4F4F] border border-[#D4AF37]" />
              <span>Selected for Active Event</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-800 text-white flex items-center justify-center text-[9px] font-bold">
              🔒
            </div>
            <span className="text-emerald-900 font-bold">Confirmed / Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">
              ✖
            </div>
            <span className="text-red-700 font-bold">Hold / Inquired</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-white border border-slate-300" />
            <span>Available Date</span>
          </div>
        </div>

        {/* Mobile Info Tip */}
        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <Info className="w-3.5 h-3.5 text-[#0D4F4F] shrink-0" />
          <span>Tap any date on mobile to see full client names, phone, WhatsApp &amp; event schedule.</span>
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs">
        {/* Weekday Labels */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="font-bold text-[10px] text-slate-400 uppercase py-1">
            {day}
          </div>
        ))}

        {/* Empty Offset Days */}
        {Array.from({ length: startOffset }).map((_, idx) => (
          <div key={`offset-${idx}`} className="h-14 sm:h-16 bg-slate-50/50 rounded-xl border border-transparent" />
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
            tooltipParts.push(`🔴 Inquired (${unconfirmedList.length}): ${unconfirmedList.map((b) => b.clientName).join(', ')}`);
          }
          if (isSelectedForCurrent) {
            tooltipParts.push(`Selected for ${isSelectedForCurrent.eventName}`);
          }
          const tooltipText = tooltipParts.length > 0 ? tooltipParts.join(' | ') : `Click to view details for ${dateStr}`;

          return (
            <button
              key={`day-${dayNum}`}
              type="button"
              onClick={() => handleDayClick(dayNum)}
              title={tooltipText}
              className={`min-h-[58px] sm:min-h-[68px] rounded-xl border p-1 sm:p-1.5 flex flex-col justify-between items-center transition-all relative overflow-hidden space-y-0.5 cursor-pointer active:scale-95 ${
                isActiveSelected
                  ? 'bg-[#0D4F4F] text-[#D4AF37] border-2 border-[#D4AF37] shadow-md font-bold z-10'
                  : isSelectedForCurrent
                  ? 'bg-blue-900 text-blue-100 border-blue-700 font-semibold'
                  : isConfirmed
                  ? 'bg-emerald-900/90 text-white border-emerald-800 shadow-2xs hover:bg-emerald-800'
                  : isUnconfirmed
                  ? 'bg-red-50 text-red-900 border-red-300 shadow-2xs hover:bg-red-100'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <div className="w-full flex items-center justify-between pl-0.5 pr-0.5">
                <span className="text-[11px] sm:text-xs font-bold block">{dayNum}</span>
                {allDayBookings.length > 1 && (
                  <span className="text-[8px] px-1 py-0.2 rounded-full bg-slate-800/80 text-white font-extrabold sm:hidden">
                    {allDayBookings.length}
                  </span>
                )}
              </div>

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
                    className="w-full bg-emerald-950/90 text-[8px] sm:text-[8.5px] font-extrabold text-emerald-300 py-0.5 px-0.5 rounded truncate uppercase tracking-tighter flex items-center justify-center gap-0.5 border border-emerald-700"
                  >
                    <Lock className="w-2 h-2 text-[#D4AF37] shrink-0" />
                    {/* Desktop shows full name, mobile shows first word/name */}
                    <span className="hidden sm:inline truncate">{b.clientName}</span>
                    <span className="sm:hidden truncate">{b.clientName.split(' ')[0] || b.clientName}</span>
                  </div>
                ))}

                {/* Not Confirmed RED Badges */}
                {unconfirmedList.map((b, bIdx) => (
                  <div
                    key={`unconf-${bIdx}`}
                    className="w-full bg-red-700/90 text-[8px] sm:text-[8.5px] font-extrabold text-red-100 py-0.5 px-0.5 rounded truncate uppercase tracking-tighter flex items-center justify-center gap-0.5 border border-red-600"
                  >
                    <span className="text-[8px] font-bold shrink-0">✖</span>
                    {/* Desktop shows full name, mobile shows first word/name */}
                    <span className="hidden sm:inline truncate">{b.clientName}</span>
                    <span className="sm:hidden truncate">{b.clientName.split(' ')[0] || b.clientName}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Date Details Interactive Popup Modal (for mobile & desktop) */}
      {selectedDayInfo && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedDayInfo(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                    {formatDate(selectedDayInfo.dateStr)}
                  </h3>
                  <p className="text-[11px] text-[#C3DFDF] font-medium">
                    {selectedDayInfo.bookings.length === 0
                      ? 'No wedding events scheduled • Date is Available'
                      : `${selectedDayInfo.bookings.length} Event${selectedDayInfo.bookings.length > 1 ? 's' : ''} on this date`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayInfo(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Bookings List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100">
              {selectedDayInfo.bookings.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Date Completely Available</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    There are no wedding events or inquiries booked on {formatDate(selectedDayInfo.dateStr)}. You can safely take new bookings for this day!
                  </p>
                  {events.length > 0 && onSelectEventDate && (
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectEventDate(activeEventIndex, selectedDayInfo.dateStr);
                          setSelectedDayInfo(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37] hover:bg-[#093A3A] font-bold text-xs transition-colors shadow-sm cursor-pointer"
                      >
                        Set as Date for {events[activeEventIndex]?.name || 'Current Event'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                selectedDayInfo.bookings.map((b, bIdx) => {
                  const isConfirmed = b.status === 'confirmed' || b.status === 'completed';
                  const waUrl = b.clientPhone
                    ? `https://wa.me/${formatWhatsAppPhone(b.clientPhone)}?text=${encodeURIComponent(
                        `Assalam-o-Alaikum ${b.clientName},\nRegarding your wedding event (${b.eventName}) scheduled on ${formatDate(b.dateStr)} (Quotation #${b.quotationNumber}):`
                      )}`
                    : '';

                  return (
                    <div key={bIdx} className="pt-3.5 first:pt-0 space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <Lock className="w-3 h-3 text-emerald-700" /> Confirmed Booking
                            </>
                          ) : (
                            <>
                              <span className="font-bold">✖</span> Hold / Inquired (Not Confirmed)
                            </>
                          )}
                        </span>

                        <Link
                          href={`/quotations/${b.quotationId}`}
                          className="font-mono text-xs font-bold text-[#0D4F4F] hover:text-[#B89228] hover:underline"
                          title="View quotation internally"
                        >
                          #{b.quotationNumber}
                        </Link>
                      </div>

                      {/* Client Name & Quick Contact */}
                      <div className="flex items-start justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {b.clientName || 'Unnamed Client'}
                          </h4>
                          {b.clientPhone && (
                            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {b.clientPhone}
                            </p>
                          )}
                        </div>

                        {b.clientPhone && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#25D366] text-white hover:bg-[#1EBE5D] text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${b.clientPhone}`}
                              className="p-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                              title="Call Client"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Event Details: Event Name, Timing, Venue, Price */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Event</span>
                          <span className="font-bold text-slate-800">{b.eventName}</span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Timing</span>
                          <span className="font-bold text-[#0D4F4F]">
                            {b.eventTiming ? formatEventTiming(b.eventTiming) : 'Standard Event'}
                          </span>
                        </div>

                        {b.eventVenue && (
                          <div className="col-span-2 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Venue</span>
                              <span className="font-semibold text-slate-800">{b.eventVenue}</span>
                            </div>
                          </div>
                        )}

                        {b.packagePrice !== undefined && b.packagePrice > 0 && (
                          <div className="col-span-2 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                            <span className="text-[10px] text-emerald-800 uppercase font-semibold">Total Package Price</span>
                            <span className="font-bold text-emerald-950 font-serif">{formatCurrency(b.packagePrice)}</span>
                          </div>
                        )}
                      </div>

                      {/* View Quotation Full Link */}
                      <div className="pt-1 flex items-center justify-end">
                        <Link
                          href={`/quotations/${b.quotationId}`}
                          className="text-xs font-bold text-[#0D4F4F] hover:text-[#B89228] flex items-center gap-1 hover:underline"
                        >
                          <span>Open Full Quotation Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDayInfo(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
