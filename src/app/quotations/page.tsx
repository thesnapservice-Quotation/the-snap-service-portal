'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuotations } from '@/hooks/use-quotations';
import { formatCurrency, formatDate, generateWhatsAppShareUrl, generatePortalUrl } from '@/lib/utils';
import { QuotationStatus } from '@/lib/types';
import { 
  PlusCircle, 
  Search, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  FileText,
  Filter,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

import { StatusBadge, STATUS_CLASSES } from '@/components/quotation/status-badge';

export default function QuotationsListPage() {
  const { quotations, loading, saveQuotation, deleteQuotation, duplicateQuotation } = useQuotations();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = quotations.filter((q) => {
    const matchesSearch =
      q.client.name.toLowerCase().includes(search.toLowerCase()) ||
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.client.phone.includes(search);

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-serif font-bold text-xl text-[#0D4F4F] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4AF37]" /> Quotation Registry
          </h1>
          <p className="text-xs text-slate-500">
            Manage all client wedding quotations, bookings, and statuses.
          </p>
        </div>

        <Link
          href="/quotations/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-sm hover:brightness-105 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Create Quotation
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Client Name, Quotation # or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
          >
            <option value="all">All Statuses ({quotations.length})</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading quotations...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium text-sm">No quotations found</p>
            <p className="text-slate-400 text-xs">Try adjusting search query or create a new quotation.</p>
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" /> Create First Quotation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D4F4F] text-[#FAF9F6] font-serif uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Quotation #</th>
                  <th className="px-5 py-3.5">Client Details</th>
                  <th className="px-5 py-3.5">Events Summary</th>
                  <th className="px-5 py-3.5">Selling Price</th>
                  <th className="px-5 py-3.5">Estimated Profit</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filtered.map((q) => {
                  const eventsSummary = q.events.map((e) => e.name).join(', ') || 'No events';

                  // Dynamic internal profit calculation for display
                  const totalCost = q.internalAnalysis?.totalInternalCost ?? q.events.reduce((sum, evt) => {
                    return sum + evt.services.reduce((sSum, s) => sSum + (s.quantity || 1) * (s.internalCostPerUnit ?? 5000), 0);
                  }, 0);
                  const netProfit = q.payment.grandTotal - totalCost;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      {/* Quotation Number */}
                      <td className="px-5 py-4 font-mono font-bold text-[#0D4F4F]">
                        {q.quotationNumber}
                      </td>

                      {/* Client Details */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800 text-sm block">
                          {q.client.name || 'Unnamed Client'}
                        </span>
                        <span className="text-slate-400 text-[11px]">{q.client.phone}</span>
                      </td>

                      {/* Events Summary */}
                      <td className="px-5 py-4 max-w-[200px] truncate text-slate-700">
                        <span className="font-medium">{eventsSummary}</span>
                        <span className="block text-[10px] text-slate-400">
                          {q.events.length} {q.events.length === 1 ? 'Event' : 'Events'}
                        </span>
                      </td>

                      {/* Total Selling Price */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 text-sm block">
                          {formatCurrency(q.payment.grandTotal)}
                        </span>
                        {q.payment.advanceReceived > 0 && (
                          <span className="text-[10px] text-emerald-700 block">
                            Adv: {formatCurrency(q.payment.advanceReceived)}
                          </span>
                        )}
                      </td>

                      {/* Estimated Profit */}
                      <td className="px-5 py-4">
                        <span className={`font-bold text-xs block ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatCurrency(netProfit)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Internal Profit</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <select
                          value={q.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as QuotationStatus;
                            saveQuotation({ ...q, status: newStatus, updatedAt: new Date().toISOString() });
                          }}
                          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none ${
                            STATUS_CLASSES[q.status] || STATUS_CLASSES.draft
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="not_confirmed">Not Confirmed</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(q.client.quotationDate)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={generateWhatsAppShareUrl(q)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                            title="Share Quotation on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>

                          <a
                            href={generatePortalUrl(q)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                            title="Open Interactive Client Portal Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <Link
                            href={`/quotations/${q.id}/compare`}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-[11px] shadow-2xs hover:brightness-105 transition-all flex items-center gap-1"
                            title="Internal Profit Analysis"
                          >
                            Compare
                          </Link>

                          <Link
                            href={`/quotations/${q.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0D4F4F] hover:bg-slate-100"
                            title="View Full Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/quotations/new?id=${q.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Quotation"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => duplicateQuotation(q.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                            title="Duplicate Quotation"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this quotation?')) {
                                deleteQuotation(q.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50"
                            title="Delete Quotation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
