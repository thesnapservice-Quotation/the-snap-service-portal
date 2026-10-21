'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Quotation, AdditionalExpense, Service, SelectedService, CrewMemberCost, VideoEditingEventCost, AlbumItemCost, QuotationVariation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { formatCurrency, formatDate, computeDefaultVideoEditingCost, getDefaultAlbumUnitCost, mergeVariationIntoQuotation } from '@/lib/utils';
import { generateSecureId } from '@/lib/crypto';
import { apiFetchQuotationById, apiSaveQuotation } from '@/lib/api-client';
import { sortEventsInSequence } from '@/components/quotation/quotation-preview';
import { useSettings } from '@/hooks/use-settings';
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
  Users,
  Sparkles,
  CheckCircle2,
  Layers,
  MapPin,
  Clock
} from 'lucide-react';

export default function QuotationComparePage() {
  const params = useParams();
  const id = params.id as string;
  const { settings } = useSettings();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [videoEditingCosts, setVideoEditingCosts] = useState<VideoEditingEventCost[]>([]);
  const [albumCosts, setAlbumCosts] = useState<AlbumItemCost[]>([]);
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

    // Sync Day-by-Day Video Editing Costs based on camera & drone counts
    const existingVideoBreakdown = q.internalAnalysis?.videoEditingBreakdown || [];
    const initialVideoCosts: VideoEditingEventCost[] = updatedEvents.map((evt) => {
      const vQty = evt.services
        .filter((s) => {
          const name = s.serviceName.toLowerCase();
          return name.includes('video') || name.includes('videographer') || name.includes('cinematograph');
        })
        .reduce((sum, s) => sum + (s.quantity || 1), 0);
      const dQty = evt.services
        .filter((s) => s.serviceName.toLowerCase().includes('drone'))
        .reduce((sum, s) => sum + (s.quantity || 1), 0);

      const computed = computeDefaultVideoEditingCost(vQty, dQty);
      const existing = existingVideoBreakdown.find((v) => v.eventId === evt.id);

      return {
        eventId: evt.id,
        eventName: evt.name,
        dayNumber: evt.dayNumber,
        cameraCount: vQty,
        droneCount: dQty,
        tierDescription: existing?.tierDescription || computed.tierDescription,
        cost: existing?.cost !== undefined ? existing.cost : computed.cost,
      };
    });
    setVideoEditingCosts(initialVideoCosts);

    // Sync Album Costs with package inclusions
    const existingAlbumBreakdown = q.internalAnalysis?.albumBreakdown || [];
    const includedAlbums = (q.inclusions || []).filter((i) => i.included && (i.name.toLowerCase().includes('album') || i.name.toLowerCase().includes('book')));
    const initialAlbumCosts: AlbumItemCost[] = includedAlbums.map((inc) => {
      const existing = existingAlbumBreakdown.find((a) => a.id === inc.id || a.name.toLowerCase() === inc.name.toLowerCase());
      const qty = inc.quantity || 1;
      const unitCost = existing?.unitCost !== undefined ? existing.unitCost : getDefaultAlbumUnitCost(inc.name, srvs);
      return {
        id: inc.id,
        name: inc.name,
        quantity: qty,
        unitCost,
        totalCost: qty * unitCost,
      };
    });
    setAlbumCosts(initialAlbumCosts);

    const rawAdditional = q.additionalExpenses || q.internalAnalysis?.additionalExpenses || [];
    const cleanAdditional = rawAdditional.filter(
      (e) => !(e.id === 'exp-1' && e.description === 'Transport & Logistics' && e.amount === 3000)
    );

    return {
      ...q,
      events: updatedEvents,
      additionalExpenses: cleanAdditional,
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

  // Total Video Editing Cost (Day-by-Day)
  const totalVideoEditingCost = videoEditingCosts.reduce((sum, v) => sum + (v.cost || 0), 0);

  // Total Album Printing Cost (Synced with Inclusions)
  const totalAlbumCost = albumCosts.reduce((sum, a) => sum + (a.totalCost || 0), 0);

  // Additional Non-Service Expenses
  const additionalExpenses = quotation.additionalExpenses || [];
  const totalAdditionalExpenses = additionalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Grand Total Internal Cost = Event Crew Cost + Video Editing Cost + Album Cost + Additional Expenses
  const totalInternalCost = totalEventCost + totalVideoEditingCost + totalAlbumCost + totalAdditionalExpenses;

  // Net Profit & Profit Margin
  const netProfit = clientPrice - totalInternalCost;
  const profitMargin = clientPrice > 0 ? (netProfit / clientPrice) * 100 : 0;

  // Category breakdown for summary chart
  let photoCost = 0;
  let videoCost = 0;
  let droneCost = 0;
  let otherCost = totalAdditionalExpenses;

  sortedEvents.forEach((evt) => {
    evt.services.forEach((s) => {
      const cost = getServiceLineCost(s);
      const name = s.serviceName.toLowerCase();
      if (name.includes('drone')) droneCost += cost;
      else if (name.includes('video') || name.includes('videographer')) videoCost += cost;
      else if (name.includes('photo') || name.includes('photographer')) photoCost += cost;
      else otherCost += cost;
    });
  });

  // Handler for individual crew member name or cost update
  const handleUpdateCrewMember = (
    eventId: string,
    serviceId: string,
    crewIndex: number,
    field: 'name' | 'cost' | 'phone' | 'role',
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

              let updatedMember = {
                ...crew[crewIndex],
                [field]: value,
              };

              // Auto-fill phone, role, and cost if selecting a known permanent team member
              if (field === 'name' && typeof value === 'string') {
                const matchedPermanent = settings?.permanentTeamMembers?.find(
                  (m) => m.name.toLowerCase() === value.trim().toLowerCase()
                );
                if (matchedPermanent) {
                  updatedMember = {
                    ...updatedMember,
                    phone: matchedPermanent.phone || updatedMember.phone,
                    role: matchedPermanent.role || updatedMember.role,
                    cost: matchedPermanent.defaultCost !== undefined ? matchedPermanent.defaultCost : updatedMember.cost,
                  };
                }
              }

              crew[crewIndex] = updatedMember;

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

  // Handler for updating video editing cost for an event day
  const handleUpdateVideoEditingCost = (eventId: string, cost: number) => {
    const updated = videoEditingCosts.map((v) =>
      v.eventId === eventId ? { ...v, cost } : v
    );
    setVideoEditingCosts(updated);
  };

  // Handler for updating album unit cost
  const handleUpdateAlbumUnitCost = (albumId: string, unitCost: number) => {
    const updated = albumCosts.map((a) =>
      a.id === albumId ? { ...a, unitCost, totalCost: a.quantity * unitCost } : a
    );
    setAlbumCosts(updated);
  };

  // Handler for adding non-service expense
  const handleAddExpense = () => {
    const newExp: AdditionalExpense = {
      id: generateSecureId('exp'),
      description: 'Transport / Logistics',
      amount: 0,
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

  // Handle switching variation in compare view
  const handleSwitchVariation = (targetVar: QuotationVariation) => {
    if (!quotation) return;
    const activeVarId = quotation.selectedVariationId || quotation.variations?.[0]?.id;
    if (targetVar.id === activeVarId) return;

    // 1. Pack current analysis into the currently active variation
    const currentAnalysis = {
      totalInternalCost,
      netProfit,
      profitMargin,
      additionalExpenses,
      eventBreakdown: eventCosts,
      videoEditingBreakdown: videoEditingCosts,
      totalVideoEditingCost,
      albumBreakdown: albumCosts,
      totalAlbumCost,
    };

    const updatedVariations = (quotation.variations || []).map((v) => {
      if (v.id === activeVarId) {
        return {
          ...v,
          events: quotation.events,
          additionalExpenses,
          internalAnalysis: currentAnalysis,
        };
      }
      return v;
    });

    // 2. Switch to target variation
    const foundTarget = updatedVariations.find((v) => v.id === targetVar.id) || targetVar;
    const merged = mergeVariationIntoQuotation(
      { ...quotation, variations: updatedVariations },
      foundTarget
    );
    const prepared = prepareQuotationData(merged, availableServices);
    setQuotation(prepared);
  };

  // Save changes to storage and cloud database
  const handleSaveAnalysis = async () => {
    const currentAnalysis = {
      totalInternalCost,
      netProfit,
      profitMargin,
      additionalExpenses,
      eventBreakdown: eventCosts,
      videoEditingBreakdown: videoEditingCosts,
      totalVideoEditingCost,
      albumBreakdown: albumCosts,
      totalAlbumCost,
    };

    let updatedVariations = quotation.variations;
    const activeVarId = quotation.selectedVariationId || quotation.variations?.[0]?.id;
    if (updatedVariations && updatedVariations.length > 0 && activeVarId) {
      updatedVariations = updatedVariations.map((v) => {
        if (v.id === activeVarId) {
          return {
            ...v,
            events: quotation.events,
            additionalExpenses,
            internalAnalysis: currentAnalysis,
          };
        }
        return v;
      });
    }

    const updatedQuotation: Quotation = {
      ...quotation,
      events: quotation.events,
      additionalExpenses,
      variations: updatedVariations,
      internalAnalysis: currentAnalysis,
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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_quotation_updated'));
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

      {/* Package Options Switcher for Internal Analysis */}
      {quotation.variations && quotation.variations.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border-2 border-[#D4AF37] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#0D4F4F]">
                Package Variation Under Analysis
              </h3>
              <p className="text-[11px] text-slate-500">
                Switch between package options to inspect and configure team/material costs for each option.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {quotation.variations.map((v) => {
              const isActive = v.id === (quotation.selectedVariationId || quotation.variations![0].id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSwitchVariation(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{v.name}</span>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    ({formatCurrency(v.payment?.grandTotal || 0)})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {quotation.payment.discount && quotation.payment.discount > 0
                ? `Net Price (${formatCurrency(quotation.payment.discount)} Discount Applied)`
                : 'Quotated Package Price'}
            </span>
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
          Event-by-Event Individual Team Cost Breakdown
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-base text-[#0D4F4F] uppercase tracking-wide">
                      {evt.name}
                    </h3>
                    {evt.venue && (
                      <span className="px-2 py-0.5 rounded-md bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold text-xs flex items-center gap-1 border border-[#0D4F4F]/20">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" /> {evt.venue}
                      </span>
                    )}
                    {evt.timing && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" /> {evt.timing}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {evt.eventDate ? `${formatDate(evt.eventDate)} • ` : ''}Client Package Price: <span className="font-bold text-slate-900">{formatCurrency(evtPrice)}</span>
                    {evt.guestCount ? ` • ${evt.guestCount} Guests` : ''}
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

              {/* Services & Individual Team Cost Breakdown Table */}
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

                      {/* Individual Team Members Name & Cost Input Table */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Individual Team Member Names &amp; Cost Breakdown:
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {crewList.slice(0, qty).map((crewMember, idx) => {
                            const datalistId = `crew-dl-${evt.id}-${srv.id || srv.serviceId}-${idx}`;
                            return (
                              <div
                                key={crewMember.id || idx}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-2xs"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold text-[10px] flex items-center justify-center shrink-0">
                                    #{idx + 1}
                                  </div>

                                  <div className="relative flex-1 min-w-0">
                                    <input
                                      type="text"
                                      list={datalistId}
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
                                      placeholder={`Team Member Name (e.g. Ali Khan)`}
                                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none bg-white"
                                    />
                                    <datalist id={datalistId}>
                                      {(settings?.permanentTeamMembers || []).map((m) => (
                                        <option key={m.id} value={m.name}>
                                          {m.role ? `${m.role} • Rs. ${m.defaultCost}` : ''}
                                        </option>
                                      ))}
                                    </datalist>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Phone input if custom/temporary */}
                                  <input
                                    type="text"
                                    value={crewMember.phone || ''}
                                    onChange={(e) =>
                                      handleUpdateCrewMember(
                                        evt.id,
                                        srv.serviceId || srv.id,
                                        idx,
                                        'phone',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Phone #"
                                    className="w-28 px-2 py-1.5 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                                    title="WhatsApp phone number"
                                  />

                                  <div className="relative w-28 shrink-0">
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
                              </div>
                            );
                          })}
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

      {/* SECTION 2: POST-PRODUCTION VIDEO EDITING COST BREAKDOWN (DAY-BY-DAY) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#0D4F4F] uppercase tracking-wider flex items-center gap-2">
              <Film className="w-5 h-5 text-[#D4AF37]" />
              Post-Production Video Editing Cost Breakdown
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Auto-synced day-by-day: <span className="font-semibold text-slate-700">1 Cam (Rs. 2,000)</span> • <span className="font-semibold text-slate-700">1 Cam + Drone (Rs. 2,500)</span> • <span className="font-semibold text-slate-700">2 Cam (Rs. 2,500)</span> • <span className="font-semibold text-slate-700">2 Cam + Drone (Rs. 3,000)</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Editing Cost</span>
            <span className="font-serif font-bold text-lg text-[#0D4F4F]">
              {formatCurrency(totalVideoEditingCost)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {videoEditingCosts.length === 0 ? (
            <p className="text-slate-400 text-xs col-span-2">No event days configured for video editing.</p>
          ) : (
            videoEditingCosts.map((vCost) => {
              const hasVideo = vCost.cameraCount > 0;
              return (
                <div
                  key={vCost.eventId}
                  className={`p-4 rounded-xl border transition-all ${
                    hasVideo
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-slate-50/40 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${hasVideo ? 'bg-[#0D4F4F] text-[#D4AF37]' : 'bg-slate-200 text-slate-500'}`}>
                        <Film className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#0D4F4F] uppercase">{vCost.eventName}</h4>
                        <span className="text-[10px] text-slate-400">
                          {vCost.cameraCount} Videographer(s) • {vCost.droneCount} Drone(s)
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      hasVideo
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {vCost.tierDescription}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-slate-600">Editing Payout:</span>
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1.5 font-bold text-[11px] text-slate-400">Rs.</span>
                      <input
                        type="number"
                        value={vCost.cost !== undefined ? vCost.cost : ''}
                        onChange={(e) =>
                          handleUpdateVideoEditingCost(
                            vCost.eventId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                        placeholder="Cost"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 3: ALBUM PRINTING & PRODUCTION COSTS (SYNCED WITH INCLUSIONS) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#0D4F4F] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#D4AF37]" />
              Album Printing & Binding Production Costs
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Automatically synced with package inclusions (Krizma, Family Albums, Couple Shoots)
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Album Cost</span>
            <span className="font-serif font-bold text-lg text-[#0D4F4F]">
              {formatCurrency(totalAlbumCost)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {albumCosts.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              No albums included in this quotation's package inclusions.
            </div>
          ) : (
            albumCosts.map((album) => (
              <div
                key={album.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0D4F4F]/10 text-[#0D4F4F] flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">{album.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Quantity: <span className="font-bold text-[#0D4F4F]">{album.quantity} unit(s)</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Unit Cost:</span>
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1.5 font-bold text-[10px] text-slate-400">Rs.</span>
                      <input
                        type="number"
                        value={album.unitCost || ''}
                        onChange={(e) =>
                          handleUpdateAlbumUnitCost(
                            album.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full pl-7 pr-2 py-1 border border-slate-300 rounded-md text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="text-right min-w-24">
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Line Total</span>
                    <span className="font-serif font-bold text-xs text-[#0D4F4F]">
                      {formatCurrency(album.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 4: ADDITIONAL NON-SERVICE EXPENSES SECTION */}
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
            <span className="font-bold text-white text-sm">{formatCurrency(totalAlbumCost)}</span>
          </div>

          <div className="bg-[#093A3A] p-3 rounded-xl border border-[#156060] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Film className="w-4 h-4 text-[#D4AF37]" /> Video Editing Cost
            </span>
            <span className="font-bold text-white text-sm">{formatCurrency(totalVideoEditingCost)}</span>
          </div>

          <div className="bg-[#093A3A] p-3 rounded-xl border border-[#156060] flex items-center justify-between">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#D4AF37]" /> Other Expenses
            </span>
            <span className="font-bold text-white text-sm">{formatCurrency(totalAdditionalExpenses)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#156060] flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-slate-300 block">Total Client Selling Price</span>
            <span className="font-serif font-bold text-2xl text-white">{formatCurrency(clientPrice)}</span>
            {quotation.payment.discount && quotation.payment.discount > 0 ? (
              <span className="text-[10.5px] text-emerald-300 block font-medium">
                Includes -{formatCurrency(quotation.payment.discount)} Discount
              </span>
            ) : null}
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
