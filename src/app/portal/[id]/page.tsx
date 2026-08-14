'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Quotation, AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatCurrency, formatWhatsAppPhone } from '@/lib/utils';
import { QuotationPreview } from '@/components/quotation/quotation-preview';
import { CheckCircle2, ShieldCheck, Sparkles, MessageSquare, Building2, X, AlertCircle, ArrowRight, Copy, Check } from 'lucide-react';

export default function ClientPortalPage() {
  const params = useParams();
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
    if (quotationId) {
      let q = storage.getQuotationById(quotationId);
      if (!q) {
        const all = storage.getQuotations();
        q = all.find((item) => item.id === quotationId || item.quotationNumber.toLowerCase() === quotationId.toLowerCase()) || all[0] || null;
      }
      if (q) {
        setQuotation(q);
        setSettings(storage.getSettings(q.userId));
        const isAlreadyConfirmed = q.status === 'confirmed' || q.status === 'completed';
        setAccepted(isAlreadyConfirmed);
        setStepConfirmed(isAlreadyConfirmed);
      }
    }
    setLoading(false);
  }, [quotationId]);

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
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0D4F4F]">
          <div className="w-5 h-5 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          <span>Loading Official Studio Quotation...</span>
        </div>
      </div>
    );
  }

  if (!quotation || !settings) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-3xl border-2 border-[#E5E0D5] text-center max-w-md shadow-xl">
          <h2 className="font-serif font-bold text-xl text-[#0D4F4F]">Quotation Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            The requested quotation link may be expired or invalid. Please contact The Snap Service.
          </p>
        </div>
      </div>
    );
  }

  const businessPhone = settings.business.phone || '0323-9244924';
  const formattedWhatsApp = formatWhatsAppPhone(businessPhone);

  const whatsappMessage = encodeURIComponent(
    `Assalam-o-Alaikum! I have confirmed booking for Quotation #${quotation.quotationNumber} (${quotation.client.name}). Here is my payment receipt screenshot!`
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
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Booking Confirmed
              </span>
            ) : (
              <button
                onClick={handleOpenModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept & Lock Booking
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Confirmation Sticky Notification */}
      {accepted && (
        <div className="bg-emerald-700 text-white p-3 text-center text-xs font-bold shadow-md flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>Congratulations! Your wedding booking date is locked with The Snap Service.</span>
        </div>
      )}

      {/* Main Quotation View Container */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <QuotationPreview quotation={quotation} settings={settings} />

        {/* Client Action Bar */}
        <div className="bg-white rounded-3xl border-2 border-[#E5E0D5] p-6 shadow-xl text-center space-y-4 max-w-[794px] mx-auto">
          <h3 className="font-serif font-bold text-lg text-[#0D4F4F]">
            Ready to Lock Your Wedding Date?
          </h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            Clicking <span className="font-bold text-[#0D4F4F]">Accept & Lock Booking</span> opens 2-step verification with official studio bank details to reserve your event dates.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!accepted && (
              <button
                onClick={handleOpenModal}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-[#D4AF37] font-bold text-sm shadow-xl hover:brightness-110 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" /> Accept & Lock Booking
              </button>
            )}

            <a
              href={`https://wa.me/${formattedWhatsApp}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" /> Chat on WhatsApp ({businessPhone})
            </a>
          </div>
        </div>
      </main>

      {/* 2-STEP SEQUENTIAL VERIFICATION MODAL POPUP */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-[#D4AF37] p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2 border-b pb-4">
              <div className="w-12 h-12 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-[#0D4F4F]" />
              </div>
              <h3 className="font-serif font-bold text-xl text-[#0D4F4F]">
                Advance Payment & Booking Confirmation
              </h3>
              <p className="text-xs text-slate-500">
                Quotation #{quotation.quotationNumber} — <span className="font-bold text-slate-800">{quotation.client.name}</span>
              </p>
            </div>

            {/* Payment Milestone Breakdown Table */}
            {(() => {
              const grandTotal = quotation.payment?.grandTotal || 0;
              const advancePKR = quotation.payment?.advanceReceived && quotation.payment.advanceReceived > 0 
                ? quotation.payment.advanceReceived 
                : Math.round(grandTotal * 0.50);
              const advancePercent = grandTotal > 0 ? Math.round((advancePKR / grandTotal) * 100) : 50;
              const afterEventPKR = Math.round(grandTotal * 0.25);
              const beforeDeliveryPKR = Math.max(0, grandTotal - advancePKR - afterEventPKR);

              return (
                <div className="bg-white rounded-2xl border-2 border-[#E5E0D5] p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#0D4F4F]">
                      💳 Payment Schedule Breakdown
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono">Total: {formatCurrency(grandTotal)}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold text-[10px] uppercase">
                        <tr>
                          <th className="px-2.5 py-1.5 rounded-l">Payment Stage</th>
                          <th className="px-2.5 py-1.5 text-center">%</th>
                          <th className="px-2.5 py-1.5 text-right rounded-r">Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        <tr className="bg-emerald-50/80 font-bold text-emerald-950">
                          <td className="px-2.5 py-2">1. Advance Payment (Booking Lock)</td>
                          <td className="px-2.5 py-2 text-center text-emerald-700">{advancePercent}%</td>
                          <td className="px-2.5 py-2 text-right font-extrabold text-[#0D4F4F]">{formatCurrency(advancePKR)}</td>
                        </tr>
                        <tr>
                          <td className="px-2.5 py-2 text-slate-700">2. After Event Completion</td>
                          <td className="px-2.5 py-2 text-center text-slate-500">25%</td>
                          <td className="px-2.5 py-2 text-right font-bold text-slate-900">{formatCurrency(afterEventPKR)}</td>
                        </tr>
                        <tr>
                          <td className="px-2.5 py-2 text-slate-700">3. Before Final Delivery</td>
                          <td className="px-2.5 py-2 text-center text-slate-500">25%</td>
                          <td className="px-2.5 py-2 text-right font-bold text-slate-900">{formatCurrency(beforeDeliveryPKR)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Step 1: Bank Transfer Details */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#0D4F4F] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#D4AF37]" /> Official Studio Bank Transfer Details
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-1.5 items-center">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-bold text-slate-900">{settings.bank.bank || 'Meezan Bank'}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-1.5 items-center">
                  <span className="text-slate-500">Account Title:</span>
                  <span className="font-bold text-[#0D4F4F]">{settings.bank.accountTitle || settings.business.name}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-1.5 items-center">
                  <span className="text-slate-500">Account Number:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold font-mono text-slate-900 text-xs sm:text-sm select-all">
                      {settings.bank.accountNumber || '04240104676435'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(settings.bank.accountNumber || '04240104676435', 'acc')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 border shadow-2xs ${
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

                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500">IBAN:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold font-mono text-[11px] text-slate-800 select-all">
                      {settings.bank.iban || 'PK36MEZN0004240104676435'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(settings.bank.iban || 'PK36MEZN0004240104676435', 'iban')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 border shadow-2xs ${
                        copiedField === 'iban'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-[#0D4F4F]/10 text-[#0D4F4F] hover:bg-[#0D4F4F] hover:text-white border-[#0D4F4F]/30'
                      }`}
                    >
                      {copiedField === 'iban' ? (
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
            </div>

            {/* Instruction Warning */}
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>INSTRUCTION: CONFIRMATION & PAYMENT PROCESS</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900">
                1. Click <span className="font-bold text-[#0D4F4F]">&quot;Yes, Confirm & Lock My Booking Now&quot;</span> to confirm date.  
                2. Transfer advance payment to bank above & click <span className="font-bold text-emerald-800">&quot;Send Payment Screenshot on WhatsApp&quot;</span>.
              </p>
            </div>

            {/* Sequential Action Buttons */}
            <div className="space-y-3 pt-1">
              {/* BUTTON 1 */}
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
