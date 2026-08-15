'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Quotation, AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatCurrency, formatWhatsAppPhone, decodeQuotationData } from '@/lib/utils';
import { QuotationPreview } from '@/components/quotation/quotation-preview';
import { CheckCircle2, ShieldCheck, Sparkles, MessageSquare, Building2, X, AlertCircle, ArrowRight, Copy, Check, Lock, ExternalLink } from 'lucide-react';

function ShortPortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stepConfirmed, setStepConfirmed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, fieldKey: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadQuotationData() {
      if (!rawId) {
        if (isMounted) setLoading(false);
        return;
      }

      // Tier 1: LocalStorage lookup
      let q = storage.getQuotationById(rawId);

      // Tier 2: Short/Long URL payload lookup `?p=...` or `?d=...`
      if (!q) {
        const payload = searchParams?.get('p') || searchParams?.get('d');
        if (payload) {
          const decoded = decodeQuotationData(payload);
          if (decoded) {
            storage.saveQuotation(decoded);
            q = decoded;
          }
        }
      }

      // Tier 3: Serverless API Endpoint lookup `/api/quotations/[id]`
      if (!q) {
        try {
          const res = await fetch(`/api/quotations/${encodeURIComponent(rawId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.quotation) {
              q = data.quotation;
              storage.saveQuotation(q!);
            }
          }
        } catch (e) {
          console.error('API quotation lookup failed', e);
        }
      }

      if (isMounted) {
        if (q) {
          setQuotation(q);
          setSettings(storage.getSettings(q.userId));
          const isAlreadyConfirmed = q.status === 'confirmed' || q.status === 'completed';
          setAccepted(isAlreadyConfirmed);
          setStepConfirmed(isAlreadyConfirmed);

          // Address bar auto-clean: Instantly remove query params so user sees only clean short URL (e.g. /p/SS-2026-103)
          if (typeof window !== 'undefined' && window.history && (searchParams?.get('d') || searchParams?.get('p'))) {
            const cleanPath = `/p/${q.quotationNumber || q.id}`;
            window.history.replaceState(null, '', cleanPath);
          }
        } else {
          setQuotation(null);
        }
        setLoading(false);
      }
    }

    loadQuotationData();
    return () => { isMounted = false; };
  }, [rawId, searchParams]);

  const handleOpenModal = () => {
    setShowConfirmModal(true);
  };

  const handleStep1Confirm = () => {
    if (!quotation) return;
    const updated: Quotation = {
      ...quotation,
      status: 'confirmed',
      updatedAt: new Date().toISOString(),
    };
    storage.saveQuotation(updated);
    setQuotation(updated);
    setAccepted(true);
    setStepConfirmed(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 space-y-3 font-sans">
        <div className="w-8 h-8 border-3 border-[#0D4F4F] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-serif font-bold text-[#0D4F4F] tracking-wider uppercase">
          Loading Official Studio Quotation...
        </p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#0D4F4F] flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="font-serif font-bold text-xl text-[#0D4F4F]">Quotation Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested quotation link may be expired or invalid. Please contact The Snap Service.
          </p>
          <a
            href="https://wa.me/923239244924"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs shadow-md"
          >
            <MessageSquare className="w-4 h-4" /> Contact Studio Support
          </a>
        </div>
      </div>
    );
  }

  const businessPhone = settings?.business.phone || '0323-9244924';
  const formattedWhatsApp = formatWhatsAppPhone(businessPhone);
  const eventSummaryNames = quotation.events.map((e) => e.name).join(' & ');
  const whatsappMessage = encodeURIComponent(
    `Assalam-o-Alaikum Snap Service Studio,\n\nI have reviewed and Accepted Quotation #${quotation.quotationNumber} for ${quotation.client.name} (${eventSummaryNames}).\n\nI have sent the booking advance payment. Please lock our event dates!`
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-slate-800 pb-16 relative">
      {/* Top Banner Header */}
      <header className="bg-gradient-to-r from-[#0D4F4F] via-[#093A3A] to-[#1B2A4A] text-white p-4 shadow-xl border-b border-[#D4AF37]/40 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-[#093A3A] shrink-0 shadow-md">
              {/* eslint-disable-next-next/no-img-element */}
              <img src="/snap-service-logo.png" alt="Snap Service Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-base tracking-wider text-white flex items-center gap-1.5">
                THE SNAP SERVICE
              </h1>
              <p className="text-[10px] text-[#C3DFDF] tracking-widest uppercase">Official Client Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {accepted ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Date Locked
              </span>
            ) : (
              <button
                onClick={handleOpenModal}
                className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs shadow-md hover:bg-[#c29f2e] transition-all flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" /> Lock Booking
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Interactive Banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] text-[10px] font-extrabold uppercase font-mono">
                {quotation.quotationNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                accepted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {accepted ? '🟢 Confirmed & Locked' : '🟡 Review & Lock Dates'}
              </span>
            </div>
            <h2 className="font-serif font-bold text-lg text-[#0D4F4F] mt-1">
              Quotation Prepared for {quotation.client.name}
            </h2>
            <p className="text-xs text-slate-500">
              Event Dates: {quotation.client.eventDates || 'As Scheduled'}
            </p>
          </div>

          {!accepted ? (
            <button
              onClick={handleOpenModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-extrabold text-xs shadow-md hover:brightness-105 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Accept & Lock Booking Now
            </button>
          ) : (
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 block">✓ Booking Locked</span>
              <span className="text-[10px] text-slate-400 block">Dates reserved in studio calendar</span>
            </div>
          )}
        </div>

        {/* Embedded Quotation Preview */}
        <div className="bg-white p-2 sm:p-6 rounded-2xl border border-slate-200 shadow-md">
          <QuotationPreview quotation={quotation} settings={settings ? settings : undefined} />
        </div>
      </main>

      {/* Confirmation & Bank Payment Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0D4F4F] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D4AF37] text-[#0D4F4F]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#FAF9F6]">
                    Confirm Booking & Lock Dates
                  </h3>
                  <p className="text-[11px] text-[#C3DFDF]">
                    Quotation #{quotation.quotationNumber} • {quotation.client.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              {/* Studio Bank Account Card */}
              <div className="bg-gradient-to-br from-[#0D4F4F]/5 via-white to-amber-50/40 p-4.5 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#D4AF37]" /> Official Bank Details
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Advance: {formatCurrency(quotation.payment.advanceReceived)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Bank Name:</span>
                    <span className="font-bold text-slate-900">{settings?.bank?.bank || 'Meezan Bank'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Account Title:</span>
                    <span className="font-bold text-slate-900">{settings?.bank?.accountTitle || 'THE SNAP SERVICE'}</span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Account Number:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {settings?.bank?.accountNumber || '0004240104676435'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(settings?.bank?.accountNumber || '0004240104676435', 'acc')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 border shadow-2xs ${
                        copiedField === 'acc'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-[#0D4F4F]/10 text-[#0D4F4F] hover:bg-[#0D4F4F] hover:text-white border-[#0D4F4F]/30'
                      }`}
                    >
                      {copiedField === 'acc' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-200" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sequential Action Buttons */}
              <div className="space-y-3 pt-1">
                {!stepConfirmed ? (
                  <button
                    onClick={handleStep1Confirm}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-[#D4AF37] font-bold text-sm shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-[#D4AF37]/50"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" /> Yes, Confirm & Lock My Booking Now
                  </button>
                ) : (
                  <div className="w-full py-3.5 rounded-2xl bg-emerald-800 text-white font-bold text-xs text-center shadow-md flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" /> ✅ Booking Date Locked!
                  </div>
                )}

                {stepConfirmed ? (
                  <a
                    href={`https://wa.me/${formattedWhatsApp}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 animate-pulse border-2 border-emerald-400"
                  >
                    <MessageSquare className="w-4 h-4" /> Send Payment Screenshot on WhatsApp ({businessPhone})
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Send Payment Screenshot on WhatsApp ({businessPhone})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShortPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-xs font-bold text-[#0D4F4F]">Loading Official Studio Quotation...</div>}>
      <ShortPortalContent />
    </Suspense>
  );
}
