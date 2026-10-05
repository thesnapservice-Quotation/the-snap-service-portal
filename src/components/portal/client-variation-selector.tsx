'use client';

import React from 'react';
import { Quotation, QuotationVariation } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Check, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface ClientVariationSelectorProps {
  quotation: Quotation;
  activeVariationId: string;
  onSelectVariation: (v: QuotationVariation) => void;
  isConfirmed?: boolean;
}

export function ClientVariationSelector({
  quotation,
  activeVariationId,
  onSelectVariation,
  isConfirmed = false,
}: ClientVariationSelectorProps) {
  const variations = quotation.variations || [];
  if (variations.length <= 1) return null;

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-[#D4AF37] shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
              Select Your Wedding Package Option
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              We have prepared customized packages for you. Click an option below to view details and pricing.
            </p>
          </div>
        </div>

        {isConfirmed && (
          <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Booking Confirmed</span>
          </div>
        )}
      </div>

      {/* Variation Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {variations.map((v, idx) => {
          const isSelected = v.id === activeVariationId;
          const isAcceptedOption = v.isAccepted || (isConfirmed && quotation.selectedVariationId === v.id);
          const price = v.payment?.grandTotal || 0;
          const eventNames = (v.events || []).map((e) => e.name).join(', ') || `${v.events?.length || 1} Event`;

          return (
            <div
              key={v.id}
              onClick={() => {
                if (!isConfirmed) {
                  onSelectVariation(v);
                }
              }}
              className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                isSelected
                  ? 'bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] border-[#D4AF37] text-white shadow-xl scale-[1.01]'
                  : 'bg-[#FAF9F6] hover:bg-white hover:border-[#D4AF37]/60 border-[#E5E0D5] text-slate-800'
              } ${isConfirmed && !isSelected ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-[#D4AF37] text-[#0D4F4F]'
                          : 'bg-[#0D4F4F]/10 text-[#0D4F4F]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <h4 className="font-serif font-bold text-sm sm:text-base leading-tight">
                      {v.name}
                    </h4>
                  </div>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      isSelected ? 'text-[#C3DFDF]' : 'text-slate-500'
                    }`}
                  >
                    Events: {eventNames}
                  </p>
                </div>

                {isSelected ? (
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#D4AF37] text-[#0D4F4F] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                    {isAcceptedOption ? 'Booked' : 'Selected'}
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {isConfirmed ? 'Alternative' : 'Click to View'}
                  </span>
                )}
              </div>

              <div
                className={`pt-2 border-t flex items-center justify-between ${
                  isSelected ? 'border-white/10' : 'border-[#E5E0D5]'
                }`}
              >
                <span
                  className={`text-[11px] font-semibold ${
                    isSelected ? 'text-[#C3DFDF]' : 'text-slate-500'
                  }`}
                >
                  Total Package Investment:
                </span>
                <span
                  className={`font-serif font-bold text-base sm:text-lg ${
                    isSelected ? 'text-[#D4AF37]' : 'text-[#0D4F4F]'
                  }`}
                >
                  {formatCurrency(price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
