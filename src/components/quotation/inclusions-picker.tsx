'use client';

import React, { useState } from 'react';
import { PackageInclusion } from '@/lib/types';
import { generateSecureId } from '@/lib/crypto';
import { Check, Plus, Trash2, ShieldCheck, Sparkles, Layers, ChevronDown } from 'lucide-react';

interface InclusionsPickerProps {
  inclusions: PackageInclusion[];
  onChange: (updated: PackageInclusion[]) => void;
}

const COMMON_CUSTOM_PRESETS = [
  { name: 'Extra Album', defaultQty: 1 },
  { name: 'Extra Sheets / Spreads', defaultQty: 5 },
  { name: 'Hard Drive (1TB / 2TB Storage)', defaultQty: 1 },
  { name: 'USB Flash Drive 3.0', defaultQty: 1 },
  { name: 'Photo Wall Frame (Canvas)', defaultQty: 1 },
  { name: 'Raw Data & Footage', defaultQty: 1 },
];

export function InclusionsPicker({ inclusions, onChange }: InclusionsPickerProps) {
  const [selectedPreset, setSelectedPreset] = useState('');
  const [newInclusionText, setNewInclusionText] = useState('');
  const [newInclusionQty, setNewInclusionQty] = useState(1);
  const [showCustomInput, setShowCustomInput] = useState(false);

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

  const handleSelectPreset = (presetName: string) => {
    if (!presetName) return;
    if (presetName === '__other__') {
      setShowCustomInput(true);
      setSelectedPreset('__other__');
      return;
    }

    const preset = COMMON_CUSTOM_PRESETS.find((p) => p.name === presetName);
    const existing = inclusions.find((i) => i.name.toLowerCase() === presetName.toLowerCase());

    if (existing) {
      // Toggle on or increment
      const updated = inclusions.map((i) =>
        i.id === existing.id ? { ...i, included: true, quantity: (i.quantity || 1) + (preset?.defaultQty || 1) } : i
      );
      onChange(updated);
    } else {
      const newItem: PackageInclusion = {
        id: generateSecureId('inc'),
        name: presetName,
        included: true,
        quantity: preset?.defaultQty || 1,
      };
      onChange([...inclusions, newItem]);
    }
    setSelectedPreset('');
  };

  const handleAddCustomInclusion = () => {
    if (!newInclusionText.trim()) return;
    const newItem: PackageInclusion = {
      id: generateSecureId('inc'),
      name: newInclusionText.trim(),
      included: true,
      quantity: Math.max(1, newInclusionQty || 1),
    };
    onChange([...inclusions, newItem]);
    setNewInclusionText('');
    setNewInclusionQty(1);
    setShowCustomInput(false);
    setSelectedPreset('');
  };

  const handleRemove = (id: string) => {
    onChange(inclusions.filter((i) => i.id !== id));
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          Included in Package (Deliverables & Inclusions)
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Standard Studio Deliverables</span>
      </div>

      {/* Grid of Standard & Active Inclusions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {inclusions.map((item) => {
          // Clean name label if it starts with leading number e.g. "1 Krizma Album" -> "Krizma Album"
          const cleanName = item.name.replace(/^(\d+)\s+/, '');

          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                item.included
                  ? 'bg-[#0D4F4F]/10 border-[#0D4F4F] text-[#0D4F4F] font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={() => handleToggle(item.id)}
                  className="hidden"
                />
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    item.included
                      ? 'bg-[#0D4F4F] border-[#0D4F4F] text-[#D4AF37]'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {item.included && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="truncate">{cleanName}</span>
              </label>

              {/* Quantity Counter Stepper */}
              {item.included && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1 py-0.5 ml-2 shrink-0 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="w-4 h-4 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
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
                    className="w-4 h-4 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                    title="Increase Quantity"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="p-1 text-slate-400 hover:text-red-500 opacity-60 hover:opacity-100 ml-1 shrink-0"
                title="Delete inclusion item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ADD CUSTOM INCLUSION PRESET DROPDOWN & CUSTOMIZE OTHER SECTION */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Dropdown Select */}
          <div className="flex-1 min-w-[220px]">
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full px-3 py-2 border border-[#D4AF37]/60 bg-[#FAF9F6] rounded-xl text-xs font-semibold text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none shadow-2xs"
            >
              <option value="">➕ Select Pre-defined Extra Item...</option>
              <option value="Extra Album">📖 Extra Album</option>
              <option value="Extra Sheets / Spreads">📄 Extra Sheets / Spreads (5 Spreads)</option>
              <option value="Hard Drive (1TB / 2TB Storage)">💾 Hard Drive (1TB / 2TB Storage)</option>
              <option value="USB Flash Drive 3.0">💽 USB Flash Drive 3.0 (Wooden Box)</option>
              <option value="Photo Wall Frame (Canvas)">🖼️ Photo Wall Frame (Canvas)</option>
              <option value="Raw Data & Footage">🎞️ Raw Data & Footage</option>
              <option value="__other__">✏️ Customize Other (Type Custom Name)...</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0D4F4F] font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            {showCustomInput ? 'Hide Custom Field' : 'Custom Other'}
          </button>
        </div>

        {/* Custom Input Field (Appears when toggled or selected from dropdown) */}
        {showCustomInput && (
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
            <span className="text-[11px] font-bold text-[#0D4F4F] block">
              Add Custom Deliverable / Inclusion:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type custom inclusion name (e.g. 1 Drone Highlight Reel, 2 Canvas Prints)..."
                value={newInclusionText}
                onChange={(e) => setNewInclusionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomInclusion();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />

              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1">
                <span className="text-[10px] text-slate-400 font-bold">Qty:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newInclusionQty}
                  onChange={(e) => setNewInclusionQty(parseInt(e.target.value) || 1)}
                  className="w-10 text-xs font-bold text-slate-800 text-center focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddCustomInclusion}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-2xs hover:brightness-105 transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
