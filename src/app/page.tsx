'use me';
'use client';

import React from 'react';
import Link from 'next/link';
import { useQuotations } from '@/hooks/use-quotations';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/app/quotations/page';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  TrendingUp, 
  PlusCircle, 
  ArrowRight,
  Eye,
  Edit3,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { quotations, loading } = useQuotations();

  // Metrics calculations
  const totalQuotations = quotations.length;
  const draftQuotations = quotations.filter((q) => q.status === 'draft').length;
  const sentQuotations = quotations.filter((q) => q.status === 'sent').length;
  const confirmedBookings = quotations.filter((q) => q.status === 'confirmed' || q.status === 'completed').length;
  
  // Financial metrics calculated ONLY for confirmed & completed bookings
  const confirmedQuotations = quotations.filter((q) => q.status === 'confirmed' || q.status === 'completed');
  const totalValue = confirmedQuotations.reduce((sum, q) => sum + (q.payment?.grandTotal || 0), 0);

  // Synchronized Total Net Profit (strictly confirmed/completed bookings)
  const totalNetProfit = confirmedQuotations.reduce((sum, q) => {
    const cost = q.internalAnalysis?.totalInternalCost ?? q.events.reduce((eSum, evt) => {
      return eSum + evt.services.reduce((sSum, s) => sSum + (s.quantity || 1) * (s.internalCostPerUnit ?? 5000), 0);
    }, 0);
    return sum + (q.payment.grandTotal - cost);
  }, 0);

  const overallMargin = totalValue > 0 ? (totalNetProfit / totalValue) * 100 : 0;

  const recentQuotations = quotations.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0D4F4F] via-[#093A3A] to-[#1B2A4A] text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-[#D4AF37]/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" /> Snap Service Quotation Studio
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide">
              Wedding Studio Overview
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-xl">
              Manage client quotations, compute custom package pricing, and issue luxury PDF quotations instantly.
            </p>
          </div>

          <Link
            href="/quotations/new"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-sm shadow-lg hover:brightness-110 transition-all shrink-0"
          >
            <PlusCircle className="w-5 h-5" /> New Quotation
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards (6 Synchronized Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Quotations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-[11px]">Total Quotations</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-[#0D4F4F]">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-xl text-slate-900">{totalQuotations}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">All time created</span>
          </div>
        </div>

        {/* Card 2: Draft Quotations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-[11px]">Drafts</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-xl text-slate-900">{draftQuotations}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">In progress</span>
          </div>
        </div>

        {/* Card 3: Sent Quotations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-[11px]">Sent to Client</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-xl text-slate-900">{sentQuotations}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Awaiting response</span>
          </div>
        </div>

        {/* Card 4: Confirmed Bookings */}
        <div className="bg-white p-4 rounded-xl border border-[#0D4F4F]/20 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-[#0D4F4F]/5">
          <div className="flex items-center justify-between">
            <span className="text-[#0D4F4F] font-semibold text-[11px]">Confirmed</span>
            <div className="p-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-xl text-[#0D4F4F]">{confirmedBookings}</span>
            <span className="text-[9px] text-[#0D4F4F]/70 block mt-0.5">Bookings locked</span>
          </div>
        </div>

        {/* Card 5: Total Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-[11px]">Total Value</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-base text-slate-900 block truncate">
              {formatCurrency(totalValue)}
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Active pipeline</span>
          </div>
        </div>

        {/* Card 6: Total Estimated Net Profit (Strictly Internal) */}
        <div className="bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-4 rounded-xl border border-[#D4AF37]/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[#D4AF37] font-bold text-[11px] uppercase tracking-wider">Est. Net Profit</span>
            <div className="p-1 rounded-md bg-[#D4AF37] text-[#0D4F4F] font-bold text-xs">
              Rs
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-extrabold text-base text-emerald-300 block truncate">
              {formatCurrency(totalNetProfit)}
            </span>
            <span className="text-[9px] text-slate-300 block mt-0.5 font-semibold">
              Avg Margin: {overallMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="font-serif font-bold text-base text-[#0D4F4F]">Recent Client Quotations</h2>
            <p className="text-xs text-slate-500">Latest wedding quotations created or modified</p>
          </div>
          <Link
            href="/quotations"
            className="flex items-center gap-1 text-xs font-bold text-[#0D4F4F] hover:text-[#093A3A]"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading recent quotations...</div>
        ) : recentQuotations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No quotations found. Click &quot;New Quotation&quot; above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D4F4F]/5 text-[#0D4F4F] font-serif uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Client Name</th>
                  <th className="px-4 py-3">Events</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3">Est. Profit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {recentQuotations.map((q) => {
                  const totalCost = q.internalAnalysis?.totalInternalCost ?? q.events.reduce((sum, evt) => {
                    return sum + evt.services.reduce((sSum, s) => sSum + (s.quantity || 1) * (s.internalCostPerUnit ?? 5000), 0);
                  }, 0);
                  const netProfit = q.payment.grandTotal - totalCost;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 block">{q.client.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{q.quotationNumber}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {q.events.map((e) => e.name).join(', ') || 'None'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {formatCurrency(q.payment.grandTotal)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`font-bold text-xs ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatCurrency(netProfit)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDate(q.client.quotationDate)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/quotations/${q.id}/compare`}
                            className="px-2 py-1 rounded-md bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-[10px] hover:brightness-105 transition-all shadow-2xs"
                            title="Internal Profit Analysis"
                          >
                            Compare
                          </Link>
                          <Link
                            href={`/quotations/${q.id}`}
                            className="p-1 rounded text-slate-500 hover:text-[#0D4F4F]"
                            title="View Quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/quotations/new?id=${q.id}`}
                            className="p-1 rounded text-slate-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
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
