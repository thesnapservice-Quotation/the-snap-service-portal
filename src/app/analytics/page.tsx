'use client';

import React from 'react';
import { useQuotations } from '@/hooks/use-quotations';
import { useProfitPrivacy } from '@/context/profit-privacy-context';
import { formatCurrency } from '@/lib/utils';
import { Sparkles, TrendingUp, DollarSign, Camera, Film, BookOpen, HardDrive, Award, PieChart, Plane, Lock, Unlock } from 'lucide-react';

export default function StudioAnalyticsPage() {
  const { quotations } = useQuotations();
  const { isProfitUnlocked, openUnlockModal, lockProfit } = useProfitPrivacy();

  // Financial metrics & crew deployments calculated ONLY for confirmed & completed bookings
  const confirmedQuotations = quotations.filter((q) => q.status === 'confirmed' || q.status === 'completed');

  const totalRevenue = confirmedQuotations.reduce((sum, q) => sum + (q.payment?.grandTotal || 0), 0);

  const totalCost = confirmedQuotations.reduce((sum, q) => {
    const cost = q.internalAnalysis?.totalInternalCost ?? q.events.reduce((eSum, evt) => {
      return eSum + evt.services.reduce((sSum, s) => sSum + (s.quantity || 1) * (s.internalCostPerUnit ?? 5000), 0);
    }, 0);
    return sum + cost;
  }, 0);

  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Count top services & gear usage strictly for confirmed/completed bookings
  let totalPhotographers = 0;
  let totalVideographers = 0;
  let totalDrones = 0;

  confirmedQuotations.forEach((q) => {
    q.events.forEach((evt) => {
      evt.services.forEach((s) => {
        const name = s.serviceName.toLowerCase();
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
              <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" /> Studio Business Intelligence v2.0
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide">
              Financial Analytics & Gear ROI
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-xl">
              Comprehensive breakdown of studio revenue, cost structures, net profits, and equipment deployment.
            </p>
          </div>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border-2 border-[#E5E0D5] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Gross Studio Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif font-bold text-2xl text-slate-900">{formatCurrency(totalRevenue)}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across active bookings</span>
          </div>
        </div>

        {/* Total Internal Cost (Password Protected) */}
        <div 
          onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
          className="bg-white p-5 rounded-2xl border-2 border-[#E5E0D5] shadow-xs flex flex-col justify-between cursor-pointer group hover:border-slate-400 transition-all"
          title={isProfitUnlocked ? "Click to lock cost figures" : "Click to enter password and reveal cost figures"}
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              Total Internal Costs {isProfitUnlocked ? <Unlock className="w-3.5 h-3.5 text-slate-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif font-bold text-2xl text-red-800 tracking-wider">
              {isProfitUnlocked ? formatCurrency(totalCost) : '••••••••'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {isProfitUnlocked ? 'Crew payouts & printing' : '🔒 Click to enter password'}
            </span>
          </div>
        </div>

        {/* Net Studio Profit (Password Protected) */}
        <div 
          onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
          className="bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-5 rounded-2xl border-2 border-[#D4AF37] shadow-xl flex flex-col justify-between cursor-pointer group hover:brightness-105 transition-all"
          title={isProfitUnlocked ? "Click to lock profit figures" : "Click to enter password and reveal profit figures"}
        >
          <div className="flex items-center justify-between">
            <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              Net Studio Profit {isProfitUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-300" /> : <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />}
            </span>
            <div className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#0D4F4F] font-bold text-[10px]">
              {isProfitUnlocked ? 'Unlocked' : 'Protected'}
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif font-extrabold text-2xl text-emerald-300 block tracking-wider">
              {isProfitUnlocked ? formatCurrency(netProfit) : '••••••••'}
            </span>
            <span className="text-[10px] text-slate-300 block mt-0.5 font-semibold">
              {isProfitUnlocked ? 'Pure studio margin' : '🔒 Click to enter password'}
            </span>
          </div>
        </div>

        {/* Average Margin % (Password Protected) */}
        <div 
          onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
          className="bg-white p-5 rounded-2xl border-2 border-[#E5E0D5] shadow-xs flex flex-col justify-between cursor-pointer group hover:border-slate-400 transition-all"
          title={isProfitUnlocked ? "Click to lock profit margin" : "Click to enter password and reveal margin"}
        >
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              Average Profit Margin {isProfitUnlocked ? <Unlock className="w-3.5 h-3.5 text-slate-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif font-bold text-2xl text-[#0D4F4F] tracking-wider">
              {isProfitUnlocked ? `${profitMargin.toFixed(1)}%` : '•••• %'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {isProfitUnlocked ? 'Target: 40% - 60%' : '🔒 Click to enter password'}
            </span>
          </div>
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
    </div>
  );
}
