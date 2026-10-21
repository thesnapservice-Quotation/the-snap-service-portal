'use client';

import React, { useState, useMemo } from 'react';
import { useQuotations } from '@/hooks/use-quotations';
import { storage } from '@/lib/storage';
import { Quotation, DeliverableStatus, AlbumDeliverableStatus, VideoDeliverableStatus } from '@/lib/types';
import { formatDate, formatWhatsAppPhone, sortDeliverableQuotations, getQuotationEarliestEventDate } from '@/lib/utils';
import { Sparkles, CheckCircle2, Film, BookOpen, Clock, AlertTriangle, Calendar, Search, X, MessageCircle } from 'lucide-react';

/**
 * Compute 15-day delivery deadline starting strictly from the LAST event day
 */
function getDeliveryDeadline(quotation: Quotation) {
  const eventDatesList: string[] = [];
  (quotation.events || []).forEach((evt) => {
    if (evt.eventDate) eventDatesList.push(evt.eventDate);
  });

  let lastEventDate = new Date();

  if (eventDatesList.length > 0) {
    eventDatesList.sort();
    const latestStr = eventDatesList[eventDatesList.length - 1];
    const parsed = new Date(latestStr);
    if (!isNaN(parsed.getTime())) lastEventDate = parsed;
  } else if (quotation.client?.eventDates) {
    const matches = quotation.client.eventDates.match(/\d{4}-\d{2}-\d{2}/g);
    if (matches && matches.length > 0) {
      matches.sort();
      lastEventDate = new Date(matches[matches.length - 1]);
    } else {
      const parsed = new Date(quotation.client.eventDates);
      if (!isNaN(parsed.getTime())) lastEventDate = parsed;
    }
  } else if (quotation.client?.quotationDate) {
    const parsed = new Date(quotation.client.quotationDate);
    if (!isNaN(parsed.getTime())) lastEventDate = parsed;
  }

  // Add 15 days starting from the LAST event date
  const deadline = new Date(lastEventDate);
  deadline.setDate(deadline.getDate() + 15);

  const today = new Date();
  const dStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dEnd = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

  const diffMs = dEnd.getTime() - dStart.getTime();
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return {
    lastEventFormatted: lastEventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    deadlineFormatted: deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    daysLeft,
    isOverdue: daysLeft < 0,
  };
}

const ALBUM_PROCESS_STEPS: { id: AlbumDeliverableStatus; label: string; stage: number }[] = [
  { id: 'raw_delivery_pending', label: 'Raw Images Delivery to Client', stage: 1 },
  { id: 'raw_delivered', label: 'Raw Images Delivered to Client', stage: 2 },
  { id: 'photo_selection', label: 'Photo Selection', stage: 3 },
  { id: 'album_designing', label: 'Album Designing', stage: 4 },
  { id: 'client_review', label: 'Client Review', stage: 5 },
  { id: 'revisions', label: 'Revisions', stage: 6 },
  { id: 'final_approval', label: 'Final Approval', stage: 7 },
  { id: 'printing_completed', label: 'Printing Completed', stage: 8 },
  { id: 'delivered', label: 'Delivered', stage: 9 },
];

const VIDEO_PROCESS_STEPS: { id: VideoDeliverableStatus; label: string; stage: number }[] = [
  { id: 'editing_in_progress', label: 'Editing in Progress', stage: 1 },
  { id: 'video_edited', label: 'Video Edited', stage: 2 },
  { id: 'client_review', label: 'Client Review', stage: 3 },
  { id: 'revisions', label: 'Revisions', stage: 4 },
  { id: 'final_changes', label: 'Final Changes', stage: 5 },
  { id: 'final_export', label: 'Final Export', stage: 6 },
  { id: 'delivered', label: 'Delivered', stage: 7 },
];

