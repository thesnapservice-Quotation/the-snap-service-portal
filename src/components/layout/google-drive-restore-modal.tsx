'use client';

import React, { useState, useEffect } from 'react';
import { Quotation } from '@/lib/types';
import { 
  listGoogleDriveQuotationFiles, 
  GoogleDriveQuotationItem 
} from '@/lib/google-drive-oauth';
import { 
  HardDrive, 
  X, 
  Check, 
  RefreshCw, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  User,
  Phone
} from 'lucide-react';

interface GoogleDriveRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingQuotations: Quotation[];
  onImportQuotations: (quotations: Quotation[]) => Promise<number>;
}

export function GoogleDriveRestoreModal({
  isOpen,
  onClose,
  existingQuotations,
  onImportQuotations,
}: GoogleDriveRestoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GoogleDriveQuotationItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    setErrorMsg('');
    setImportSuccessMsg('');
    const res = await listGoogleDriveQuotationFiles();
    setLoading(false);

    if (res.success) {
      setItems(res.items);
      // Auto-select all by default for fast convenience
      const allIds = new Set(res.items.map((it) => it.id));
      setSelectedIds(allIds);
    } else {
      setErrorMsg(res.error || 'Failed to fetch quotation files from Google Drive.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const existingIds = new Set(existingQuotations.map((q) => q.id));
  const existingNumbers = new Set(existingQuotations.map((q) => q.quotationNumber));

  const isAlreadyInPortal = (item: GoogleDriveQuotationItem) => {
    return (
      existingIds.has(item.quotation.id) ||
      existingNumbers.has(item.quotation.quotationNumber)
    );
  };

  const filteredItems = items.filter((item) => {
    const q = item.quotation;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (q.quotationNumber || '').toLowerCase().includes(query) ||
      (q.client?.name || '').toLowerCase().includes(query) ||
      (q.client?.phone || '').toLowerCase().includes(query) ||
      (q.notes || '').toLowerCase().includes(query)
    );
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredItems.map((it) => it.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    setImporting(true);
    setErrorMsg('');

    const toImport = items
      .filter((it) => selectedIds.has(it.id))
      .map((it) => it.quotation);

    try {
      const count = await onImportQuotations(toImport);
      setImporting(false);
      setImportSuccessMsg(`✓ Successfully restored ${count} quotation(s) into your portal!`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setImporting(false);
      setErrorMsg(err?.message || 'Error restoring quotations.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-[#D4AF37] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-white flex items-center justify-between border-b border-[#D4AF37]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37] text-[#0D4F4F] shadow-sm">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">
                Restore Quotations from Google Drive
              </h3>
              <p className="text-xs text-[#C3DFDF] flex items-center gap-1.5 mt-0.5">
                <span>📁 Folder:</span>
                <span className="font-mono text-[#D4AF37]">The Snap Service — Quotations Archive</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Client Name, Phone, or Quotation #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectedIds.size === filteredItems.length ? deselectAll : selectAll}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>

            <button
              type="button"
              onClick={fetchFiles}
              disabled={loading}
              className="p-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Google Drive files"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0D4F4F]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {importSuccessMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {/* Quotations List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-[250px]">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-[#0D4F4F]" />
              <p className="text-xs font-semibold">Reading Google Drive Quotations Archive...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400 text-center p-6">
              <HardDrive className="w-12 h-12 text-slate-300" />
              <div>
                <p className="text-sm font-bold text-slate-700">No quotation files found</p>
                <p className="text-xs text-slate-500 mt-1">
                  No matching .json quotation files were found in your Google Drive archive folder.
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((item) => {
              const q = item.quotation;
              const isSelected = selectedIds.has(item.id);
              const inPortal = isAlreadyInPortal(item);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#0D4F4F]/5 border-[#0D4F4F] shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 sm:mt-0 ${
                        isSelected
                          ? 'bg-[#0D4F4F] border-[#0D4F4F] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {/* Quotation Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-[#0D4F4F]">
                          {q.quotationNumber || 'No #'}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {q.client?.name || 'Unnamed Client'}
                        </span>
                        {inPortal ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] border border-slate-200">
                            Already in Portal
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                            New / Restorable
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold text-[10px] uppercase">
                          {q.status || 'draft'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                        {q.client?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {q.client.phone}
                          </span>
                        )}
                        {q.client?.eventDates ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {q.client.eventDates}
                          </span>
                        ) : q.events && q.events.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {q.events.length} Event(s) ({q.events.map((e) => e.name || e.eventDate).filter(Boolean).join(', ')})
                          </span>
                        ) : null}
                        {q.createdAt && (
                          <span className="text-[10px] text-slate-400">
                            Saved: {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="sm:text-right pl-8 sm:pl-0">
                    <span className="text-xs text-slate-500 block">Total Amount</span>
                    <span className="font-mono font-bold text-sm text-[#0D4F4F]">
                      PKR {(q.payment?.grandTotal || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Selected: <span className="font-bold text-[#0D4F4F]">{selectedIds.size}</span> of{' '}
            <span className="font-bold text-slate-800">{filteredItems.length}</span> quotation(s)
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0 || importing}
              onClick={handleImport}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-extrabold text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {importing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                {importing
                  ? 'Restoring Quotations...'
                  : `Restore Selected (${selectedIds.size}) into Portal`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
