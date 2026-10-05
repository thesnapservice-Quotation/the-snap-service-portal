'use client';

import React, { useState } from 'react';
import { Quotation, QuotationVariation } from '@/lib/types';
import { 
  createVariationFromQuotation, 
  mergeVariationIntoQuotation, 
  formatCurrency 
} from '@/lib/utils';
import { 
  Layers, 
  Plus, 
  Copy, 
  Trash2, 
  Edit2, 
  Check, 
  Sparkles, 
  Info,
  ChevronRight
} from 'lucide-react';

interface QuotationVariationsBarProps {
  quotation: Quotation;
  onQuotationChange: (updater: (prev: Quotation) => Quotation) => void;
  disabled?: boolean;
}

export function QuotationVariationsBar({
  quotation,
  onQuotationChange,
  disabled = false,
}: QuotationVariationsBarProps) {
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const variations = quotation.variations || [];
  const hasVariations = variations.length > 1;
  const activeVariationId = quotation.selectedVariationId || variations[0]?.id;

  // Initialize first variation from current quotation state
  const handleEnableVariations = () => {
    const var1 = createVariationFromQuotation(
      quotation,
      quotation.events?.length === 1 ? 'Single Day Package' : `${quotation.events?.length || 1} Days Package`,
      'var_1'
    );

    // Create a sensible 2nd variation as a starter duplicate
    const var2 = createVariationFromQuotation(
      quotation,
      quotation.events?.length === 1 ? '2 Days Package' : 'Premium Package',
      'var_2'
    );

    onQuotationChange((prev) => ({
      ...prev,
      hasVariations: true,
      selectedVariationId: var1.id,
      variations: [var1, var2],
    }));
  };

  // Add a new blank or default variation
  const handleAddOption = () => {
    const nextIndex = variations.length + 1;
    const newVar = createVariationFromQuotation(
      quotation,
      `Option ${nextIndex}`,
      `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    );

    onQuotationChange((prev) => {
      // 1. First sync live form state into currently active variation
      const currentList = (prev.variations || []).map((v) => {
        if (v.id === activeVariationId) {
          return {
            ...v,
            packageType: prev.packageType,
            events: JSON.parse(JSON.stringify(prev.events || [])),
            inclusions: JSON.parse(JSON.stringify(prev.inclusions || [])),
            payment: JSON.parse(JSON.stringify(prev.payment)),
            termsAndConditions: prev.termsAndConditions ? [...prev.termsAndConditions] : undefined,
            notes: prev.notes,
            additionalExpenses: prev.additionalExpenses ? JSON.parse(JSON.stringify(prev.additionalExpenses)) : undefined,
            internalAnalysis: prev.internalAnalysis ? JSON.parse(JSON.stringify(prev.internalAnalysis)) : undefined,
          };
        }
        return v;
      });
      const updatedList = [...currentList, newVar];
      // Switch active to the newly created option
      return mergeVariationIntoQuotation(
        { ...prev, variations: updatedList },
        newVar
      );
    });
  };

  // Duplicate the currently selected variation
  const handleDuplicateCurrentOption = () => {
    onQuotationChange((prev) => {
      const active = (prev.variations || []).find((v) => v.id === activeVariationId);
      const activeName = active?.name || 'Option';
      const newVar: QuotationVariation = {
        id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${activeName} (Copy)`,
        packageType: prev.packageType,
        events: JSON.parse(JSON.stringify(prev.events || [])),
        inclusions: JSON.parse(JSON.stringify(prev.inclusions || [])),
        payment: JSON.parse(JSON.stringify(prev.payment)),
        termsAndConditions: prev.termsAndConditions ? [...prev.termsAndConditions] : undefined,
        notes: prev.notes,
        additionalExpenses: prev.additionalExpenses ? JSON.parse(JSON.stringify(prev.additionalExpenses)) : undefined,
        internalAnalysis: prev.internalAnalysis ? JSON.parse(JSON.stringify(prev.internalAnalysis)) : undefined,
        isAccepted: false,
      };

      const currentList = (prev.variations || []).map((v) => {
        if (v.id === activeVariationId) {
          return {
            ...v,
            packageType: prev.packageType,
            events: JSON.parse(JSON.stringify(prev.events || [])),
            inclusions: JSON.parse(JSON.stringify(prev.inclusions || [])),
            payment: JSON.parse(JSON.stringify(prev.payment)),
            termsAndConditions: prev.termsAndConditions ? [...prev.termsAndConditions] : undefined,
            notes: prev.notes,
            additionalExpenses: prev.additionalExpenses ? JSON.parse(JSON.stringify(prev.additionalExpenses)) : undefined,
            internalAnalysis: prev.internalAnalysis ? JSON.parse(JSON.stringify(prev.internalAnalysis)) : undefined,
          };
        }
        return v;
      });

      const updatedList = [...currentList, newVar];
      return mergeVariationIntoQuotation(
        { ...prev, variations: updatedList },
        newVar
      );
    });
  };

  // Switch active variation
  const handleSelectVariation = (targetVar: QuotationVariation) => {
    if (targetVar.id === activeVariationId) return;

    onQuotationChange((prev) => {
      // 1. First save current live form state into current active variation in the list
      const currentList = prev.variations || [];
      const updatedList = currentList.map((v) => {
        if (v.id === activeVariationId) {
          return {
            ...v,
            packageType: prev.packageType,
            events: JSON.parse(JSON.stringify(prev.events || [])),
            inclusions: JSON.parse(JSON.stringify(prev.inclusions || [])),
            payment: JSON.parse(JSON.stringify(prev.payment)),
            termsAndConditions: prev.termsAndConditions ? [...prev.termsAndConditions] : undefined,
            notes: prev.notes,
            additionalExpenses: prev.additionalExpenses ? JSON.parse(JSON.stringify(prev.additionalExpenses)) : undefined,
            internalAnalysis: prev.internalAnalysis ? JSON.parse(JSON.stringify(prev.internalAnalysis)) : undefined,
          };
        }
        return v;
      });

      // 2. Find target variation from updated list
      const foundTarget = updatedList.find((v) => v.id === targetVar.id) || targetVar;

      // 3. Merge target into root quotation
      return mergeVariationIntoQuotation(
        { ...prev, variations: updatedList },
        foundTarget
      );
    });
  };

  // Delete a variation
  const handleDeleteVariation = (varIdToDelete: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (variations.length <= 1) return;

    if (!confirm('Are you sure you want to remove this package option?')) return;

    onQuotationChange((prev) => {
      const remaining = (prev.variations || []).filter((v) => v.id !== varIdToDelete);
      const nextActive = remaining[0];
      if (remaining.length <= 1) {
        // If only 1 left, disable variations mode or keep as single
        const updated = mergeVariationIntoQuotation(
          { ...prev, hasVariations: false, variations: remaining },
          nextActive
        );
        return updated;
      }
      return mergeVariationIntoQuotation(
        { ...prev, variations: remaining },
        nextActive
      );
    });
  };

  // Start editing variation name
  const handleStartEditName = (v: QuotationVariation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNameId(v.id);
    setTempName(v.name);
  };

  // Save edited name
  const handleSaveName = (varId: string) => {
    const finalName = tempName.trim() || 'Package Option';
    onQuotationChange((prev) => {
      const updatedList = (prev.variations || []).map((v) => {
        if (v.id === varId) {
          return { ...v, name: finalName };
        }
        return v;
      });
      return {
        ...prev,
        variations: updatedList,
      };
    });
    setEditingNameId(null);
    setTempName('');
  };

  // If variations are NOT yet enabled
  if (!hasVariations && variations.length <= 1) {
    return (
      <div className="bg-gradient-to-r from-amber-50/70 via-emerald-50/40 to-amber-50/70 border-2 border-dashed border-[#D4AF37]/50 rounded-2xl p-4 transition-all hover:border-[#D4AF37]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D4F4F]/10 text-[#0D4F4F] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-[#0D4F4F]" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-1.5">
                Client Package Options / Variations
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-sans font-bold">
                  Optional
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Offer your client multiple choices (e.g. Single Day vs 2-Days Package) under 1 link without creating duplicate dashboard entries.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={handleEnableVariations}
            className="shrink-0 px-4 py-2 rounded-xl bg-[#0D4F4F] hover:bg-[#0A3D3D] text-[#D4AF37] font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Package Option</span>
          </button>
        </div>
      </div>
    );
  }

  const activeVar = variations.find((v) => v.id === activeVariationId) || variations[0];

  return (
    <div className="bg-white border-2 border-[#D4AF37]/40 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#0D4F4F]">
                Package Options for Client
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] font-bold">
                {variations.length} Options Added
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500">
              Client can switch between these options on their portal link. Only the accepted option will confirm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={handleDuplicateCurrentOption}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Duplicate active option"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate Active</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={handleAddOption}
            className="px-3 py-1.5 rounded-lg bg-[#0D4F4F] hover:bg-[#0A3D3D] text-[#D4AF37] font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Option</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {variations.map((v, idx) => {
          const isActive = v.id === activeVariationId;
          const isEditing = editingNameId === v.id;
          const price = v.payment?.grandTotal || 0;
          const eventsCount = v.events?.length || 0;

          return (
            <div
              key={v.id}
              onClick={() => handleSelectVariation(v)}
              className={`relative rounded-xl p-3 border-2 transition-all cursor-pointer text-left flex flex-col justify-between gap-2 ${
                isActive
                  ? 'bg-gradient-to-br from-[#0D4F4F] to-[#0A3D3D] border-[#D4AF37] text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#0D4F4F]'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        autoFocus
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName(v.id);
                          if (e.key === 'Escape') setEditingNameId(null);
                        }}
                        className="px-2 py-0.5 rounded text-xs bg-white text-slate-900 border border-slate-300 w-32 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveName(v.id)}
                        className="p-1 rounded bg-emerald-600 text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-serif font-bold text-xs truncate block">
                      {v.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={(e) => handleStartEditName(v, e)}
                      className={`p-1 rounded hover:opacity-80 transition-opacity ${
                        isActive ? 'text-[#D4AF37]' : 'text-slate-400'
                      }`}
                      title="Rename option"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}

                  {variations.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteVariation(v.id, e)}
                      className={`p-1 rounded hover:text-red-400 transition-colors ${
                        isActive ? 'text-white/60' : 'text-slate-400'
                      }`}
                      title="Delete option"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Price & events badge */}
              <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
                <span className={isActive ? 'text-[#D4AF37] font-bold' : 'text-slate-500'}>
                  {eventsCount} {eventsCount === 1 ? 'Event' : 'Events'}
                </span>
                <span
                  className={`font-mono font-bold text-xs ${
                    isActive ? 'text-white' : 'text-[#0D4F4F]'
                  }`}
                >
                  {formatCurrency(price)}
                </span>
              </div>

              {isActive && (
                <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0D4F4F] font-bold text-[9px] uppercase tracking-wider shadow-xs">
                  Active in Form
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mini info helper */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-amber-900">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Currently editing: <strong>{activeVar.name}</strong>. Events, Services, Deliverables & Pricing below apply to this option.
          </span>
        </div>
      </div>
    </div>
  );
}
