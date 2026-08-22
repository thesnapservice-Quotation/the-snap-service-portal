'use client';

import React, { useState, useEffect } from 'react';
import { PackageInclusion, EventItem } from '@/lib/types';
import { generateSecureId } from '@/lib/crypto';
import { Check, Plus, Trash2, ShieldCheck, Sparkles, ChevronDown, PlusCircle } from 'lucide-react';

interface InclusionsPickerProps {
  inclusions: PackageInclusion[];
  onChange: (updated: PackageInclusion[]) => void;
  events?: EventItem[];
}

const PREDEFINED_EXTRA_ITEMS = [
  'Extra Album',
  'Extra Album Sheets (10 Pages)',
  'External Hard Drive (1TB / 2TB)',
  'Custom Wooden / Crystal USB Box',
  'Raw Footage on Storage Drive',
  'Krizma Lay-Flat Album',
  'Signature Canvas Print / Frame',
  'Instagram Reels & Teasers Package',
  'Same Day Edit (SDE Teaser)',
];

export function InclusionsPicker({ inclusions, onChange, events }: InclusionsPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newInclusionText, setNewInclusionText] = useState('');
  const [selectedDropdownValue, setSelectedDropdownValue] = useState('');

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

  const handleAddPredefinedExtra = (itemName: string) => {
    if (!itemName) return;

    // Check if already exists in inclusions
    const existing = inclusions.find(
      (i) => i.name.toLowerCase() === itemName.toLowerCase()
    );

    if (existing) {
      // If already exists, simply activate and increment quantity
      const updated = inclusions.map((item) =>
        item.id === existing.id
          ? { ...item, included: true, quantity: (item.quantity || 1) + 1 }
          : item
      );
      onChange(updated);
    } else {
      const newItem: PackageInclusion = {
        id: generateSecureId('inc'),
        name: itemName,
        included: true,
        quantity: 1,
      };
      onChange([...inclusions, newItem]);
    }
    setSelectedDropdownValue('');
  };

  const handleAddCustomInclusion = () => {
    if (!newInclusionText.trim()) return;
    const newItem: PackageInclusion = {
      id: generateSecureId('inc'),
      name: newInclusionText.trim(),
      included: true,
      quantity: 1,
    };
    onChange([...inclusions, newItem]);
    setNewInclusionText('');
    setShowCustomInput(false);
  };

  const handleRemove = (id: string) => {
    onChange(inclusions.filter((i) => i.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
          Included in Package (Deliverables & Inclusions)
        </h3>
        <span className="text-[11px] font-medium text-slate-400">
          Standard Studio Deliverables
        </span>
      </div>

      {/* Grid of Inclusions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {inclusions.map((item) => {
          const cleanName = item.name.replace(/^(\d+)\s+/, '');

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                item.included
                  ? 'bg-[#0D4F4F]/5 border-[#0D4F4F]/40 text-[#0D4F4F] font-bold shadow-2xs'
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
                <span className="truncate text-xs">{cleanName}</span>
              </label>

              {/* Quantity Stepper Counter */}
              {item.included && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 ml-2 shadow-2xs">
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
              )}

              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1"
                title="Remove deliverable item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
              {PREDEFINED_EXTRA_ITEMS.map((item) => (
                <option key={item} value={item}>
                  + {item}
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
              {showCustomInput ? 'Close Custom' : '+ Custom Other'}
            </button>
          </div>
        </div>

        {/* Expandable Custom Other Input */}
        {showCustomInput && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in zoom-in-95">
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
            <button
              type="button"
              onClick={handleAddCustomInclusion}
              className="px-4 py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs hover:bg-[#093A3A] transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
