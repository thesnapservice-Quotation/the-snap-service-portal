'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Quotation, EventItem } from '@/lib/types';
import { useSettings } from '@/hooks/use-settings';
import { formatDate } from '@/lib/utils';
import { normalizeWhatsAppPhone, generateWhatsAppIntentUrl } from '@/lib/whatsapp';
import { 
  MessageSquare, 
  Send, 
  X, 
  RotateCcw, 
  Copy, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  MapPin, 
  Calendar as CalendarIcon, 
  Phone, 
  User,
  Camera,
  Layers,
  ChevronDown
} from 'lucide-react';

export interface CrewMemberDetail {
  name: string;
  phone?: string;
  role?: string;
}

interface SendCrewWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  crewMember: CrewMemberDetail | null;
  initialEventId?: string;
}

type BriefMode = 'all_days' | 'today' | 'tomorrow' | 'single_event';

export function SendCrewWhatsAppModal({
  isOpen,
  onClose,
  quotation,
  crewMember,
  initialEventId,
}: SendCrewWhatsAppModalProps) {
  const { settings } = useSettings();

  const [briefMode, setBriefMode] = useState<BriefMode>('today');
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || '');
  const [crewPhone, setCrewPhone] = useState<string>('');
  
  // Brief Details Inputs
  const [eventTiming, setEventTiming] = useState<string>('07:00 PM (Night Event)');
  const [reportingTime, setReportingTime] = useState<string>('06:30 PM Sharp');
  const [venueName, setVenueName] = useState<string>('');
  const [mapLocation, setMapLocation] = useState<string>('');
  const [dressCode, setDressCode] = useState<string>('Black Studio Shirt / Smart Formal');
  const [assignedRole, setAssignedRole] = useState<string>('Lead Photographer');
  
  const [editedMessage, setEditedMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Sync crew phone and role on open
  useEffect(() => {
    if (crewMember) {
      setCrewPhone(crewMember.phone || '');
      setAssignedRole(crewMember.role || 'Lead Photographer');
    }
  }, [crewMember, isOpen]);

  // Sync selected event if passed
  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId);
      setBriefMode('single_event');
    } else if (quotation?.events && quotation.events.length > 0) {
      setSelectedEventId(quotation.events[0].id);
    }
  }, [initialEventId, quotation, isOpen]);

  const activeEvent = useMemo(() => {
    if (!quotation?.events || quotation.events.length === 0) return null;
    return quotation.events.find((e) => e.id === selectedEventId) || quotation.events[0];
  }, [quotation, selectedEventId]);

  // Set default venue if available on event
  useEffect(() => {
    if (activeEvent?.venue) {
      setVenueName(activeEvent.venue);
    } else if (!venueName) {
      setVenueName('Royal Palm Golf & Country Club, Lahore');
    }
    if (activeEvent?.mapLink) {
      setMapLocation(activeEvent.mapLink);
    } else if (!mapLocation) {
      setMapLocation('https://maps.google.com/?q=Lahore');
    }
  }, [activeEvent]);

  // Compile default WhatsApp Brief text based on selected mode
  const generateDefaultBrief = (): string => {
    if (!quotation || !crewMember) return '';

    const studioName = settings?.business?.name || 'The Snap Service';
    const clientName = quotation.client.name;
    const clientPhone = quotation.client.phone;
    const qNum = quotation.quotationNumber;

    if (briefMode === 'all_days') {
      const scheduleLines = quotation.events
        .map((evt, idx) => {
          const dateStr = evt.eventDate ? formatDate(evt.eventDate) : 'Date TBD';
          return `• Day ${idx + 1}: *${evt.name}* — ${dateStr}`;
        })
        .join('\n');

      return `Salam ${crewMember.name},

📋 *WEDDING EVENT CREW SCHEDULE — ${studioName.toUpperCase()}*

You are assigned for the upcoming wedding shoot of *${clientName}* (${qNum}).

*Events Schedule:*
${scheduleLines}

*Assigned Role:* ${assignedRole}
*Client Contact:* ${clientName} (${clientPhone})
*Dress Code:* ${dressCode}

Please review the dates and reply with *"CONFIRMED"* to block your schedule.

Regards,
*Studio Operations*
${studioName}`;
    }

    // Single event / Today / Tomorrow
    const targetEvent = activeEvent || quotation.events[0];
    const eventName = targetEvent ? targetEvent.name : 'Wedding Event';
    const eventDateStr = targetEvent?.eventDate ? formatDate(targetEvent.eventDate) : 'Today';
    
    let headerTitle = "TODAY'S EVENT CREW BRIEFING";
    if (briefMode === 'tomorrow') headerTitle = "TOMORROW'S EVENT CREW BRIEFING";
    else if (briefMode === 'single_event') headerTitle = `EVENT BRIEFING: ${eventName.toUpperCase()}`;

    return `Salam ${crewMember.name},

📋 *${headerTitle} — ${studioName.toUpperCase()}*

💍 *Event:* ${eventName} (${clientName})
📅 *Date:* ${eventDateStr}
⏰ *Event Time:* ${eventTiming}
⏰ *Reporting Time:* ${reportingTime}

📍 *Venue / Marquee:* ${venueName || 'Venue TBD'}
🗺️ *Map Location:* ${mapLocation || 'Map location to be shared'}

👤 *Client Contact:* ${clientName} (${clientPhone})
👔 *Dress Code:* ${dressCode}
🎒 *Assigned Role:* ${assignedRole}

⚠️ *Guidelines:*
• Please reach venue 15 minutes before reporting time.
• Ensure batteries are 100% charged and SD cards are formatted.

Please reply with *"CONFIRMED"* on receipt.

Regards,
*Studio Operations*
${studioName}`;
  };

  // Recompute message when mode or parameters change
  useEffect(() => {
    if (isOpen && quotation && crewMember) {
      setEditedMessage(generateDefaultBrief());
    }
  }, [isOpen, briefMode, selectedEventId, eventTiming, reportingTime, venueName, mapLocation, dressCode, assignedRole, crewMember, quotation]);

  if (!isOpen || !quotation || !crewMember) return null;

  const validPhone = normalizeWhatsAppPhone(crewPhone || '');
  const isValidPhone = validPhone.length >= 10;
  const directWaUrl = isValidPhone ? generateWhatsAppIntentUrl(validPhone, editedMessage) : '#';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSend = () => {
    if (!isValidPhone) {
      alert('Please enter a valid WhatsApp phone number for this crew member.');
      return;
    }
    window.open(directWaUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#0D4F4F] text-white px-5 py-4 flex items-center justify-between border-b border-[#156060]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-white">Send WhatsApp Crew Brief</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0D4F4F] font-bold text-[10px] uppercase tracking-wider">
                  {quotation.quotationNumber}
                </span>
              </div>
              <p className="text-xs text-[#C3DFDF] flex items-center gap-2 mt-0.5">
                <span>Crew: <strong className="text-white">{crewMember.name}</strong> ({assignedRole})</span>
                <span>•</span>
                <span>Client: {quotation.client.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#C3DFDF] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Crew Phone Number Input */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Phone className="w-4 h-4 text-[#0D4F4F] shrink-0" />
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Recipient WhatsApp Number
                </label>
                <input
                  type="text"
                  value={crewPhone}
                  onChange={(e) => setCrewPhone(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full px-2.5 py-1 border border-slate-300 rounded-md font-bold text-xs bg-white text-slate-800 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none mt-0.5"
                />
              </div>
            </div>

            {isValidPhone && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-[11px] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>wa.me/{validPhone}</span>
              </div>
            )}
          </div>

          {/* Mode Selection Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Briefing Scope
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setBriefMode('today')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                  briefMode === 'today'
                    ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#D4AF37] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ⚡ Today&apos;s Event
              </button>

              <button
                type="button"
                onClick={() => setBriefMode('tomorrow')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                  briefMode === 'tomorrow'
                    ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#D4AF37] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ⏳ Tomorrow&apos;s Event
              </button>

              <button
                type="button"
                onClick={() => setBriefMode('single_event')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                  briefMode === 'single_event'
                    ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#D4AF37] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🎯 Specific Day
              </button>

              <button
                type="button"
                onClick={() => setBriefMode('all_days')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                  briefMode === 'all_days'
                    ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#D4AF37] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                📋 All {quotation.events.length} Days
              </button>
            </div>
          </div>

          {/* Event Specific Parameter Controls (When not All Days) */}
          {briefMode !== 'all_days' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Event Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Event Day</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  >
                    {quotation.events.map((evt, idx) => (
                      <option key={evt.id} value={evt.id}>
                        Day {idx + 1}: {evt.name} ({evt.eventDate ? formatDate(evt.eventDate) : 'No Date'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Event Time</label>
                  <input
                    type="text"
                    value={eventTiming}
                    onChange={(e) => setEventTiming(e.target.value)}
                    placeholder="e.g. 07:00 PM (Night Event) or 01:00 PM (Day Event)"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  />
                </div>

                {/* Reporting Time */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Reporting Time</label>
                  <input
                    type="text"
                    value={reportingTime}
                    onChange={(e) => setReportingTime(e.target.value)}
                    placeholder="e.g. 06:30 PM Sharp"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  />
                </div>

                {/* Assigned Role */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Assigned Role</label>
                  <input
                    type="text"
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                    placeholder="e.g. Lead Photographer"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  />
                </div>

                {/* Venue Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Venue / Marquee Name</label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Royal Palm Golf & Country Club, Canal Road, Lahore"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  />
                </div>

                {/* Google Map Pin Link */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Google Maps Pin Link</label>
                  <input
                    type="text"
                    value={mapLocation}
                    onChange={(e) => setMapLocation(e.target.value)}
                    placeholder="e.g. https://maps.google.com/?q=Royal+Palm+Lahore"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Editable Live Message Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                Message Preview (Editable Before Sending)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditedMessage(generateDefaultBrief())}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#0D4F4F] font-semibold"
                  title="Reset to default template"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-[#0D4F4F] font-bold hover:underline"
                >
                  {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={9}
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="w-full p-3.5 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 bg-white focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!isValidPhone}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
              isValidPhone
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
