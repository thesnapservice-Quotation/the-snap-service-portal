'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Moon,
  Sun,
  ArrowUpRight,
  Film,
  Sliders,
} from 'lucide-react';
import { ClientStory } from '@/lib/types';
import { DEFAULT_CLIENT_STORIES } from '@/lib/defaults';
import { storage } from '@/lib/storage';
import { parseVideoEmbed } from '@/lib/video-embed';

export default function ClientReviewsPage() {
  // Theme state: defaults to studio's standard warm cream & teal palette (#FAF9F6 + #0D4F4F + #D4AF37)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic Stories loaded from Database / Local Storage
  const [stories, setStories] = useState<ClientStory[]>(() => {
    if (typeof window !== 'undefined') {
      return storage.getClientReviews();
    }
    return DEFAULT_CLIENT_STORIES;
  });

  // Mobile Slide index (one client review story per slide on phone screens)
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Fetch latest saved reviews and custom order from central database
  useEffect(() => {
    let isMounted = true;
    async function loadFreshReviews() {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
            if (isMounted) {
              setStories(data.reviews);
              storage.saveClientReviews(data.reviews);
            }
          }
        }
      } catch (err) {
        console.warn('Using offline cached reviews:', err);
      }
    }

    loadFreshReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for local updates dispatched by admin panel
  useEffect(() => {
    const handleLocalUpdate = () => {
      setStories(storage.getClientReviews());
    };
    window.addEventListener('snap_client_reviews_updated', handleLocalUpdate);
    return () => window.removeEventListener('snap_client_reviews_updated', handleLocalUpdate);
  }, []);

  // Mobile navigation handlers
  const nextMobileSlide = () => {
    setMobileSlideIndex((prev) => (prev + 1) % stories.length);
  };

  const prevMobileSlide = () => {
    setMobileSlideIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      nextMobileSlide();
    } else if (diff < -45) {
      prevMobileSlide();
    }
    setTouchStartX(null);
  };

  const currentMobileStory = stories[mobileSlideIndex] || stories[0];

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
        className={`relative z-20 w-full px-4 sm:px-6 md:px-14 pt-6 md:pt-8 pb-4 md:pb-5 flex items-center justify-between border-b transition-colors duration-500 backdrop-blur-md ${
          isDarkMode
            ? 'border-[#D4AF37]/15 bg-[#090A0D]/75'
            : 'border-[#D4AF37]/25 bg-[#FAF9F6]/85'
        }`}
      >
        {/* Left: Understated Sans-Serif Studio Branding */}
        <div className="flex flex-col">
          <Link href="/" className="group flex items-center gap-1.5 md:gap-2">
            <span
              className={`text-xs md:text-sm font-semibold tracking-[0.24em] md:tracking-[0.28em] uppercase transition-colors duration-300 ${
                isDarkMode ? 'text-[#D4AF37]' : 'text-[#0D4F4F]'
              }`}
            >
              The Snap Service
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] opacity-80" />
          </Link>
          <span
            className={`text-[9px] md:text-[10px] tracking-[0.18em] uppercase font-light mt-0.5 ${
              isDarkMode ? 'text-neutral-400' : 'text-stone-500'
            }`}
          >
            Wedding Photography & Cinematography
          </span>
        </div>

        {/* Center: Refined Minimal Serif Title (Desktop only, mobile renders below header) */}
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <h1
            className={`font-serif text-3xl lg:text-4xl font-normal tracking-wide transition-colors duration-500 ${
              isDarkMode
                ? 'text-[#E5C158] drop-shadow-[0_2px_10px_rgba(212,175,55,0.25)]'
                : 'text-[#0D4F4F] drop-shadow-[0_1px_4px_rgba(13,79,79,0.08)]'
            }`}
          >
            Client Reviews
          </h1>
        </div>

        {/* Right: Actions (Theme Toggle, Admin Manage & Studio Link) */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Subtle Ambient Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 md:p-2 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
              isDarkMode
                ? 'border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                : 'border-[#0D4F4F]/20 text-[#0D4F4F] hover:bg-[#0D4F4F]/5'
            }`}
            title={isDarkMode ? 'Switch to Studio Cream' : 'Switch to Dark Mode'}
            aria-label="Toggle visual theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Moon className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </button>

          {/* Admin Manage Link (discreet shortcut) */}
          <Link
            href="/reviews/manage"
            className={`p-1.5 md:p-2 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
              isDarkMode
                ? 'border-neutral-800 text-neutral-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/40'
                : 'border-stone-200 text-stone-500 hover:text-[#0D4F4F] hover:border-[#0D4F4F]/30'
            }`}
            title="Manage Reviews (Admin)"
          >
            <Sliders className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Link>

          {/* Visit Studio Link */}
          <Link
            href="https://thesnapservice.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[10px] md:text-xs tracking-wider uppercase font-medium px-3 md:px-4 py-1.5 md:py-2 rounded-full border transition-all duration-300 flex items-center gap-1 cursor-pointer ${
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

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-[1760px] mx-auto px-4 md:px-10 py-6 md:py-14">
        {/* ============================================================== */}
        {/* MOBILE VIEW (< md): Single-Slide Showcase with Compact Photos */}
        {/* Each client review fits cleanly into a single slide card       */}
        {/* ============================================================== */}
        <div className="block md:hidden">
          {/* Mobile Page Title */}
          <div className="text-center mb-4">
            <h1
              className={`font-serif text-2xl font-normal tracking-wide ${
                isDarkMode ? 'text-[#E5C158]' : 'text-[#0D4F4F]'
              }`}
            >
              Client Reviews
            </h1>
            <p
              className={`text-[10px] tracking-[0.2em] uppercase mt-1 ${
                isDarkMode ? 'text-neutral-400' : 'text-stone-500'
              }`}
            >
              Real Couples • Real Moments
            </p>
          </div>

          {/* Client Selection Pills */}
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none px-1">
            {stories.map((s, idx) => {
              const isActive = mobileSlideIndex === idx;
              return (
                <button
                  key={s.id}
                  onClick={() => setMobileSlideIndex(idx)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-300 border cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37] shadow-sm font-semibold'
                        : 'bg-[#0D4F4F] text-[#FAF9F6] border-[#0D4F4F] shadow-sm font-semibold'
                      : isDarkMode
                      ? 'bg-neutral-900/70 text-neutral-300 border-neutral-800 hover:border-[#D4AF37]/40'
                      : 'bg-white/80 text-stone-600 border-stone-200 hover:border-[#D4AF37]/50'
                  }`}
                >
                  {s.couple}
                </button>
              );
            })}
          </div>

          {/* Single-Slide Card for Active Client */}
          {currentMobileStory && (
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`relative rounded-3xl border transition-all duration-500 p-4 sm:p-5 flex flex-col gap-3.5 shadow-xl ${
                isDarkMode
                  ? 'border-[#D4AF37]/30 bg-[#0E1015]/90 shadow-black/50'
                  : 'border-[#D4AF37]/35 bg-white/95 shadow-[0_10px_35px_rgba(13,79,79,0.06)]'
              }`}
            >
              {/* Top Navigation Bar inside Card */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#D4AF37]/15">
                <span
                  className={`text-[10px] tracking-[0.2em] uppercase font-medium ${
                    isDarkMode ? 'text-[#D4AF37]' : 'text-[#0D4F4F]'
                  }`}
                >
                  Story {mobileSlideIndex + 1} of {stories.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevMobileSlide}
                    className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'border-neutral-800 text-neutral-300 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                        : 'border-stone-200 text-stone-600 hover:border-[#0D4F4F] hover:text-[#0D4F4F]'
                    }`}
                    aria-label="Previous client story"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={nextMobileSlide}
                    className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'border-neutral-800 text-neutral-300 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                        : 'border-stone-200 text-stone-600 hover:border-[#0D4F4F] hover:text-[#0D4F4F]'
                    }`}
                    aria-label="Next client story"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Couple Review Meta (Centerpiece) */}
              <div className="text-center flex flex-col items-center pt-1">
                {/* Couple Name in Gold */}
                <h2 className="font-serif text-2xl text-[#D4AF37] font-medium tracking-wide mb-1 drop-shadow-[0_1px_3px_rgba(212,175,55,0.25)]">
                  {currentMobileStory.couple}
                </h2>

                {/* 5 Stars in Gold */}
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(currentMobileStory.rating || 5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_1px_2px_rgba(212,175,55,0.35)]"
                    />
                  ))}
                </div>

                {/* Client Quote */}
                <blockquote
                  className={`text-xs leading-relaxed font-normal italic max-w-xs mx-auto mb-2 px-1 transition-colors duration-500 ${
                    isDarkMode ? 'text-white/95' : 'text-slate-700'
                  }`}
                >
                  &ldquo;{currentMobileStory.quote}&rdquo;
                </blockquote>

                {/* Event & City Tag */}
                <div className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-[#D4AF37] font-semibold border-t border-[#D4AF37]/25 pt-1.5">
                  <span>{currentMobileStory.eventType}</span>
                  <span className="opacity-50">•</span>
                  <span>{currentMobileStory.city}</span>
                </div>
              </div>

              {/* Compact 2x2 Photo Showcase: Clean, No Caption, Hover Zoom Only */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  currentMobileStory.photos.farLeft,
                  currentMobileStory.photos.innerLeft,
                  currentMobileStory.photos.innerRight,
                  currentMobileStory.photos.farRight,
                ].map((photo, pIdx) => (
                  <div
                    key={pIdx}
                    className={`group relative aspect-[4/3] rounded-xl overflow-hidden border transition-all duration-300 ${
                      isDarkMode
                        ? 'border-[#D4AF37]/30 bg-neutral-900 shadow-sm'
                        : 'border-[#D4AF37]/35 bg-stone-100 shadow-sm'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt="Wedding story photo"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {/* ============================================================== */}
              {/* VIDEO EMBED IN MOBILE SLIDE (YouTube / Instagram)               */}
              {/* "video neechy show ho gi har client k agar kisi client ki       */}
              {/* video nahi toh box bhi show na ho video wala"                   */}
              {/* ============================================================== */}
              {(() => {
                const videoInfo = parseVideoEmbed(currentMobileStory.videoUrl);
                if (!videoInfo.isValid || !videoInfo.embedUrl) return null;

                return (
                  <div className="mt-2 pt-2 border-t border-[#D4AF37]/25 flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                      <Film className="w-3 h-3" />
                      <span>Cinematic Wedding Film</span>
                    </div>
                    <div
                      className={`w-full rounded-xl overflow-hidden border border-[#D4AF37]/40 shadow-md bg-black ${
                        videoInfo.type === 'youtube'
                          ? 'aspect-video'
                          : 'aspect-[9/16] min-h-[340px]'
                      }`}
                    >
                      <iframe
                        src={videoInfo.embedUrl}
                        title={`${currentMobileStory.couple} Film`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Swipe Navigation Hint */}
              <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-400 font-light">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" /> The Snap Service Studio
                </span>
                <span className="tracking-wide">Swipe to next story &rarr;</span>
              </div>

              {/* Animated Pagination Indicators */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {stories.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMobileSlideIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      mobileSlideIndex === idx
                        ? 'w-6 bg-[#D4AF37]'
                        : isDarkMode
                        ? 'w-1.5 bg-neutral-700 hover:bg-neutral-500'
                        : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                    }`}
                    aria-label={`Go to story ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* DESKTOP VIEW (>= md): Signature 16:9 Landscape 5-Part Ribbon   */}
        {/* [Far Left] [Inner Left] [Center Review] [Inner Right] [Far Right]*/}
        {/* With Video Player Underneath if Present                        */}
        {/* Clean Photos: No Captions, No Full Screen Modal                */}
        {/* ============================================================== */}
        <div className="hidden md:flex md:flex-col gap-14 lg:gap-18">
          {stories.map((story, index) => {
            const isLastPeeking = index === stories.length - 1 && stories.length >= 3;
            const videoInfo = parseVideoEmbed(story.videoUrl);

            return (
              <section
                key={story.id}
                className={`relative group/row transition-all duration-700 ${
                  isLastPeeking ? 'opacity-90 hover:opacity-100' : 'opacity-100'
                }`}
              >
                {/* 5-Part Landscape Ribbon Container */}
                <div className="grid grid-cols-12 gap-3.5 lg:gap-4 items-center">
                  {/* 1. Far Left Image */}
                  <div
                    className={`col-span-2 group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 ${
                      isDarkMode
                        ? 'border-[#D4AF37]/30 hover:border-[#E5C158] bg-neutral-900 shadow-md shadow-black/50'
                        : 'border-[#D4AF37]/35 hover:border-[#D4AF37] bg-stone-100 shadow-[0_8px_25px_rgba(13,79,79,0.06)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)]'
                    }`}
                  >
                    <img
                      src={story.photos.farLeft.url}
                      alt="Far left wedding photo"
                      className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  </div>

                  {/* 2. Inner Left Image */}
                  <div
                    className={`col-span-2 group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 ${
                      isDarkMode
                        ? 'border-[#D4AF37]/30 hover:border-[#E5C158] bg-neutral-900 shadow-md shadow-black/50'
                        : 'border-[#D4AF37]/35 hover:border-[#D4AF37] bg-stone-100 shadow-[0_8px_25px_rgba(13,79,79,0.06)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)]'
                    }`}
                  >
                    <img
                      src={story.photos.innerLeft.url}
                      alt="Inner left wedding photo"
                      className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  </div>

                  {/* 3. Center Review Card (Sandwiched between left & right photos - Span 4 cols) */}
                  <div
                    className={`col-span-4 px-5 lg:px-7 py-7 lg:py-9 text-center flex flex-col items-center justify-center relative rounded-3xl border transition-all duration-500 ${
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
                    <h2 className="font-serif text-2xl lg:text-3xl text-[#D4AF37] font-medium tracking-wide mb-2 drop-shadow-[0_1px_3px_rgba(212,175,55,0.25)]">
                      {story.couple}
                    </h2>

                    {/* 5 Stars in Gold */}
                    <div className="flex items-center justify-center gap-1 mb-3.5">
                      {[...Array(story.rating || 5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37] drop-shadow-[0_1px_3px_rgba(212,175,55,0.35)]"
                        />
                      ))}
                    </div>

                    {/* Client Quote */}
                    <blockquote
                      className={`text-sm lg:text-[15px] leading-relaxed font-normal italic max-w-sm mx-auto mb-4 px-2 transition-colors duration-500 ${
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
                    className={`col-span-2 group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 ${
                      isDarkMode
                        ? 'border-[#D4AF37]/30 hover:border-[#E5C158] bg-neutral-900 shadow-md shadow-black/50'
                        : 'border-[#D4AF37]/35 hover:border-[#D4AF37] bg-stone-100 shadow-[0_8px_25px_rgba(13,79,79,0.06)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)]'
                    }`}
                  >
                    <img
                      src={story.photos.innerRight.url}
                      alt="Inner right wedding photo"
                      className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  </div>

                  {/* 5. Far Right Image */}
                  <div
                    className={`col-span-2 group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 ${
                      isDarkMode
                        ? 'border-[#D4AF37]/30 hover:border-[#E5C158] bg-neutral-900 shadow-md shadow-black/50'
                        : 'border-[#D4AF37]/35 hover:border-[#D4AF37] bg-stone-100 shadow-[0_8px_25px_rgba(13,79,79,0.06)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.18)]'
                    }`}
                  >
                    <img
                      src={story.photos.farRight.url}
                      alt="Far right wedding photo"
                      className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* ============================================================== */}
                {/* VIDEO EMBED UNDERNEATH CLIENT ROW                              */}
                {/* "video neechy show ho gi har client k agar kisi client ki       */}
                {/* video nahi toh box bhi show na ho video wala"                   */}
                {/* ============================================================== */}
                {videoInfo.isValid && videoInfo.embedUrl && (
                  <div className="mt-8 flex flex-col items-center animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                      <Film className="w-3.5 h-3.5" />
                      <span>{story.couple} • Cinematic Wedding Film</span>
                    </div>
                    <div
                      className={`w-full rounded-2xl overflow-hidden border border-[#D4AF37]/35 shadow-2xl bg-black ${
                        videoInfo.type === 'youtube'
                          ? 'max-w-3xl aspect-video'
                          : 'max-w-md aspect-[9/16] min-h-[460px]'
                      }`}
                    >
                      <iframe
                        src={videoInfo.embedUrl}
                        title={`${story.couple} Wedding Film`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* Delicate Gold Separator Line Between Stories */}
                {index < stories.length - 1 && (
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
        </div>

        {/* Suggestion of More Stories Below */}
        <div className="relative pt-8 pb-4 text-center flex flex-col items-center">
          <div
            className={`h-10 w-[1px] ${
              isDarkMode
                ? 'bg-gradient-to-b from-[#D4AF37]/50 to-transparent'
                : 'bg-gradient-to-b from-[#0D4F4F]/40 to-transparent'
            }`}
          />
          <span
            className={`text-[10px] md:text-[11px] tracking-[0.25em] uppercase font-medium mt-3 ${
              isDarkMode ? 'text-[#D4AF37]' : 'text-[#0D4F4F]'
            }`}
          >
            Endless Celebrations & Love Stories Documented
          </span>
          <div
            className={`flex flex-wrap items-center justify-center gap-2 mt-1.5 text-[11px] md:text-xs font-light ${
              isDarkMode ? 'text-neutral-400' : 'text-stone-500'
            }`}
          >
            <span>Lahore</span>
            <span>•</span>
            <span>Faisalabad</span>
            <span>•</span>
            <span>Islamabad</span>
            <span>•</span>
            <span>Worldwide Destinations</span>
          </div>
        </div>
      </main>

      {/* Understated Minimalist Footer */}
      <footer
        className={`relative z-20 w-full px-4 sm:px-6 md:px-14 py-5 md:py-6 border-t transition-colors duration-500 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-[11px] md:text-xs gap-3 ${
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
        <div className="flex items-center gap-5 md:gap-6">
          <Link
            href="/reviews/manage"
            className={`transition-colors tracking-wide ${
              isDarkMode ? 'hover:text-[#D4AF37]' : 'hover:text-[#0D4F4F]'
            }`}
          >
            Manage Reviews
          </Link>
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
    </div>
  );
}
