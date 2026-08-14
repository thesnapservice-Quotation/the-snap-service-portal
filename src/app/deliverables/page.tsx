'use me';
'use client';

import React, { useState } from 'react';
import { useQuotations } from '@/hooks/use-quotations';
import { storage } from '@/lib/storage';
import { Quotation, DeliverableStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Sparkles, CheckCircle2, Film, BookOpen, Clock, AlertTriangle, Calendar } from 'lucide-react';

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

export default function DeliverablesPage() {
  const { quotations, refreshQuotations } = useQuotations();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const updateDeliverableStatus = (
    quotation: Quotation,
    field: keyof DeliverableStatus,
    val: string
  ) => {
    const currentStatus: DeliverableStatus = quotation.deliverableStatus || {
      albumStatus: quotation.status === 'completed' ? 'delivered' : 'design',
      videoStatus: quotation.status === 'completed' ? 'delivered' : 'in_progress',
    };

    const newDeliverableStatus: DeliverableStatus = {
      ...currentStatus,
      [field]: val as any,
    };

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

    storage.saveQuotation(updatedQuotation);
    refreshQuotations();
  };

  const filteredQuotations = quotations.filter((q) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return q.status !== 'completed';
    return q.status === 'completed';
  });

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
              Deliverables & Album Printing Tracker
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-xl">
              Track Album printing and Video Editing handover. Automatic 15-day delivery deadlines calculated post-event.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'all' ? 'bg-[#D4AF37] text-[#0D4F4F]' : 'text-white hover:bg-white/10'
              }`}
            >
              All Clients ({quotations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'pending' ? 'bg-[#D4AF37] text-[#0D4F4F]' : 'text-white hover:bg-white/10'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'completed' ? 'bg-[#D4AF37] text-[#0D4F4F]' : 'text-white hover:bg-white/10'
              }`}
            >
              Completed / Delivered
            </button>
          </div>
        </div>
      </div>

      {/* Deliverables List */}
      <div className="space-y-4">
        {filteredQuotations.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center text-slate-400 text-xs">
            No client quotations found for this filter.
          </div>
        ) : (
          filteredQuotations.map((q) => {
            const isQuotationCompleted = q.status === 'completed';
            const deliverable = q.deliverableStatus || {
              albumStatus: isQuotationCompleted ? 'delivered' : 'design',
              videoStatus: isQuotationCompleted ? 'delivered' : 'in_progress',
            };

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
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                      isQuotationCompleted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : deadline.isOverdue
                        ? 'bg-red-50 text-red-800 border-red-300 animate-pulse'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Deadline: {deadline.deadlineFormatted}
                        {!isQuotationCompleted && (
                          <span className="font-mono text-[11px] ml-1">
                            ({deadline.isOverdue ? `${Math.abs(deadline.daysLeft)} Days OVERDUE!` : `${deadline.daysLeft} Days Left`})
                          </span>
                        )}
                      </span>
                    </div>

                    <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                      q.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : q.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {q.status === 'completed' ? 'Completed / Delivered' : q.status}
                    </span>
                  </div>
                </div>

                {/* Grid of 2 Core Deliverable Cards: Albums & Video Editing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* 1. Albums (Krizma, Couple & Family Albums) */}
                  <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                    deliverable.albumStatus === 'delivered' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#0D4F4F]" /> Albums (Krizma & Family Albums)
                      </span>
                      {deliverable.albumStatus === 'delivered' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Handed Over
                        </span>
                      )}
                    </div>
                    <select
                      value={deliverable.albumStatus}
                      onChange={(e) => updateDeliverableStatus(q, 'albumStatus', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0D4F4F] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D4F4F]"
                    >
                      <option value="design">Layout Design In Progress</option>
                      <option value="printing">Sent to Printing Press</option>
                      <option value="delivered">Delivered to Client</option>
                    </select>
                  </div>

                  {/* 2. Video Editing */}
                  <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                    deliverable.videoStatus === 'delivered' ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-[#0D4F4F]" /> Complete Video Editing
                      </span>
                      {deliverable.videoStatus === 'delivered' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Handed Over
                        </span>
                      )}
                    </div>
                    <select
                      value={deliverable.videoStatus}
                      onChange={(e) => updateDeliverableStatus(q, 'videoStatus', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0D4F4F] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D4F4F]"
                    >
                      <option value="not_started">Editing Not Started</option>
                      <option value="in_progress">Video Editing In Progress</option>
                      <option value="delivered">Delivered to Client</option>
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