function normalizeAlbumStatus(status?: string): AlbumDeliverableStatus {
  if (!status || status === 'design') return 'raw_delivery_pending';
  if (status === 'printing') return 'printing_completed';
  return status as AlbumDeliverableStatus;
}

function normalizeVideoStatus(status?: string): VideoDeliverableStatus {
  if (!status || status === 'not_started' || status === 'in_progress') return 'editing_in_progress';
  if (status === 'music_selection' || status === 'music_changes') return 'video_edited';
  return status as VideoDeliverableStatus;
}

function getDeliverableWhatsAppUrl(
  q: Quotation,
  albumLabel: string,
  videoLabel: string,
  deadlineFormatted: string
): string {
  const phone = formatWhatsAppPhone(q.client?.phone || '');
  const clientName = q.client?.name || 'Valued Client';
  const qNum = q.quotationNumber || 'SS-2026';

  const message = `*THE SNAP SERVICE*
Deliverables & Post-Production Update

Assalam-o-Alaikum *${clientName}*,
Here is the latest progress update on your event deliverables (Ref: #${qNum}):

*Album Process:* ${albumLabel}
*Video Editing:* ${videoLabel}

*Estimated Delivery Deadline:* ${deadlineFormatted}

If you have any feedback or questions, please feel free to reach out to us.

Thank you for choosing The Snap Service.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function DeliverablesPage() {
  const { quotations, loading, saveQuotation } = useQuotations();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [localDeliverableStatus, setLocalDeliverableStatus] = useState<Record<string, DeliverableStatus>>({});

  // Strictly filter only quotations whose events are confirmed or completed, sorted strictly EVENT-WISE (earliest event first)
  const confirmedQuotations = useMemo(() => {
    const list = quotations.filter((q) => q.status === 'confirmed' || q.status === 'completed');
    return sortDeliverableQuotations(list);
  }, [quotations]);

  const updateDeliverableStatus = async (
    quotation: Quotation,
    field: keyof DeliverableStatus,
    val: string
  ) => {
    const existingDeliverable = localDeliverableStatus[quotation.id] || quotation.deliverableStatus;
    const currentAlbum = normalizeAlbumStatus(existingDeliverable?.albumStatus || (quotation.status === 'completed' ? 'delivered' : undefined));
    const currentVideo = normalizeVideoStatus(existingDeliverable?.videoStatus || (quotation.status === 'completed' ? 'delivered' : undefined));

    const currentStatus: DeliverableStatus = {
      albumStatus: currentAlbum,
      videoStatus: currentVideo,
    };

    const newDeliverableStatus: DeliverableStatus = {
      ...currentStatus,
      [field]: val as any,
    };

    // Immediate optimistic state update in React
    setLocalDeliverableStatus((prev) => ({
      ...prev,
      [quotation.id]: newDeliverableStatus,
    }));

    // If BOTH Albums & Video Editing are delivered -> mark as 'completed' (Delivered)
    // If NOT both delivered -> revert from 'completed' back to 'confirmed'
    const bothDelivered = newDeliverableStatus.albumStatus === 'delivered' && newDeliverableStatus.videoStatus === 'delivered';
    
    let nextQuotationStatus = quotation.status;
    if (bothDelivered) {
      nextQuotationStatus = 'completed';
    } else if (quotation.status === 'completed') {
      nextQuotationStatus = 'confirmed';
    }

    const updatedQuotation: Quotation = {
      ...quotation,
      deliverableStatus: newDeliverableStatus,
      status: nextQuotationStatus,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveQuotation(updatedQuotation);
    } catch (e) {
      console.error('Error saving deliverable status:', e);
    }
  };

  const filteredQuotations = useMemo(() => {
    return confirmedQuotations.filter((q) => {
      // Search filter
      const search = searchQuery.toLowerCase().trim();
      const matchSearch =
        !search ||
        (q.client?.name || '').toLowerCase().includes(search) ||
        (q.client?.phone || '').toLowerCase().includes(search) ||
        (q.quotationNumber || '').toLowerCase().includes(search);

      if (!matchSearch) return false;

      if (filter === 'all') return true;
      if (filter === 'pending') return q.status !== 'completed';
      return q.status === 'completed';
    });
  }, [confirmedQuotations, filter, searchQuery]);

  const pendingCount = useMemo(() => {
    return confirmedQuotations.filter((q) => q.status !== 'completed').length;
  }, [confirmedQuotations]);

  const completedCount = useMemo(() => {
    return confirmedQuotations.filter((q) => q.status === 'completed').length;
  }, [confirmedQuotations]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D4F4F] via-[#093A3A] to-[#1B2A4A] text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-[#D4AF37]/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" /> Deliverables & Printing Hub v2.0
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide">
              Deliverables &amp; Album Printing Tracker
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-xl">
              Track Album printing and Video Editing handover for confirmed event clients. Automatic 15-day delivery deadlines calculated post-event.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="overflow-x-auto no-scrollbar max-w-full flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 whitespace-nowrap transition-all ${
                filter === 'all' ? 'bg-[#D4AF37] text-[#0D4F4F]' : 'text-white hover:bg-white/10'
              }`}
            >
              All Confirmed ({confirmedQuotations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 whitespace-nowrap transition-all ${
                filter === 'pending' ? 'bg-[#D4AF37] text-[#0D4F4F]' : 'text-white hover:bg-white/10'
              }`}
            >
              In Progress ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 whitespace-nowrap transition-all ${
                filter === 'completed' ? 'bg-[#D4AF37] text-[#0D4F4F]' : 'text-white hover:bg-white/10'
              }`}
            >
              Completed / Delivered ({completedCount})
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3 relative z-10">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-[#C3DFDF] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search confirmed client name, quotation #, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-[#C3DFDF]/70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#C3DFDF] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-[#C3DFDF] hidden sm:inline-block font-medium">
            Showing {filteredQuotations.length} of {confirmedQuotations.length} confirmed bookings
          </span>
        </div>
      </div>

      {/* Deliverables List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-2">
            <div className="inline-block w-5 h-5 border-2 border-[#0D4F4F] border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading confirmed event deliverables...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center text-slate-400 text-xs">
            {confirmedQuotations.length === 0
              ? 'No confirmed event bookings found yet. Once an event is confirmed in Quotations, it will appear here automatically.'
              : 'No confirmed event clients match your search or filter.'}
          </div>
        ) : (
          filteredQuotations.map((q) => {
            const deliverable = localDeliverableStatus[q.id] || q.deliverableStatus;
            const rawAlbum = deliverable?.albumStatus;
            const rawVideo = deliverable?.videoStatus;
            
            const albumStatus = normalizeAlbumStatus(
              rawAlbum || (q.status === 'completed' ? 'delivered' : undefined)
            );
            const videoStatus = normalizeVideoStatus(
              rawVideo || (q.status === 'completed' ? 'delivered' : undefined)
            );

            const isQuotationCompleted = albumStatus === 'delivered' && videoStatus === 'delivered';

            const albumStep = ALBUM_PROCESS_STEPS.find((s) => s.id === albumStatus) || ALBUM_PROCESS_STEPS[0];
            const videoStep = VIDEO_PROCESS_STEPS.find((s) => s.id === videoStatus) || VIDEO_PROCESS_STEPS[0];

            const albumProgressPercent = Math.round((albumStep.stage / ALBUM_PROCESS_STEPS.length) * 100);
            const videoProgressPercent = Math.round((videoStep.stage / VIDEO_PROCESS_STEPS.length) * 100);

            const deadline = getDeliveryDeadline(q);

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border-2 border-[#E5E0D5] p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                {/* Header & Client Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h3 className="font-bold text-base text-[#0D4F4F] flex items-center gap-2">
                      {q.client.name}
                      <span className="text-xs font-mono font-normal text-slate-500">
                        (#{q.quotationNumber})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Phone: {q.client.phone} • Event Dates: {q.client.eventDates || 'As Discussed'}
                    </p>
                  </div>

                  {/* 15-Day Delivery Deadline Badge (Calculated from Last Event Date) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      isQuotationCompleted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : deadline.isOverdue
                        ? 'bg-red-50 text-red-800 border-red-300 animate-pulse'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Deadline: {deadline.deadlineFormatted}
                        {!isQuotationCompleted && (
                          <span className="font-mono text-[11px] ml-1">
                            ({deadline.isOverdue ? `${Math.abs(deadline.daysLeft)} Days OVERDUE!` : `${deadline.daysLeft} Days Left`})
                          </span>
                        )}
                      </span>
                    </div>

                    <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border shrink-0 whitespace-nowrap ${
                      q.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : q.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {q.status === 'completed' ? 'Completed / Delivered' : q.status}
                    </span>

                    {/* WhatsApp Update Button */}
                    <a
                      href={getDeliverableWhatsAppUrl(q, albumStep.label, videoStep.label, deadline.deadlineFormatted)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-md transition-all shrink-0 whitespace-nowrap cursor-pointer"
                      title="Send Deliverable Update on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Update</span>
                    </a>
                  </div>
                </div>

                {/* Grid of 2 Core Deliverable Cards: Album Process & Video Editing Process */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* 1. 📸 Album Process (9 Stages) */}
                  <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                    albumStatus === 'delivered' 
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#0D4F4F]" />
                        <span>📸 Album Process</span>
                      </span>
                      {albumStatus === 'delivered' ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#0D4F4F] bg-[#0D4F4F]/10 px-2 py-0.5 rounded-md">
                          Stage {albumStep.stage} of {ALBUM_PROCESS_STEPS.length}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          albumStatus === 'delivered' ? 'bg-emerald-600' : 'bg-gradient-to-r from-[#0D4F4F] to-[#D4AF37]'
                        }`}
                        style={{ width: `${albumProgressPercent}%` }}
                      />
                    </div>

                    {/* Select Dropdown */}
                    <select
                      value={albumStatus}
                      onChange={(e) => updateDeliverableStatus(q, 'albumStatus', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#0D4F4F] transition-all cursor-pointer ${
                        albumStatus === 'delivered'
                          ? 'border-emerald-300 text-emerald-800 bg-emerald-50/40'
                          : 'border-slate-300 text-[#0D4F4F]'
                      }`}
                    >
                      {ALBUM_PROCESS_STEPS.map((step) => (
                        <option key={step.id} value={step.id}>
                          {step.stage}. {step.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. 🎬 Video Editing Process (8 Stages) */}
                  <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                    videoStatus === 'delivered' 
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-[#0D4F4F]" />
                        <span>🎬 Video Editing Process</span>
                      </span>
                      {videoStatus === 'delivered' ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#0D4F4F] bg-[#0D4F4F]/10 px-2 py-0.5 rounded-md">
                          Stage {videoStep.stage} of {VIDEO_PROCESS_STEPS.length}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          videoStatus === 'delivered' ? 'bg-emerald-600' : 'bg-gradient-to-r from-[#0D4F4F] to-[#D4AF37]'
                        }`}
                        style={{ width: `${videoProgressPercent}%` }}
                      />
                    </div>

                    {/* Select Dropdown */}
                    <select
                      value={videoStatus}
                      onChange={(e) => updateDeliverableStatus(q, 'videoStatus', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#0D4F4F] transition-all cursor-pointer ${
                        videoStatus === 'delivered'
                          ? 'border-emerald-300 text-emerald-800 bg-emerald-50/40'
                          : 'border-slate-300 text-[#0D4F4F]'
                      }`}
                    >
                      {VIDEO_PROCESS_STEPS.map((step) => (
                        <option key={step.id} value={step.id}>
                          {step.stage}. {step.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
