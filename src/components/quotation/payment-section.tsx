'use client';

import React from 'react';
import { PaymentDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Percent, Banknote } from 'lucide-react';

interface PaymentSectionProps {
  payment: PaymentDetails;
  grandTotal: number;
  onChange: (updated: PaymentDetails) => void;
}

export function PaymentSection({ payment, grandTotal, onChange }: PaymentSectionProps) {
  const handleAdvanceTypeChange = (type: 'fixed' | 'percentage') => {
    const percentage = payment.advancePercentage || 50;
    // Do NOT auto-set advanceReceived if it was 0!
    let newAdvance = Number(payment.advanceReceived) || 0;
    if (newAdvance > 0 && type === 'percentage') {
      newAdvance = Math.round((grandTotal * percentage) / 100);
    }

    const balance = Math.max(0, grandTotal - newAdvance);

    onChange({
      ...payment,
      grandTotal,
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
      // Only set advanceReceived if val > 0 and previously received > 0, otherwise it's just the policy percentage
      advanceAmt = (Number(payment.advanceReceived) > 0 || val > 0) ? Math.round((grandTotal * val) / 100) : 0;
    }

    const balance = Math.max(0, grandTotal - advanceAmt);

    onChange({
      ...payment,
      grandTotal,
      advanceReceived: advanceAmt,
      advancePercentage: percentage,
      balancePayable: balance,
    });
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
      <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2 border-b pb-2">
        <Wallet className="w-4 h-4 text-[#D4AF37]" />
        Payment Breakdown
      </h3>

      <div className="bg-[#0D4F4F]/5 rounded-xl p-4 border border-[#0D4F4F]/10 space-y-3">
        {/* Grand Total Display */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Grand Total (Events + Extras):
          </span>
          <span className="font-serif font-bold text-lg text-[#0D4F4F]">
            {formatCurrency(grandTotal)}
          </span>
        </div>

        {/* Advance Received Inputs */}
        <div className="pt-3 border-t border-slate-200/80 space-y-3 text-xs">
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
