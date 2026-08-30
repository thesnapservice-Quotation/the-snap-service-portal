'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Quotation, WhatsAppCategory, WhatsAppHistoryEntry } from '@/lib/types';
import { useSettings } from '@/hooks/use-settings';
import { useAuth } from '@/hooks/use-auth';
import { 
  WHATSAPP_CATEGORIES, 
  DYNAMIC_VARIABLES_REFERENCE, 
  compileWhatsAppMessage, 
  normalizeWhatsAppPhone, 
  generateWhatsAppIntentUrl,
  getAllWhatsAppCategories
} from '@/lib/whatsapp';
import { DEFAULT_WHATSAPP_TEMPLATES } from '@/lib/defaults';
import { formatDate } from '@/lib/utils';
import { 
  MessageSquare, 
  Send, 
  X, 
  RotateCcw, 
  History, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Sparkles, 
  ExternalLink,
  Plus
} from 'lucide-react';

interface SendWhatsAppModalProps {
  quotation: Quotation | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveQuotation?: (updated: Quotation) => void;
  initialCategory?: WhatsAppCategory;
}

export function SendWhatsAppModal({
  quotation,
  isOpen,
  onClose,
  onSaveQuotation,
  initialCategory = 'new_client',
}: SendWhatsAppModalProps) {
  const { settings } = useSettings();
  const { currentUser } = useAuth();

  const allCategories = useMemo(() => getAllWhatsAppCategories(settings), [settings]);

  const [activeCategory, setActiveCategory] = useState<WhatsAppCategory>(initialCategory);
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [editedMessage, setEditedMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Sync initial category when opening
  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory, isOpen]);

  // Compute base template for the active category
  const baseTemplateText = useMemo(() => {
    if (!settings || !settings.whatsappTemplates) {
      return (DEFAULT_WHATSAPP_TEMPLATES as any)[activeCategory] || DEFAULT_WHATSAPP_TEMPLATES.new_client;
    }
    return settings.whatsappTemplates[activeCategory] || (DEFAULT_WHATSAPP_TEMPLATES as any)[activeCategory] || '';
  }, [settings, activeCategory]);

  // Compile message whenever activeCategory or quotation changes
  useEffect(() => {
    if (quotation) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const compiled = compileWhatsAppMessage(baseTemplateText, quotation, settings, origin);
      setEditedMessage(compiled);
    }
  }, [baseTemplateText, quotation, settings]);

  if (!isOpen || !quotation) return null;

  const clientName = quotation.client?.name || 'Valued Client';
  const rawPhone = quotation.client?.phone || '';
  const normalizedPhone = normalizeWhatsAppPhone(rawPhone);
  const hasValidPhone = normalizedPhone.length >= 10;

  const currentCategoryMeta =
    allCategories.find((c) => c.id === activeCategory) || allCategories[0];

  const handleResetToTemplate = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const compiled = compileWhatsAppMessage(baseTemplateText, quotation, settings, origin);
    setEditedMessage(compiled);
  };

  const handleInsertVariable = (tag: string) => {
    setEditedMessage((prev) => `${prev} ${tag}`);
  };

  const handleCopyText = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(editedMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSendWhatsApp = () => {
    if (!hasValidPhone) {
      alert('Please ensure the client has a valid phone number before sending.');
      return;
    }

    // 1. Record WhatsApp History Entry
    const newEntry: WhatsAppHistoryEntry = {
      id: `wah-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sentAt: new Date().toISOString(),
      category: activeCategory,
      categoryLabel: currentCategoryMeta.label,
      sentTo: clientName,
      phone: rawPhone,
      messageSnippet: editedMessage.slice(0, 120) + (editedMessage.length > 120 ? '...' : ''),
      sentByUserId: currentUser?.id,
      sentByUserName: currentUser?.name,
      status: 'sent',
    };

    const existingHistory = quotation.whatsappHistory || [];
    const updatedQuotation: Quotation = {
      ...quotation,
      whatsappHistory: [newEntry, ...existingHistory],
      updatedAt: new Date().toISOString(),
    };

    if (onSaveQuotation) {
      onSaveQuotation(updatedQuotation);
    }

    // 2. Launch WhatsApp Intent
    const url = generateWhatsAppIntentUrl(normalizedPhone, editedMessage);
    window.open(url, '_blank', 'noopener,noreferrer');

    // 3. Close Modal
    onClose();
  };

  const historyList = quotation.whatsappHistory || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-[#0D4F4F] to-[#156060] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-white">Send WhatsApp Message</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0D4F4F] font-bold text-[10px]">
                  {quotation.quotationNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                To: <strong className="text-white">{clientName}</strong> • {rawPhone || 'No Phone Number'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Compose vs History) */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-100 bg-slate-50/70 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'compose'
                  ? 'border-[#0D4F4F] text-[#0D4F4F]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose Message</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'history'
                  ? 'border-[#0D4F4F] text-[#0D4F4F]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Sending History ({historyList.length})</span>
            </button>
          </div>

          {/* Phone Status Indicator */}
          <div className="flex items-center gap-1 text-[11px] pb-2">
            {hasValidPhone ? (
              <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>wa.me/{normalizedPhone}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>Invalid Phone</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'compose' ? (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
            {/* Category Selector Pills */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Select Message Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                {allCategories.map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`p-2 rounded-xl text-center font-bold text-xs border transition-all ${
                        isSelected
                          ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#0D4F4F] shadow-xs ring-1 ring-[#D4AF37]/50'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700">
                    Message Preview (Ready to Send)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (Editable for this send only)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    className="text-[11px] text-slate-500 hover:text-[#0D4F4F] font-semibold flex items-center gap-1"
                    title="Reset changes back to default template"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="text-[11px] text-slate-500 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    title="Copy message text"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={13}
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="w-full p-3.5 border border-slate-300 rounded-2xl text-xs font-sans text-slate-800 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none leading-relaxed bg-[#FAF9F6] resize-y"
              />
            </div>

            {/* Quick Variable Insert Toolbar */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Quick Insert Placeholders:
              </span>
              <div className="flex flex-wrap gap-1">
                {DYNAMIC_VARIABLES_REFERENCE.slice(0, 6).map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] font-mono transition-colors"
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Sending History Tab */
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
            {historyList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <History className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-xs text-slate-600">No WhatsApp messages sent yet for this quotation.</p>
                <p className="text-[11px]">Messages you send will be logged here with timestamps for internal tracking.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {historyList.map((entry) => (
                  <div key={entry.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                          {entry.categoryLabel || entry.category}
                        </span>
                        <span className="font-bold text-slate-800">{entry.sentTo}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({entry.phone})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(entry.sentAt).toLocaleString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {entry.messageSnippet && (
                      <p className="text-[11px] text-slate-500 font-sans italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        &quot;{entry.messageSnippet}&quot;
                      </p>
                    )}
                    {entry.sentByUserName && (
                      <span className="text-[10px] text-slate-400 block text-right">
                        Sent by: {entry.sentByUserName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={!hasValidPhone}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
              hasValidPhone
                ? 'bg-[#25D366] hover:bg-[#20bd5a] text-white hover:shadow-lg'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
