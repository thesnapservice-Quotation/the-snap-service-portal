'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Quotation, AdditionalExpense, Service, SelectedService, CrewMemberCost } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { generateSecureId } from '@/lib/crypto';
import { apiFetchQuotationById, apiSaveQuotation } from '@/lib/api-client';
import { sortEventsInSequence } from '@/components/quotation/quotation-preview';
import { 
  ArrowLeft, 
  Lock, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Save, 
  ShieldAlert, 
  DollarSign, 
  Building2, 
  Camera, 
  Video, 
  Plane, 
  BookOpen, 
  Film, 
  PieChart,
  User,
  Users
} from 'lucide-react';

export default function QuotationComparePage() {
  const params = useParams();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const prepareQuotationData = (q: Quotation, srvs: Service[]): Quotation => {
    // Preserve existing crew breakdown, custom cost units, and existing profit analysis
    const updatedEvents = q.events.map((evt) => ({
      ...evt,
      services: evt.services.map((s) => {
        const qty = Math.max(1, s.quantity || 1);
        const defaultMatch = srvs.find(
          (srv) => srv.id === s.serviceId || srv.name.toLowerCase() === s.serviceName.toLowerCase()
        );
        // STRICT SNAPSHOT PRESERVATION: If quotation already has internalCostPerUnit, use it!
        const existingCost = s.internalCostPerUnit !== undefined && s.internalCostPerUnit !== null
          ? s.internalCostPerUnit
          : (defaultMatch?.defaultInternalCost ?? 5000);

        let crew = s.crewBreakdown ? [...s.crewBreakdown] : [];
        if (crew.length === 0) {
          crew = Array.from({ length: qty }).map((_, idx) => ({
            id: `crew-${idx + 1}`,
            name: `${s.serviceName} #${idx + 1}`,
            cost: existingCost,
          }));
        } else if (crew.length < qty) {
          while (crew.length < qty) {
            crew.push({
              id: `crew-${crew.length + 1}`,
              name: `${s.serviceName} #${crew.length + 1}`,
              cost: existingCost,
            });
          }
        }

        return {
          ...s,
          internalCostPerUnit: existingCost,
          crewBreakdown: crew,
        };
      }),
    }));

    return {
      ...q,
      events: updatedEvents,
      additionalExpenses: q.additionalExpenses || q.internalAnalysis?.additionalExpenses || [
        { id: 'exp-1', description: 'Transport & Logistics', amount: 3000 },
      ],
    };
  };

  // Load quotation and service defaults
  useEffect(() => {
    if (id) {
      const srvs = storage.getServices();
      setAvailableServices(srvs);

      const localQ = storage.getQuotationById(id);
      if (localQ) {
        setQuotation(prepareQuotationData(localQ, srvs));
      }

      // Also fetch latest cloud data from Supabase PostgreSQL
      apiFetchQuotationById(id).then((cloudQ) => {
        if (cloudQ) {
          setQuotation(prepareQuotationData(cloudQ, srvs));
          storage.saveQuotationLocally(cloudQ);
        }
      });
    }
  }, [id]);

  if (!quotation) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-serif font-bold text-slate-700">Quotation Not Found</h2>
        <p className="text-xs text-slate-500">The quotation you are looking for does not exist or was deleted.</p>
        <Link
          href="/quotations"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D4F4F] text-[#D4AF37] text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotation Registry
        </Link>
      </div>
    );
  }

  // Helper to calculate total line cost for a service
  const getServiceLineCost = (s: SelectedService): number => {
    if (s.crewBreakdown && s.crewBreakdown.length > 0) {
      return s.crewBreakdown.reduce((sum, c) => sum + (c.cost || 0), 0);
    }
    return (s.quantity || 1) * (s.internalCostPerUnit || 0);
  };

  // Sorted events chronologically
  const sortedEvents = sortEventsInSequence(quotation.events);

  // Calculations
  const clientPrice = quotation.payment.grandTotal;

  // Calculate event-by-event internal cost
  const eventCosts = sortedEvents.map((evt) => {
    const cost = evt.services.reduce((sum, s) => sum + getServiceLineCost(s), 0);
    const profit = evt.price - cost;
    const margin = evt.price > 0 ? (profit / evt.price) * 100 : 0;
    return {
      eventId: evt.id,
      eventName: evt.name,
      sellingPrice: evt.price,
      internalCost: cost,
      profit,
      marginPercentage: margin,
    };
  });

  const totalEventCost = eventCosts.reduce((sum, e) => sum + e.internalCost, 0);

  // Additional Non-Service Expenses
  const additionalExpenses = quotation.additionalExpenses || [];
  const totalAdditionalExpenses = additionalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Grand Total Internal Cost
  const totalInternalCost = totalEventCost + totalAdditionalExpenses;

  // Net Profit & Profit Margin
  const netProfit = clientPrice - totalInternalCost;
  const profitMargin = clientPrice > 0 ? (netProfit / clientPrice) * 100 : 0;

  // Category breakdown for summary chart
  let photoCost = 0;
  let videoCost = 0;
  let droneCost = 0;
  let albumCost = 0;
  let editingCost = 0;
  let otherCost = totalAdditionalExpenses;

  sortedEvents.forEach((evt) => {
    evt.services.forEach((s) => {
      const cost = getServiceLineCost(s);
      const name = s.serviceName.toLowerCase();
      if (name.includes('drone')) droneCost += cost;
      else if (name.includes('video') || name.includes('videographer')) videoCost += cost;
      else if (name.includes('edit') || name.includes('film')) editingCost += cost;
      else if (name.includes('album')) albumCost += cost;
      else if (name.includes('photo') || name.includes('photographer')) photoCost += cost;
      else otherCost += cost;
    });
  });

  // Handler for individual crew member name or cost update
  const handleUpdateCrewMember = (
    eventId: string,
    serviceId: string,
    crewIndex: number,
    field: 'name' | 'cost',
    value: string | number
  ) => {
    const updatedEvents = quotation.events.map((evt) => {
      if (evt.id === eventId) {
        return {
          ...evt,
          services: evt.services.map((s) => {
            if (s.serviceId === serviceId || s.id === serviceId) {
              const qty = Math.max(1, s.quantity || 1);
              let crew = s.crewBreakdown ? [...s.crewBreakdown] : [];

              // Ensure crew array length matches quantity
              while (crew.length < qty) {
                crew.push({
                  id: `crew-${crew.length + 1}`,
                  name: `${s.serviceName} #${crew.length + 1}`,
                  cost: s.internalCostPerUnit || 5000,
                });
              }

              crew[crewIndex] = {
                ...crew[crewIndex],
                [field]: value,
              };

              return {
                ...s,
                crewBreakdown: crew,
              };
            }
            return s;
          }),
        };
      }
      return evt;
    });

    setQuotation({
      ...quotation,
      events: updatedEvents,
    });
  };

  // Handler for adding non-service expense
  const handleAddExpense = () => {
    const newExp: AdditionalExpense = {
      id: generateSecureId('exp'),
      description: 'New Expense (Food / Transport / Lodging)',
      amount: 2000,
    };
    setQuotation({
      ...quotation,
      additionalExpenses: [...additionalExpenses, newExp],
    });
  };

  // Handler for expense change
  const handleUpdateExpense = (id: string, field: keyof AdditionalExpense, value: string | number) => {
    const updated = additionalExpenses.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    setQuotation({
      ...quotation,
      additionalExpenses: updated,
    });
  };

  // Handler for removing expense
  const handleRemoveExpense = (id: string) => {
    setQuotation({
      ...quotation,
      additionalExpenses: additionalExpenses.filter((e) => e.id !== id),
    });
  };

  // Save changes to storage and cloud database
  const handleSaveAnalysis = async () => {
    const updatedQuotation: Quotation = {
      ...quotation,
      events: quotation.events,
      additionalExpenses,
      internalAnalysis: {
        totalInternalCost,
        netProfit,
        profitMargin,
        additionalExpenses,
        eventBreakdown: eventCosts,
      },
      updatedAt: new Date().toISOString(),
    };
    storage.saveQuotationLocally(updatedQuotation);
    setQuotation(updatedQuotation);
    setSaveSuccessMsg('Saving profit analysis to cloud database...');

    try {
      await apiSaveQuotation(updatedQuotation);
      setSaveSuccessMsg('✅ Internal profit analysis saved to database successfully!');
    } catch (e) {
      console.error('Error syncing profit analysis to database', e);
      setSaveSuccessMsg('✅ Profit analysis saved locally!');
    }

    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Visual status indicator
  let statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  let statusLabel = 'High Profit';
  if (netProfit < 0) {
    statusBadgeClass = 'bg-red-50 text-red-800 border-red-300 animate-pulse';
    statusLabel = 'LOSS WARNING';
  } else if (profitMargin < 15) {
    statusBadgeClass = 'bg-red-50 text-red-700 border-red-300';
    statusLabel = 'Low Profit Margin';
  } else if (profitMargin < 30) {
    statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
    statusLabel = 'Moderate Profit';
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans text-slate-800">
      {/* Top Banner (Strictly Internal Warning) */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-[#D4AF37]/50">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Lock className="w-3 h-3" /> Strictly Internal Business Analysis
            </div>
            <h1 className="font-serif font-bold text-xl text-white flex items-center gap-2">
              Quotation Profit Analysis — {quotation.quotationNumber}
            </h1>
            <p className="text-xs text-slate-400">
              Client: <span className="text-white font-bold">{quotation.client.name || 'Valued Client'}</span> ({quotation.client.eventDates})
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAnalysis}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-lg hover:brightness-110 transition-all"
        >
          <Save className="w-4 h-4" /> Save Analysis
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* KPI PROFIT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Client Price */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Client Selling Price</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-2xl text-slate-900">
              {formatCurrency(clientPrice)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Quotated Package Price</span>
          </div>
        </div>

        {/* Card 2: Total Internal Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Total Internal Cost</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-2xl text-amber-800">
              {formatCurrency(totalInternalCost)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Services + Additional Expenses</span>
          </div>
        </div>

        {/* Card 3: Estimated Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Estimated Net Profit</span>
            <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <span className={`font-serif font-bold text-2xl ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Net Profit after all costs</span>
          </div>
        </div>

        {/* Card 4: Profit Margin & Visual Indicator */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Profit Margin</span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusBadgeClass}`}>
              {statusLabel}
            </span>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-2xl text-[#0D4F4F]">
              {profitMargin.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Net Profit ÷ Selling Price</span>
          </div>
        </div>
      </div>

      {/* EVENT-BY-EVENT INTERNAL COST COMPARISON */}
      <div className="space-y-5">
        <h2 className="font-serif font-bold text-base text-[#0D4F4F] uppercase tracking-wider border-b pb-2">
          Event-by-Event Individual Crew Cost Breakdown
        </h2>

        {sortedEvents.map((evt) => {
          const analysis = eventCosts.find((e) => e.eventId === evt.id);
          const evtPrice = evt.price || 0;
          const evtCost = analysis?.internalCost || 0;
          const evtProfit = analysis?.profit || 0;
          const evtMargin = analysis?.marginPercentage || 0;

          return (
            <div
              key={evt.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Event Header Bar */}
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#0D4F4F] uppercase tracking-wide">
                    {evt.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Client Package Price: <span className="font-bold text-slate-900">{formatCurrency(evtPrice)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Internal Cost</span>
                    <span className="font-bold text-amber-800">{formatCurrency(evtCost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase">Event Profit</span>
                    <span className={`font-bold ${evtProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatCurrency(evtProfit)} ({evtMargin.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Services & Individual Crew Cost Breakdown Table */}
              <div className="p-4 space-y-4">
                {evt.services.map((srv) => {
                  const qty = Math.max(1, srv.quantity || 1);
                  const lineTotal = getServiceLineCost(srv);

                  // Ensure crew array exists for rendering
                  const crewList: CrewMemberCost[] = srv.crewBreakdown && srv.crewBreakdown.length >= qty
                    ? srv.crewBreakdown
                    : Array.from({ length: qty }).map((_, idx) => ({
                        id: `crew-${idx + 1}`,
                        name: `${srv.serviceName} #${idx + 1}`,
                        cost: srv.internalCostPerUnit || 5000,
                      }));

                  return (
                    <div
                      key={srv.id}
                      className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#0D4F4F]" />
                          <span className="font-bold text-sm text-[#0D4F4F]">{srv.serviceName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold text-xs">
                            Quantity: {qty}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Service Total Cost</span>
                          <span className="font-serif font-bold text-base text-slate-900">
                            {formatCurrency(lineTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Individual Crew Members Name & Cost Input Table */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Individual Crew Names & Cost Breakdown:
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {crewList.slice(0, qty).map((crewMember, idx) => (
                            <div
                              key={crewMember.id || idx}
                              className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs shadow-2xs"
                            >
                              <div className="w-6 h-6 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold text-[10px] flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </div>

                              <input
                                type="text"
                                value={crewMember.name}
                                onChange={(e) =>
                                  handleUpdateCrewMember(
                                    evt.id,
                                    srv.serviceId || srv.id,
                                    idx,
                                    'name',
                                    e.target.value
                                  )
                                }
                                placeholder={`Crew Member Name (e.g. Ali Khan)`}
                                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                              />

                              <div className="relative w-32 shrink-0">
                                <span className="absolute left-2 top-1.5 font-bold text-[10px] text-slate-400">Rs.</span>
                                <input
                                  type="number"
                                  value={crewMember.cost || ''}
                                  onChange={(e) =>
                                    handleUpdateCrewMember(
                                      evt.id,
                                      srv.serviceId || srv.id,
                                      idx,
                                      'cost',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  placeholder="Cost"
                                  className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADDITIONAL NON-SERVICE EXPENSES SECTION */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-serif font-bold text-base text-[#0D4F4F] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#D4AF37]" />
            Additional Event Expenses (Logistics / Food / Transport)
          </h3>
          <button
            type="button"
            onClick={handleAddExpense}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-semibold text-xs hover:bg-[#093A3A] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {additionalExpenses.length === 0 ? (
            <p className="text-slate-400 text-xs">No additional non-service expenses added.</p>
          ) : (
            additionalExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={exp.description}
                  onChange={(e) => handleUpdateExpense(exp.id, 'description', e.target.value)}
                  placeholder="Expense description (e.g. Transport, Food, Accommodation)"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />

                <div className="relative w-36">
                  <span className="absolute left-2.5 top-2 font-bold text-[11px] text-slate-400">Rs.</span>
                  <input
                    type="number"
                    value={exp.amount || ''}
                    onChange={(e) => handleUpdateExpense(exp.id, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveExpense(exp.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Remove expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COMPLETE INTERNAL PROFIT SUMMARY */}
      <div className="bg-[#0D4F4F] text-white rounded-2xl p-6 shadow-xl space-y-4 border border-[#D4AF37]">
        <h3 className="font-serif font-bold text-base text-[#D4AF37] uppercase tracking-widest border-b border-[#156060] pb-2 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-[#D4AF37]" />
          COMPLETE INTERNAL PROFIT SUMMARY
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#093A3A] p-3 rounded-xl border border-[#156060] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#D4AF37]" /> Photography Cost
            </span>
            <span className="font-bold text-white text-sm">{formatCurrency(photoCost)}</span>
          </div>

          <div className="bg-[#093A3A] p-3 rounded-xl border border-[#156060] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Video className="w-4 h-4 text-[#D4AF37]" /> Videography Cost
            </span>
            <span className="font-bold text-white text-sm">{formatCurrency(videoCost)}</span>
          </div>

          <div className="bg-[#093A3A] p-3 rounded-xl border border-[#156060] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-[#D4AF37]" /> Drone Cost
            </span>
            <span className="font-bold text-white text-sm">{formatCurrency(droneCost)}</span>
          </div>

          <div className="bg-[#093A3A] p-3 rounded-xl border border-[#156060] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Album Cost
            </span>
            <span className="font-bold text-white text-sm">{formatCurrency(albumCost)}</span>
          </div>

          <div className="bg-[#093A3A] p-3 rounded-xl border border-[#156060] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Film className="w-4 h-4 text-[#D4AF37]" /> Video Editing Cost
            </span>
            <span className="font-bold text-white text-sm">{formatCurrency(editingCost)}</span>
          </div>

          <div className="bg-[#093A3A] p-3 rounded-xl border border-[#156060] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#D4AF37]" /> Other Expenses
            </span>
            <span className="font-bold text-white text-sm">{formatCurrency(otherCost)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#156060] flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-slate-300 block">Total Client Selling Price</span>
            <span className="font-serif font-bold text-2xl text-white">{formatCurrency(clientPrice)}</span>
          </div>

          <div>
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] block">Total Internal Cost</span>
            <span className="font-serif font-bold text-2xl text-[#D4AF37]">{formatCurrency(totalInternalCost)}</span>
          </div>

          <div className="bg-[#093A3A] px-5 py-2.5 rounded-xl border border-[#D4AF37]/60 text-right">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">NET ESTIMATED PROFIT</span>
            <span className="font-serif font-extrabold text-2xl text-emerald-400">
              {formatCurrency(netProfit)} ({profitMargin.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
