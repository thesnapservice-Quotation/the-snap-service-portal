'use client';

import React, { useState } from 'react';
import { EventItem, Service, SelectedService } from '@/lib/types';
import { generateSecureId } from '@/lib/crypto';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Users, 
  Check, 
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface EventBuilderProps {
  events: EventItem[];
  availableServices: Service[];
  onChange: (events: EventItem[]) => void;
}

const EVENT_PRESETS = ['Nikkah', 'Ubtan', 'Mehndi', 'Barat', 'Walima', 'Engagement', 'Couple Shoot', 'Single Day Package'];

export function EventBuilder({ events, availableServices, onChange }: EventBuilderProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(
    events.length > 0 ? events[0].id : null
  );

  // Strict Rule: Event days ONLY include Photographer, Videographer, Drone, Outdoor Couple Shoot
  const activeServices = availableServices.filter((s) => {
    if (!s.active) return false;
    const name = s.name.toLowerCase();
    return (
      name.includes('photographer') ||
      name.includes('videographer') ||
      name.includes('drone') ||
      name.includes('couple shoot')
    );
  });

  // Add new blank event card
  const handleAddEvent = (namePreset?: string) => {
    const dayNumber = events.length + 1;
    const defaultName = namePreset || (dayNumber === 1 ? 'Barat' : `Day ${dayNumber}`);

    // Default basic services (1 Photographer, 1 Videographer)
    const photoSrv = activeServices.find((s) => s.name.toLowerCase().includes('photographer'));
    const videoSrv = activeServices.find((s) => s.name.toLowerCase().includes('videographer'));

    const initialServices: SelectedService[] = [];
    if (photoSrv) {
      initialServices.push({
        id: generateSecureId('es'),
        serviceId: photoSrv.id,
        serviceName: photoSrv.name,
        quantity: 1,
      });
    }
    if (videoSrv) {
      initialServices.push({
        id: generateSecureId('es'),
        serviceId: videoSrv.id,
        serviceName: videoSrv.name,
        quantity: 1,
      });
    }

    const newEvent: EventItem = {
      id: generateSecureId('evt'),
      name: defaultName,
      dayNumber,
      services: initialServices,
      guestCount: undefined,
      price: 40000, // Reasonable initial price draft
    };

    const updated = [...events, newEvent];
    onChange(updated);
    setExpandedEventId(newEvent.id);
  };

  // Update specific event properties
  const handleUpdateEvent = (id: string, updates: Partial<EventItem>) => {
    const updated = events.map((e) => (e.id === id ? { ...e, ...updates } : e));
    onChange(updated);
  };

  // Remove event card
  const handleRemoveEvent = (id: string) => {
    const updated = events
      .filter((e) => e.id !== id)
      .map((e, idx) => ({ ...e, dayNumber: idx + 1 }));
    onChange(updated);
  };

  // Toggle service selection within an event
  const handleToggleService = (eventId: string, service: Service) => {
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    const existingIndex = targetEvent.services.findIndex((s) => s.serviceId === service.id);

    let updatedServices: SelectedService[];
    if (existingIndex >= 0) {
      // Remove service
      updatedServices = targetEvent.services.filter((s) => s.serviceId !== service.id);
    } else {
      // Add service
      updatedServices = [
        ...targetEvent.services,
        {
          id: generateSecureId('es'),
          serviceId: service.id,
          serviceName: service.name,
          quantity: 1,
        },
      ];
    }

    handleUpdateEvent(eventId, { services: updatedServices });
  };

  // Change quantity for a service in an event
  const handleServiceQuantityChange = (eventId: string, serviceId: string, delta: number) => {
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    const updatedServices = targetEvent.services
      .map((s) => {
        if (s.serviceId === serviceId) {
          const newQty = Math.max(1, s.quantity + delta);
          return { ...s, quantity: newQty };
        }
        return s;
      })
      .filter((s) => s.quantity > 0);

    handleUpdateEvent(eventId, { services: updatedServices });
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          Wedding Events & Price Setup
        </h3>
        <button
          type="button"
          onClick={() => handleAddEvent()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-semibold text-xs hover:bg-[#093A3A] transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
        <span className="text-slate-500 font-medium mr-1 text-[11px]">Quick Add Preset:</span>
        {EVENT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleAddEvent(preset)}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-[#D4AF37] hover:text-[#0D4F4F] font-medium text-slate-700 transition-all text-[11px] shadow-2xs"
          >
            + {preset}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4 mt-2">
        {events.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-500 text-xs mb-3">No wedding events added to quotation.</p>
            <button
              type="button"
              onClick={() => handleAddEvent()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D4F4F] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Add First Event
            </button>
          </div>
        ) : (
          events.map((evt, index) => {
            const isExpanded = expandedEventId === evt.id;

            return (
              <div
                key={evt.id}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all bg-white"
              >
                {/* Event Summary Bar */}
                <div
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                    isExpanded ? 'bg-[#0D4F4F]/5 border-b border-slate-200' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                      Day {evt.dayNumber || index + 1}
                    </span>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#0D4F4F] uppercase tracking-wide">
                        {evt.name || `Day ${index + 1}`}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {evt.services.length} {evt.services.length === 1 ? 'service' : 'services'}
                        {evt.guestCount ? ` • ${evt.guestCount} Guests` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Price</span>
                      <span className="font-bold text-sm text-[#0D4F4F]">
                        Rs. {(evt.price || 0).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEvent(evt.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Remove event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Event Expanded Form */}
                {isExpanded && (
                  <div className="p-4 space-y-4 bg-slate-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Event Name */}
                      <div className="sm:col-span-1">
                        <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Event Name
                        </label>
                        <input
                          type="text"
                          value={evt.name}
                          onChange={(e) => handleUpdateEvent(evt.id, { name: e.target.value })}
                          placeholder="e.g. Barat, Walima, Nikkah"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none font-semibold text-slate-800"
                        />
                      </div>

                      {/* Guest Count */}
                      <div className="sm:col-span-1">
                        <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> Guest Count (Optional)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 200"
                          value={evt.guestCount || ''}
                          onChange={(e) =>
                            handleUpdateEvent(evt.id, {
                              guestCount: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                        />
                      </div>

                      {/* Manual Price Field (CRITICAL RULE: User enters price manually) */}
                      <div className="sm:col-span-1">
                        <label className="block font-semibold text-[#0D4F4F] mb-1 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" /> Manual Event Price (PKR) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 font-bold text-xs text-slate-400">Rs.</span>
                          <input
                            type="number"
                            required
                            placeholder="40000"
                            value={evt.price || ''}
                            onChange={(e) =>
                              handleUpdateEvent(evt.id, {
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full pl-10 pr-3 py-2 border-2 border-[#0D4F4F]/30 rounded-lg bg-white font-bold text-sm text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Services Selector for this event */}
                    <div>
                      <label className="block font-semibold text-slate-700 text-xs mb-2">
                        Select Included Services:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {activeServices.map((srv) => {
                          const selectedSrv = evt.services.find((s) => s.serviceId === srv.id);
                          const isSelected = !!selectedSrv;

                          return (
                            <div
                              key={srv.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-[#0D4F4F]/10 border-[#0D4F4F] font-semibold text-[#0D4F4F]'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div
                                className="flex items-center gap-2 cursor-pointer flex-1"
                                onClick={() => handleToggleService(evt.id, srv)}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-[#0D4F4F] border-[#0D4F4F] text-[#D4AF37]'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="truncate">{srv.name}</span>
                              </div>

                              {isSelected && (
                                <div className="flex items-center gap-1 bg-white border rounded-md px-1 py-0.5 ml-1">
                                  <button
                                    type="button"
                                    onClick={() => handleServiceQuantityChange(evt.id, srv.id, -1)}
                                    className="w-4 h-4 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="w-4 text-center font-bold text-[#0D4F4F]">
                                    {selectedSrv.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleServiceQuantityChange(evt.id, srv.id, 1)}
                                    className="w-4 h-4 rounded text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
