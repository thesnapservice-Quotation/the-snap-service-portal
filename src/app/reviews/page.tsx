'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, X, ChevronLeft, ChevronRight, Maximize2, Sparkles, Moon, Sun, ArrowUpRight } from 'lucide-react';

interface ReviewPhoto {
  url: string;
  caption: string;
  position: 'far-left' | 'inner-left' | 'inner-right' | 'far-right';
}

interface ClientStory {
  id: string;
  couple: string;
  eventType: string;
  city: string;
  rating: number;
  quote: string;
  photos: {
    farLeft: ReviewPhoto;
    innerLeft: ReviewPhoto;
    innerRight: ReviewPhoto;
    farRight: ReviewPhoto;
  };
}

const CLIENT_STORIES: ClientStory[] = [
  {
    id: 'sarah-zain',
    couple: 'Sarah & Zain',
    eventType: 'Mehndi Night',
    city: 'Lahore',
    rating: 5,
    quote: 'The candid moments captured are breathtaking! The team made us so comfortable.',
    photos: {
      farLeft: {
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85',
        caption: 'Candid laughter in traditional Pakistani Mehndi attire',
        position: 'far-left',
      },
      innerLeft: {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
        caption: 'Vibrant stage setup and floral guest seating',
        position: 'inner-left',
      },
      innerRight: {
        url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85',
        caption: 'The couple entrance under a blooming floral canopy',
        position: 'inner-right',
      },
      farRight: {
        url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85',
        caption: 'Friends & family cheering and celebrating the night',
        position: 'far-right',
      },
    },
  },
  {
    id: 'ayesha-hamza',
    couple: 'Ayesha & Hamza',
    eventType: 'Baraat & Reception',
    city: 'Faisalabad',
    rating: 5,
    quote: 'Absolutely incredible work. The attention to detail and cinematic feel exceeded expectations!',
    photos: {
      farLeft: {
        url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=85',
        caption: 'Affectionate daylight portrait in ivory & gold sherwani',
        position: 'far-left',
      },
      innerLeft: {
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85',
        caption: 'Intricate bridal henna and royal heritage jewelry details',
        position: 'inner-left',
      },
      innerRight: {
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
        caption: 'Groom royal entrance amongst guests and family',
        position: 'inner-right',
      },
      farRight: {
        url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=85',
        caption: 'Joyful candid moments during the grand reception',
        position: 'far-right',
      },
    },
  },
  {
    id: 'salman-rabia',
    couple: 'Dr. M. Salman & Dr. Rabia',
    eventType: 'Shendi',
    city: 'Islamabad',
    rating: 5,
    quote: 'Professional, punctual, and highly creative. We love every single shot!',
    photos: {
      farLeft: {
        url: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=1200&q=85',
        caption: 'Enchanted outdoor portraits under warm fairy lights',
        position: 'far-left',
      },
      innerLeft: {
        url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85',
        caption: 'Lively family dance moments on the open dancefloor',
        position: 'inner-left',
      },
      innerRight: {
        url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85',
        caption: 'Radiant bride candid laugh during ceremony rituals',
        position: 'inner-right',
      },
      farRight: {
        url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=85',
        caption: 'Rose petals and confetti shower on the grand walkway',
        position: 'far-right',
      },
    },
  },
];

