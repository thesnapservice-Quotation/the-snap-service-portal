'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Quotation, AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { apiFetchQuotationById } from '@/lib/api-client';
import { decompactQuotationData, decodeQuotationData, formatCurrency, formatWhatsAppPhone } from '@/lib/utils';
import { QuotationPreview } from '@/components/quotation/quotation-preview';
import { CheckCircle2, ShieldCheck, Sparkles, MessageSquare, Building2, X, AlertCircle, ArrowRight, Copy, Check } from 'lucide-react';

function ShortClientPortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quotationId = params?.id as string;

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
      if (!quotationId) {
        if (isMounted) setLoading(false);
        return;
      }

      // 1. Direct Serverless Database API lookup
      let q = await apiFetchQuotationById(quotationId);

      // 2. Compact payload lookup `?c=...`
      if (!q && searchParams) {
        const compactStr = searchParams.get('c');
        if (compactStr) {
          const decompacted = decompactQuotationData(compactStr);
          if (decompacted) {
            q = decompacted;
          }
        }
      }

      // 3. Standard base64 payload lookup `?d=...`
      if (!q && searchParams) {
        const encodedStr = searchParams.get('d');
        if (encodedStr) {
          const decoded = decodeQuotationData(encodedStr);
          if (decoded) {
            q = decoded;
          }
        }
      }

      if (isMounted) {
        if (q) {
          setQuotation(q);
          setSettings(storage.getSettings(q.userId));
          const isAlreadyConfirmed = q.status === 'confirmed' || q.status === 'completed';
          setAccepted(isAlreadyConfirmed);
          setStepConfirmed(isAlreadyConfirmed);
        } else {
          setQuotation(null);
        }
        setLoading(false);
      }
    }

    loadQuotationData();
    return () => {
      isMounted = false;
    };
  }, [quotationId, searchParams]);

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
    setStepConfirmed(true);
  };

  const handleFinalConfirm = () => {
    if (!quotation) return;
    setAccepted(true);
    setShowConfirmModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#0D4F4F] border-t-[#D4AF37] rounded-full animate-spin mb-4" />
        <p className="font-serif font-bold text-sm text-[#0D4F4F] animate-pulse">
          Loading Official Client Portal...
        </p>
      </div>
    );
  }

  if (!quotation || !settings) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-xl text-[#0D4F4F]">Quotation Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested quotation link may be expired or invalid. Please contact The Snap Service.
          </p>
        </div>
      </div>
    );
  }

  const businessPhone = settings.business.phone || '0323-9244924';
  const formattedWhatsApp = formatWhatsAppPhone(businessPhone);
  const eventListStr = quotation.events.map((e) => e.name).join(', ') || 'Wedding Event';
  const whatsappMessage = encodeURIComponent(
    `Hello ${settings.business.name},\nI have confirmed & locked booking for Quotation #${quotation.quotationNumber} (${quotation.client.name}). Here is my advance payment screenshot!`
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans pb-24">
      {/* Top Banner */}
      <header className="no-print bg-[#0D4F4F] text-[#FAF9F6] py-3.5 px-4 sticky top-0 z-40 shadow-md border-b border-[#D4AF37]/30">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-serif font-bold tracking-wider text-[#D4AF37] uppercase">
              {settings.business.name || 'THE SNAP SERVICE'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {accepted ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> BOOKING LOCKED
              </span>
            ) : (
              <button
                onClick={handleOpenModal}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-extrabold text-xs shadow-sm hover:brightness-105 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Accept & Lock Booking
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Quotation View */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Client Quotation Portal</span>
          </div>
          <span className="font-mono text-slate-400">#{quotation.quotationNumber}</span>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2 md:p-6">
          <QuotationPreview quotation={quotation} settings={settings} />
        </div>
      </main>

      {/* Sticky Mobile Bottom Booking Bar */}
      <div className="no-print fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 z-40 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Grand Total</span>
            <span className="font-bold text-sm text-[#0D4F4F]">
              {formatCurrency(quotation.payment.grandTotal)}
            </span>
          </div>

          {accepted ? (
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${formattedWhatsApp}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-all flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" /> Send Payment Proof
              </a>
            </div>
          ) : (
            <button
              onClick={handleOpenModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-extrabold text-xs shadow-md hover:brightness-105 transition-all flex items-center gap-2 animate-pulse"
            >
              <span>Accept & Lock Booking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2-Step Booking Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 font-sans text-slate-800 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#0D4F4F] p-4 text-[#FAF9F6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif font-bold text-base text-[#D4AF37]">
                  2-Step Booking Confirmation & Date Lock
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* STEP 1 */}
              <div className="p-4 rounded-xl border-2 border-[#E5E0D5] bg-[#FAF9F6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0D4F4F] text-xs uppercase tracking-wider">
                    Step 1: Confirm Quotation Terms
                  </span>
                  {stepConfirmed && (
                    <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  By clicking confirm below, you agree to lock dates for <span className="font-bold">{quotation.client.name}</span> for {eventListStr} ({quotation.client.eventDates || 'Selected Dates'}).
                </p>

                {!stepConfirmed && (
                  <button
                    onClick={handleStep1Confirm}
                    className="w-full py-2.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs shadow-sm hover:bg-[#093A3A] transition-all"
                  >
                    Confirm Terms & Lock Dates Online
                  </button>
                )}
              </div>

              {/* STEP 2 */}
              <div className={`p-4 rounded-xl border-2 transition-all space-y-3 ${stepConfirmed ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Step 2: Advance Payment Instructions
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Bank Account Details</span>
                </div>

                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-slate-500 text-[11px]">Bank Name:</span>
                    <span className="font-bold text-slate-800">{settings.bank?.bank || 'Meezan Bank'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-slate-500 text-[11px]">Account Title:</span>
                    <span className="font-bold text-slate-800">{settings.bank?.accountTitle || settings.business.name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-slate-500 text-[11px]">Account / IBAN #:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                      <span>{settings.bank?.accountNumber || 'PK00MEZN000123456789'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(settings.bank?.accountNumber || 'PK00MEZN000123456789', 'bank')}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500"
                        title="Copy Account Number"
                      >
                        {copiedField === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Advance Payment Required</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {formatCurrency(quotation.payment.advanceReceived || quotation.payment.grandTotal * 0.3)}
                    </span>
                  </div>
                  <button
                    disabled={!stepConfirmed}
                    onClick={handleFinalConfirm}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${stepConfirmed ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                  >
                    I Have Made Payment
                  </button>
                </div>
              </div>

              {/* BUTTON 2 */}
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
      )}
    </div>
  );
}

export default function ShortClientPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-xs font-bold text-[#0D4F4F]">Loading Official Studio Quotation...</div>}>
      <ShortClientPortalContent />
    </Suspense>
  );
}
