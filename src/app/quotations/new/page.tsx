'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Quotation, EventItem, PackageInclusion, QuotationStatus } from '@/lib/types';
import { useQuotations } from '@/hooks/use-quotations';
import { useSettings } from '@/hooks/use-settings';
import { useServices } from '@/hooks/use-services';
import { useAuth } from '@/hooks/use-auth';
import { storage } from '@/lib/storage';
import { getTodayDateString, sortEventsInSequence } from '@/lib/utils';
import { generateSecureId, generateRandomNumericId } from '@/lib/crypto';
import { DEFAULT_INCLUSIONS } from '@/lib/defaults';
import { apiFetchQuotationById } from '@/lib/api-client';
import { ClientDetailsForm } from '@/components/quotation/client-details-form';
import { EventBuilder } from '@/components/quotation/event-builder';
import { InclusionsPicker } from '@/components/quotation/inclusions-picker';
import { PaymentSection } from '@/components/quotation/payment-section';
import { QuotationPreview } from '@/components/quotation/quotation-preview';
import { QuotationActions } from '@/components/quotation/quotation-actions';
import { ArrowLeft, Eye, Edit3, Sparkles } from 'lucide-react';
import Link from 'next/link';

function NewQuotationContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const editId = (params?.id as string) || searchParams.get('id');

  const { saveQuotation, deleteQuotation, duplicateQuotation } = useQuotations();
  const { settings } = useSettings();
  const { services } = useServices();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initial quotation state
  const [quotation, setQuotation] = useState<Quotation>(() => {
    const activeUser = currentUser || (typeof window !== 'undefined' ? storage.getCurrentUser() : null);
    const activeUserId = activeUser?.id || 'user-super-admin';
    const activeWs = activeUser?.role === 'super_admin' || activeUserId === 'user-super-admin'
      ? 'ws_user-super-admin'
      : (activeUser?.workspaceId || `ws_${activeUserId}`);

    if (editId) {
      const existing = storage.getQuotationById(editId);
      if (existing) return existing;
    }

    // Default template inclusions (Standard 6 Deliverables)
    const defaultIncList: PackageInclusion[] = DEFAULT_INCLUSIONS.map((item) => ({ ...item }));

    // Initial default events (Mehndi)
    const initialEvents: EventItem[] = [
      {
        id: `evt-1`,
        name: 'Mehndi',
        dayNumber: 1,
        services: [
          { id: 'es-1', serviceId: 'srv-1', serviceName: 'Photographer', quantity: 2 },
          { id: 'es-2', serviceId: 'srv-2', serviceName: 'Videographer', quantity: 1 },
          { id: 'es-3', serviceId: 'srv-3', serviceName: 'Drone', quantity: 1 },
        ],
        guestCount: 200,
        price: 45000,
      },
    ];

    const initialTodayDate = getTodayDateString();

    return {
      id: generateSecureId('quote'),
      quotationNumber: storage.generateQuotationNumber(activeWs),
      workspaceId: activeWs,
      userId: activeUserId,
      createdByUserId: activeUserId,
      updatedByUserId: activeUserId,
      status: 'sent',
      securityPin: generateRandomNumericId(6),
      publicLinkDate: initialTodayDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: {
        name: '',
        phone: '',
        quotationDate: initialTodayDate,
        eventDates: '',
      },
      packageType: 'multi_event',
      events: initialEvents,
      inclusions: defaultIncList.length > 0 ? defaultIncList : [],
      payment: {
        grandTotal: 45000,
        advanceReceived: 0,
        advanceType: 'fixed',
        balancePayable: 45000,
      },
      termsAndConditions: settings.quotation.defaultTerms,
    };
  });

  // Re-synchronize when editId changes
  useEffect(() => {
    if (editId) {
      const existing = storage.getQuotationById(editId);
      if (existing) {
        setQuotation(existing);
      }
      apiFetchQuotationById(editId).then((fromDb) => {
        if (fromDb) {
          setQuotation(fromDb);
          storage.saveQuotationLocally(fromDb);
        }
      });
    }
  }, [editId]);

  // Keep grand total and balance calculated automatically whenever events, inclusions, or payment settings change
  useEffect(() => {
    const eventsSum = quotation.events.reduce((sum, e) => sum + (e.price || 0), 0);
    const extrasSum = (quotation.inclusions || [])
      .filter((inc) => inc.included && inc.price !== undefined && inc.price > 0)
      .reduce((sum, inc) => sum + (inc.price || 0) * (inc.quantity || 1), 0);
    
    const total = eventsSum + extrasSum;
    
    let advanceAmt = quotation.payment.advanceReceived;
    if (quotation.payment.advanceType === 'percentage' && quotation.payment.advancePercentage) {
      advanceAmt = Math.round((total * quotation.payment.advancePercentage) / 100);
    }
    const balance = Math.max(0, total - advanceAmt);

    setQuotation((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        grandTotal: total,
        advanceReceived: advanceAmt,
        balancePayable: balance,
      },
    }));
  }, [quotation.events, quotation.inclusions, quotation.payment.advanceType, quotation.payment.advancePercentage]);

  const handleSave = async (status?: QuotationStatus) => {
    if (isSaving) return;
    setIsSaving(true);

    const activeUser = currentUser || storage.getCurrentUser();
    const activeUserId = activeUser?.id || 'user-super-admin';
    const activeWs = activeUser?.role === 'super_admin' || activeUserId === 'user-super-admin'
      ? 'ws_user-super-admin'
      : (activeUser?.workspaceId || `ws_${activeUserId}`);
    const finalStatus = status || quotation.status || 'sent';
    const sortedEvents = sortEventsInSequence(quotation.events || []);

    const toSave: Quotation = {
      ...quotation,
      events: sortedEvents,
      workspaceId: quotation.workspaceId || activeWs,
      userId: activeUserId,
      createdByUserId: quotation.createdByUserId || activeUserId,
      updatedByUserId: activeUserId,
      status: finalStatus,
      publicLinkDate: quotation.publicLinkDate || (quotation.client?.quotationDate ? quotation.client.quotationDate.split('T')[0] : getTodayDateString()),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveQuotation(toSave);
    setQuotation(saved);

    // Update browser URL silently so that page refresh (F5 / Cmd+R) loads this saved quotation instead of generating a new one
    if (typeof window !== 'undefined' && window.history && !editId) {
      window.history.replaceState(null, '', `/quotations/new?id=${saved.id}`);
    }

    setSaveSuccessMsg(`Quotation saved as ${finalStatus.toUpperCase().replace('_', ' ')}!`);
    setTimeout(() => {
      setSaveSuccessMsg('');
      setIsSaving(false);
    }, 2500);
  };

  const handleDuplicate = async () => {
    const dup = await duplicateQuotation(quotation.id);
    if (dup) {
      router.push(`/quotations/new?id=${dup.id}`);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this quotation draft?')) {
      deleteQuotation(quotation.id);
      router.push('/quotations');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-lg text-[#0D4F4F] flex items-center gap-2">
              {editId ? 'Edit Quotation' : 'Create New Quotation'}
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </h1>
            <p className="text-xs text-slate-500">
              Snap Service Wedding Photography & Videography
            </p>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
              activeTab === 'editor' ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs' : 'text-slate-600'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
              activeTab === 'preview' ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs' : 'text-slate-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="no-print p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>✓ {saveSuccessMsg}</span>
          <Link href="/quotations" className="underline font-bold">View All Quotations</Link>
        </div>
      )}

      {/* Main Split-Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Builder */}
        <div
          className={`lg:col-span-6 space-y-5 ${
            activeTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Actions toolbar */}
          <QuotationActions
            quotation={quotation}
            onSave={handleSave}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />

          {/* Client Details Form with Interactive Booking Calendar */}
          <ClientDetailsForm
            client={quotation.client}
            quotationNumber={quotation.quotationNumber}
            events={quotation.events}
            currentQuotationId={quotation.id}
            onChange={(client) => setQuotation((prev) => ({ ...prev, client }))}
            onQuotationNumberChange={(num) =>
              setQuotation((prev) => ({ ...prev, quotationNumber: num }))
            }
            onEventDateChange={(eventIndex, dateStr) => {
              const updatedEvents = [...quotation.events];
              if (updatedEvents[eventIndex]) {
                updatedEvents[eventIndex] = {
                  ...updatedEvents[eventIndex],
                  eventDate: dateStr,
                };
                setQuotation((prev) => ({
                  ...prev,
                  events: updatedEvents,
                }));
              }
            }}
          />

          {/* Smart Event Builder */}
          <EventBuilder
            events={quotation.events}
            availableServices={services}
            onChange={(events) => setQuotation((prev) => ({ ...prev, events }))}
          />

          {/* Inclusions Picker */}
          <InclusionsPicker
            inclusions={quotation.inclusions}
            events={quotation.events}
            onChange={(inclusions) => setQuotation((prev) => ({ ...prev, inclusions }))}
          />

          {/* Payment Breakdown */}
          <PaymentSection
            payment={quotation.payment}
            grandTotal={quotation.payment.grandTotal}
            onChange={(payment) => setQuotation((prev) => ({ ...prev, payment }))}
          />
        </div>

        {/* Right Column: Live Quotation Preview */}
        <div
          className={`lg:col-span-6 sticky top-6 ${
            activeTab === 'editor' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="no-print flex items-center justify-between mb-2">
            <h3 className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#D4AF37]" /> Live Quotation Preview
            </h3>
            <span className="text-[11px] text-slate-400">Updates instantly in real-time</span>
          </div>

          <QuotationPreview quotation={quotation} settings={settings} />
        </div>
      </div>
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs text-slate-400">Loading editor...</div>}>
      <NewQuotationContent />
    </Suspense>
  );
}
