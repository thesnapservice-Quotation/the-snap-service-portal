'use client';

import React, { useState } from 'react';
import { PackageInclusion } from '@/lib/types';
import { generateSecureId } from '@/lib/crypto';
import { Check, Plus, Trash2, ShieldCheck } from 'lucide-react';

interface InclusionsPickerProps {
  inclusions: PackageInclusion[];
  onChange: (updated: PackageInclusion[]) => void;
}

export function InclusionsPicker({ inclusions, onChange }: InclusionsPickerProps) {
  const [newInclusionText, setNewInclusionText] = useState('');

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
  };

  const handleRemove = (id: string) => {
    onChange(inclusions.filter((i) => i.id !== id));
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
      <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2 border-b pb-2">
        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
        Included in Package (Deliverables & Inclusions)
      </h3>

      {/* Grid of inclusions */}
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
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={() => handleToggle(item.id)}
                  className="hidden"
                />
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
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
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1 py-0.5 ml-2">
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
              className="p-1 text-slate-400 hover:text-red-500 opacity-60 hover:opacity-100 ml-1"
              title="Delete inclusion item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      </div>

      {/* Add Custom Inclusion */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <input
          type="text"
          placeholder="Add custom inclusion (e.g., 1 Extra Frame)..."
          value={newInclusionText}
          onChange={(e) => setNewInclusionText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomInclusion();
            }
          }}
          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAddCustomInclusion}
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0D4F4F] font-semibold text-xs transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}
