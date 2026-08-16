'use client';

import React, { useState } from 'react';
import { Quotation, QuotationStatus } from '@/lib/types';
import { 
  downloadPDF, 
  downloadPNG, 
  triggerPrint, 
  shareViaWhatsApp 
} from '@/lib/export-utils';
import { generatePortalUrl } from '@/lib/utils';
import { 
  Save, 
  FileCheck, 
  Copy, 
  Printer, 
  FileDown, 
  Image as ImageIcon, 
  Share2, 
  Trash2,
  Link as LinkIcon,
  Check
} from 'lucide-react';

interface QuotationActionsProps {
  quotation: Quotation;
  onSave: (status: QuotationStatus) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function QuotationActions({
  quotation,
  onSave,
  onDuplicate,
  onDelete,
}: QuotationActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const filename = `SnapService_Quotation_${quotation.quotationNumber || 'Draft'}.pdf`;
  const imgFilename = `SnapService_Quotation_${quotation.quotationNumber || 'Draft'}.png`;

  const handleCopyClientLink = () => {
    const fullUrl = generatePortalUrl(quotation);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="no-print bg-white rounded-xl p-4 border border-slate-200 shadow-md space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h4 className="font-serif font-bold text-sm text-[#0D4F4F]">Quotation Actions</h4>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium">Status:</span>
          <select
            value={quotation.status}
            onChange={(e) => onSave(e.target.value as Quotation['status'])}
            className="text-xs font-bold px-2.5 py-1 rounded-md border border-slate-300 bg-slate-50 text-[#0D4F4F] focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="not_confirmed">Not Confirmed (Red Date Hold)</option>
            <option value="confirmed">Confirmed (Green Date Lock)</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Save Draft */}
        <button
          type="button"
          onClick={() => onSave('draft')}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
        >
          <Save className="w-4 h-4 text-slate-500" /> Save Draft
        </button>

        {/* Save & Confirm */}
        <button
          type="button"
          onClick={() => onSave('confirmed')}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0D4F4F] hover:bg-[#093A3A] text-[#D4AF37] font-bold transition-all shadow-sm"
        >
          <FileCheck className="w-4 h-4" /> Save Quotation
        </button>

        {/* Compare / Profit Analysis Button */}
        <a
          href={`/quotations/${quotation.id}/compare`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-extrabold transition-all shadow-sm border border-[#B89228]"
        >
          <Save className="w-4 h-4" /> Compare (Profit Analysis)
        </a>

        {/* Download PDF */}
        <button
          type="button"
          onClick={() => downloadPDF('quotation-capture-area', filename)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold transition-colors border border-red-200"
        >
          <FileDown className="w-4 h-4 text-red-600" /> Download PDF
        </button>

        {/* Print */}
        <button
          type="button"
          onClick={() => triggerPrint()}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors border border-blue-200"
        >
          <Printer className="w-4 h-4 text-blue-600" /> Print
        </button>

        {/* Download PNG */}
        <button
          type="button"
          onClick={() => downloadPNG('quotation-capture-area', imgFilename)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition-colors border border-amber-200"
        >
          <ImageIcon className="w-4 h-4 text-amber-600" /> Download PNG
        </button>

        {/* Copy Client Link */}
        <button
          type="button"
          onClick={handleCopyClientLink}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all shadow-xs border ${
            copiedLink
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
          }`}
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-white" /> Link Copied!
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 text-blue-600" /> Copy Client Link
            </>
          )}
        </button>

        {/* WhatsApp Share */}
        <button
          type="button"
          onClick={() => shareViaWhatsApp(quotation)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold transition-colors border border-emerald-200"
        >
          <Share2 className="w-4 h-4 text-emerald-600" /> WhatsApp
        </button>

        {/* Duplicate */}
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-colors border border-slate-200"
          >
            <Copy className="w-4 h-4 text-slate-500" /> Duplicate
          </button>
        )}

        {/* Delete */}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-red-50 text-red-600 font-semibold transition-colors border border-red-200"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
