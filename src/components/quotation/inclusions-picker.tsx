'use client';

import React, { useState, useEffect } from 'react';
import { PackageInclusion, EventItem } from '@/lib/types';
import { generateSecureId } from '@/lib/crypto';
import { PREDEFINED_EXTRA_DELIVERABLES } from '@/lib/defaults';
import { Check, Plus, Trash2, ShieldCheck, Sparkles, ChevronDown } from 'lucide-react';

interface InclusionsPickerProps {
  inclusions: PackageInclusion[];
  onChange: (updated: PackageInclusion[]) => void;
  events?: EventItem[];
}

export function InclusionsPicker({ inclusions, onChange, events }: InclusionsPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newInclusionText, setNewInclusionText] = useState('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [selectedDropdownValue, setSelectedDropdownValue] = useState('');

  // Automatic cleanup of legacy default inclusions in drafts
  useEffect(() => {
    if (!inclusions || inclusions.length === 0) return;

    const hasOldDefaults = inclusions.some(
      (i) => i.name === 'Raw Footage' || i.name === 'Hard Drive' || i.name === 'Krizma Album'
    );
    const hasHighlights = inclusions.some((i) => i.name.toLowerCase().includes('highlight'));
    const hasSongs = inclusions.some((i) => i.name.toLowerCase().includes('song'));

    if (hasOldDefaults && (!hasHighlights || !hasSongs)) {
      const cleaned = inclusions.filter(
        (i) =>
          i.name !== 'Raw Footage' &&
          i.name !== 'Hard Drive' &&
          i.name !== 'Krizma Album' &&
          i.name !== 'Extra Album'
      );

      if (!cleaned.some((i) => i.name.toLowerCase().includes('highlight'))) {
        cleaned.splice(1, 0, {
          id: generateSecureId('inc'),
          name: 'Events Highlights for each day',
          included: true,
          quantity: 1,
        });
      }
      if (!cleaned.some((i) => i.name.toLowerCase().includes('song'))) {
        cleaned.splice(2, 0, {
          id: generateSecureId('inc'),
          name: 'Couple Shoot Songs',
          included: true,
          quantity: 1,
        });
      }

      onChange(cleaned);
    }
  }, []);

  // Auto-sync Complete Video Editing quantity with event days that have video coverage
  useEffect(() => {
    if (!events || events.length === 0) return;

    const videoDaysCount = events.filter((e) =>
      e.services.some(
        (s) =>
          s.serviceName.toLowerCase().includes('video') ||
          s.serviceName.toLowerCase().includes('videographer')
      )
    ).length;

    if (videoDaysCount > 0) {
      const videoEditingItem = inclusions.find((i) =>
        i.name.toLowerCase().includes('video editing')
      );

      if (videoEditingItem && videoEditingItem.quantity !== videoDaysCount) {
        const updated = inclusions.map((item) =>
          item.id === videoEditingItem.id
            ? { ...item, quantity: videoDaysCount }
            : item
        );
        onChange(updated);
      }
    }
  }, [events]);

  const handleToggle = (id: string) => {
    const updated = inclusions.map((item) =>
      item.id === id ? { ...item, included: !item.included } : item
    );
    onChange(updated);
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const updated = inclusions.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty, included: true };
      }
      return item;
    });
    onChange(updated);
  };

  const handlePriceChange = (id: string, newPrice?: number) => {
    const updated = inclusions.map((item) =>
      item.id === id ? { ...item, price: newPrice, included: true } : item
    );
    onChange(updated);
  };

  const handleAddPredefinedExtra = (itemKey: string) => {
    if (!itemKey) return;
    const found = PREDEFINED_EXTRA_DELIVERABLES.find((p) => p.name === itemKey);
    const itemName = found?.name || itemKey;
    const defaultPrice = found?.defaultPrice ?? 0;

    // Check if already exists in inclusions
    const existing = inclusions.find(
      (i) => i.name.toLowerCase() === itemName.toLowerCase()
    );

    if (existing) {
      // If already exists, activate and increment quantity
      const updated = inclusions.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              included: true,
              quantity: (item.quantity || 1) + 1,
              price: item.price !== undefined ? item.price : (defaultPrice > 0 ? defaultPrice : undefined),
            }
          : item
      );
      onChange(updated);
    } else {
      const newItem: PackageInclusion = {
        id: generateSecureId('inc'),
        name: itemName,
        included: true,
        quantity: 1,
        price: defaultPrice > 0 ? defaultPrice : undefined,
      };
      onChange([...inclusions, newItem]);
    }
    setSelectedDropdownValue('');
  };

  const handleAddCustomInclusion = () => {
    if (!newInclusionText.trim()) return;
    const parsedPrice = customPrice !== '' ? parseFloat(customPrice) || 0 : undefined;
    const newItem: PackageInclusion = {
      id: generateSecureId('inc'),
      name: newInclusionText.trim(),
      included: true,
      quantity: 1,
      price: parsedPrice && parsedPrice > 0 ? parsedPrice : undefined,
    };
    onChange([...inclusions, newItem]);
    setNewInclusionText('');
    setCustomPrice('');
    setShowCustomInput(false);
  };

  const handleRemove = (id: string) => {
    onChange(inclusions.filter((i) => i.id !== id));
  };

  // Calculate total extra inclusions price
  const extraInclusionsTotal = inclusions
    .filter((i) => i.included && i.price && i.price > 0)
    .reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
          Included in Package (Deliverables &amp; Inclusions)
        </h3>
        {extraInclusionsTotal > 0 ? (
          <span className="text-xs font-bold text-[#0D4F4F] bg-[#0D4F4F]/10 px-2.5 py-1 rounded-full border border-[#0D4F4F]/20">
            Extras Total: +Rs. {extraInclusionsTotal.toLocaleString()}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-400">
            Standard Studio Deliverables
          </span>
        )}
      </div>

      {/* Grid of Inclusions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {inclusions.map((item) => {
          const cleanName = item.name.replace(/^(\d+)\s+/, '');
          const hasPrice = item.price !== undefined && item.price !== null;
          const lineTotal = (item.price || 0) * (item.quantity || 1);

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                item.included
                  ? 'bg-[#0D4F4F]/5 border-[#0D4F4F]/40 text-[#0D4F4F] shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
              }`}
            >
              <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={() => handleToggle(item.id)}
                  className="hidden"
                />
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                    item.included
                      ? 'bg-[#0D4F4F] border-[#0D4F4F] text-[#D4AF37]'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {item.included && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`truncate text-xs block ${item.included ? 'font-bold' : ''}`}>
                    {cleanName}
                  </span>
                  {item.included && hasPrice && item.price! > 0 && (item.quantity || 1) > 1 && (
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Total: Rs. {lineTotal.toLocaleString()} ({item.quantity} × {item.price?.toLocaleString()})
                    </span>
                  )}
                </div>
              </label>

              {/* Action Controls: Price Input, Quantity Stepper, Delete Button */}
              {item.included && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Editable Price Box */}
                  <div className="relative flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
                    <span className="font-bold text-[10px] text-slate-400 mr-1">Rs.</span>
                    <input
                      type="number"
                      value={item.price !== undefined ? item.price : ''}
                      onChange={(e) =>
                        handlePriceChange(
                          item.id,
                          e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      className="w-14 sm:w-16 font-bold text-xs text-[#0D4F4F] bg-transparent focus:outline-none"
                      title="Item price (editable)"
                    />
                  </div>

                  {/* Quantity Stepper Counter */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-5 h-5 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold text-xs transition-colors"
                      title="Decrease Quantity"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold text-[#0D4F4F] text-xs">
                      {item.quantity || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-5 h-5 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold text-xs transition-colors"
                      title="Increase Quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove deliverable item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Actions Bar: Pre-defined Extra Items Dropdown + Custom Other */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          {/* Dropdown for Predefined Extras */}
          <div className="sm:col-span-8 relative">
            <select
              value={selectedDropdownValue}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDropdownValue(val);
                if (val) handleAddPredefinedExtra(val);
              }}
              className="w-full pl-3.5 pr-8 py-2.5 bg-[#FAF9F6] border border-[#D4AF37]/50 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none appearance-none shadow-2xs cursor-pointer hover:border-[#D4AF37]"
            >
              <option value="">+ Select Pre-defined Extra Item...</option>
              {PREDEFINED_EXTRA_DELIVERABLES.map((item) => (
                <option key={item.name} value={item.name}>
                  + {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Custom Other Button */}
          <div className="sm:col-span-4">
            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0D4F4F] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              {showCustomInput ? 'Close Custom' : '+ Custom Other Item'}
            </button>
          </div>
        </div>

        {/* Expandable Custom Other Input */}
        {showCustomInput && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <input
              type="text"
              placeholder="Type custom deliverable name (e.g. 1 Canvas Print Frame)..."
              value={newInclusionText}
              onChange={(e) => setNewInclusionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomInclusion();
                }
              }}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              autoFocus
            />
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-slate-400">Rs.</span>
              <input
                type="number"
                placeholder="Price"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-20 text-xs font-bold text-[#0D4F4F] bg-transparent focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCustomInclusion}
              className="px-4 py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs hover:bg-[#093A3A] transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
