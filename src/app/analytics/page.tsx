'use client';

import React, { useState } from 'react';
import { useQuotations } from '@/hooks/use-quotations';
import { useExpenses } from '@/hooks/use-expenses';
import { useProfitPrivacy } from '@/context/profit-privacy-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Quotation } from '@/lib/types';
import { PaymentLedgerModal } from '@/components/quotation/payment-ledger-modal';
import { DateRangePicker, DateRange, computePresetRange } from '@/components/analytics/date-range-picker';
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
  ExternalLink,
  Calendar,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function StudioAnalyticsPage() {
  const { quotations, refreshQuotations } = useQuotations();
  const { expenses, totalExpenses, totalTeamAdvances } = useExpenses();
  const { isProfitUnlocked, openUnlockModal, lockProfit } = useProfitPrivacy();

  const [searchTerm, setSearchTerm] = useState('');
  const [ledgerModalQuotation, setLedgerModalQuotation] = useState<Quotation | null>(null);

  // Date Range filter state (Default to Maximum / All Time so all confirmed bookings are visible immediately)
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    startDate: null,
    endDate: null,
    preset: 'all_time',
  }));

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

  // Date range filter helper
  const isQuotationInDateRange = (q: Quotation): boolean => {
    if (!dateRange.startDate && !dateRange.endDate) return true;

    const startMs = dateRange.startDate ? new Date(dateRange.startDate).setHours(0, 0, 0, 0) : 0;
    const endMs = dateRange.endDate ? new Date(dateRange.endDate).setHours(23, 59, 59, 999) : Infinity;

    // 1. Check event dates in q.events
    if (q.events && q.events.length > 0) {
      const hasMatchingEvent = q.events.some((e) => {
        if (!e.eventDate) return false;
        const d = new Date(e.eventDate).getTime();
        return !isNaN(d) && d >= startMs && d <= endMs;
      });
      if (hasMatchingEvent) return true;
    }

    // 2. Check quotationDate
    if (q.client?.quotationDate) {
      const d = new Date(q.client.quotationDate).getTime();
      if (!isNaN(d) && d >= startMs && d <= endMs) return true;
    }

    // 3. Check createdAt
    if (q.createdAt) {
      const d = new Date(q.createdAt).getTime();
      if (!isNaN(d) && d >= startMs && d <= endMs) return true;
    }

    // 4. Check payment transactions dates
    if (q.payment?.transactions && q.payment.transactions.length > 0) {
      const hasMatchingTx = q.payment.transactions.some((tx) => {
        if (!tx.date) return false;
        const d = new Date(tx.date).getTime();
        return !isNaN(d) && d >= startMs && d <= endMs;
      });
      if (hasMatchingTx) return true;
    }

    // 5. Try parsing dates in q.client.eventDates
    if (q.client?.eventDates) {
      const words = q.client.eventDates.match(/\d{4}-\d{2}-\d{2}/g);
      if (words && words.length > 0) {
        const match = words.some((w) => {
          const d = new Date(w).getTime();
          return !isNaN(d) && d >= startMs && d <= endMs;
        });
        if (match) return true;
      }
    }

    return false;
  };

  // Strictly filter to ONLY confirmed and completed bookings (no sent or draft quotations) & apply date range filter
  const targetQuotations = quotations.filter(
    (q) => (q.status === 'confirmed' || q.status === 'completed') && isQuotationInDateRange(q)
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

  // Date Range filter helper for Studio Expenses & Team Advances
  const isExpenseInDateRange = (exp: any): boolean => {
    if (!dateRange.startDate && !dateRange.endDate) return true;
    const expTime = new Date(exp.date).getTime();
    if (isNaN(expTime)) return true;

    if (dateRange.startDate) {
      const startTime = new Date(dateRange.startDate).getTime();
      if (expTime < startTime) return false;
    }
    if (dateRange.endDate) {
      const endTime = new Date(dateRange.endDate + 'T23:59:59.999Z').getTime();
      if (expTime > endTime) return false;
    }
    return true;
  };

  const targetExpensesList = expenses.filter(isExpenseInDateRange);
  const aggregateLedgerExpenses = targetExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const aggregateTeamAdvancesFiltered = targetExpensesList
    .filter((e) => e.category === 'team_advance')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Top Aggregate KPI Calculations (Synchronized with Studio Expenses & Team Ledger):
  // 1. Event Total Amount
  const aggregateEventTotal = targetQuotations.reduce((sum, q) => sum + getEventTotal(q), 0);

  // 2. Event Direct Internal Quoted Costs
  const aggregateEventExpenses = targetQuotations.reduce((sum, q) => sum + getEventExpenses(q), 0);

  // 3. Total Studio Expenses & Team Advances (From Expenses Ledger)
  const totalOutflowExpenses = aggregateLedgerExpenses;

  // 4. Client Inflow Received = Synced from Live Payment Ledger
  const aggregateReceived = targetQuotations.reduce((sum, q) => sum + getReceivedAmount(q), 0);

  // 5. Net Studio Profit (Inflow - Studio Expenses & Advances) -> EXACT SYNC WITH EXPENSES & TEAM LEDGER
  const netStudioProfit = aggregateReceived - totalOutflowExpenses;
  const netStudioProfitMargin = aggregateReceived > 0 ? (netStudioProfit / aggregateReceived) * 100 : 0;

  // 6. Projected Net Profit (Total Quoted - Direct Event Costs)
  const projectedProfit = aggregateEventTotal - (aggregateEventExpenses || totalOutflowExpenses);
  const projectedProfitMargin = aggregateEventTotal > 0 ? (projectedProfit / aggregateEventTotal) * 100 : 0;

  // 7. Pending Amount = Event Total - Total Received
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
              <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" /> Financial Analytics &amp; Gear ROI
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide">
              Studio Financial Intelligence
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-2xl leading-relaxed">
              Real-time Single Source of Truth for confirmed studio bookings — synchronized with Live Payment Ledgers, Studio Expenses, and Net Profit.
            </p>
          </div>

          {/* Top Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/expenses"
              className="flex items-center gap-2 bg-[#FAF9F6]/10 hover:bg-[#FAF9F6]/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] shadow-md transition-all"
            >
              <Receipt className="w-4 h-4" />
              <span>Studio Expenses &amp; Team Ledger</span>
            </Link>

            <div className="flex items-center gap-2 bg-emerald-950/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-500/30 text-xs font-bold text-emerald-300 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{targetQuotations.length} Confirmed Bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Step Financial Workflow Pipeline Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#0D4F4F] uppercase tracking-wider">
              Financial Workflow Pipeline
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
              (Total ➔ Expenses ➔ Projected ➔ Inflow ➔ Net Studio Profit ➔ Pending)
            </span>
          </div>

          {/* Top Controls: Date Range Picker + Lock Cost & Profit */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Google / Meta Ads style Date Range Picker */}
            <DateRangePicker 
              dateRange={dateRange} 
              onChange={setDateRange} 
            />

            {/* Lock / Unlock Cost & Profit */}
            <button
              onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
              className="text-xs font-bold px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              {isProfitUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Lock Cost &amp; Profit
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Unlock Cost &amp; Profit
                </>
              )}
            </button>
          </div>
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

          {/* STEP 2: TOTAL EXPENSES & TEAM ADVANCES */}
          <div 
            onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
            className="bg-white p-3.5 rounded-2xl border-2 border-red-100 shadow-xs flex flex-col justify-between cursor-pointer group hover:border-red-300 transition-all relative overflow-hidden"
            title={isProfitUnlocked ? "Click to lock cost figures" : "Click to unlock cost figures"}
          >
            <div className="flex items-center justify-between">
              <span className="text-red-700 font-bold uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                2. Studio Outflow {isProfitUnlocked ? <Unlock className="w-2.5 h-2.5 text-red-500" /> : <Lock className="w-2.5 h-2.5 text-red-500" />}
              </span>
              <div className="p-1 rounded-lg bg-red-50 text-red-600">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-bold text-lg text-red-700 block tracking-wider">
                {isProfitUnlocked ? formatCurrency(totalOutflowExpenses) : '••••••••'}
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 font-medium truncate" title="Total Studio Expenses & Team Advances">
                {isProfitUnlocked ? `Expenses + Advances` : '🔒 Protected'}
              </span>
            </div>
          </div>

          {/* STEP 3: PROJECTED PROFIT AMOUNT */}
          <div 
            onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
            className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer group hover:border-slate-300 transition-all relative overflow-hidden"
            title={isProfitUnlocked ? "Click to lock profit figures" : "Click to unlock profit figures"}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                3. Projected Profit {isProfitUnlocked ? <Unlock className="w-2.5 h-2.5 text-emerald-600" /> : <Lock className="w-2.5 h-2.5 text-slate-500" />}
              </span>
              <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-bold text-lg text-slate-900 block tracking-wider">
                {isProfitUnlocked ? formatCurrency(projectedProfit) : '••••••••'}
              </span>
              <span className="text-[9.5px] text-slate-500 block mt-0.5 font-medium">
                {isProfitUnlocked ? `Margin: ${projectedProfitMargin.toFixed(0)}%` : '🔒 Expected'}
              </span>
            </div>
          </div>

          {/* STEP 4: RECEIVED INFLOW (LIVE PAYMENT LEDGER SYNCED) */}
          <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-emerald-800 font-bold uppercase tracking-wider text-[9.5px]">
                4. Client Inflow
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

          {/* STEP 5: NET STUDIO PROFIT (REALIZED IN-HAND PROFIT) -> EXACT MATCH WITH EXPENSES */}
          <div 
            onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
            className="bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-3.5 rounded-2xl border-2 border-[#D4AF37] shadow-md flex flex-col justify-between cursor-pointer group hover:brightness-105 transition-all relative overflow-hidden"
            title={isProfitUnlocked ? "Click to lock profit figures" : "Click to unlock profit figures"}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#D4AF37] font-bold uppercase tracking-wider text-[9.5px] flex items-center gap-1">
                5. Net Studio Profit {isProfitUnlocked ? <Unlock className="w-2.5 h-2.5 text-emerald-300" /> : <Lock className="w-2.5 h-2.5 text-[#D4AF37]" />}
              </span>
              <div className="p-1 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37]">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="font-serif font-extrabold text-lg text-emerald-300 block tracking-wider">
                {isProfitUnlocked ? formatCurrency(netStudioProfit) : '••••••••'}
              </span>
              <span className="text-[9.5px] text-[#C3DFDF] block mt-0.5 font-medium truncate" title="Synced with Studio Expenses & Team Ledger">
                {isProfitUnlocked ? `Net Margin: ${netStudioProfitMargin.toFixed(0)}% • Synced` : '🔒 Protected'}
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

      {/* Studio Expenses & Team Advances Deduction Summary */}
      <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Receipt className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-2">
              Studio Expenses & Team Advances Sync
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 whitespace-nowrap">
                ⚡ Active & Deducted
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Team advances and studio costs are synchronized live from the Expenses Ledger and deducted from overall Net Profit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 flex-wrap">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Team Advances</span>
            <span className="font-serif font-bold text-amber-800 text-sm">{formatCurrency(aggregateTeamAdvancesFiltered)}</span>
          </div>

          <div className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Deductions</span>
            <span className="font-serif font-bold text-rose-600 text-sm">{formatCurrency(aggregateLedgerExpenses)}</span>
          </div>

          <Link
            href="/expenses"
            className="px-3.5 py-2 rounded-xl bg-[#0D4F4F] hover:bg-[#156060] text-[#D4AF37] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Open Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
                          className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider mt-0.5 shrink-0 whitespace-nowrap ${
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
