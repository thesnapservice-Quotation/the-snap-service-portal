'use client';

import React from 'react';
import Link from 'next/link';
import { Quotation, EventItem } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CrewMemberDetail } from '@/components/quotation/send-crew-whatsapp-modal';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Users, 
  Camera, 
  Video, 
  Plane, 
  MessageSquare, 
  ExternalLink, 
  X, 
  Edit, 
  CheckCircle2, 
  Sparkles,
  FileText,
  DollarSign
} from 'lucide-react';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  event: EventItem | null;
  onOpenCrewBrief: (crewMember: CrewMemberDetail, eventId?: string) => void;
}

export function EventDetailsModal({
  isOpen,
  onClose,
  quotation,
  event,
  onOpenCrewBrief,
}: EventDetailsModalProps) {
  if (!isOpen || !quotation || !event) return null;

  const isConfirmed = quotation.status === 'confirmed' || quotation.status === 'completed';

  // Extract photography, videography, and drone services
  const photoService = event.services.find((s) => s.serviceName.toLowerCase().includes('photo'));
  const videoService = event.services.find((s) => s.serviceName.toLowerCase().includes('video'));
  const droneService = event.services.find((s) => s.serviceName.toLowerCase().includes('drone'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0D4F4F] via-[#093A3A] to-[#1B2A4A] text-white px-5 py-4 flex items-center justify-between border-b border-[#156060]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold shadow-xs shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#FAF9F6] tracking-wide">
                  {event.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#0D4F4F] font-bold text-[10px] uppercase tracking-wider">
                  Day {event.dayNumber || 1}
                </span>
              </div>
              <p className="text-xs text-[#C3DFDF] mt-0.5">
                Client: <strong className="text-white">{quotation.client.name}</strong> • Quotation #{quotation.quotationNumber}
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

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto text-xs flex-1">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Event Date</span>
              <span className="font-bold text-xs text-[#0D4F4F] mt-0.5 block">
                {event.eventDate ? formatDate(event.eventDate) : 'Date Pending'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Guest Count</span>
              <span className="font-bold text-xs text-slate-900 mt-0.5 block">
                {event.guestCount ? `${event.guestCount} Guests` : 'Standard'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Selling Price</span>
              <span className="font-serif font-bold text-xs text-[#0D4F4F] mt-0.5 block">
                {formatCurrency(event.price || 0)}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Status</span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5 border ${
                  isConfirmed
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : quotation.status === 'not_confirmed'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-[#D4AF37]/20 text-[#0D4F4F] border-[#D4AF37]/40'
                }`}
              >
                {quotation.status === 'not_confirmed' ? 'Not Confirmed' : quotation.status}
              </span>
            </div>
          </div>

          {/* Client Details Card */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wedding Client</span>
              <h4 className="font-bold text-sm text-slate-900 mt-0.5">{quotation.client.name}</h4>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{quotation.client.phone}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${quotation.client.phone}`}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#0D4F4F]" /> Call Client
              </a>
              <Link
                href={`/quotations/${quotation.id}`}
                className="px-3 py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold hover:bg-[#093A3A] transition-colors flex items-center gap-1.5 text-xs shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" /> View Quotation
              </Link>
            </div>
          </div>

          {/* Timing & Venue Location Details */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
            <h4 className="font-bold text-xs text-[#0D4F4F] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" /> Timing &amp; Venue Location
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Event Timing</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {event.timing || '07:00 PM (Night Event)'}
                </span>
                <span className="text-[10px] text-slate-500 block">Reporting: 06:30 PM (30 min before)</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Venue / Marquee</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {event.venue || 'Royal Palm Golf & Country Club, Canal Road, Lahore'}
                </span>
                {event.mapLink && (
                  <a
                    href={event.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                  >
                    <MapPin className="w-3 h-3 text-red-500" /> Open Map Location
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Shooting Crew Breakdown (Large, Clear, Actionable) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-serif font-bold text-xs uppercase text-[#0D4F4F] tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#D4AF37]" /> Assigned Shooting Team for {event.name}
              </span>
              <Link
                href={`/quotations/${quotation.id}/compare`}
                className="text-[#D4AF37] hover:underline font-bold text-[11px] flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Team
              </Link>
            </div>

            <div className="space-y-2.5">
              {/* Photographers */}
              {photoService && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" /> Photographers ({photoService.quantity || 1})
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold">Candid &amp; Portrait Coverage</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(photoService.crewBreakdown || []).slice(0, photoService.quantity || 1).map((crew, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-bold text-xs text-slate-900 block truncate">{crew.name || 'Unassigned'}</span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">{crew.phone || 'No phone'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCrewBrief(
                              {
                                name: crew.name,
                                phone: crew.phone,
                                role: 'Lead Photographer',
                              },
                              event.id
                            );
                          }}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Brief</span>
                        </button>
                      </div>
                    ))}
                    {(!photoService.crewBreakdown || photoService.crewBreakdown.length === 0) && (
                      <div className="p-2 bg-white rounded-lg border border-dashed border-blue-200 text-slate-400 text-center col-span-2">
                        No photographer assigned yet. Click Edit Team to assign.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Videographers */}
              {videoService && (
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-purple-600" /> Videographers ({videoService.quantity || 1})
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold">Cinema HD &amp; Documentary</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(videoService.crewBreakdown || []).slice(0, videoService.quantity || 1).map((crew, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-bold text-xs text-slate-900 block truncate">{crew.name || 'Unassigned'}</span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">{crew.phone || 'No phone'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCrewBrief(
                              {
                                name: crew.name,
                                phone: crew.phone,
                                role: 'Cinematographer',
                              },
                              event.id
                            );
                          }}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Brief</span>
                        </button>
                      </div>
                    ))}
                    {(!videoService.crewBreakdown || videoService.crewBreakdown.length === 0) && (
                      <div className="p-2 bg-white rounded-lg border border-dashed border-purple-200 text-slate-400 text-center col-span-2">
                        No videographer assigned yet. Click Edit Team to assign.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Drone Operator */}
              {droneService && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Plane className="w-4 h-4 text-amber-600" /> Drone Pilot ({droneService.quantity || 1})
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">4K Aerial Venue Coverage</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(droneService.crewBreakdown || []).slice(0, droneService.quantity || 1).map((crew, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-amber-100 shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-bold text-xs text-slate-900 block truncate">{crew.name || 'Unassigned'}</span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">{crew.phone || 'No phone'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCrewBrief(
                              {
                                name: crew.name,
                                phone: crew.phone,
                                role: 'Drone Pilot',
                              },
                              event.id
                            );
                          }}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Brief</span>
                        </button>
                      </div>
                    ))}
                    {(!droneService.crewBreakdown || droneService.crewBreakdown.length === 0) && (
                      <div className="p-2 bg-white rounded-lg border border-dashed border-amber-200 text-slate-400 text-center col-span-2">
                        No drone pilot assigned yet. Click Edit Team to assign.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <Link
              href={`/quotations/${quotation.id}/compare`}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs hover:brightness-110 transition-all shadow-xs flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Shooting Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
