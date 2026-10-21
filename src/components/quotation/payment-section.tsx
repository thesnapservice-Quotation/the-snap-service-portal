'use client';

import React from 'react';
import { PaymentDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Percent, Banknote, Tag, Sparkles, X, Check } from 'lucide-react';

interface PaymentSectionProps {
  payment: PaymentDetails;
  subtotal?: number;
  grandTotal: number;
  onChange: (updated: PaymentDetails) => void;
}

export function PaymentSection({ payment, subtotal: propSubtotal, grandTotal: propGrandTotal, onChange }: PaymentSectionProps) {
  // Base package subtotal before discount
  const baseSubtotal = Math.max(
    0,
    propSubtotal !== undefined
      ? propSubtotal
      : (payment.subtotal ?? (Number(payment.grandTotal || 0) + (Number(payment.discount) || 0)))
  );

  const discountType = payment.discountType || 'fixed';
  const discountAmt = Math.min(baseSubtotal, Number(payment.discount) || 0);
  const effectiveGrandTotal = Math.max(0, baseSubtotal - discountAmt);

  // Toggle Fixed vs Percentage for Discount
  const handleDiscountTypeChange = (type: 'fixed' | 'percentage') => {
    let newDiscount = discountAmt;
    let newPercentage = payment.discountPercentage || 0;

    if (type === 'percentage') {
      newPercentage = baseSubtotal > 0 ? Math.round((discountAmt / baseSubtotal) * 100) : 0;
      newDiscount = Math.round((baseSubtotal * newPercentage) / 100);
    } else {
      newDiscount = discountAmt;
    }

    const newGrandTotal = Math.max(0, baseSubtotal - newDiscount);
    let newAdvance = Number(payment.advanceReceived) || 0;
    if (newAdvance > 0 && payment.advanceType === 'percentage') {
      newAdvance = Math.round((newGrandTotal * (payment.advancePercentage || 50)) / 100);
    }
    const balance = Math.max(0, newGrandTotal - newAdvance);

    onChange({
      ...payment,
      subtotal: baseSubtotal,
      discount: newDiscount,
      discountType: type,
      discountPercentage: newPercentage,
      grandTotal: newGrandTotal,
      advanceReceived: newAdvance,
      balancePayable: balance,
    });
  };

  // Change Discount Value
  const handleDiscountValueChange = (val: number) => {
    let newDiscount = Math.max(0, val);
    let newPercentage = payment.discountPercentage || 0;

    if (discountType === 'percentage') {
      newPercentage = Math.max(0, Math.min(100, val));
      newDiscount = Math.round((baseSubtotal * newPercentage) / 100);
    } else {
      newDiscount = Math.max(0, Math.min(baseSubtotal, val));
      newPercentage = baseSubtotal > 0 ? Math.round((newDiscount / baseSubtotal) * 100) : 0;
    }

    const newGrandTotal = Math.max(0, baseSubtotal - newDiscount);
    let newAdvance = Number(payment.advanceReceived) || 0;
    if (newAdvance > 0 && payment.advanceType === 'percentage') {
      newAdvance = Math.round((newGrandTotal * (payment.advancePercentage || 50)) / 100);
    }
    const balance = Math.max(0, newGrandTotal - newAdvance);

    onChange({
      ...payment,
      subtotal: baseSubtotal,
      discount: newDiscount,
      discountType,
      discountPercentage: newPercentage,
      grandTotal: newGrandTotal,
      advanceReceived: newAdvance,
      balancePayable: balance,
    });
  };

  // Quick Preset Discount Buttons
  const handleQuickDiscount = (amountOrPct: number, isPct: boolean) => {
    let newDiscount = 0;
    let newPercentage = 0;
    const type: 'fixed' | 'percentage' = isPct ? 'percentage' : 'fixed';

    if (isPct) {
      newPercentage = amountOrPct;
      newDiscount = Math.round((baseSubtotal * amountOrPct) / 100);
    } else {
      newDiscount = Math.min(baseSubtotal, amountOrPct);
      newPercentage = baseSubtotal > 0 ? Math.round((newDiscount / baseSubtotal) * 100) : 0;
    }

    const newGrandTotal = Math.max(0, baseSubtotal - newDiscount);
    let newAdvance = Number(payment.advanceReceived) || 0;
    if (newAdvance > 0 && payment.advanceType === 'percentage') {
      newAdvance = Math.round((newGrandTotal * (payment.advancePercentage || 50)) / 100);
    }
    const balance = Math.max(0, newGrandTotal - newAdvance);

    onChange({
      ...payment,
      subtotal: baseSubtotal,
      discount: newDiscount,
      discountType: type,
      discountPercentage: newPercentage,
      grandTotal: newGrandTotal,
      advanceReceived: newAdvance,
      balancePayable: balance,
    });
  };

  const handleAdvanceTypeChange = (type: 'fixed' | 'percentage') => {
    const percentage = payment.advancePercentage || 50;
    let newAdvance = Number(payment.advanceReceived) || 0;
    if (newAdvance > 0 && type === 'percentage') {
      newAdvance = Math.round((effectiveGrandTotal * percentage) / 100);
    }

    const balance = Math.max(0, effectiveGrandTotal - newAdvance);

    onChange({
      ...payment,
      subtotal: baseSubtotal,
      discount: discountAmt,
      grandTotal: effectiveGrandTotal,
      advanceType: type,
      advanceReceived: newAdvance,
      advancePercentage: percentage,
      balancePayable: balance,
    });
  };

  const handleAdvanceValueChange = (val: number) => {
    let advanceAmt = val;
    let percentage = payment.advancePercentage || 50;

    if (payment.advanceType === 'percentage') {
      percentage = val;
      advanceAmt = (Number(payment.advanceReceived) > 0 || val > 0) ? Math.round((effectiveGrandTotal * val) / 100) : 0;
    }

    const balance = Math.max(0, effectiveGrandTotal - advanceAmt);

    onChange({
      ...payment,
      subtotal: baseSubtotal,
      discount: discountAmt,
      grandTotal: effectiveGrandTotal,
      advanceReceived: advanceAmt,
      advancePercentage: percentage,
      balancePayable: balance,
    });
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
      <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2 border-b pb-2">
        <Wallet className="w-4 h-4 text-[#D4AF37]" />
        Payment Breakdown & Discount
      </h3>

      <div className="bg-[#0D4F4F]/5 rounded-xl p-4 border border-[#0D4F4F]/10 space-y-4">
        {/* Package Subtotal (Before Discount) */}
        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/80">
          <span className="font-semibold text-slate-700 uppercase tracking-wider">
            Package Subtotal (Events + Add-ons):
          </span>
          <span className="font-mono font-bold text-sm text-slate-800">
            {formatCurrency(baseSubtotal)}
          </span>
        </div>

        {/* 🏷️ SPECIAL PACKAGE DISCOUNT SECTION */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/90 shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="font-bold text-xs text-[#0D4F4F] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Special Package Discount (Optional):
            </label>

            {/* Toggle Fixed vs Percentage Discount */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 font-medium text-[11px]">
              <button
                type="button"
                onClick={() => handleDiscountTypeChange('fixed')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  discountType === 'fixed'
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-3 h-3" /> Fixed (PKR)
              </button>
              <button
                type="button"
                onClick={() => handleDiscountTypeChange('percentage')}
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                  discountType === 'percentage'
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent className="w-3 h-3" /> Percentage (%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {discountType === 'fixed' ? (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Discount Amount (Rs.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-xs text-emerald-700">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    max={baseSubtotal}
                    placeholder="0"
                    value={discountAmt || ''}
                    onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-1.5 border border-emerald-300 rounded-lg font-bold text-sm text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Discount Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={payment.discountPercentage || ''}
                    onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg font-bold text-sm text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none pr-8"
                  />
                  <span className="absolute right-3 top-2 font-bold text-emerald-700 text-xs">%</span>
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Quick Discount Shortcuts:</label>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickDiscount(5000, false)}
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold border border-emerald-200 transition-colors"
                >
                  5k
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDiscount(10000, false)}
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold border border-emerald-200 transition-colors"
                >
                  10k
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDiscount(15000, false)}
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold border border-emerald-200 transition-colors"
                >
                  15k
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDiscount(20000, false)}
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold border border-emerald-200 transition-colors"
                >
                  20k
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDiscount(5, true)}
                  className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10.5px] font-semibold border border-amber-200 transition-colors"
                >
                  5%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDiscount(10, true)}
                  className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10.5px] font-semibold border border-amber-200 transition-colors"
                >
                  10%
                </button>
                {discountAmt > 0 && (
                  <button
                    type="button"
                    onClick={() => handleQuickDiscount(0, false)}
                    className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10.5px] font-semibold border border-rose-200 transition-colors flex items-center gap-0.5"
                    title="Remove Discount"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Discount Feedback */}
          {discountAmt > 0 && (
            <div className="pt-1.5 flex items-center justify-between text-xs text-emerald-800 font-bold border-t border-emerald-100">
              <span className="flex items-center gap-1 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Special Discount Applied:
              </span>
              <span className="font-mono text-xs">
                - {formatCurrency(discountAmt)}
              </span>
            </div>
          )}
        </div>

        {/* Final Net Grand Total Display */}
        <div className="bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-white p-3.5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Final Net Grand Total:
            </span>
            {discountAmt > 0 && (
              <span className="text-[10.5px] text-[#C3DFDF] line-through block mt-0.5">
                Base Price: {formatCurrency(baseSubtotal)}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="font-serif font-extrabold text-xl text-[#D4AF37]">
              {formatCurrency(effectiveGrandTotal)}
            </span>
            {discountAmt > 0 && (
              <span className="text-[10px] text-emerald-300 font-semibold block">
                (Saved {formatCurrency(discountAmt)})
              </span>
            )}
          </div>
        </div>

        {/* Advance Received Inputs */}
        <div className="pt-2 border-t border-slate-200/80 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="font-medium text-slate-700">Advance Payment Received (Optional):</label>

            {/* Toggle Fixed vs Percentage */}
            <div className="flex items-center rounded-lg bg-slate-200 p-0.5 font-medium text-[11px]">
              <button
                type="button"
                onClick={() => handleAdvanceTypeChange('fixed')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  payment.advanceType === 'fixed'
                    ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-3 h-3" /> Fixed (PKR)
              </button>
              <button
                type="button"
                onClick={() => handleAdvanceTypeChange('percentage')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  payment.advanceType === 'percentage'
                    ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent className="w-3 h-3" /> Percentage (%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {payment.advanceType === 'fixed' ? (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Advance Amount (Rs.)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={payment.advanceReceived || ''}
                  onChange={(e) => handleAdvanceValueChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sm text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Advance Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    value={payment.advancePercentage || ''}
                    onChange={(e) => handleAdvanceValueChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sm text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none pr-8"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">%</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Calculated Balance Payable</label>
              <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-sm text-[#1B2A4A]">
                {formatCurrency(payment.balancePayable)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
