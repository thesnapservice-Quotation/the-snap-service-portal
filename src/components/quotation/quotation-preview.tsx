'use client';

import React from 'react';
import { Quotation, AppSettings, EventItem } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  User, 
  Calendar, 
  ShieldCheck, 
  Building2, 
  Phone, 
  MapPin, 
  Wallet, 
  Receipt,
  PackageCheck
} from 'lucide-react';

interface QuotationPreviewProps {
  quotation: Quotation;
  settings: AppSettings;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

// Chronological Pakistani Wedding Event Order:
// 1. Engagement, 2. Nikkah, 3. Ubtan/Mayun, 4. Mehndi, 5. Barat, 6. Walima, 7. Couple Shoot
function getEventOrderScore(name: string): number {
  const n = name.toLowerCase();
  if (n.includes('engagement')) return 1;
  if (n.includes('nikkah')) return 2;
  if (n.includes('ubtan') || n.includes('mayun')) return 3;
  if (n.includes('mehndi')) return 4;
  if (n.includes('barat')) return 5;
  if (n.includes('walima')) return 6;
  if (n.includes('couple') || n.includes('shoot')) return 7;
  return 8;
}

export function sortEventsInSequence(events: EventItem[]): EventItem[] {
  return [...events]
    .sort((a, b) => getEventOrderScore(a.name) - getEventOrderScore(b.name))
    .map((evt, idx) => ({ ...evt, dayNumber: idx + 1 }));
}

// 🌿 Luxury Botanical Vine Top Left Corner SVG (Gold Accent #D4AF37)
function BotanicalVineTopLeft() {
  return (
    <svg className="absolute top-0 left-0 w-36 h-36 text-[#D4AF37] opacity-[0.22] pointer-events-none z-0" viewBox="0 0 160 160" fill="currentColor">
      <path d="M10 0 C 40 30, 80 50, 140 60 C 100 60, 60 40, 0 10 Z" fill="currentColor" />
      <path d="M15 15 C 30 10, 45 5, 55 0 C 45 20, 30 25, 15 15 Z" />
      <path d="M35 30 C 55 20, 70 10, 85 5 C 70 30, 50 35, 35 30 Z" />
      <path d="M60 45 C 80 35, 95 25, 115 15 C 95 45, 75 50, 60 45 Z" />
      <path d="M85 55 C 110 45, 130 35, 150 25 C 130 60, 105 60, 85 55 Z" />
    </svg>
  );
}

// 🌿 Luxury Botanical Vine Bottom Right Corner SVG
function BotanicalVineBottomRight() {
  return (
    <svg className="absolute bottom-0 right-0 w-36 h-36 text-[#D4AF37] opacity-[0.22] pointer-events-none z-0 rotate-180" viewBox="0 0 160 160" fill="currentColor">
      <path d="M10 0 C 40 30, 80 50, 140 60 C 100 60, 60 40, 0 10 Z" fill="currentColor" />
      <path d="M15 15 C 30 10, 45 5, 55 0 C 45 20, 30 25, 15 15 Z" />
      <path d="M35 30 C 55 20, 70 10, 85 5 C 70 30, 50 35, 35 30 Z" />
      <path d="M60 45 C 80 35, 95 25, 115 15 C 95 45, 75 50, 60 45 Z" />
      <path d="M85 55 C 110 45, 130 35, 150 25 C 130 60, 105 60, 85 55 Z" />
    </svg>
  );
}

// 🎨 Luxury Watercolor Bloom Top Right Corner SVG
function WatercolorBloomTopRight() {
  return (
    <svg className="absolute -top-10 -right-10 w-48 h-48 opacity-[0.18] pointer-events-none z-0" viewBox="0 0 200 200">
      <defs>
        <radialGradient id="waterColorGrad1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#0D4F4F" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FAF9F6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M100,20 C140,10 180,50 190,90 C200,130 160,180 110,190 C60,200 20,160 10,110 C0,60 60,30 100,20 Z" fill="url(#waterColorGrad1)" filter="blur(8px)" />
    </svg>
  );
}

// 🎨 Luxury Watercolor Bloom Bottom Left Corner SVG
function WatercolorBloomBottomLeft() {
  return (
    <svg className="absolute -bottom-10 -left-10 w-48 h-48 opacity-[0.18] pointer-events-none z-0" viewBox="0 0 200 200">
      <defs>
        <radialGradient id="waterColorGrad2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0D4F4F" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FAF9F6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M100,20 C140,10 180,50 190,90 C200,130 160,180 110,190 C60,200 20,160 10,110 C0,60 60,30 100,20 Z" fill="url(#waterColorGrad2)" filter="blur(8px)" />
    </svg>
  );
}

// 1. Professional DSLR / Mirrorless Camera Body SVG
function DSLRCameraIcon({ className = "w-4 h-4 text-[#0D4F4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  );
}

// 2. Cinema Video Camera / Camcorder SVG
function CinemaCameraIcon({ className = "w-4 h-4 text-[#0D4F4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z"/>
      <rect x="2" y="6" width="14" height="12" rx="2" ry="2"/>
      <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  );
}

// 3. Quadcopter Drone SVG with Propellers
function DroneEquipmentIcon({ className = "w-4 h-4 text-[#0D4F4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <line x1="9" y1="9" x2="4" y2="4" />
      <line x1="15" y1="9" x2="20" y2="4" />
      <line x1="9" y1="15" x2="4" y2="20" />
      <line x1="15" y1="15" x2="20" y2="20" />
      <line x1="2" y1="4" x2="6" y2="4" strokeWidth="2.5" />
      <line x1="18" y1="4" x2="22" y2="4" strokeWidth="2.5" />
      <line x1="2" y1="20" x2="6" y2="20" strokeWidth="2.5" />
      <line x1="18" y1="20" x2="22" y2="20" strokeWidth="2.5" />
    </svg>
  );
}

// 4. Photo Album / Krizma Album SVG
function PhotoAlbumIcon({ className = "w-4 h-4 text-[#0D4F4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
      <path d="M6 6h10"/>
      <path d="M6 10h10"/>
      <path d="M6 14h6"/>
    </svg>
  );
}

// 5. External Hard Drive / Data Drive SVG
function HardDriveIcon({ className = "w-4 h-4 text-[#0D4F4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M12 12h.01"/>
      <path d="M17 12h.01"/>
      <path d="M7 12h.01"/>
    </svg>
  );
}

// 6. Video Editing Film Strip SVG
function FilmEditingIcon({ className = "w-4 h-4 text-[#0D4F4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2.18" ry="2.18"/>
      <line x1="7" y1="4" x2="7" y2="20"/>
      <line x1="17" y1="4" x2="17" y2="20"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="2" y1="8" x2="7" y2="8"/>
      <line x1="2" y1="16" x2="7" y2="16"/>
      <line x1="17" y1="8" x2="22" y2="8"/>
      <line x1="17" y1="16" x2="22" y2="16"/>
    </svg>
  );
}

/**
 * Returns exact wedding equipment icon based on service name
 */
function getEquipmentIcon(serviceName: string, className = "w-4 h-4 text-[#0D4F4F] shrink-0") {
  const n = serviceName.toLowerCase();
  if (n.includes('drone')) return <DroneEquipmentIcon className={className} />;
  if (n.includes('video') || n.includes('videographer')) return <CinemaCameraIcon className={className} />;
  if (n.includes('edit') || n.includes('film')) return <FilmEditingIcon className={className} />;
  if (n.includes('album') || n.includes('krizma')) return <PhotoAlbumIcon className={className} />;
  if (n.includes('drive') || n.includes('data') || n.includes('hard')) return <HardDriveIcon className={className} />;
  return <DSLRCameraIcon className={className} />;
}

// Gold Ornament Divider
function GoldOrnamentDivider({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 my-2 relative z-10">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37] flex-1 max-w-[120px]" />
      <span className="text-[#D4AF37] text-[10px]">❖</span>
      <h3 className="font-serif font-bold text-xs tracking-widest text-[#0D4F4F] uppercase">
        {text}
      </h3>
      <span className="text-[#D4AF37] text-[10px]">❖</span>
      <div className="h-[1px] bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37] flex-1 max-w-[120px]" />
    </div>
  );
}

// Custom Event Motif Image — Strictly Matched to File Name & Event Name
// nikkah.png -> Nikkah Calligraphy
// mehndi.png -> Mehndi Henna Hand
// ubtan.png / mayun.png -> Ubtan / Diya Bowl
// barat.png -> Barat Bride & Groom
// walima.png -> Walima Diya Lamp
// engagement.png -> Wedding Rings
function EventMotifIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  let imageSrc = '/events/engagement.png';
  let altText = 'Wedding Rings Motif';

  if (n.includes('nikkah')) {
    imageSrc = '/events/nikkah.png';
    altText = 'Nikkah Calligraphy';
  } else if (n.includes('mehndi')) {
    imageSrc = '/events/mehndi.png';
    altText = 'Mehndi Henna Hand';
  } else if (n.includes('ubtan') || n.includes('mayun')) {
    imageSrc = '/events/ubtan.png';
    altText = 'Ubtan Diya Bowl';
  } else if (n.includes('barat')) {
    imageSrc = '/events/barat.png';
    altText = 'Barat Bride & Groom';
  } else if (n.includes('walima')) {
    imageSrc = '/events/walima.png';
    altText = 'Walima Diya Lamp';
  }

  return (
    <div className="w-12 h-12 my-1 mx-auto flex items-center justify-center filter brightness-0 invert">
      {/* eslint-disable-next-next/no-img-element */}
      <img src={imageSrc} alt={altText} className="w-10 h-10 object-contain" />
    </div>
  );
}

export function QuotationPreview({ quotation, settings, previewRef }: QuotationPreviewProps) {
  const { client, events, inclusions, payment, termsAndConditions, quotationNumber } = quotation;
  const { business, bank } = settings;

  // Auto-sort events chronologically (Engagement -> Nikkah -> Ubtan/Mayun -> Mehndi -> Barat -> Walima -> Couple Shoot)
  const sortedEvents = sortEventsInSequence(events);

  const hasAdvance = payment.advanceReceived > 0;
  const packageTypeTitle = quotation.packageType === 'single_day' || sortedEvents.length === 1 
    ? 'SINGLE DAY PACKAGE' 
    : 'WEDDING PACKAGE';

  return (
    <div className="w-full flex justify-center py-1 sm:py-2 px-0 sm:px-1">
      {/* Minimalistic Capturable Container with Rounded Edges (rounded-3xl) */}
      <div
        ref={previewRef}
        className="w-full max-w-[794px] bg-[#FAF9F6] text-slate-800 shadow-xl rounded-2xl sm:rounded-3xl border sm:border-2 border-[#E5E0D5] font-sans relative overflow-hidden text-xs leading-tight p-3 sm:p-6"
        id="quotation-capture-area"
      >
        {/* Background Botanical Leaves & Watercolor Accents */}
        <BotanicalVineTopLeft />
        <BotanicalVineBottomRight />
        <WatercolorBloomTopRight />
        <WatercolorBloomBottomLeft />

        {/* TOP HEADER SECTION */}
        <div className="relative min-h-[95px] sm:min-h-[110px] bg-white rounded-xl sm:rounded-2xl border border-[#E5E0D5] overflow-hidden shadow-2xs z-10 flex items-center justify-between">
          {/* Angled Dark Teal Left Banner (#0D4F4F & #093A3A) */}
          <div className="absolute top-0 left-0 bottom-0 w-[40%] sm:w-[42%] bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-2 sm:p-3 flex items-center justify-center text-center [clip-path:polygon(0_0,100%_0,82%_100%,0_100%)] shadow-md">
            {/* Prominent Metallic Gold Snap Service Logo */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-sm:border-2 border-[#D4AF37] p-0.5 flex items-center justify-center relative bg-[#093A3A] shadow-xl overflow-hidden shrink-0">
              {/* eslint-disable-next-next/no-img-element */}
              <img
                src={business.logoUrl || '/snap-service-logo.png'}
                alt="Snap Service Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          {/* Right Header Details - Positioned on the Right Side */}
          <div className="w-full pl-[42%] sm:pl-[45%] pr-3 sm:pr-6 py-2 sm:py-3 flex flex-col items-end text-right">
            <h1 className="font-serif font-extrabold text-xl sm:text-3xl text-[#0D4F4F] tracking-wider uppercase leading-none">
              QUOTATION
            </h1>
            <p className="font-serif text-[10px] sm:text-xs font-semibold text-[#D4AF37] tracking-widest uppercase mt-0.5 sm:mt-1">
              {packageTypeTitle}
            </p>
            <div className="flex items-center gap-1 my-0.5 sm:my-1">
              <div className="h-[1px] w-8 sm:w-12 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[7px] sm:text-[8px]">❖</span>
              <div className="h-[1px] w-8 sm:w-12 bg-[#D4AF37]" />
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
              Quotation No. <span className="font-bold text-[#0D4F4F] font-mono">#{quotationNumber || 'SS-00950'}</span>
            </p>
          </div>
        </div>

        {/* CLIENT DETAILS BAR (Rounded Corners - Prepared For, Quotation Date & Event Dates) */}
        <div className="mt-2 sm:mt-3 bg-white rounded-xl sm:rounded-2xl border border-[#E5E0D5] p-2.5 sm:p-3 shadow-2xs relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 gap-2 sm:gap-0">
            {/* Prepared For */}
            <div className="flex items-center gap-2.5 px-2 sm:px-3 pb-1.5 sm:pb-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0D4F4F] text-white flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FAF9F6]" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  PREPARED FOR:
                </span>
                <span className="font-bold text-xs sm:text-sm text-[#0D4F4F] block truncate">
                  {client.name || 'Valued Client'}
                </span>
              </div>
            </div>

            {/* Quotation Date */}
            <div className="flex items-center gap-2.5 px-2 sm:px-3 sm:pl-4 pt-1.5 sm:pt-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0D4F4F] text-white flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FAF9F6]" />
              </div>
              <div>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  QUOTATION DATE:
                </span>
                <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                  {formatDate(client.quotationDate)}
                </span>
              </div>
            </div>

            {/* Event Date(s) */}
            <div className="flex items-center gap-2.5 px-2 sm:px-3 sm:pl-4 pt-1.5 sm:pt-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0D4F4F] text-white flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8.5px] sm:text-[9px] text-[#0D4F4F] font-bold uppercase tracking-wider block">
                  EVENT DATE(S):
                </span>
                <span className="font-extrabold text-[10.5px] sm:text-xs text-[#0D4F4F] block leading-tight break-words">
                  {client.eventDates || 'As Discussed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PACKAGE DETAILS SECTION */}
        <div className="mt-2 sm:mt-3 relative z-10">
          <GoldOrnamentDivider text="PACKAGE DETAILS" />

          {/* EVENTS / PACKAGES GRID */}
          <div className="space-y-2.5 sm:space-y-3 mt-2">
            {sortedEvents.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-xl sm:rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                No events added to quotation yet.
              </div>
            ) : (
              sortedEvents.map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  className="bg-white rounded-xl sm:rounded-2xl border border-[#E5E0D5] overflow-hidden flex flex-col sm:flex-row shadow-2xs"
                >
                  {/* Left Column: DAY 1, DAY 2, etc. (Dark Teal #0D4F4F Background) */}
                  <div className="sm:w-1/3 bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-2.5 sm:p-3 flex flex-col justify-center items-center text-center border-b sm:border-b-0 sm:border-r border-[#E5E0D3]">
                    <span className="text-[9.5px] sm:text-[10px] tracking-widest text-slate-300 font-bold uppercase block border-b border-[#D4AF37]/40 pb-0.5 sm:pb-1 w-full">
                      DAY {idx + 1}
                    </span>
                    
                    <EventMotifIcon name={evt.name} />

                    <h4 className="font-serif font-bold text-sm sm:text-base text-[#D4AF37] tracking-wider uppercase mt-0.5">
                      {evt.name || `Day ${idx + 1}`}
                    </h4>

                    {evt.guestCount !== undefined && evt.guestCount > 0 && (
                      <span className="text-[9.5px] sm:text-[10px] text-slate-300 font-medium block mt-0.5">
                        ({evt.guestCount} GUESTS)
                      </span>
                    )}
                  </div>

                  {/* Middle Column: Services List */}
                  <div className="sm:w-5/12 p-2.5 sm:p-3 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-dashed border-slate-300">
                    <ul className="space-y-1.5 sm:space-y-2 text-xs">
                      {evt.services.map((srv) => (
                        <li key={srv.id} className="flex items-center gap-2 text-slate-800 font-bold uppercase text-[10.5px] sm:text-[11px]">
                          {getEquipmentIcon(srv.serviceName, "w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0D4F4F] shrink-0")}
                          <span>
                            {srv.quantity} {srv.serviceName.toUpperCase()}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-1.5 sm:pt-2 border-t border-slate-100 mt-2">
                      <span className="text-[9.5px] sm:text-[10px] font-bold tracking-widest text-[#0D4F4F] uppercase block">
                        FULL EVENT COVERAGE
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Price */}
                  <div className="sm:w-3/12 p-2.5 sm:p-3 bg-white flex flex-col items-center justify-center text-center">
                    <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">
                      PACKAGE PRICE
                    </span>
                    <div className="flex items-center gap-1 my-0.5 sm:my-1">
                      <div className="h-[1px] w-6 bg-[#D4AF37]" />
                      <span className="text-[#D4AF37] text-[7px]">❖</span>
                      <div className="h-[1px] w-6 bg-[#D4AF37]" />
                    </div>
                    <p className="font-serif font-bold text-lg sm:text-xl text-[#0D4F4F] tracking-tight">
                      {formatCurrency(evt.price)}
                    </p>
                    <div className="flex items-center gap-1 my-0.5 sm:my-1">
                      <div className="h-[1px] w-6 bg-[#D4AF37]" />
                      <span className="text-[#D4AF37] text-[7px]">❖</span>
                      <div className="h-[1px] w-6 bg-[#D4AF37]" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* GRAND TOTAL BANNER BAR (Rounded Edges) */}
        <div className="my-2.5 sm:my-3 relative z-10">
          <div className="bg-[#D4AF37] rounded-xl sm:rounded-2xl overflow-hidden flex items-center shadow-md border border-[#B89228]">
            {/* Left Angled Dark Teal Box */}
            <div className="w-1/2 bg-[#0D4F4F] text-white py-2.5 sm:py-3 px-3 sm:px-4 font-serif font-bold text-xs sm:text-sm tracking-widest uppercase [clip-path:polygon(0_0,100%_0,85%_100%,0_100%)]">
              GRAND TOTAL
            </div>
            {/* Right Gold Amount */}
            <div className="w-1/2 text-right pr-3 sm:pr-6 py-1.5 sm:py-2">
              <span className="font-serif font-extrabold text-lg sm:text-2xl text-white tracking-tight">
                {formatCurrency(payment.grandTotal)}
              </span>
            </div>
          </div>

          {/* 3-STAGE MILESTONE PAYMENT PLAN ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-center text-xs">
            {/* Stage 1: 50% Advance to confirm booking */}
            <div className="bg-white p-2 rounded-xl sm:rounded-2xl border border-[#E5E0D5] shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0D4F4F] text-white flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="text-left">
                <span className="text-[8px] sm:text-[8.5px] text-slate-400 font-bold block uppercase">50% ADVANCE TO CONFIRM BOOKING</span>
                <span className="font-bold text-[#0D4F4F] text-xs">
                  {formatCurrency(payment.advanceReceived > 0 ? payment.advanceReceived : Math.round(payment.grandTotal * 0.5))}
                </span>
              </div>
            </div>

            {/* Stage 2: 25% After event completion */}
            <div className="bg-white p-2 rounded-xl sm:rounded-2xl border border-[#E5E0D5] shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0D4F4F] text-white flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="text-left">
                <span className="text-[8px] sm:text-[8.5px] text-slate-400 font-bold block uppercase">25% AFTER EVENT COMPLETION</span>
                <span className="font-bold text-[#0D4F4F] text-xs">
                  {formatCurrency(Math.round(payment.grandTotal * 0.25))}
                </span>
              </div>
            </div>

            {/* Stage 3: 25% Before final delivery */}
            <div className="bg-white p-2 rounded-xl sm:rounded-2xl border border-[#E5E0D5] shadow-2xs flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0D4F4F] text-white flex items-center justify-center shrink-0">
                <PackageCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="text-left">
                <span className="text-[8px] sm:text-[8.5px] text-slate-400 font-bold block uppercase">25% BEFORE FINAL DELIVERY</span>
                <span className="font-bold text-[#0D4F4F] text-xs">
                  {formatCurrency(
                    payment.grandTotal -
                    (payment.advanceReceived > 0 ? payment.advanceReceived : Math.round(payment.grandTotal * 0.5)) -
                    Math.round(payment.grandTotal * 0.25)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* INCLUDED IN PACKAGE SECTION */}
        {inclusions && inclusions.filter((i) => i.included).length > 0 && (
          <div className="my-2 relative z-10">
            <div className="flex items-center justify-center gap-2 my-1">
              <div className="h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37] flex-1" />
              <div className="bg-[#0D4F4F] text-[#D4AF37] px-3 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold tracking-widest uppercase border border-[#D4AF37]/40 shadow-2xs">
                INCLUDED IN PACKAGE
              </div>
              <div className="h-[1px] bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37] flex-1" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mt-2">
              {inclusions
                .filter((inc) => inc.included)
                .map((inc) => {
                  const qty = inc.quantity || 1;
                  const isAlbum = inc.name.toLowerCase().includes('album');
                  // Always show quantity for Albums (e.g. "1 KRIZMA ALBUM", "3 FAMILY ALBUMS") or if qty > 1
                  const displayName = (isAlbum || qty > 1) ? `${qty} ${inc.name}` : inc.name;

                  return (
                    <div key={inc.id} className="bg-white p-2 rounded-xl sm:rounded-2xl border border-[#E5E0D5] shadow-2xs flex flex-col items-center justify-center">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#D4AF37] bg-[#FAF9F6] flex items-center justify-center text-[#0D4F4F] mb-1 shadow-2xs">
                        {getEquipmentIcon(inc.name, "w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0D4F4F]")}
                      </div>
                      <span className="font-bold text-[8.5px] sm:text-[9px] text-slate-800 uppercase tracking-tight leading-tight">
                        {displayName}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TERMS & CONDITIONS + BANK DETAILS GRID (Rounded Corners) */}
        <div className="my-2.5 sm:my-3 pt-2 border-t border-[#E5E0D5] relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
            {/* Terms & Conditions */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#E5E0D5]">
              <h4 className="font-serif font-bold text-xs text-[#0D4F4F] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-4 h-4 text-[#0D4F4F]" />
                TERMS & CONDITIONS
              </h4>
              <ul className="space-y-1 text-[10px] text-slate-700 font-medium">
                {termsAndConditions.map((term, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#0D4F4F] font-bold">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bank Details */}
            <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#E5E0D5]">
              <h4 className="font-serif font-bold text-xs text-[#0D4F4F] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Building2 className="w-4 h-4 text-[#0D4F4F]" />
                BANK DETAILS
              </h4>
              <div className="space-y-1.5 text-[10.5px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Account Title:</span>
                  <span className="font-bold text-slate-900 uppercase">{bank.accountTitle || 'MUHAMMAD ARIF'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Account Number:</span>
                  <span className="font-mono font-bold text-[#0D4F4F]">{bank.accountNumber || '04010103463346'}</span>
                </div>
                {bank.iban && (
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">IBAN:</span>
                    <span className="font-mono font-bold text-slate-800 text-[9.5px]">{bank.iban}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Bank / Branch:</span>
                  <span className="font-bold text-slate-800 uppercase">{bank.bank} — {bank.branch}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER BAR (Rounded Container) */}
        <div className="bg-[#0D4F4F] text-white p-2.5 sm:py-2.5 sm:px-5 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center justify-between text-[10px] font-semibold border border-[#D4AF37]/40 shadow-sm relative z-10 gap-1.5 sm:gap-0 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0D4F4F] flex items-center justify-center font-bold shrink-0">
              <Phone className="w-3 h-3 text-[#0D4F4F]" />
            </div>
            <span>{business.phone || '0323-9244924'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0D4F4F] flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-3 h-3 text-[#0D4F4F]" />
            </div>
            <span>{business.address || 'Office# 42, Dragon Mall, Faisalabad'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#0D4F4F] flex items-center justify-center font-bold shrink-0">
              <DSLRCameraIcon className="w-3 h-3 text-[#0D4F4F]" />
            </div>
            <span>{business.instagram || '@snapservice.pk'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
