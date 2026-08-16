'use client';

import React, { useState } from 'react';
import { ClientDetails, EventItem } from '@/lib/types';
import { BookingCalendar } from './booking-calendar';
import { User, Phone, Calendar, Hash, Sparkles } from 'lucide-react';

interface ClientDetailsFormProps {
  client: ClientDetails;
  quotationNumber: string;
  events: EventItem[];
  currentQuotationId?: string;
  onChange: (updated: ClientDetails) => void;
  onQuotationNumberChange: (num: string) => void;
  onEventDateChange: (eventIndex: number, dateStr: string) => void;
}

export function ClientDetailsForm({
  client,
  quotationNumber,
  events,
  currentQuotationId,
  onChange,
  onQuotationNumberChange,
  onEventDateChange,
}: ClientDetailsFormProps) {
  const [showCalendar, setShowCalendar] = useState(true);

  const handleChange = (field: keyof ClientDetails, value: string) => {
    onChange({
      ...client,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4 font-sans text-slate-800">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
          <User className="w-4 h-4 text-[#D4AF37]" />
          Client & Quotation Details
        </h3>

        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="text-xs font-bold text-[#0D4F4F] bg-[#0D4F4F]/10 hover:bg-[#0D4F4F]/20 px-3 py-1 rounded-lg transition-all flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{showCalendar ? 'Hide Booking Calendar' : 'Show Interactive Calendar'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Client Name */}
        <div>
          <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" /> Client Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Hassan & Zara"
            value={client.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none text-sm"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
          </label>
          <input
            type="text"
            placeholder="e.g. 0321-9876543"
            value={client.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none text-sm"
          />
        </div>

        {/* Quotation Number */}
        <div>
          <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-slate-400" /> Quotation #
          </label>
          <input
            type="text"
            value={quotationNumber}
            onChange={(e) => onQuotationNumberChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none text-sm bg-slate-50"
          />
        </div>

        {/* Quotation Date */}
        <div>
          <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Quotation Date
          </label>
          <input
            type="date"
            value={client.quotationDate}
            onChange={(e) => handleChange('quotationDate', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none text-sm"
          />
        </div>

        {/* Event Dates Description */}
        <div className="sm:col-span-2">
          <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Event Date(s) / Schedule
          </label>
          <input
            type="text"
            placeholder="e.g. 15th Oct - 18th Oct 2026 (auto-populated by calendar)"
            value={client.eventDates}
            onChange={(e) => handleChange('eventDates', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none text-sm font-semibold text-[#0D4F4F]"
          />
        </div>
      </div>

      {/* Embedded Interactive Booking Calendar */}
      {showCalendar && (
        <div className="pt-2 border-t border-slate-100">
          <BookingCalendar
            events={events}
            currentQuotationId={currentQuotationId}
            onSelectEventDate={onEventDateChange}
            onAutoFormatDateRange={(rangeText) => handleChange('eventDates', rangeText)}
          />
        </div>
      )}
    </div>
  );
}
