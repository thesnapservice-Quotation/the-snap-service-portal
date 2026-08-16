'use client';

import React from 'react';
import { useQuotations } from '@/hooks/use-quotations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BookingCalendar } from '@/components/quotation/booking-calendar';
import { Calendar as CalendarIcon, Clock, UserCheck, AlertTriangle, Sparkles, Plus, Camera, Video, Plane } from 'lucide-react';

interface BookedEvent {
  quotationId: string;
  quotationNumber: string;
  clientName: string;
  clientPhone: string;
  eventName: string;
  eventDate?: string;
  dayNumber: number;
  guestCount: number;
  price: number;
  status: string;
  photographersCount: number;
  videographersCount: number;
  droneCount: number;
}

export default function MasterCalendarPage() {
  const { quotations } = useQuotations();

  // Aggregate all events across all quotations
  const allEvents: BookedEvent[] = [];
  quotations.forEach((q) => {
    q.events.forEach((evt) => {
      const photo = evt.services.find((s) => s.serviceName.toLowerCase().includes('photo'))?.quantity || 0;
      const video = evt.services.find((s) => s.serviceName.toLowerCase().includes('video'))?.quantity || 0;
      const drone = evt.services.find((s) => s.serviceName.toLowerCase().includes('drone'))?.quantity || 0;

      allEvents.push({
        quotationId: q.id,
        quotationNumber: q.quotationNumber,
        clientName: q.client.name,
        clientPhone: q.client.phone,
        eventName: evt.name,
        eventDate: evt.eventDate,
        dayNumber: evt.dayNumber || 1,
        guestCount: evt.guestCount || 0,
        price: evt.price || 0,
        status: q.status,
        photographersCount: photo,
        videographersCount: video,
        droneCount: drone,
      });
    });
  });

  // Dummy event for calendar component in view mode
  const currentEvents = quotations[0]?.events || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D4F4F] via-[#093A3A] to-[#1B2A4A] text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-[#D4AF37]/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" /> Studio Master Schedule v2.0
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide">
              Master Booking & Crew Schedule
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-xl">
              Track event day bookings, prevent crew availability clashes, and manage team coverage on the interactive calendar.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Total Booked Events</span>
            <span className="font-serif font-bold text-2xl text-[#0D4F4F]">{allEvents.length}</span>
          </div>
          <div className="p-2 bg-[#0D4F4F]/10 rounded-lg text-[#0D4F4F]">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Photographers Assigned</span>
            <span className="font-serif font-bold text-2xl text-slate-900">
              {allEvents.reduce((sum, e) => sum + e.photographersCount, 0)}
            </span>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Videographers Assigned</span>
            <span className="font-serif font-bold text-2xl text-slate-900">
              {allEvents.reduce((sum, e) => sum + e.videographersCount, 0)}
            </span>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Drone Operators Required</span>
            <span className="font-serif font-bold text-2xl text-slate-900">
              {allEvents.reduce((sum, e) => sum + e.droneCount, 0)}
            </span>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <Plane className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Visual Month Calendar Grid */}
      <BookingCalendar
        events={currentEvents}
        onSelectEventDate={() => {}}
      />

      {/* Booked Events Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="font-serif font-bold text-base text-[#0D4F4F] border-b pb-3 flex items-center justify-between">
          <span>Upcoming Scheduled Wedding Events</span>
          <span className="text-xs text-slate-400 font-sans font-normal">Auto-synchronized with quotations</span>
        </h2>

        {allEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No events scheduled yet. Create a quotation to populate your studio master schedule.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allEvents.map((evt, idx) => (
              <div
                key={`${evt.quotationId}-${idx}`}
                className="bg-white rounded-2xl border-2 border-[#E5E0D5] p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-xs text-[#0D4F4F] uppercase tracking-wider bg-[#0D4F4F]/10 px-2.5 py-1 rounded-lg">
                    Day {evt.dayNumber}: {evt.eventName}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    evt.status === 'confirmed' || evt.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : evt.status === 'not_confirmed'
                      ? 'bg-red-100 text-red-800 border-red-300 font-extrabold'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {evt.status === 'not_confirmed' ? 'Not Confirmed' : evt.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">{evt.clientName}</h3>
                  <p className="text-xs text-slate-500 font-mono">{evt.clientPhone}</p>
                  <p className="text-[11px] text-slate-400">
                    Quotation No. #{evt.quotationNumber}
                    {evt.eventDate && <span className="font-bold text-[#0D4F4F] block">Date: {formatDate(evt.eventDate)}</span>}
                  </p>
                </div>

                {/* Service Requirement Chips */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px] font-bold">
                  {evt.photographersCount > 0 && (
                    <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      📷 {evt.photographersCount} Photographer(s)
                    </span>
                  )}
                  {evt.videographersCount > 0 && (
                    <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      🎥 {evt.videographersCount} Videographer(s)
                    </span>
                  )}
                  {evt.droneCount > 0 && (
                    <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      ✈️ {evt.droneCount} Drone Operator
                    </span>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t">
                  <span className="text-slate-500 font-medium">Guest Count: {evt.guestCount}</span>
                  <span className="font-bold text-[#0D4F4F]">{formatCurrency(evt.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