export default function ClientReviewsPage() {
  // Theme state: defaults to studio's standard warm cream & teal palette (#FAF9F6 + #0D4F4F + #D4AF37)
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [activePhoto, setActivePhoto] = useState<{
    url: string;
    caption: string;
    couple: string;
    index: number;
    allPhotos: { url: string; caption: string; couple: string }[];
  } | null>(null);

  // Flatten all photos for continuous lightbox carousel
  const allStoryPhotos = CLIENT_STORIES.flatMap((story) => [
    { url: story.photos.farLeft.url, caption: story.photos.farLeft.caption, couple: story.couple },
    { url: story.photos.innerLeft.url, caption: story.photos.innerLeft.caption, couple: story.couple },
    { url: story.photos.innerRight.url, caption: story.photos.innerRight.caption, couple: story.couple },
    { url: story.photos.farRight.url, caption: story.photos.farRight.caption, couple: story.couple },
  ]);

  const openLightbox = (url: string, caption: string, couple: string) => {
    const idx = allStoryPhotos.findIndex((p) => p.url === url);
    setActivePhoto({
      url,
      caption,
      couple,
      index: idx >= 0 ? idx : 0,
      allPhotos: allStoryPhotos,
    });
  };

  const nextLightboxPhoto = () => {
    if (!activePhoto) return;
    const nextIdx = (activePhoto.index + 1) % activePhoto.allPhotos.length;
    const next = activePhoto.allPhotos[nextIdx];
    setActivePhoto({
      ...next,
      index: nextIdx,
      allPhotos: activePhoto.allPhotos,
    });
  };

  const prevLightboxPhoto = () => {
    if (!activePhoto) return;
    const prevIdx = (activePhoto.index - 1 + activePhoto.allPhotos.length) % activePhoto.allPhotos.length;
    const prev = activePhoto.allPhotos[prevIdx];
    setActivePhoto({
      ...prev,
      index: prevIdx,
      allPhotos: activePhoto.allPhotos,
    });
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePhoto) return;
      if (e.key === 'Escape') setActivePhoto(null);
      if (e.key === 'ArrowRight') nextLightboxPhoto();
      if (e.key === 'ArrowLeft') prevLightboxPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-500 overflow-x-hidden flex flex-col justify-between ${
        isDarkMode
          ? 'bg-[#090A0D] text-slate-100 selection:bg-[#D4AF37]/30 selection:text-[#F3E5AB]'
          : 'bg-[#FAF9F6] text-slate-800 selection:bg-[#0D4F4F]/20 selection:text-[#0D4F4F]'
      }`}
    >
      {/* Subtle Luxury Atmospheric Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isDarkMode ? (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-[#D4AF37]/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[350px] bg-[#0D4F4F]/10 blur-[140px] rounded-full" />
          </>
        ) : (
          <>
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-[#0D4F4F]/[0.035] via-[#D4AF37]/[0.03] to-transparent blur-[120px] rounded-full" />
            <div className="absolute top-1/2 -left-32 w-[600px] h-[400px] bg-[#D4AF37]/[0.025] blur-[140px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[700px] h-[400px] bg-[#0D4F4F]/[0.03] blur-[150px] rounded-full" />
          </>
        )}
      </div>

      {/* Top Header Bar */}
      <header
        className={`relative z-20 w-full px-6 md:px-14 pt-8 pb-5 flex items-center justify-between border-b transition-colors duration-500 backdrop-blur-md ${
          isDarkMode
            ? 'border-[#D4AF37]/15 bg-[#090A0D]/70'
            : 'border-[#D4AF37]/25 bg-[#FAF9F6]/85'
        }`}
      >
        {/* Top-Left: Understated Sans-Serif Studio Branding */}
        <div className="flex flex-col">
          <Link href="/" className="group flex items-center gap-2">
            <span
              className={`text-xs md:text-sm font-semibold tracking-[0.28em] uppercase transition-colors duration-300 ${
                isDarkMode ? 'text-[#D4AF37]' : 'text-[#0D4F4F]'
              }`}
            >
              The Snap Service
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] opacity-80" />
          </Link>
          <span
            className={`text-[9px] md:text-[10px] tracking-[0.2em] uppercase font-light mt-0.5 ${
              isDarkMode ? 'text-neutral-400' : 'text-stone-500'
            }`}
          >
            Wedding Photography & Cinematography
          </span>
        </div>

        {/* Center: Refined Minimal Serif Title */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <h1
            className={`font-serif text-2xl md:text-4xl font-normal tracking-wide transition-colors duration-500 ${
              isDarkMode
                ? 'text-[#E5C158] drop-shadow-[0_2px_10px_rgba(212,175,55,0.25)]'
                : 'text-[#0D4F4F] drop-shadow-[0_1px_4px_rgba(13,79,79,0.08)]'
            }`}
          >
            Client Reviews
          </h1>
        </div>

        {/* Top-Right: Actions (Theme Toggle & Studio Link) */}
        <div className="flex items-center gap-3">
          {/* Subtle Ambient Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
              isDarkMode
                ? 'border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                : 'border-[#0D4F4F]/20 text-[#0D4F4F] hover:bg-[#0D4F4F]/5'
            }`}
            title={isDarkMode ? 'Switch to Studio Cream' : 'Switch to Dark Mode'}
            aria-label="Toggle visual theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Visit Studio Link */}
          <Link
            href="https://thesnapservice.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[11px] md:text-xs tracking-wider uppercase font-medium px-4 py-2 rounded-full border transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              isDarkMode
                ? 'border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                : 'border-[#0D4F4F] text-[#0D4F4F] hover:bg-[#0D4F4F] hover:text-[#FAF9F6] shadow-sm'
            }`}
          >
            <span>Visit Studio</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* Main Reviews Container (Landscape 16:9 Inspired Framing) */}
      <main className="relative z-10 flex-1 w-full max-w-[1760px] mx-auto px-4 md:px-10 py-8 md:py-14 flex flex-col gap-12 md:gap-16">
        {CLIENT_STORIES.map((story, index) => {
          const isThirdPeeking = index === 2;

          return (
            <section
              key={story.id}
              className={`relative group/row transition-all duration-700 ${
                isThirdPeeking ? 'opacity-90 hover:opacity-100' : 'opacity-100'
              }`}
            >
              {/* Row Container: 5-Part Landscape Ribbon (Image - Image - Review Center - Image - Image) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 md:gap-4 items-center">
                {/* 1. Far Left Image */}
                <div
                  onClick={() => openLightbox(story.photos.farLeft.url, story.photos.farLeft.caption, story.couple)}
                  className={`md:col-span-2 group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 cursor-pointer ${
                    isDarkMode
                      ? 'border-[#D4AF37]/30 hover:border-[#E5C158] bg-neutral-900 shadow-md shadow-black/50'
                      : 'border-[#D4AF37]/35 hover:border-[#D4AF37] bg-stone-100 shadow-[0_8px_25px_rgba(13,79,79,0.06)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)]'
                  }`}
                >
                  <img
                    src={story.photos.farLeft.url}
                    alt={story.photos.farLeft.caption}
                    className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-[10px] text-white line-clamp-1 flex items-center gap-1.5 font-light">
                      <Maximize2 className="w-3 h-3 text-[#D4AF37]" /> {story.photos.farLeft.caption}
                    </span>
                  </div>
                </div>

                {/* 2. Inner Left Image */}
                <div
                  onClick={() => openLightbox(story.photos.innerLeft.url, story.photos.innerLeft.caption, story.couple)}
                  className={`md:col-span-2 group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 cursor-pointer ${
                    isDarkMode
                      ? 'border-[#D4AF37]/30 hover:border-[#E5C158] bg-neutral-900 shadow-md shadow-black/50'
                      : 'border-[#D4AF37]/35 hover:border-[#D4AF37] bg-stone-100 shadow-[0_8px_25px_rgba(13,79,79,0.06)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)]'
                  }`}
                >
                  <img
                    src={story.photos.innerLeft.url}
                    alt={story.photos.innerLeft.caption}
                    className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-[10px] text-white line-clamp-1 flex items-center gap-1.5 font-light">
                      <Maximize2 className="w-3 h-3 text-[#D4AF37]" /> {story.photos.innerLeft.caption}
                    </span>
                  </div>
                </div>

                {/* 3. Center Review Card (Sandwiched between left & right photos - Span 4 cols) */}
                <div
                  className={`md:col-span-4 px-4 md:px-7 py-7 md:py-9 text-center flex flex-col items-center justify-center relative rounded-3xl border transition-all duration-500 ${
                    isDarkMode
                      ? 'border-[#D4AF37]/25 bg-[#0D0E12]/80 backdrop-blur-sm shadow-[0_6px_28px_rgba(0,0,0,0.6)]'
                      : 'border-[#D4AF37]/30 bg-white/90 backdrop-blur-sm shadow-[0_10px_35px_rgba(13,79,79,0.05)]'
                  }`}
                >
                  {/* Subtle Gold Accent Filigree */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-7 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]/70" />
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="w-7 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]/70" />
                  </div>

                  {/* Couple Name in Gold */}
                  <h2 className="font-serif text-2xl md:text-3xl text-[#D4AF37] font-medium tracking-wide mb-2 drop-shadow-[0_1px_3px_rgba(212,175,55,0.25)]">
                    {story.couple}
                  </h2>

                  {/* 5 Stars in Gold */}
                  <div className="flex items-center justify-center gap-1 mb-3.5">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_1px_3px_rgba(212,175,55,0.35)]"
                      />
                    ))}
                  </div>

                  {/* Client Quote in White (in Dark mode) or Rich Midnight Slate (in Standard Cream mode) */}
                  <blockquote
                    className={`text-sm md:text-[15px] leading-relaxed font-normal italic max-w-sm mx-auto mb-4 px-2 transition-colors duration-500 ${
                      isDarkMode ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    &ldquo;{story.quote}&rdquo;
                  </blockquote>

                  {/* Event & City Tag in Gold */}
                  <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-[#D4AF37] font-semibold border-t border-[#D4AF37]/30 pt-2.5">
                    <span>{story.eventType}</span>
                    <span className="opacity-50">•</span>
                    <span>{story.city}</span>
                  </div>
                </div>

                {/* 4. Inner Right Image */}
                <div
                  onClick={() => openLightbox(story.photos.innerRight.url, story.photos.innerRight.caption, story.couple)}
                  className={`md:col-span-2 group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 cursor-pointer ${
                    isDarkMode
                      ? 'border-[#D4AF37]/30 hover:border-[#E5C158] bg-neutral-900 shadow-md shadow-black/50'
                      : 'border-[#D4AF37]/35 hover:border-[#D4AF37] bg-stone-100 shadow-[0_8px_25px_rgba(13,79,79,0.06)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)]'
                  }`}
                >
                  <img
                    src={story.photos.innerRight.url}
                    alt={story.photos.innerRight.caption}
                    className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-[10px] text-white line-clamp-1 flex items-center gap-1.5 font-light">
                      <Maximize2 className="w-3 h-3 text-[#D4AF37]" /> {story.photos.innerRight.caption}
                    </span>
                  </div>
                </div>

                {/* 5. Far Right Image */}
                <div
                  onClick={() => openLightbox(story.photos.farRight.url, story.photos.farRight.caption, story.couple)}
                  className={`md:col-span-2 group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 cursor-pointer ${
                    isDarkMode
                      ? 'border-[#D4AF37]/30 hover:border-[#E5C158] bg-neutral-900 shadow-md shadow-black/50'
                      : 'border-[#D4AF37]/35 hover:border-[#D4AF37] bg-stone-100 shadow-[0_8px_25px_rgba(13,79,79,0.06)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)]'
                  }`}
                >
                  <img
                    src={story.photos.farRight.url}
                    alt={story.photos.farRight.caption}
                    className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="text-[10px] text-white line-clamp-1 flex items-center gap-1.5 font-light">
                      <Maximize2 className="w-3 h-3 text-[#D4AF37]" /> {story.photos.farRight.caption}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delicate Gold Separator Line Between Stories */}
              {index < CLIENT_STORIES.length - 1 && (
                <div
                  className={`w-full h-[1px] mt-12 md:mt-16 transition-colors duration-500 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/25 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent'
                  }`}
                />
              )}
            </section>
          );
        })}

        {/* Suggestion of More Stories Below (Row 3 peeking hint / smooth gradient) */}
        <div className="relative pt-6 pb-6 text-center flex flex-col items-center">
          <div
            className={`h-12 w-[1px] ${
              isDarkMode
                ? 'bg-gradient-to-b from-[#D4AF37]/50 to-transparent'
                : 'bg-gradient-to-b from-[#0D4F4F]/40 to-transparent'
            }`}
          />
          <span
            className={`text-[11px] tracking-[0.25em] uppercase font-medium mt-3 ${
              isDarkMode ? 'text-[#D4AF37]' : 'text-[#0D4F4F]'
            }`}
          >
            Endless Celebrations & Love Stories Documented
          </span>
          <div
            className={`flex items-center gap-2 mt-1.5 text-xs font-light ${
              isDarkMode ? 'text-neutral-400' : 'text-stone-500'
            }`}
          >
            <span>Lahore</span>
            <span>•</span>
            <span>Faisalabad</span>
            <span>•</span>
            <span>Islamabad</span>
            <span>•</span>
            <span>Worldwide Destination Weddings</span>
          </div>
        </div>
      </main>

      {/* Understated Minimalist Footer */}
      <footer
        className={`relative z-20 w-full px-6 md:px-14 py-6 border-t transition-colors duration-500 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-xs gap-3 ${
          isDarkMode
            ? 'border-[#D4AF37]/15 bg-[#090A0D]/85 text-neutral-400'
            : 'border-[#D4AF37]/25 bg-[#FAF9F6]/90 text-stone-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className={`font-semibold tracking-wider ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#0D4F4F]'}`}>
            THE SNAP SERVICE
          </span>
          <span className="opacity-40">|</span>
          <span className="font-light">Official Luxury Client Gallery</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/portal"
            className={`transition-colors tracking-wide ${
              isDarkMode ? 'hover:text-[#D4AF37]' : 'hover:text-[#0D4F4F]'
            }`}
          >
            Client Portal
          </Link>
          <a
            href="https://wa.me/923000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4AF37] font-medium hover:underline tracking-wide"
          >
            Inquire for Dates
          </a>
        </div>
      </footer>

      {/* Interactive 4K Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 md:p-8 animate-in fade-in duration-300">
          {/* Top Controls Bar */}
          <div className="w-full flex items-center justify-between z-10 max-w-6xl">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-medium">
                {activePhoto.couple}
              </span>
              <span className="text-xs text-neutral-300 font-light mt-0.5">
                {activePhoto.caption}
              </span>
            </div>
            <button
              onClick={() => setActivePhoto(null)}
              className="p-2 rounded-full border border-[#D4AF37]/40 text-neutral-200 hover:text-white hover:border-[#D4AF37] bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              aria-label="Close photo preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image in Lightbox */}
          <div className="relative max-w-6xl max-h-[78vh] w-full flex items-center justify-center my-auto">
            <button
              onClick={prevLightboxPhoto}
              className="absolute left-2 md:-left-12 p-3 rounded-full border border-[#D4AF37]/40 text-neutral-200 hover:text-[#D4AF37] bg-black/60 hover:bg-black/90 transition-all z-20 cursor-pointer"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-2xl shadow-black max-h-[76vh]">
              <img
                src={activePhoto.url}
                alt={activePhoto.caption}
                className="max-h-[76vh] w-auto object-contain mx-auto"
              />
            </div>

            <button
              onClick={nextLightboxPhoto}
              className="absolute right-2 md:-right-12 p-3 rounded-full border border-[#D4AF37]/40 text-neutral-200 hover:text-[#D4AF37] bg-black/60 hover:bg-black/90 transition-all z-20 cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Photo Indicator */}
          <div className="text-center text-xs tracking-widest uppercase text-neutral-400 font-light z-10">
            Photo {activePhoto.index + 1} of {activePhoto.allPhotos.length} • Press Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
