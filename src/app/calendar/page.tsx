'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuotations } from '@/hooks/use-quotations';
import { useSettings } from '@/hooks/use-settings';
import { formatCurrency, formatDate, formatEventTiming } from '@/lib/utils';
import { BookingCalendar } from '@/components/quotation/booking-calendar';
import { SendCrewWhatsAppModal, CrewMemberDetail } from '@/components/quotation/send-crew-whatsapp-modal';
import { Quotation, EventItem } from '@/lib/types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  Camera, 
  Video, 
  Plane,
  Search,
  Filter,
  MessageSquare,
  Phone,
  ExternalLink,
  Users,
  CheckCircle2,
  ChevronDown,
  Edit,
  ArrowRight,
  X,
  MapPin,
  Maximize2
} from 'lucide-react';

export default function MasterCalendarPage() {
  const { quotations } = useQuotations();
  const { settings } = useSettings();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Wedding Event Details Popup Modal State
  const [selectedWeddingModalQuotation, setSelectedWeddingModalQuotation] = useState<Quotation | null>(null);

  // Crew WhatsApp Modal State
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [selectedCrewMember, setSelectedCrewMember] = useState<CrewMemberDetail | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);

  // Aggregate stats across all quotations
  const totalEventsCount = useMemo(() => {
    return quotations.reduce((sum, q) => sum + (q.events?.length || 0), 0);
  }, [quotations]);

  const totalPhotographers = useMemo(() => {
    return quotations.reduce((sum, q) => {
      return sum + q.events.reduce((eSum, evt) => {
        const pQty = evt.services.find((s) => s.serviceName.toLowerCase().includes('photo'))?.quantity || 0;
        return eSum + pQty;
      }, 0);
    }, 0);
  }, [quotations]);

  const totalVideographers = useMemo(() => {
    return quotations.reduce((sum, q) => {
      return sum + q.events.reduce((eSum, evt) => {
        const vQty = evt.services.find((s) => s.serviceName.toLowerCase().includes('video'))?.quantity || 0;
        return eSum + vQty;
      }, 0);
    }, 0);
  }, [quotations]);

  const totalDrones = useMemo(() => {
    return quotations.reduce((sum, q) => {
      return sum + q.events.reduce((eSum, evt) => {
        const dQty = evt.services.find((s) => s.serviceName.toLowerCase().includes('drone'))?.quantity || 0;
        return eSum + dQty;
      }, 0);
    }, 0);
  }, [quotations]);

  // Compute big wedding date range string for a quotation
  const getWeddingDateRange = (events: EventItem[]): string => {
    const dates = events
      .map((e) => e.eventDate)
      .filter((d): d is string => Boolean(d && d.trim().length > 0))
      .sort();

    if (dates.length === 0) return 'Dates Pending / TBD';
    if (dates.length === 1) return formatDate(dates[0]);

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    if (firstDate === lastDate) return formatDate(firstDate);
    return `${formatDate(firstDate)} — ${formatDate(lastDate)}`;
  };

  // Filter & Search Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) {
        return false;
      }

      if (!search.trim()) return true;
      const query = search.toLowerCase();

      // Search in client name, phone, quotation number
      if (
        q.client.name.toLowerCase().includes(query) ||
        q.client.phone.toLowerCase().includes(query) ||
        q.quotationNumber.toLowerCase().includes(query)
      ) {
        return true;
      }

      // Search in event names
      if (q.events.some((e) => e.name.toLowerCase().includes(query))) {
        return true;
      }

      // Search in assigned crew member names
      const hasMatchingCrew = q.events.some((e) =>
        e.services.some((s) =>
          s.crewBreakdown?.some((c) => c.name.toLowerCase().includes(query))
        )
      );
      if (hasMatchingCrew) return true;

      return false;
    });
  }, [quotations, search, statusFilter]);

  // Helper to open Crew WhatsApp Dialog
  const handleOpenCrewModal = (
    q: Quotation,
    crewMember: CrewMemberDetail,
    eventId?: string
  ) => {
    setSelectedQuotation(q);
    setSelectedCrewMember(crewMember);
    setSelectedEventId(eventId);
    setIsCrewModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D4F4F] via-[#093A3A] to-[#1B2A4A] text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-[#D4AF37]/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" /> Studio Master Schedule v2.0
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide">
              Master Booking &amp; Team Schedule
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-xl">
              Unified wedding schedules, assigned shooting team, and 1-click WhatsApp event briefing for photographers and videographers.
            </p>
          </div>

          <Link
            href="/quotations/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-md hover:brightness-110 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Booking</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Booked Weddings</span>
            <span className="font-serif font-bold text-2xl text-[#0D4F4F]">{quotations.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{totalEventsCount} Total Events</span>
          </div>
          <div className="p-2.5 bg-[#0D4F4F]/10 rounded-xl text-[#0D4F4F]">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Photographer Shifts</span>
            <span className="font-serif font-bold text-2xl text-slate-900">{totalPhotographers}</span>
            <span className="text-[10px] text-blue-600 block mt-0.5 font-semibold">Assigned &amp; Required</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Videographer Shifts</span>
            <span className="font-serif font-bold text-2xl text-slate-900">{totalVideographers}</span>
            <span className="text-[10px] text-purple-600 block mt-0.5 font-semibold">Cinema Cameras</span>
          </div>
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 block font-medium">Drone Aerial Slots</span>
            <span className="font-serif font-bold text-2xl text-slate-900">{totalDrones}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5 font-semibold">4K Aerial Pilots</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Plane className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive Visual Month Calendar Grid */}
      <BookingCalendar
        events={quotations[0]?.events || []}
        onSelectEventDate={() => {}}
      />

      {/* UNIFIED CLIENT WEDDING EVENTS & TEAM SCHEDULE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#0D4F4F] flex items-center gap-2">
              <span>Upcoming Scheduled Wedding Events</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] text-xs font-sans font-bold">
                {filteredQuotations.length} Weddings
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-day wedding events compiled per client with direct team WhatsApp briefing.
            </p>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Client, Phone, or Team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              >
                <option value="all">All Statuses ({quotations.length})</option>
                <option value="confirmed">Confirmed</option>
                <option value="sent">Sent</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="not_confirmed">Not Confirmed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Unified Wedding Cards Grid */}
        {filteredQuotations.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-bold text-sm">No scheduled weddings found</p>
            <p className="text-slate-400 text-xs">Try adjusting your search filter or create a new quotation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuotations.map((q) => {
              const dateRangeStr = getWeddingDateRange(q.events);
              const isConfirmed = q.status === 'confirmed' || q.status === 'completed';

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedWeddingModalQuotation(q)}
                  className="bg-white rounded-2xl border-2 border-[#E5E0D5] hover:border-[#D4AF37] transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between cursor-pointer group"
                >
                  {/* Card Header: Large Bold Date Header + Status */}
                  <div className="bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-white p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold shrink-0">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-serif font-bold text-base text-[#FAF9F6] block tracking-wide">
                          {dateRangeStr}
                        </span>
                        <span className="text-[10px] text-[#C3DFDF] uppercase tracking-widest font-semibold block">
                          {q.events.length} Event Day{q.events.length > 1 ? 's' : ''} Scheduled
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                          isConfirmed
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                            : q.status === 'not_confirmed'
                            ? 'bg-red-500 text-white border-red-400'
                            : 'bg-[#D4AF37] text-[#0D4F4F] border-white/40'
                        }`}
                      >
                        {q.status === 'not_confirmed' ? 'Not Confirmed' : q.status}
                      </span>
                    </div>
                  </div>

                  {/* Client & Booking Summary Info */}
                  <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-[#0D4F4F] transition-colors">{q.client.name}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono font-bold text-[11px]">
                          #{q.quotationNumber}
                        </span>
                      </div>
                      <p className="text-slate-500 font-mono text-xs mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{q.client.phone}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Package Price
                      </span>
                      <span className="font-serif font-bold text-base text-[#0D4F4F]">
                        {formatCurrency(q.payment?.grandTotal || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Card Compact Content */}
                  <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                    {/* Event Days Badges (Compact) */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Scheduled Event Days ({q.events.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {q.events.map((evt, idx) => (
                          <span
                            key={evt.id || idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex-wrap"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D4F4F]"></span>
                            <span className="font-bold text-[#0D4F4F]">{evt.name}</span>
                            {evt.eventDate && (
                              <span className="text-slate-500 text-[11px]">({formatDate(evt.eventDate)})</span>
                            )}
                            {evt.venue && (
                              <span className="text-[#0D4F4F] font-semibold text-[10.5px] bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-[#D4AF37]" /> {evt.venue}
                              </span>
                            )}
                            {evt.timing && (
                              <span className="text-amber-800 font-semibold text-[10.5px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-amber-600" /> {formatEventTiming(evt.timing)}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Assigned Shooting Team (Compact) */}
                    {(() => {
                      const uniqueCrewMap = new Map<string, { name: string; role: string }>();
                      
                      q.events.forEach((evt) => {
                        evt.services.forEach((srv) => {
                          const srvRole = srv.serviceName.toLowerCase().includes('drone')
                            ? 'Drone'
                            : srv.serviceName.toLowerCase().includes('video')
                            ? 'Video'
                            : 'Photo';

                          (srv.crewBreakdown || []).slice(0, srv.quantity || 1).forEach((c) => {
                            const cleanName = c.name?.trim();
                            if (
                              cleanName &&
                              !cleanName.toLowerCase().startsWith('photographer #') &&
                              !cleanName.toLowerCase().startsWith('videographer #') &&
                              !cleanName.toLowerCase().startsWith('drone #')
                            ) {
                              if (!uniqueCrewMap.has(cleanName)) {
                                uniqueCrewMap.set(cleanName, {
                                  name: cleanName,
                                  role: c.role || srvRole,
                                });
                              }
                            }
                          });
                        });
                      });

                      const uniqueCrewList = Array.from(uniqueCrewMap.values());

                      return (
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Assigned Shooting Team
                          </span>
                          {uniqueCrewList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {uniqueCrewList.map((crew, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D4F4F]/10 border border-[#0D4F4F]/20 text-[#0D4F4F] text-xs font-bold"
                                >
                                  <div className="w-4 h-4 rounded-full bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center font-bold text-[9px]">
                                    {crew.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{crew.name}</span>
                                  <span className="text-[10px] text-slate-500 font-medium font-mono">({crew.role})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block font-medium">
                              ⚠️ Team not assigned yet
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Card Bottom: Simple Click Hint & Quick Actions */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] font-bold text-[#0D4F4F] group-hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                      <span>Click box for full details &amp; WhatsApp brief</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/quotations/${q.id}/compare`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-lg bg-[#D4AF37] text-[#0D4F4F] font-bold hover:brightness-110 transition-all text-[11px] shadow-2xs"
                      >
                        Edit Team
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* WEDDING EVENT DETAILS & CREW OPERATIONS POPUP MODAL  */}
      {/* ---------------------------------------------------- */}
      {selectedWeddingModalQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0D4F4F] text-white p-5 flex items-center justify-between border-b border-[#156060]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold shadow-xs">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-white">
                      {selectedWeddingModalQuotation.client.name}&apos;s Wedding Event Details
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs uppercase tracking-wider">
                      #{selectedWeddingModalQuotation.quotationNumber}
                    </span>
                  </div>
                  <p className="text-xs text-[#C3DFDF] mt-0.5">
                    {getWeddingDateRange(selectedWeddingModalQuotation.events)} • {selectedWeddingModalQuotation.events.length} Event Days
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWeddingModalQuotation(null)}
                className="p-2 rounded-xl text-[#C3DFDF] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Client & Booking Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Client Contact</span>
                  <div className="font-bold text-sm text-slate-900">{selectedWeddingModalQuotation.client.name}</div>
                  <div className="flex items-center gap-2 text-slate-600 font-mono text-xs">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedWeddingModalQuotation.client.phone}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Package Value</span>
                  <div className="font-serif font-bold text-lg text-[#0D4F4F]">
                    {formatCurrency(selectedWeddingModalQuotation.payment?.grandTotal || 0)}
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      selectedWeddingModalQuotation.status === 'confirmed' || selectedWeddingModalQuotation.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : selectedWeddingModalQuotation.status === 'not_confirmed'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-[#D4AF37]/20 text-[#0D4F4F] border-[#D4AF37]/40'
                    }`}
                  >
                    {selectedWeddingModalQuotation.status}
                  </span>
                </div>
              </div>

              {/* Overall Assigned Wedding Team */}
              {(() => {
                const uniqueCrewMap = new Map<string, { name: string; phone?: string; role: string; eventsCount: number }>();
                
                selectedWeddingModalQuotation.events.forEach((evt) => {
                  evt.services.forEach((srv) => {
                    const srvRole = srv.serviceName.toLowerCase().includes('drone')
                      ? 'Drone Pilot'
                      : srv.serviceName.toLowerCase().includes('video')
                      ? 'Cinematographer'
                      : 'Photographer';

                    (srv.crewBreakdown || []).slice(0, srv.quantity || 1).forEach((c) => {
                      const cleanName = c.name?.trim();
                      if (
                        cleanName &&
                        !cleanName.toLowerCase().startsWith('photographer #') &&
                        !cleanName.toLowerCase().startsWith('videographer #') &&
                        !cleanName.toLowerCase().startsWith('drone #')
                      ) {
                        const existing = uniqueCrewMap.get(cleanName);
                        if (existing) {
                          existing.eventsCount += 1;
                          if (c.phone && !existing.phone) existing.phone = c.phone;
                        } else {
                          uniqueCrewMap.set(cleanName, {
                            name: cleanName,
                            phone: c.phone,
                            role: c.role || srvRole,
                            eventsCount: 1,
                          });
                        }
                      }
                    });
                  });
                });

                const uniqueCrewList = Array.from(uniqueCrewMap.values());

                if (uniqueCrewList.length === 0) return null;

                return (
                  <div className="p-4 bg-gradient-to-r from-[#0D4F4F]/10 via-[#0D4F4F]/5 to-[#D4AF37]/10 rounded-2xl border border-[#0D4F4F]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0D4F4F] flex items-center gap-2 text-xs uppercase tracking-wider">
                        <Users className="w-4 h-4 text-[#D4AF37]" /> Assigned Wedding Shooting Team ({uniqueCrewList.length} Members)
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Send Multi-Day Schedule</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {uniqueCrewList.map((crew, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-xs"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0">
                              {crew.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <span className="font-bold text-slate-900 block text-xs truncate">{crew.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {crew.role} • {crew.eventsCount} {crew.eventsCount === 1 ? 'day' : 'days'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenCrewModal(
                                selectedWeddingModalQuotation,
                                {
                                  name: crew.name,
                                  phone: crew.phone,
                                  role: crew.role,
                                }
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>All Days Brief</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Day-by-Day Detailed Event Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-serif font-bold text-sm text-[#0D4F4F] uppercase tracking-wider">
                    Full Day-by-Day Event Breakdown &amp; Team
                  </h4>
                  <Link
                    href={`/quotations/${selectedWeddingModalQuotation.id}/compare`}
                    className="text-[#D4AF37] font-bold text-xs hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Team Assignment
                  </Link>
                </div>

                <div className="space-y-4">
                  {selectedWeddingModalQuotation.events.map((evt, idx) => {
                    const photoService = evt.services.find((s) =>
                      s.serviceName.toLowerCase().includes('photo')
                    );
                    const videoService = evt.services.find((s) =>
                      s.serviceName.toLowerCase().includes('video')
                    );
                    const droneService = evt.services.find((s) =>
                      s.serviceName.toLowerCase().includes('drone')
                    );

                    return (
                      <div
                        key={evt.id || idx}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm hover:border-[#0D4F4F]/40 transition-colors"
                      >
                        {/* Event Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-serif font-bold text-base text-[#0D4F4F]">{evt.name}</h5>
                                {evt.venue && (
                                  <span className="px-2 py-0.5 rounded-md bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold text-xs flex items-center gap-1 border border-[#0D4F4F]/20">
                                    <MapPin className="w-3 h-3 text-[#D4AF37]" /> {evt.venue}
                                  </span>
                                )}
                                {evt.timing && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-600" /> {formatEventTiming(evt.timing)}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-medium block mt-0.5">
                                {evt.eventDate ? formatDate(evt.eventDate) : 'Date TBD'} • {evt.guestCount ? `${evt.guestCount} Guests` : 'Event Day'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Selling Price</span>
                            <span className="font-serif font-bold text-sm text-slate-900">{formatCurrency(evt.price)}</span>
                          </div>
                        </div>

                        {/* Venue & Timing if set */}
                        {(evt.venue || evt.timing || evt.mapLink) && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-700">
                            {evt.timing && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[#0D4F4F]" />
                                <span className="font-semibold">{formatEventTiming(evt.timing)}</span>
                              </div>
                            )}
                            {evt.venue && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#0D4F4F]" />
                                <span>{evt.venue}</span>
                              </div>
                            )}
                            {evt.mapLink && (
                              <a
                                href={evt.mapLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" /> Map Location
                              </a>
                            )}
                          </div>
                        )}

                        {/* Shooting Crew Rows */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Photographers */}
                          {photoService && (
                            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
                              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-blue-600" /> Photographers ({photoService.quantity || 1})
                              </span>
                              <div className="space-y-1.5">
                                {(photoService.crewBreakdown || []).slice(0, photoService.quantity || 1).map((crew, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-2xs"
                                  >
                                    <div>
                                      <span className="font-bold text-xs text-slate-900 block truncate">
                                        {crew.name || `Photographer #${cIdx + 1}`}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono block">
                                        {crew.phone || 'No phone'}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenCrewModal(
                                          selectedWeddingModalQuotation,
                                          {
                                            name: crew.name,
                                            phone: crew.phone,
                                            role: 'Lead Photographer',
                                          },
                                          evt.id
                                        )
                                      }
                                      className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                      title="Send WhatsApp Brief"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span>Brief</span>
                                    </button>
                                  </div>
                                ))}
                                {(!photoService.crewBreakdown || photoService.crewBreakdown.length === 0) && (
                                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Videographers */}
                          {videoService && (
                            <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-xs space-y-2">
                              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-purple-600" /> Videographers ({videoService.quantity || 1})
                              </span>
                              <div className="space-y-1.5">
                                {(videoService.crewBreakdown || []).slice(0, videoService.quantity || 1).map((crew, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-purple-100 shadow-2xs"
                                  >
                                    <div>
                                      <span className="font-bold text-xs text-slate-900 block truncate">
                                        {crew.name || `Videographer #${cIdx + 1}`}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono block">
                                        {crew.phone || 'No phone'}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenCrewModal(
                                          selectedWeddingModalQuotation,
                                          {
                                            name: crew.name,
                                            phone: crew.phone,
                                            role: 'Cinematographer',
                                          },
                                          evt.id
                                        )
                                      }
                                      className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                      title="Send WhatsApp Brief"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span>Brief</span>
                                    </button>
                                  </div>
                                ))}
                                {(!videoService.crewBreakdown || videoService.crewBreakdown.length === 0) && (
                                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Drone Pilots */}
                          {droneService && (
                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2 sm:col-span-2">
                              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Plane className="w-3.5 h-3.5 text-amber-600" /> Drone Operators ({droneService.quantity || 1})
                              </span>
                              <div className="space-y-1.5">
                                {(droneService.crewBreakdown || []).slice(0, droneService.quantity || 1).map((crew, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-amber-100 shadow-2xs"
                                  >
                                    <div>
                                      <span className="font-bold text-xs text-slate-900 block truncate">
                                        {crew.name || `Drone Pilot #${cIdx + 1}`}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono block">
                                        {crew.phone || 'No phone'}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenCrewModal(
                                          selectedWeddingModalQuotation,
                                          {
                                            name: crew.name,
                                            phone: crew.phone,
                                            role: 'Drone Pilot',
                                          },
                                          evt.id
                                        )
                                      }
                                      className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                      title="Send WhatsApp Brief"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span>Brief</span>
                                    </button>
                                  </div>
                                ))}
                                {(!droneService.crewBreakdown || droneService.crewBreakdown.length === 0) && (
                                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedWeddingModalQuotation(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close Window
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/quotations/${selectedWeddingModalQuotation.id}`}
                  className="px-4 py-2 rounded-xl border border-[#0D4F4F] text-[#0D4F4F] font-bold text-xs hover:bg-[#0D4F4F]/10 transition-colors"
                >
                  View Quotation
                </Link>
                <Link
                  href={`/quotations/${selectedWeddingModalQuotation.id}/compare`}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs shadow-md hover:brightness-110 transition-all"
                >
                  Edit Team &amp; Profit
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crew WhatsApp Briefing Modal */}
      <SendCrewWhatsAppModal
        isOpen={isCrewModalOpen}
        onClose={() => setIsCrewModalOpen(false)}
        quotation={selectedQuotation}
        crewMember={selectedCrewMember}
        initialEventId={selectedEventId}
      />
    </div>
  );
}

