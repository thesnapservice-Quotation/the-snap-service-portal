'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Quotation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { apiFetchQuotationById } from '@/lib/api-client';
import { useSettings } from '@/hooks/use-settings';
import { QuotationPreview } from '@/components/quotation/quotation-preview';
import { QuotationActions } from '@/components/quotation/quotation-actions';
import { PaymentLedgerModal } from '@/components/quotation/payment-ledger-modal';
import { ArrowLeft, Edit3, Sparkles, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    if (id) {
      apiFetchQuotationById(id).then((fromDb) => {
        setQuotation(fromDb);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-xs text-slate-400 font-medium animate-pulse">Loading quotation from database...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-serif font-bold text-slate-700">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">The quotation you are looking for does not exist or was deleted.</p>
        <Link
          href="/quotations"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D4F4F] text-[#D4AF37] text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations List
        </Link>
      </div>
    );
  }

  const handleSaveStatus = (status: Quotation['status']) => {
    const updated = { ...quotation, status };
    storage.saveQuotation(updated);
    setQuotation(updated);
  };

  const handleDuplicate = () => {
    const dup = storage.duplicateQuotation(quotation.id);
    if (dup) {
      router.push(`/quotations/${dup.id}`);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      storage.deleteQuotation(quotation.id);
      router.push('/quotations');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Action Header */}
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
              Quotation Preview — {quotation.quotationNumber}
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </h1>
            <p className="text-xs text-slate-500">
              Client: {quotation.client.name || 'Unnamed Client'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLedgerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-bold hover:bg-emerald-200 transition-all shadow-xs"
            title="Live Payment Ledger & Bill Management"
          >
            <Receipt className="w-4 h-4 text-emerald-800" /> Payment Ledger
          </button>

          <Link
            href={`/quotations/new?id=${quotation.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D4F4F] text-[#D4AF37] text-xs font-bold hover:bg-[#093A3A] transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4" /> Edit Quotation
          </Link>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <QuotationActions
        quotation={quotation}
        onSave={handleSaveStatus}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      {/* Full Screen High-Res Preview */}
      <div className="bg-white p-2 md:p-6 rounded-xl border border-slate-200 shadow-md">
        <QuotationPreview quotation={quotation} settings={settings} />
      </div>

      {/* Payment Ledger Modal */}
      {showLedgerModal && (
        <PaymentLedgerModal
          isOpen={showLedgerModal}
          quotation={quotation}
          onClose={() => setShowLedgerModal(false)}
          onQuotationUpdate={(updated) => {
            setQuotation(updated);
            storage.saveQuotationLocally(updated);
          }}
        />
      )}
    </div>
  );
}
