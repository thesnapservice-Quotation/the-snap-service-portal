'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Star,
  Plus,
  Trash2,
  Upload,
  Save,
  Check,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  Video,
  Film,
  Camera,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ClientStory, ReviewPhoto } from '@/lib/types';
import { DEFAULT_CLIENT_STORIES } from '@/lib/defaults';
import { storage } from '@/lib/storage';
import { parseVideoEmbed, ParsedVideoEmbed } from '@/lib/video-embed';
import { compressAndReadFileAsDataUrl } from '@/lib/image-upload';

export default function ManageClientReviewsPage() {
  const [reviews, setReviews] = useState<ClientStory[]>(() => storage.getClientReviews());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<{ storyId: string; slot: string } | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Fetch reviews from API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      try {
        setLoading(true);
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
            if (isMounted) {
              setReviews(data.reviews);
              storage.saveClientReviews(data.reviews);
            }
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load reviews from API, using local cache:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save reviews to API and local storage
  const handleSave = async (reviewsToSave = reviews) => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    // Normalize order
    const ordered = reviewsToSave.map((r, i) => ({
      ...r,
      order: i + 1,
    }));

    try {
      storage.saveClientReviews(ordered);

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: ordered }),
      });

      if (!res.ok) {
        throw new Error('Failed to save to central database');
      }

      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Error saving reviews:', err);
      setErrorMessage(err.message || 'Error saving changes. Changes saved to local cache.');
    } finally {
      setSaving(false);
    }
  };

  // Reordering helpers
  const moveStory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reviews.length) return;

    const updated = [...reviews];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setReviews(updated);
    handleSave(updated);
  };

  const makeFirst = (index: number) => {
    if (index === 0) return;
    const updated = [...reviews];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);

    setReviews(updated);
    handleSave(updated);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const updated = [...reviews];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(dragOverIndex, 0, moved);
      setReviews(updated);
      handleSave(updated);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Field update handlers
  const updateStoryField = (id: string, field: keyof ClientStory, value: any) => {
    setReviews((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const updatePhoto = (
    storyId: string,
    slot: 'farLeft' | 'innerLeft' | 'innerRight' | 'farRight',
    field: keyof ReviewPhoto,
    value: string
  ) => {
    setReviews((prev) =>
      prev.map((s) => {
        if (s.id !== storyId) return s;
        return {
          ...s,
          photos: {
            ...s.photos,
            [slot]: {
              ...s.photos[slot],
              [field]: value,
            },
          },
        };
      })
    );
  };

  // Image file upload handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    storyId: string,
    slot: 'farLeft' | 'innerLeft' | 'innerRight' | 'farRight'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSlot({ storyId, slot });
      const dataUrl = await compressAndReadFileAsDataUrl(file, 1400, 1400, 0.84);
      updatePhoto(storyId, slot, 'url', dataUrl);
    } catch (err) {
      console.error('Failed to compress and upload photo:', err);
      alert('Error reading image file. Please try another image.');
    } finally {
      setUploadingSlot(null);
    }
  };

  // Add new story
  const handleAddStory = () => {
    const newId = `story-${Date.now()}`;
    const newStory: ClientStory = {
      id: newId,
      couple: 'New Couple',
      eventType: 'Baraat & Reception',
      city: 'Lahore',
      rating: 5,
      quote: 'Write the memorable review from the couple here...',
      videoUrl: '',
      order: reviews.length + 1,
      photos: {
        farLeft: {
          url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85',
          caption: 'Candid photo of bride and groom',
          position: 'far-left',
        },
        innerLeft: {
          url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
          caption: 'Stage and decor details',
          position: 'inner-left',
        },
        innerRight: {
          url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85',
          caption: 'Couple grand entrance under floral canopy',
          position: 'inner-right',
        },
        farRight: {
          url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85',
          caption: 'Family and friends celebrating',
          position: 'far-right',
        },
      },
    };

    const updated = [...reviews, newStory];
    setReviews(updated);
    setExpandedId(newId);
    handleSave(updated);
  };

  // Delete story
  const handleDeleteStory = (id: string, couple: string) => {
    if (!window.confirm(`Are you sure you want to delete review story for "${couple}"?`)) return;
    const updated = reviews.filter((s) => s.id !== id);
    setReviews(updated);
    if (expandedId === id) setExpandedId(null);
    handleSave(updated);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#0D4F4F] font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Studio Public Showcase</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-800">
            Client Reviews & Stories
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Drag to reorder who shows first, upload event pictures, and embed YouTube / Instagram wedding films.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#0D4F4F]/30 text-[#0D4F4F] hover:bg-[#0D4F4F]/5 transition-all shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Live Page</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>

          <button
            onClick={handleAddStory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#D4AF37] bg-[#D4AF37]/15 text-[#917215] hover:bg-[#D4AF37]/25 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client Story</span>
          </button>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0D4F4F] text-[#FAF9F6] hover:bg-[#093A3A] transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Saved & Live!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Review changes and order updated successfully! The live public page is refreshed.</span>
          </div>
          <Link
            href="/reviews"
            target="_blank"
            className="text-xs font-bold underline text-emerald-700 hover:text-emerald-900"
          >
            Open Live Reviews &rarr;
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Guide Banner */}
      <div className="bg-[#FAF9F6] border border-[#D4AF37]/35 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D4F4F]/10 border border-[#0D4F4F]/20 flex items-center justify-center shrink-0">
            <GripVertical className="w-5 h-5 text-[#0D4F4F]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              Drag Up/Down or Click &ldquo;Show First&rdquo; to Change Order
            </h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              The top story (#1) is shown first on both desktop and mobile. Click any client to upload photos or embed wedding videos.
            </p>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-[#0D4F4F] bg-white px-3 py-1.5 rounded-lg border border-stone-200 shrink-0">
          Total Stories: {reviews.length}
        </div>
      </div>

      {/* Stories List (Collapsible Accordion with Drag & Drop) */}
      <div className="space-y-3">
        {reviews.map((story, index) => {
          const isExpanded = expandedId === story.id;
          const isFirst = index === 0;
          const isLast = index === reviews.length - 1;
          const isBeingDragged = draggedIndex === index;
          const isDragTarget = dragOverIndex === index;
          const videoInfo = parseVideoEmbed(story.videoUrl);

          return (
            <div
              key={story.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-2xl border transition-all duration-200 bg-white shadow-xs ${
                isDragTarget
                  ? 'border-2 border-[#D4AF37] ring-2 ring-[#D4AF37]/20 scale-[1.01]'
                  : isExpanded
                  ? 'border-[#0D4F4F]/40 ring-1 ring-[#0D4F4F]/10'
                  : 'border-stone-200 hover:border-stone-300'
              } ${isBeingDragged ? 'opacity-40' : 'opacity-100'}`}
            >
              {/* ============================================================== */}
              {/* COLLAPSED ROW HEADER: Clean view with Name, Rank & Quick Actions */}
              {/* ============================================================== */}
              <div
                className={`p-3.5 sm:p-4.5 flex items-center justify-between gap-3 cursor-pointer select-none rounded-t-2xl ${
                  isExpanded ? 'bg-stone-50/70 border-b border-stone-200' : 'hover:bg-stone-50/50'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : story.id)}
              >
                {/* Left: Drag Handle, Rank Badge & Client Name */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  {/* Drag Handle */}
                  <div
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 cursor-grab active:cursor-grabbing transition-colors"
                    title="Drag to reorder"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Rank Badge */}
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                      isFirst
                        ? 'bg-[#D4AF37] text-slate-900 shadow-xs'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {isFirst ? '⭐ Rank #1 (Shows First)' : `Rank #${index + 1}`}
                  </span>

                  {/* Client Name & Details */}
                  <div className="min-w-0">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-slate-800 truncate">
                      {story.couple || 'Untitled Story'}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
                      <span>{story.eventType}</span>
                      <span>•</span>
                      <span>{story.city}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Video Status Badge */}
                  {videoInfo.isValid ? (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      <Film className="w-2.5 h-2.5" />
                      <span>{videoInfo.type === 'youtube' ? 'YouTube' : 'Instagram'} Video</span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex text-[10px] text-stone-400 px-2 py-0.5 rounded-full bg-stone-50">
                      No Video
                    </span>
                  )}

                  {/* Rating Stars Preview */}
                  <div className="hidden md:flex items-center gap-0.5">
                    {[...Array(story.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                    ))}
                  </div>

                  {/* Make First Quick Button */}
                  {!isFirst && (
                    <button
                      onClick={() => makeFirst(index)}
                      className="p-1.5 rounded-lg text-xs font-semibold text-[#917215] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 transition-colors"
                      title="Move to position #1 (Show First)"
                    >
                      Show First
                    </button>
                  )}

                  {/* Move Up / Down Buttons */}
                  <button
                    onClick={() => moveStory(index, 'up')}
                    disabled={isFirst}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => moveStory(index, 'down')}
                    disabled={isLast}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Expand / Collapse Chevron */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : story.id)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                    title={isExpanded ? 'Collapse' : 'Edit photos & details'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ============================================================== */}
              {/* EXPANDED EDITOR: Details, Video Embed & 4 Image Upload Slots    */}
              {/* ============================================================== */}
              {isExpanded && (
                <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
                  {/* Basic Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Couple Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700">
                        Couple Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={story.couple}
                        onChange={(e) => updateStoryField(story.id, 'couple', e.target.value)}
                        placeholder="e.g. Sarah & Zain"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#0D4F4F] focus:ring-1 focus:ring-[#0D4F4F]"
                      />
                    </div>

                    {/* Event Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Event Type</label>
                      <input
                        type="text"
                        value={story.eventType}
                        onChange={(e) => updateStoryField(story.id, 'eventType', e.target.value)}
                        placeholder="e.g. Mehndi Night"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#0D4F4F] focus:ring-1 focus:ring-[#0D4F4F]"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">City</label>
                      <input
                        type="text"
                        value={story.city}
                        onChange={(e) => updateStoryField(story.id, 'city', e.target.value)}
                        placeholder="e.g. Lahore"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#0D4F4F] focus:ring-1 focus:ring-[#0D4F4F]"
                      />
                    </div>
                  </div>

                  {/* Rating & Review Quote */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-700">Client Rating:</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => updateStoryField(story.id, 'rating', stars)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                (story.rating || 5) >= stars
                                  ? 'fill-[#D4AF37] text-[#D4AF37]'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-stone-500 font-medium">({story.rating || 5} Stars)</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Client Review Quote <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={story.quote}
                        onChange={(e) => updateStoryField(story.id, 'quote', e.target.value)}
                        placeholder="The candid moments captured are breathtaking! The team made us so comfortable."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#0D4F4F] focus:ring-1 focus:ring-[#0D4F4F]"
                      />
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* VIDEO EMBED SECTION (YouTube / Instagram Reel)                  */}
                  {/* "video neechy show ho gi har client k agar kisi client ki       */}
                  {/* video nahi toh box bhi show na ho video wala"                   */}
                  {/* ============================================================== */}
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-[#0D4F4F]" />
                        <h4 className="text-xs font-bold text-slate-800">
                          Video Embed (YouTube or Instagram Reel / Video)
                        </h4>
                      </div>
                      {videoInfo.isValid && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Valid {videoInfo.type === 'youtube' ? 'YouTube' : 'Instagram'} link
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={story.videoUrl || ''}
                          onChange={(e) => updateStoryField(story.id, 'videoUrl', e.target.value)}
                          placeholder="e.g. https://www.youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                          className="w-full px-3 py-2 pr-9 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#0D4F4F] focus:ring-1 focus:ring-[#0D4F4F]"
                        />
                        {story.videoUrl && (
                          <button
                            onClick={() => updateStoryField(story.id, 'videoUrl', '')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                            title="Clear video"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Paste a YouTube link (watch, share, shorts) or Instagram link (reel, post).{' '}
                        <strong className="text-stone-700">Agar link blank chorenge toh public page par video box show nahi hoga.</strong>
                      </p>
                    </div>

                    {/* Live Video Preview Box in Admin */}
                    {videoInfo.embedUrl && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-stone-700 mb-1.5 block">
                          Preview Player:
                        </span>
                        <div
                          className={`rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-black ${
                            videoInfo.type === 'youtube' ? 'aspect-video max-w-md' : 'max-w-xs aspect-[9/16] min-h-[360px]'
                          }`}
                        >
                          <iframe
                            src={videoInfo.embedUrl}
                            title={`${story.couple} Preview`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ============================================================== */}
                  {/* 4 PHOTO SLOTS: With Image Upload & URL input                    */}
                  {/* ============================================================== */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#0D4F4F]" />
                        <h4 className="text-xs font-bold text-slate-800">
                          Story Pictures (4 Positions: Far Left, Inner Left, Inner Right, Far Right)
                        </h4>
                      </div>
                      <span className="text-[11px] text-stone-400 font-medium">Click &ldquo;Upload&rdquo; or paste URL</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(
                        [
                          { slot: 'farLeft', label: '1. Far Left (Candid Couple)' },
                          { slot: 'innerLeft', label: '2. Inner Left (Stage / Decor)' },
                          { slot: 'innerRight', label: '3. Inner Right (Grand Entrance)' },
                          { slot: 'farRight', label: '4. Far Right (Friends & Family)' },
                        ] as const
                      ).map(({ slot, label }) => {
                        const photo = story.photos[slot];
                        const isUploadingThis =
                          uploadingSlot?.storyId === story.id && uploadingSlot?.slot === slot;

                        return (
                          <div
                            key={slot}
                            className="p-3 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between gap-2.5"
                          >
                            <span className="text-[11px] font-bold text-slate-700 block truncate">
                              {label}
                            </span>

                            {/* Image Thumbnail Preview */}
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#D4AF37]/35 bg-stone-200 shadow-2xs group">
                              {photo?.url ? (
                                <img
                                  src={photo.url}
                                  alt={photo.caption}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs gap-1">
                                  <Camera className="w-6 h-6 opacity-40" />
                                  <span>No image</span>
                                </div>
                              )}

                              {isUploadingThis && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs gap-1.5 font-medium">
                                  <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                                  <span>Compressing...</span>
                                </div>
                              )}
                            </div>

                            {/* Upload Button + File Input */}
                            <div className="flex items-center gap-2">
                              <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:border-[#0D4F4F] hover:text-[#0D4F4F] transition-all cursor-pointer shadow-2xs">
                                <Upload className="w-3 h-3 text-[#D4AF37]" />
                                <span>Upload Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, story.id, slot)}
                                />
                              </label>

                              {photo?.url && (
                                <button
                                  type="button"
                                  onClick={() => updatePhoto(story.id, slot, 'url', '')}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 border border-stone-200"
                                  title="Clear image"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Or Paste URL */}
                            <input
                              type="text"
                              value={photo?.url?.startsWith('data:') ? 'Image uploaded (base64)' : photo?.url || ''}
                              onChange={(e) => updatePhoto(story.id, slot, 'url', e.target.value)}
                              placeholder="Or paste image URL"
                              disabled={photo?.url?.startsWith('data:')}
                              className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-[#0D4F4F] disabled:bg-stone-100 disabled:text-stone-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Actions inside Card */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleDeleteStory(story.id, story.couple)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Story</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 border border-stone-200"
                      >
                        Collapse
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0D4F4F] text-[#FAF9F6] hover:bg-[#093A3A] transition-all"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save This Story</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Save Bar when at bottom */}
      <div className="sticky bottom-4 z-20 p-3 sm:p-4 rounded-2xl bg-[#093A3A] text-white shadow-xl flex items-center justify-between gap-3 border border-[#D4AF37]/35">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs sm:text-sm font-semibold">
            {saveSuccess ? 'All changes saved & live on public page!' : 'Review changes ready to publish.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/reviews"
            target="_blank"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center gap-1"
          >
            <span>Preview</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#D4AF37] text-slate-900 hover:bg-[#e6bf44] transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save & Publish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
