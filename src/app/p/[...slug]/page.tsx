'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Quotation, AppSettings, PaymentTransaction, QuotationVariation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { apiFetchQuotationById, apiFetchPublicQuotation, apiSaveQuotation, apiFetchSettings } from '@/lib/api-client';
import { decompactQuotationData, decodeQuotationData, formatCurrency, formatWhatsAppPhone, getQuotationSecurityPin, calculatePaymentMilestones, getTodayDateString, isQuotationExpired, mergeVariationIntoQuotation, formatQuotationEventsDateRange } from '@/lib/utils';
import { generateSecureId } from '@/lib/crypto';
import { QuotationPreview } from '@/components/quotation/quotation-preview';
import { ClientVariationSelector } from '@/components/portal/client-variation-selector';
import { CheckCircle2, ShieldCheck, Sparkles, MessageSquare, Building2, X, AlertCircle, ArrowRight, Copy, Check, ShieldAlert, Wallet, Banknote } from 'lucide-react';

function ShortClientPortalContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  // Format: /p/[date]/[quotationNumber]/[pin]
  const rawSlug = params?.slug;
  const slugArray = Array.isArray(rawSlug) ? rawSlug : rawSlug ? [rawSlug] : [];

  let urlDate = '';
  let quoteKey = '';
  let expectedPin = '';

  if (slugArray.length >= 3) {
    urlDate = slugArray[0];
    quoteKey = slugArray[1];
    expectedPin = slugArray[2];
  } else if (slugArray.length === 2) {
    quoteKey = slugArray[0];
    expectedPin = slugArray[1];
  } else if (slugArray.length === 1) {
    quoteKey = slugArray[0];
  }

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [activeVariationId, setActiveVariationId] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');
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

  // Lock background body scroll on mobile and desktop when modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (showConfirmModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showConfirmModal]);

  useEffect(() => {
    let isMounted = true;

    async function loadQuotationData() {
      // 1. Authoritative 3-parameter exact lookup
      let q: Quotation | null = null;
      if (urlDate && quoteKey && expectedPin) {
        q = await apiFetchPublicQuotation(urlDate, quoteKey, expectedPin);
      } else if (quoteKey) {
        q = await apiFetchQuotationById(quoteKey);
        if (q && expectedPin) {
          const candidatePin = (q.securityPin || '').trim();
          const fallbackPin = getQuotationSecurityPin(q);
          if (candidatePin !== expectedPin && fallbackPin !== expectedPin) {
            q = null;
          }
        }
      }

      // 2. Compact payload in query params fallback
      if (!q) {
        const compactPayload = searchParams?.get('c');
        if (compactPayload) {
          const decompacted = decompactQuotationData(compactPayload);
          if (decompacted) {
            q = decompacted;
          }
        }
      }

      // 3. Fallback: Full base64 payload
      if (!q) {
        const fullPayload = searchParams?.get('d');
        if (fullPayload) {
          const decoded = decodeQuotationData(fullPayload);
          if (decoded) {
            q = decoded;
          }
        }
      }

      // If quotation is in Trash, soft-deleted, or expired -> client MUST see "Quotation Not Found"
      if (q && (q.status === 'trash' || q.isDeleted || isQuotationExpired(q))) {
        q = null;
      }

      if (isMounted) {
        if (q) {
          setQuotation(q);
          if (q.variations && q.variations.length > 0) {
            setActiveVariationId(q.selectedVariationId || q.variations[0].id);
          }
          const qWs = q.workspaceId || (q.userId === 'user-super-admin' ? 'ws_user-super-admin' : `ws_${q.userId}`);
          const liveSettings = await apiFetchSettings(qWs);
          if (liveSettings && liveSettings.bank) {
            setSettings(liveSettings);
          } else {
            setSettings(storage.getSettings(qWs));
          }
          const isAlreadyConfirmed = q.status === 'confirmed' || q.status === 'completed';
          setAccepted(isAlreadyConfirmed);
          setStepConfirmed(isAlreadyConfirmed);
          const initialAdv = q.payment.clientProposedAdvance || (q.payment.advanceReceived > 0 ? q.payment.advanceReceived : Math.round((q.payment.grandTotal || 0) * 0.5));
          setCustomAdvanceAmount(initialAdv);
          const existingTx = q.payment?.transactions || [];
          const portalTx = existingTx.find(t => t.recordedBy === 'Client Portal (Online Confirmation)' || t.id.startsWith('tx-portal-'));
          if (portalTx?.method === 'cash') {
            setPaymentMethod('cash');
          }
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
  }, [urlDate, quoteKey, expectedPin, searchParams]);

  const handleSelectVariation = (v: QuotationVariation) => {
    setActiveVariationId(v.id);
    const initialAdv = v.payment.clientProposedAdvance || (v.payment.advanceReceived > 0 ? v.payment.advanceReceived : Math.round((v.payment.grandTotal || 0) * 0.5));
    setCustomAdvanceAmount(initialAdv);
  };

  const resolvedVarId = activeVariationId || quotation?.selectedVariationId || (quotation?.variations && quotation.variations.find((v) => v.isAccepted)?.id);
  const activeVar = (quotation?.variations && resolvedVarId)
    ? (quotation.variations.find((v) => v.id === resolvedVarId) || quotation.variations[0])
    : quotation?.variations?.[0];
  const displayQuotation = (quotation && activeVar && quotation.variations && quotation.variations.length > 1)
    ? mergeVariationIntoQuotation(quotation, activeVar)
    : quotation;

  const handleOpenModal = () => {
    if (displayQuotation) {
      const initialAdv = displayQuotation.payment.clientProposedAdvance || (displayQuotation.payment.advanceReceived > 0 ? displayQuotation.payment.advanceReceived : Math.round((displayQuotation.payment.grandTotal || 0) * 0.5));
      setCustomAdvanceAmount(initialAdv);
      const existingTx = displayQuotation.payment?.transactions || [];
      const portalTx = existingTx.find(t => t.recordedBy === 'Client Portal (Online Confirmation)' || t.id.startsWith('tx-portal-'));
      if (portalTx?.method === 'cash') {
        setPaymentMethod('cash');
      } else {
        setPaymentMethod('bank_transfer');
      }
    }
    setShowConfirmModal(true);
  };

  const handleStep1Confirm = async () => {
    if (!quotation) return;
    const currentActiveQuote = displayQuotation || quotation;
    const proposed = Number(customAdvanceAmount) || Math.round((currentActiveQuote.payment.grandTotal || 0) * 0.5);

    // Synchronize to Payment Ledger transactions
    const existingTx = currentActiveQuote.payment?.transactions || [];
    const portalTxIndex = existingTx.findIndex(
      (t) => t.recordedBy === 'Client Portal (Online Confirmation)' || t.id.startsWith('tx-portal-')
    );

    const paymentMethodLabel = paymentMethod === 'cash' ? 'Cash Payment' : 'Bank Transfer';

    const portalTx: PaymentTransaction = {
      id: portalTxIndex >= 0 ? existingTx[portalTxIndex].id : `tx-portal-${quotation.id}-${generateSecureId('tx')}`,
      date: getTodayDateString(),
      amount: proposed,
      method: paymentMethod,
      notes: `Online Booking Confirmation Advance via ${paymentMethodLabel} by client (${quotation.client?.name || 'Client'}) via Studio Portal`,
      recordedBy: 'Client Portal (Online Confirmation)',
      createdAt: portalTxIndex >= 0 ? existingTx[portalTxIndex].createdAt : new Date().toISOString(),
    };

    const updatedTx = portalTxIndex >= 0
      ? existingTx.map((t, idx) => (idx === portalTxIndex ? portalTx : t))
      : [portalTx, ...existingTx];

    const totalPaid = updatedTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const grandTotal = currentActiveQuote.payment?.grandTotal || 0;
    const balancePayable = Math.max(0, grandTotal - totalPaid);

    let paymentStatus: 'unpaid' | 'partially_paid' | 'paid_in_full' = 'unpaid';
    if (totalPaid >= grandTotal && grandTotal > 0) {
      paymentStatus = 'paid_in_full';
    } else if (totalPaid > 0) {
      paymentStatus = 'partially_paid';
    }

    const updatedPayment = {
      ...currentActiveQuote.payment,
      grandTotal: currentActiveQuote.payment?.grandTotal || 0,
      advanceReceived: totalPaid,
      balancePayable: balancePayable,
      transactions: updatedTx,
      paymentStatus: paymentStatus,
      clientProposedAdvance: proposed,
    };

    let updatedVariations = quotation.variations;
    if (updatedVariations && updatedVariations.length > 0) {
      updatedVariations = updatedVariations.map((v) => {
        const isThisVar = v.id === activeVariationId;
        return {
          ...v,
          isAccepted: isThisVar,
          ...(isThisVar ? {
            payment: {
              ...v.payment,
              ...updatedPayment,
            },
          } : {}),
        };
      });
    }

    const confirmedDates = formatQuotationEventsDateRange(
      currentActiveQuote.events,
      currentActiveQuote.client?.eventDates || quotation.client?.eventDates
    );

    const updated: Quotation = {
      ...currentActiveQuote,
      client: {
        ...currentActiveQuote.client,
        eventDates: confirmedDates,
      },
      status: 'confirmed',
      selectedVariationId: activeVariationId,
      hasVariations: quotation.hasVariations,
      variations: updatedVariations,
      payment: updatedPayment,
      updatedAt: new Date().toISOString(),
    };
    setQuotation(updated);
    setAccepted(true);
    setStepConfirmed(true);

    storage.saveQuotationLocally(updated);
    await apiSaveQuotation(updated);
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

  if (!quotation || !settings || !displayQuotation) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-lg text-slate-800">Quotation Not Found</h2>
          <p className="text-xs text-slate-500">
            The link you opened is invalid or expired. Please contact The Snap Service to request a fresh quotation link.
          </p>
        </div>
      </div>
    );
  }

  const businessPhone = settings.business.phone || '0323-9244924';
  const formattedWhatsApp = formatWhatsAppPhone(businessPhone);

  const effectiveAdv = customAdvanceAmount !== ''
    ? (Number(customAdvanceAmount) || 0)
    : (displayQuotation.payment.clientProposedAdvance ?? displayQuotation.payment.advanceReceived ?? 0);

  const portalMilestones = calculatePaymentMilestones(
    displayQuotation.payment.grandTotal,
    effectiveAdv,
    displayQuotation.payment.advancePercentage
  );

  const proposedAdv = effectiveAdv > 0 ? effectiveAdv : portalMilestones.stage1Amount;

  const whatsappMessage = encodeURIComponent(
    paymentMethod === 'cash'
      ? `Assalam-o-Alaikum! I have confirmed my booking for Quotation #${displayQuotation.quotationNumber} (${displayQuotation.client.name})${displayQuotation.variations && displayQuotation.variations.length > 1 ? ` - ${activeVar?.name}` : ''}.\n\nPayment Mode: Cash Payment\nAdvance Amount: ${formatCurrency(proposedAdv)}\n\nPlease note my booking reservation.`
      : `Assalam-o-Alaikum! I have confirmed booking for Quotation #${displayQuotation.quotationNumber} (${displayQuotation.client.name})${displayQuotation.variations && displayQuotation.variations.length > 1 ? ` - ${activeVar?.name}` : ''}.\n\nPayment Mode: Bank Transfer\nAdvance Amount: ${formatCurrency(proposedAdv)}\n\nHere is my payment receipt screenshot!`
  );

  const txList = displayQuotation.payment?.transactions || [];
  const totalVerifiedPaid = txList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const liveRemainingBalance = Math.max(0, (displayQuotation.payment?.grandTotal || 0) - totalVerifiedPaid);

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

      {/* Main Quotation Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Interactive Package Variation Selector (For multi-option quotations) */}
        {quotation.variations && quotation.variations.length > 1 && (
          <ClientVariationSelector
            quotation={quotation}
            activeVariationId={activeVariationId}
            onSelectVariation={handleSelectVariation}
            isConfirmed={accepted || quotation.status === 'confirmed'}
          />
        )}

        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-[#E5E0D5] shadow-xl">
          <QuotationPreview
            quotation={displayQuotation}
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

        {/* Action Bar */}
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

      {/* Confirmation & Payment Method Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmModal(false);
          }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full h-[88dvh] sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl border-t sm:border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Mobile Sheet Pull Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-0 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0D4F4F]/10 text-[#0D4F4F]">
                  <ShieldCheck className="w-4 h-4 text-[#0D4F4F]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#0D4F4F]">
                    Lock Booking Confirmation
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Quotation #{displayQuotation.quotationNumber} • {displayQuotation.client.name}
                    {displayQuotation.variations && displayQuotation.variations.length > 1 && (
                      <span className="ml-1 text-[#D4AF37] font-bold">
                        • {activeVar?.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-8 sm:pb-4 space-y-3 text-xs touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Payment Method Switcher (Segmented Pill) */}
              <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-white text-[#0D4F4F] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-[#0D4F4F]" />
                  <span>Bank Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cash Payment</span>
                </button>
              </div>

              {/* Milestone Schedule (Compact & Minimal) */}
              <div className="bg-[#FAF9F6] p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-700">Payment Milestone Plan</span>
                  <span className="text-[11px] font-extrabold text-[#0D4F4F]">
                    Total: {formatCurrency(quotation.payment.grandTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs text-center">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Step 1 (50%)</span>
                    <span className="font-bold text-[#0D4F4F] block mt-0.5">{formatCurrency(portalMilestones.stage1Amount)}</span>
                    <span className="text-[8.5px] text-slate-500 block">On Booking</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs text-center">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Step 2 (25%)</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{formatCurrency(portalMilestones.stage2Amount)}</span>
                    <span className="text-[8.5px] text-slate-500 block">On Event Day</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs text-center">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Step 3 (25%)</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{formatCurrency(portalMilestones.stage3Amount)}</span>
                    <span className="text-[8.5px] text-slate-500 block">Final Delivery</span>
                  </div>
                </div>
              </div>

              {/* Advance Amount Input */}
              <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#D4AF37]/50 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#0D4F4F] flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {paymentMethod === 'cash' ? 'Cash Advance to Deposit (PKR)' : 'Advance Amount to Transfer (PKR)'}
                  </label>
                  <span className="text-[9px] text-slate-400 font-medium">Editable</span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-xs text-[#0D4F4F]">Rs.</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1000"
                    max={quotation.payment.grandTotal}
                    value={customAdvanceAmount}
                    onChange={(e) => setCustomAdvanceAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-sm focus:ring-1 focus:ring-[#0D4F4F] focus:border-[#0D4F4F] outline-hidden transition-all"
                    placeholder="e.g. 35000"
                  />
                </div>

                <div className="flex items-center justify-between text-[9.5px] text-slate-500 font-medium pt-0.5">
                  <span>Standard 50%: {formatCurrency(Math.round(quotation.payment.grandTotal * 0.5))}</span>
                  <span>Remaining: {formatCurrency(Math.max(0, quotation.payment.grandTotal - (Number(customAdvanceAmount) || 0)))}</span>
                </div>
              </div>

              {/* METHOD SPECIFIC CARDS */}
              {paymentMethod === 'bank_transfer' ? (
                /* Bank Account Details Card */
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/70 text-slate-700 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#0D4F4F]" /> Official Studio Bank Account
                    </span>
                    <span className="text-[9px] text-emerald-800 font-medium bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {(settings.bank.bank || settings.bank.branch) && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Bank Name:</span>
                        <span className="font-semibold text-slate-800 text-right">
                          {[settings.bank.bank, settings.bank.branch].filter(Boolean).join(' — ')}
                        </span>
                      </div>
                    )}

                    {settings.bank.accountTitle && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Account Title:</span>
                        <span className="font-semibold text-slate-800">{settings.bank.accountTitle}</span>
                      </div>
                    )}

                    {settings.bank.accountNumber && (
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-slate-500">Account Number:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono text-slate-800 select-all">
                            {settings.bank.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(settings.bank.accountNumber, 'acc')}
                            className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold transition-all flex items-center gap-1 border shadow-2xs cursor-pointer ${
                              copiedField === 'acc'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-[#0D4F4F] hover:bg-[#0D4F4F] hover:text-white border-slate-200'
                            }`}
                          >
                            {copiedField === 'acc' ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-white" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {settings.bank.iban && (
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-slate-500">IBAN:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono text-[10px] text-slate-800 select-all">
                            {settings.bank.iban}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(settings.bank.iban || '', 'iban')}
                            className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold transition-all flex items-center gap-1 border shadow-2xs cursor-pointer ${
                              copiedField === 'iban'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-[#0D4F4F] hover:bg-[#0D4F4F] hover:text-white border-slate-200'
                            }`}
                          >
                            {copiedField === 'iban' ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-white" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Cash Payment Info Card */
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60 text-emerald-950 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-700" /> Cash Payment (In-Person / Office)
                    </span>
                    <span className="text-[9px] text-emerald-800 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                      Direct Pay
                    </span>
                  </div>

                  <p className="text-[10.5px] leading-relaxed text-emerald-900">
                    You can pay the cash advance in-person at our studio office or handover to our authorized team representative.
                  </p>
                  <p className="text-[10px] font-medium text-emerald-800">
                    💡 Clicking confirm will immediately lock & reserve your event dates in our studio booking calendar.
                  </p>
                </div>
              )}

              {/* Minimal Instruction Helper */}
              <div className="px-3 py-2 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-[10.5px] flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-tight text-[10px]">
                  {paymentMethod === 'bank_transfer'
                    ? '1. Confirm your booking below. 2. Transfer advance & send screenshot on WhatsApp.'
                    : '1. Confirm your cash booking below. 2. Notify studio via WhatsApp to coordinate visit.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1 pb-1">
                {!stepConfirmed ? (
                  <button
                    onClick={handleStep1Confirm}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-[#D4AF37] font-bold text-xs shadow-md hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-[#D4AF37]/40 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    {paymentMethod === 'cash' ? 'Confirm Booking via Cash Payment' : 'Yes, Confirm & Lock My Booking Now'}
                  </button>
                ) : (
                  <div className="w-full py-3 rounded-xl bg-emerald-800 text-white font-bold text-xs text-center shadow-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> ✅ Booking Date Locked!
                  </div>
                )}

                {stepConfirmed ? (
                  <a
                    href={`https://wa.me/${formattedWhatsApp}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleFinalConfirm}
                    className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 animate-pulse border border-emerald-400"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {paymentMethod === 'cash'
                      ? `Notify Studio on WhatsApp (${businessPhone})`
                      : `Send Payment Screenshot on WhatsApp (${businessPhone})`}
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Step 2: Share Confirmation on WhatsApp
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
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-xs font-bold text-[#0D4F4F]">Loading Official Client Portal...</div>}>
      <ShortClientPortalContent />
    </Suspense>
  );
}
