'use client';

import React, { useState } from 'react';
import { useQuotations } from '@/hooks/use-quotations';
import { useProfitPrivacy } from '@/context/profit-privacy-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Quotation } from '@/lib/types';
import { PaymentLedgerModal } from '@/components/quotation/payment-ledger-modal';
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Camera, 
  Film, 
  Award, 
  Plane, 
  Lock, 
  Unlock, 
  Wallet, 
  Clock, 
  Receipt, 
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function StudioAnalyticsPage() {
  const { quotations, refreshQuotations } = useQuotations();
  const { isProfitUnlocked, openUnlockModal, lockProfit } = useProfitPrivacy();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'confirmed_completed' | 'sent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ledgerModalQuotation, setLedgerModalQuotation] = useState<Quotation | null>(null);

  // Helper functions for Single Source of Truth financial calculations
  const getEventTotal = (q: Quotation): number => {
    if (q.payment?.grandTotal !== undefined && q.payment.grandTotal > 0) {
      return q.payment.grandTotal;
    }
    return (q.events || []).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  };

  const getEventExpenses = (q: Quotation): number => {
    if (q.internalAnalysis?.totalInternalCost !== undefined && q.internalAnalysis.totalInternalCost > 0) {
      return q.internalAnalysis.totalInternalCost;
    }
    const servicesCost = (q.events || []).reduce((eSum, evt) => {
      return eSum + (evt.services || []).reduce((sSum, s) => {
        return sSum + (s.quantity || 1) * (s.internalCostPerUnit ?? 5000);
      }, 0);
    }, 0);
    const albumCost = q.internalAnalysis?.totalAlbumCost || 0;
    const videoCost = q.internalAnalysis?.totalVideoEditingCost || 0;
    return servicesCost + albumCost + videoCost;
  };

  const getReceivedAmount = (q: Quotation): number => {
    // Single Source of Truth: Live Payment Ledger transactions
    if (q.payment?.transactions && q.payment.transactions.length > 0) {
      return q.payment.transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    }
    return Number(q.payment?.advanceReceived) || 0;
  };

  // Strictly filter to ONLY confirmed and completed bookings (no sent or draft quotations)
  const targetQuotations = quotations.filter(
    (q) => q.status === 'confirmed' || q.status === 'completed'
  );

  // Filtered list for the data table based on search
  const filteredQuotationsList = targetQuotations.filter((q) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const clientName = (q.client?.name || '').toLowerCase();
    const quoteNum = (q.quotationNumber || '').toLowerCase();
    const eventDates = (q.client?.eventDates || '').toLowerCase();
    return clientName.includes(term) || quoteNum.includes(term) || eventDates.includes(term);
  });

  // Top Aggregate KPI Calculations:
  // 1. Event Total Amount
  const aggregateEventTotal = targetQuotations.reduce((sum, q) => sum + getEventTotal(q), 0);

  // 2. Total Event Expenses
  const aggregateExpenses = targetQuotations.reduce((sum, q) => sum + getEventExpenses(q), 0);

  // 3. Remaining / Profit Amount = Event Total - Total Expenses
  const aggregateProfit = aggregateEventTotal - aggregateExpenses;
  const aggregateProfitMargin = aggregateEventTotal > 0 ? (aggregateProfit / aggregateEventTotal) * 100 : 0;

  // 4. Received Amount = Synced from Live Payment Ledger
  const aggregateReceived = targetQuotations.reduce((sum, q) => sum + getReceivedAmount(q), 0);

  // 5. Profit Amount Received (Realized Cash Profit in Hand = max(0, Received - Expenses))
  const aggregateProfitReceived = targetQuotations.reduce((sum, q) => {
    const evExp = getEventExpenses(q);
    const evRec = getReceivedAmount(q);
    return sum + Math.max(0, evRec - evExp);
  }, 0);

  // 6. Pending Amount = Event Total - Total Received
  const aggregatePending = Math.max(0, aggregateEventTotal - aggregateReceived);

  // Count crew deployments
  let totalPhotographers = 0;
  let totalVideographers = 0;
  let totalDrones = 0;

  targetQuotations.forEach((q) => {
    (q.events || []).forEach((evt) => {
      (evt.services || []).forEach((s) => {
        const name = (s.serviceName || '').toLowerCase();
        if (name.includes('photo')) totalPhotographers += s.quantity || 1;
        if (name.includes('video')) totalVideographers += s.quantity || 1;
        if (name.includes('drone')) totalDrones += s.quantity || 1;
      });
    });
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D4F4F] via-[#093A3A] to-[#1B2A4A] text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-[#D4AF37]/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" /> Financial Analytics & Gear ROI
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide">
              Studio Financial Intelligence
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-2xl leading-relaxed">
              Real-time Single Source of Truth for confirmed studio bookings — synchronized with Live Payment Ledgers, Event Expenses, Profit Forecasts, and Equipment Deployments.
            </p>
          </div>

          {/* Confirmed Bookings Badge */}
          <div className="flex items-center gap-2 bg-emerald-950/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-500/30 text-xs font-bold text-emerald-300 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{targetQuotations.length} Confirmed Bookings</span>
          </div>
        </div>
      </div>

      {/* 6-Step Financial Workflow Pipeline Cards (In Exact Flow Sequence) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#0D4F4F] uppercase tracking-wider">
              Financial Workflow Pipeline
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              (Event ➔ Expenses ➔ Profit ➔ Received ➔ Profit Received ➔ Pending)
            </span>
          </div>
          <button
            onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
            className="text-xs font-bold px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            {isProfitUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Lock Cost & Profit
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600" /> Unlock Cost & Profit
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* STEP 1: EVENT TOTAL AMOUNT */}
          <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9.5px]">
                1. Event Total
              </span>
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-bold text-lg text-slate-900 block">
                {formatCurrency(aggregateEventTotal)}
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 font-medium">
                Total Booked Packages
              </span>
            </div>
          </div>

          {/* STEP 2: TOTAL EVENT EXPENSES */}
          <div 
            onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
            className="bg-white p-3.5 rounded-2xl border-2 border-red-100 shadow-xs flex flex-col justify-between cursor-pointer group hover:border-red-300 transition-all relative overflow-hidden"
            title={isProfitUnlocked ? "Click to lock cost figures" : "Click to unlock cost figures"}
          >
            <div className="flex items-center justify-between">
              <span className="text-red-700 font-bold uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                2. Expenses {isProfitUnlocked ? <Unlock className="w-2.5 h-2.5 text-red-500" /> : <Lock className="w-2.5 h-2.5 text-red-500" />}
              </span>
              <div className="p-1 rounded-lg bg-red-50 text-red-600">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-bold text-lg text-red-700 block tracking-wider">
                {isProfitUnlocked ? formatCurrency(aggregateExpenses) : '••••••••'}
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 font-medium">
                {isProfitUnlocked ? 'Crew & Printing' : '🔒 Protected'}
              </span>
            </div>
          </div>

          {/* STEP 3: REMAINING / PROFIT AMOUNT */}
          <div 
            onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
            className="bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-3.5 rounded-2xl border-2 border-[#D4AF37] shadow-md flex flex-col justify-between cursor-pointer group hover:brightness-105 transition-all relative overflow-hidden"
            title={isProfitUnlocked ? "Click to lock profit figures" : "Click to unlock profit figures"}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#D4AF37] font-bold uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                3. Total Profit {isProfitUnlocked ? <Unlock className="w-2.5 h-2.5 text-emerald-300" /> : <Lock className="w-2.5 h-2.5 text-[#D4AF37]" />}
              </span>
              <div className="p-1 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37]">
                <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-extrabold text-lg text-emerald-300 block tracking-wider">
                {isProfitUnlocked ? formatCurrency(aggregateProfit) : '••••••••'}
              </span>
              <span className="text-[9.5px] text-[#C3DFDF] block mt-0.5 font-medium">
                {isProfitUnlocked ? `Margin: ${aggregateProfitMargin.toFixed(0)}%` : '🔒 Expected'}
              </span>
            </div>
          </div>

          {/* STEP 4: RECEIVED AMOUNT (LIVE PAYMENT LEDGER SYNCED) */}
          <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-emerald-800 font-bold uppercase tracking-wider text-[9.5px]">
                4. Received Total
              </span>
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-bold text-lg text-emerald-800 block">
                {formatCurrency(aggregateReceived)}
              </span>
              <span className="text-[9.5px] text-emerald-600 block mt-0.5 font-medium">
                ⚡ Ledger Synced
              </span>
            </div>
          </div>

          {/* STEP 5: PROFIT AMOUNT RECEIVED (REALIZED IN-HAND PROFIT) */}
          <div 
            onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
            className="bg-emerald-950 text-white p-3.5 rounded-2xl border-2 border-emerald-400 shadow-md flex flex-col justify-between cursor-pointer group hover:brightness-110 transition-all relative overflow-hidden"
            title={isProfitUnlocked ? "Click to lock profit figures" : "Click to unlock profit figures"}
          >
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-bold uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                5. Profit Received {isProfitUnlocked ? <Unlock className="w-2.5 h-2.5 text-emerald-300" /> : <Lock className="w-2.5 h-2.5 text-emerald-300" />}
              </span>
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-extrabold text-lg text-[#D4AF37] block tracking-wider">
                {isProfitUnlocked ? formatCurrency(aggregateProfitReceived) : '••••••••'}
              </span>
              <span className="text-[9.5px] text-emerald-300/80 block mt-0.5 font-medium">
                {isProfitUnlocked ? 'In-Hand Realized' : '🔒 Protected'}
              </span>
            </div>
          </div>

          {/* STEP 6: PENDING AMOUNT */}
          <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-amber-800 font-bold uppercase tracking-wider text-[9.5px]">
                6. Pending Amount
              </span>
              <div className="p-1 rounded-lg bg-amber-50 text-amber-700">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-bold text-lg text-amber-800 block">
                {formatCurrency(aggregatePending)}
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 font-medium">
                Total − Received
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Event Financial Workflow Table */}
      <div className="bg-white rounded-2xl border-2 border-[#E5E0D5] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#D4AF37]" />
              Event-by-Event Financial Ledger & ROI Breakdown
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live calculation of Event Total ➔ Expenses ➔ Profit ➔ Received (Ledger) ➔ Profit Received ➔ Pending (Confirmed bookings only).
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search client, quotation #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-2.5">Quotation / Client</th>
                <th className="py-2.5 px-2.5">Dates & Status</th>
                <th className="py-2.5 px-2.5 text-right">Event Total</th>
                <th className="py-2.5 px-2.5 text-right">Expenses</th>
                <th className="py-2.5 px-2.5 text-right">Total Profit</th>
                <th className="py-2.5 px-2.5 text-right">Received (Ledger)</th>
                <th className="py-2.5 px-2.5 text-right">Profit Received</th>
                <th className="py-2.5 px-2.5 text-right">Pending</th>
                <th className="py-2.5 px-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredQuotationsList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No confirmed bookings found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredQuotationsList.map((q) => {
                  const evTotal = getEventTotal(q);
                  const evExp = getEventExpenses(q);
                  const evProfit = evTotal - evExp;
                  const evReceived = getReceivedAmount(q);
                  const evProfitReceived = Math.max(0, evReceived - evExp);
                  const evPending = Math.max(0, evTotal - evReceived);
                  const txCount = q.payment?.transactions?.length || (q.payment?.advanceReceived ? 1 : 0);

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Quotation & Client */}
                      <td className="py-2.5 px-2.5">
                        <div className="font-bold text-slate-900">
                          {q.client?.name || 'Unnamed Client'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{q.quotationNumber || 'SS-2026'}
                        </div>
                      </td>

                      {/* Dates & Status */}
                      <td className="py-2.5 px-2.5">
                        <div className="text-slate-700 text-[10.5px]">
                          {q.client?.eventDates || 'Dates Pending'}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider mt-0.5 ${
                            q.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>

                      {/* Event Total */}
                      <td className="py-2.5 px-2.5 text-right font-bold font-mono text-slate-900">
                        {formatCurrency(evTotal)}
                      </td>

                      {/* Expenses (Protected) */}
                      <td className="py-2.5 px-2.5 text-right font-mono text-red-700 font-bold">
                        {isProfitUnlocked ? formatCurrency(evExp) : '••••••'}
                      </td>

                      {/* Total Profit (Protected) */}
                      <td className="py-2.5 px-2.5 text-right font-mono text-emerald-700 font-bold">
                        {isProfitUnlocked ? formatCurrency(evProfit) : '••••••'}
                      </td>

                      {/* Received (Ledger Synced) */}
                      <td className="py-2.5 px-2.5 text-right">
                        <div className="font-bold font-mono text-emerald-800">
                          {formatCurrency(evReceived)}
                        </div>
                        <span className="text-[9px] text-slate-400 inline-flex items-center gap-0.5">
                          {txCount} receipt{txCount === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* Profit Received (Protected) */}
                      <td className="py-2.5 px-2.5 text-right font-mono text-[#0D4F4F] font-bold">
                        {isProfitUnlocked ? (
                          <span className={evProfitReceived > 0 ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>
                            {formatCurrency(evProfitReceived)}
                          </span>
                        ) : (
                          '••••••'
                        )}
                      </td>

                      {/* Pending */}
                      <td className="py-2.5 px-2.5 text-right">
                        <span className={`font-bold font-mono ${evPending > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                          {formatCurrency(evPending)}
                        </span>
                      </td>

                      {/* Action: Open Live Ledger */}
                      <td className="py-2.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setLedgerModalQuotation(q)}
                          className="px-2 py-1 rounded-lg bg-[#0D4F4F]/10 hover:bg-[#0D4F4F] text-[#0D4F4F] hover:text-white font-bold text-[10px] transition-colors inline-flex items-center gap-1 border border-[#0D4F4F]/30 shadow-2xs"
                        >
                          <CreditCard className="w-3 h-3" />
                          Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment & Service Deployment ROI Breakdown */}
      <div className="bg-white rounded-2xl border-2 border-[#E5E0D5] p-6 shadow-sm space-y-6">
        <h2 className="font-serif font-bold text-base text-[#0D4F4F] border-b pb-3 flex items-center justify-between">
          <span>Equipment & Crew Utilization Breakdown</span>
          <span className="text-xs text-slate-400 font-sans font-normal">Active deployments</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Photographers Deployed</h3>
            <span className="font-serif font-bold text-3xl text-blue-900 block">{totalPhotographers}</span>
            <p className="text-[10px] text-slate-500">Total shifts assigned across all event days</p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Videographers Deployed</h3>
            <span className="font-serif font-bold text-3xl text-purple-900 block">{totalVideographers}</span>
            <p className="text-[10px] text-slate-500">Total shifts assigned across all event days</p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Plane className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Drone Aerial Shifts</h3>
            <span className="font-serif font-bold text-3xl text-amber-900 block">{totalDrones}</span>
            <p className="text-[10px] text-slate-500">Total aerial coverage shifts booked</p>
          </div>
        </div>
      </div>

      {/* Live Payment Ledger Modal */}
      {ledgerModalQuotation && (
        <PaymentLedgerModal
          isOpen={!!ledgerModalQuotation}
          onClose={() => {
            setLedgerModalQuotation(null);
            refreshQuotations();
          }}
          quotation={ledgerModalQuotation}
          onQuotationUpdate={(updated) => {
            setLedgerModalQuotation(updated);
            refreshQuotations();
          }}
        />
      )}
    </div>
  );
}
