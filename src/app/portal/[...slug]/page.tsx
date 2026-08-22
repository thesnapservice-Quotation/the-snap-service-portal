'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Quotation, AppSettings } from '@/lib/types';
import { storage } from '@/lib/storage';
import { apiFetchQuotationById, apiSaveQuotation } from '@/lib/api-client';
import { formatCurrency, formatWhatsAppPhone, decodeQuotationData, getQuotationSecurityPin } from '@/lib/utils';
import { QuotationPreview } from '@/components/quotation/quotation-preview';
import { CheckCircle2, ShieldCheck, Sparkles, MessageSquare, Building2, X, AlertCircle, ArrowRight, Copy, Check, ShieldAlert, Wallet } from 'lucide-react';

function ClientPortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Support both /portal/2026-08-17/SS-2026-101/4928 and legacy /portal/SS-2026-101
  const rawSlug = params?.slug;
  const slugArray = Array.isArray(rawSlug) ? rawSlug : rawSlug ? [rawSlug] : [];

  let quoteKey = '';
  let expectedPin = '';

  if (slugArray.length >= 3) {
    // Format: /portal/[date]/[quotationNumber]/[pin]
    quoteKey = slugArray[1];
    expectedPin = slugArray[2];
  } else if (slugArray.length === 2) {
    // Format: /portal/[quotationNumber]/[pin]
    quoteKey = slugArray[0];
    expectedPin = slugArray[1];
  } else if (slugArray.length === 1) {
    quoteKey = slugArray[0];
  }

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stepConfirmed, setStepConfirmed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState<number | ''>('');

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
      if (!quoteKey) {
        if (isMounted) setLoading(false);
        return;
      }

      // 1. Direct Serverless Database API lookup
      let q = await apiFetchQuotationById(quoteKey);

      // 2. URL embedded payload fallback if shared via offline link
      if (!q) {
        const encodedData = searchParams?.get('d');
        if (encodedData) {
          const decoded = decodeQuotationData(encodedData);
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
          const initialAdv = q.payment.clientProposedAdvance || (q.payment.advanceReceived > 0 ? q.payment.advanceReceived : Math.round((q.payment.grandTotal || 0) * 0.5));
          setCustomAdvanceAmount(initialAdv);
        } else {
          setQuotation(null);
        }
        setLoading(false);
      }
    }

    loadQuotationData();
    return () => { isMounted = false; };
  }, [quoteKey, expectedPin, searchParams]);

  const handleOpenModal = () => {
    if (quotation) {
      const initialAdv = quotation.payment.clientProposedAdvance || (quotation.payment.advanceReceived > 0 ? quotation.payment.advanceReceived : Math.round((quotation.payment.grandTotal || 0) * 0.5));
      setCustomAdvanceAmount(initialAdv);
    }
    setShowConfirmModal(true);
  };

  const handleStep1Confirm = async () => {
    if (!quotation) return;
    const proposed = Number(customAdvanceAmount) || Math.round((quotation.payment.grandTotal || 0) * 0.5);
    const updated: Quotation = {
      ...quotation,
      status: 'confirmed',
      payment: {
        ...quotation.payment,
        clientProposedAdvance: proposed,
      },
      updatedAt: new Date().toISOString(),
    };
    setQuotation(updated);
    setAccepted(true);
    setStepConfirmed(true);

    storage.saveQuotationLocally(updated);
    // Save directly to Supabase production database
    await apiSaveQuotation(updated);
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

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-3xl border-2 border-red-200 text-center max-w-md shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-xl text-[#0D4F4F]">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The security PIN in this link is invalid or does not match this quotation.
            Please use the exact link sent to you by The Snap Service.
          </p>
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

  const proposedAdv = Number(customAdvanceAmount) || quotation.payment.clientProposedAdvance || (quotation.payment.advanceReceived > 0 ? quotation.payment.advanceReceived : Math.round((quotation.payment.grandTotal || 0) * 0.5));

  const whatsappMessage = encodeURIComponent(
    `Assalam-o-Alaikum! I have confirmed booking for Quotation #${quotation.quotationNumber} (${quotation.client.name}). Advance Amount: ${formatCurrency(proposedAdv)} (Bank Transfer / Cash). Here is my payment receipt screenshot!`
  );

  const txList = quotation.payment?.transactions || [];
  const totalVerifiedPaid = txList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const liveRemainingBalance = Math.max(0, (quotation.payment?.grandTotal || 0) - totalVerifiedPaid);

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
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Booking Locked & Confirmed
              </span>
            ) : (
              <button
                onClick={handleOpenModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Accept & Lock Booking
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Quotation View Area */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-[#E5E0D5] shadow-xl">
          <QuotationPreview
            quotation={quotation}
            settings={settings}
          />
        </div>

        {/* Live Verified Payment Ledger & Receipt History (If payments recorded by studio) */}
        {txList.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border-2 border-[#E5E0D5] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#0D4F4F]">
                    Verified Payment Receipts & Ledger
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Official record of payments received by The Snap Service
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Remaining Due</span>
                <span className="font-serif font-bold text-sm text-[#0D4F4F]">
                  {formatCurrency(liveRemainingBalance)}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {txList.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {tx.method === 'cash' ? '💵 Cash Payment' : tx.method === 'bank_transfer' ? '🏦 Bank Transfer' : '📱 Online Transfer'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {tx.notes ? ` • ${tx.notes}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-800 font-mono">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-xs font-bold bg-[#FAF9F6] p-3 rounded-2xl">
              <span className="text-slate-700">Total Amount Received to Date:</span>
              <span className="text-emerald-800 font-serif text-sm">
                {formatCurrency(totalVerifiedPaid)}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Booking Action Bar */}
        <div className="bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-6 md:p-8 rounded-3xl shadow-2xl border border-[#D4AF37]/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="font-serif font-bold text-lg text-white flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Lock Your Dates & Guarantee Availability
            </h3>
            <p className="text-xs text-[#C3DFDF] max-w-lg leading-relaxed">
              We accept a limited number of weddings per season to maintain world-class quality. Accept online and submit your advance receipt to confirm booking.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {accepted ? (
              <div className="px-6 py-3.5 rounded-2xl bg-emerald-800/90 text-[#D4AF37] font-bold text-xs border border-[#D4AF37]/60 shadow-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dates Locked & Confirmed
              </div>
            ) : (
              <button
                onClick={handleOpenModal}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-extrabold text-sm shadow-xl hover:brightness-110 transition-all flex items-center gap-2"
              >
                <span>Accept Quotation Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation & Bank Payment 2-Step Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border-2 border-[#D4AF37] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0D4F4F]/10 text-[#0D4F4F]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                    Lock Booking & Bank Transfer
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Quotation #{quotation.quotationNumber} • {quotation.client.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-Stage Milestone Payment Schedule Box */}
            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E0D5] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0D4F4F] pb-1 border-b border-[#E5E0D5]">
                <span>Payment Plan & Milestone Schedule</span>
                <span>Amount (PKR)</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0D4F4F] text-[#D4AF37] font-bold text-[9px] flex items-center justify-center">1</span>
                    <span className="text-slate-700 font-medium">50% Advance to confirm booking</span>
                  </div>
                  <span className="font-bold text-[#0D4F4F]">
                    {formatCurrency(quotation.payment.advanceReceived > 0 ? quotation.payment.advanceReceived : Math.round(quotation.payment.grandTotal * 0.5))}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0D4F4F] text-[#D4AF37] font-bold text-[9px] flex items-center justify-center">2</span>
                    <span className="text-slate-700 font-medium">25% After event completion</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(Math.round(quotation.payment.grandTotal * 0.25))}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0D4F4F] text-[#D4AF37] font-bold text-[9px] flex items-center justify-center">3</span>
                    <span className="text-slate-700 font-medium">25% Before final delivery</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(
                      quotation.payment.grandTotal -
                      (quotation.payment.advanceReceived > 0 ? quotation.payment.advanceReceived : Math.round(quotation.payment.grandTotal * 0.5)) -
                      Math.round(quotation.payment.grandTotal * 0.25)
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-dashed border-[#E5E0D5]">
                  <span className="font-bold text-slate-900">Total Package Amount:</span>
                  <span className="text-base font-serif font-extrabold text-[#0D4F4F]">
                    {formatCurrency(quotation.payment.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Custom Advance Amount Input */}
            <div className="bg-[#FAF9F6] p-4 rounded-2xl border-2 border-[#D4AF37] space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0D4F4F] flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-[#D4AF37]" />
                  Advance Amount You Are Transferring (PKR)
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Editable amount</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-sm text-[#0D4F4F]">Rs.</span>
                <input
                  type="number"
                  min="1000"
                  max={quotation.payment.grandTotal}
                  value={customAdvanceAmount}
                  onChange={(e) => setCustomAdvanceAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-11 pr-3 py-2 bg-white border-2 border-[#D4AF37]/60 rounded-xl font-bold text-slate-900 text-base focus:ring-2 focus:ring-[#0D4F4F] focus:border-[#0D4F4F] outline-hidden shadow-2xs"
                  placeholder="e.g. 20000"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                <span>Standard 50%: {formatCurrency(Math.round(quotation.payment.grandTotal * 0.5))}</span>
                <span>Remaining Balance: {formatCurrency(Math.max(0, quotation.payment.grandTotal - (Number(customAdvanceAmount) || 0)))}</span>
              </div>
            </div>

            {/* Studio Official Bank Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-slate-700 font-bold">
                <span>Official Studio Bank Account</span>
                <span className="text-[10px] text-[#0D4F4F] font-mono bg-[#D4AF37]/20 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-bold text-slate-800">{settings.bank.bank || 'Meezan Bank'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Account Title:</span>
                  <span className="font-bold text-slate-800">{settings.bank.accountTitle || 'The Snap Service'}</span>
                </div>

                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500">Account Number:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold font-mono text-slate-800 select-all">
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

export default function ClientPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-xs font-bold text-[#0D4F4F]">Loading Official Studio Quotation...</div>}>
      <ClientPortalContent />
    </Suspense>
  );
}
