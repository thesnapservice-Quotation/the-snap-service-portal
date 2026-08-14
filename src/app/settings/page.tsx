'use me';
'use client';

import React, { useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { useServices } from '@/hooks/use-services';
import { useAuth } from '@/hooks/use-auth';
import { AppSettings, Service, UserRole } from '@/lib/types';
import { storage } from '@/lib/storage';
import { 
  Building2, 
  Landmark, 
  Sliders, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  Layers, 
  Sparkles,
  Users,
  Crown,
  ShieldCheck,
  UserPlus,
  UserCheck,
  XCircle,
  ArrowRightLeft,
  Database,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock
} from 'lucide-react';

const ICON_OPTIONS = [
  'Camera',
  'Video',
  'Plane',
  'Heart',
  'Film',
  'Clapperboard',
  'HardDrive',
  'BookOpen',
  'BookMarked',
  'Book',
  'PlusSquare',
  'CheckCircle2',
];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { services, addService, updateService, toggleServiceActive, deleteService } = useServices();
  const { 
    users, 
    currentUser, 
    isSuperAdmin, 
    approveUser, 
    toggleUserActive, 
    deleteUser, 
    createUserDirectly,
    switchUserAccount 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'business' | 'bank' | 'services' | 'terms' | 'quotation' | 'users' | 'backup'>('business');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('');

  // Service form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceCost, setNewServiceCost] = useState<number>(8000);
  const [newServiceCategory, setNewServiceCategory] = useState<Service['category']>('photography');
  const [newServiceIcon, setNewServiceIcon] = useState('Camera');

  // Direct User Creation form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');

  // Terms form state
  const [newTermText, setNewTermText] = useState('');

  // Sync state when settings load
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettings(formData);
    setSaveSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    addService({
      name: newServiceName.trim(),
      description: newServiceDesc.trim(),
      category: newServiceCategory,
      icon: newServiceIcon,
      defaultInternalCost: newServiceCost,
      active: true,
    });

    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceCost(8000);
  };

  const handleAddTerm = () => {
    if (!newTermText.trim()) return;
    const updatedTerms = [...formData.quotation.defaultTerms, newTermText.trim()];
    setFormData({
      ...formData,
      quotation: {
        ...formData.quotation,
        defaultTerms: updatedTerms,
      },
    });
    setNewTermText('');
  };

  const handleRemoveTerm = (index: number) => {
    const updatedTerms = formData.quotation.defaultTerms.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      quotation: {
        ...formData.quotation,
        defaultTerms: updatedTerms,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-serif font-bold text-xl text-[#0D4F4F] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#D4AF37]" /> Studio Settings & Configuration
          </h1>
          <p className="text-xs text-slate-500">
            Configure business contact info, bank details, service library, and quotation templates.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-md hover:brightness-105 transition-all"
        >
          <Save className="w-4 h-4" /> Save All Settings
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'business'
              ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" /> Business Info
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'bank'
              ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Landmark className="w-4 h-4" /> Bank Details
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'services'
              ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" /> Service Library ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'terms'
              ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" /> Terms & Conditions
        </button>
        <button
          onClick={() => setActiveTab('quotation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'quotation'
              ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Quotation Defaults
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              activeTab === 'users'
                ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#D4AF37] shadow-md'
                : 'bg-[#D4AF37]/10 text-[#0D4F4F] border-[#D4AF37]/40 hover:bg-[#D4AF37]/20'
            }`}
          >
            <Crown className="w-4 h-4 text-[#D4AF37]" /> User Accounts & Access ({users.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
            activeTab === 'backup'
              ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#D4AF37] shadow-md'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          }`}
        >
          <Database className="w-4 h-4 text-[#D4AF37]" /> System Backup & Data Restore ⚡
        </button>
      </div>

      {/* Tab 1: Business Profile */}
      {activeTab === 'business' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="font-serif font-bold text-base text-[#0D4F4F] border-b pb-2">
            Business Profile & Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.business.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, name: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.business.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, phone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Instagram Handle</label>
              <input
                type="text"
                value={formData.business.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, instagram: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                value={formData.business.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, website: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Studio Address</label>
              <input
                type="text"
                value={formData.business.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: { ...formData.business, address: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bank Details */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="font-serif font-bold text-base text-[#0D4F4F] border-b pb-2">
            Bank Account Details (Displayed on Quotation)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Account Title</label>
              <input
                type="text"
                value={formData.bank.accountTitle}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bank: { ...formData.bank, accountTitle: e.target.value },
                  })
                }
                placeholder="e.g. Zunair Ahmad"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bank.bank}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bank: { ...formData.bank, bank: e.target.value },
                  })
                }
                placeholder="e.g. Meezan Bank"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Branch Name / Code</label>
              <input
                type="text"
                value={formData.bank.branch}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bank: { ...formData.bank, branch: e.target.value },
                  })
                }
                placeholder="e.g. PMC Branch"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.bank.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bank: { ...formData.bank, accountNumber: e.target.value },
                  })
                }
                placeholder="e.g. 04240104676435"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">IBAN Number (Optional)</label>
              <input
                type="text"
                value={formData.bank.iban || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bank: { ...formData.bank, iban: e.target.value },
                  })
                }
                placeholder="e.g. PK36MEZN0004240104676435"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Service Library Management */}
      {activeTab === 'services' && (
        <div className="space-y-6 text-xs">
          {/* Add New Service Card */}
          <form
            onSubmit={handleAddService}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3"
          >
            <h3 className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-1.5 border-b pb-2">
              <Plus className="w-4 h-4 text-[#D4AF37]" /> Add New Service to Library
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live LED Screen"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Default Internal Cost (Rs.)</label>
                <input
                  type="number"
                  placeholder="8000"
                  value={newServiceCost}
                  onChange={(e) => setNewServiceCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value as Service['category'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none bg-white"
                >
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="editing">Editing</option>
                  <option value="album">Album</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Icon</label>
                <select
                  value={newServiceIcon}
                  onChange={(e) => setNewServiceIcon(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none bg-white"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs hover:bg-[#093A3A] transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Service
                </button>
              </div>
            </div>
          </form>

          {/* Service Library Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-[#0D4F4F]">
                Active Service Library ({services.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Services can be toggled Active/Inactive
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-8 h-8 rounded-lg bg-[#0D4F4F]/10 text-[#0D4F4F] flex items-center justify-center font-bold">
                      {srv.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{srv.name}</h4>
                      <p className="text-[11px] text-slate-500">{srv.description || srv.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium text-xs">Internal Cost:</span>
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1.5 font-bold text-xs text-slate-400">Rs.</span>
                      <input
                        type="number"
                        value={srv.defaultInternalCost ?? 0}
                        onChange={(e) =>
                          updateService({
                            ...srv,
                            defaultInternalCost: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Active Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleServiceActive(srv.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        srv.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {srv.active ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteService(srv.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Terms & Conditions */}
      {activeTab === 'terms' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="font-serif font-bold text-base text-[#0D4F4F] border-b pb-2">
            Default Terms & Conditions Manager
          </h2>

          <div className="space-y-2">
            {formData.quotation.defaultTerms.map((term, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
              >
                <span className="font-medium text-slate-800">
                  {index + 1}. {term}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTerm(index)}
                  className="p-1 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Term */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="text"
              placeholder="Add new terms rule..."
              value={newTermText}
              onChange={(e) => setNewTermText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTerm();
                }
              }}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTerm}
              className="px-4 py-2 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs"
            >
              + Add Term
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Quotation Defaults */}
      {activeTab === 'quotation' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="font-serif font-bold text-base text-[#0D4F4F] border-b pb-2">
            Quotation Numbering & Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quotation Number Prefix</label>
              <input
                type="text"
                value={formData.quotation.prefix}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quotation: { ...formData.quotation, prefix: e.target.value },
                  })
                }
                placeholder="e.g. SS-2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Starting Number Sequence</label>
              <input
                type="number"
                value={formData.quotation.startingNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quotation: {
                      ...formData.quotation,
                      startingNumber: parseInt(e.target.value) || 101,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Default Footer Message</label>
              <input
                type="text"
                value={formData.quotation.defaultFooter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quotation: { ...formData.quotation, defaultFooter: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: User Accounts & Access Control (Super Admin Only) */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="space-y-6 text-xs">
          {/* Direct User Creation Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newUserName.trim() || !newUserEmail.trim() || !newUserPass.trim()) return;
              const res = createUserDirectly(newUserName, newUserEmail, newUserPass, newUserRole);
              if (res.success) {
                setSaveSuccessMsg(res.message);
                setNewUserName('');
                setNewUserEmail('');
                setNewUserPass('');
                setTimeout(() => setSaveSuccessMsg(''), 3000);
              }
            }}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3"
          >
            <h3 className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-1.5 border-b pb-2">
              <UserPlus className="w-4 h-4 text-[#D4AF37]" /> Create & Approve New Account Directly
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Usman Ali"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="usman@snapservice.pk"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Account Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none bg-white"
                >
                  <option value="user">Standard User (Photographer/Staff)</option>
                  <option value="super_admin">👑 Super Admin (Owner)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs shadow-md hover:bg-[#093A3A] transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Create User Account
              </button>
            </div>
          </form>

          {/* Registered Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Registered User Accounts ({users.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Super Admin can approve pending signups or deactivate team access.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div className="w-9 h-9 rounded-full bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0">
                      {u.role === 'super_admin' ? <Crown className="w-4.5 h-4.5" /> : u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">{u.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${
                          u.role === 'super_admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role === 'super_admin' ? '👑 Super Admin' : '👤 Standard User'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email} {u.phone ? `• ${u.phone}` : ''}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {!u.approved ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                        ⏳ Pending Approval
                      </span>
                    ) : u.active ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        ✓ Active Account
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-300">
                        🚫 Deactivated
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!u.approved && (
                      <button
                        type="button"
                        onClick={() => approveUser(u.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs hover:bg-emerald-800"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}

                    {u.approved && u.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => switchUserAccount(u.id)}
                        className="px-3 py-1 rounded-lg bg-[#0D4F4F] text-[#D4AF37] border border-[#D4AF37]/40 font-bold text-xs flex items-center gap-1 shadow-2xs hover:brightness-110 transition-all"
                        title="Log in to this user's account workspace"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Switch Account
                      </button>
                    )}

                    {u.approved && u.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => toggleUserActive(u.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                          u.active
                            ? 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}

                    {u.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete account for ${u.name}?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Backup, Export & Complete Data Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6 text-xs font-sans">
          {/* Auto-Backup Status Banner */}
          <div className="bg-gradient-to-r from-[#0D4F4F] to-[#093A3A] text-white p-6 rounded-2xl shadow-md border border-[#D4AF37]/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#D4AF37] text-[#0D4F4F] font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Auto-Backup Engine Active</h3>
                  <p className="text-xs text-[#C3DFDF]">
                    A complete system snapshot is automatically created after every quotation save or update.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Auto-Backup Live
              </span>
            </div>

            {storage.getLastAutoBackupTime() && (
              <div className="pt-2 text-[11px] text-[#D4AF37] font-mono">
                Last Auto-Backup Snapshot: {new Date(storage.getLastAutoBackupTime()!).toLocaleString()}
              </div>
            )}
          </div>

          {/* Backup Download & Project File Export Card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E5E0D5] shadow-sm space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
                <Download className="w-5 h-5 text-[#D4AF37]" /> Export & Download Full System Project File (.json)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Download a complete standalone backup file containing all client quotations, internal profit analyses, studio settings, service library, and user accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const data = storage.createBackupData();
                  if (data) {
                    const jsonStr = JSON.stringify(data, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const todayStr = new Date().toISOString().split('T')[0];
                    link.href = url;
                    link.download = `the-snap-service-backup-${todayStr}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-extrabold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Complete System Backup (.json)
              </button>

              <button
                type="button"
                onClick={() => {
                  storage.triggerAutoBackup();
                  setSaveSuccessMsg('Manual backup snapshot created successfully!');
                  setTimeout(() => setSaveSuccessMsg(''), 3000);
                }}
                className="px-5 py-3 rounded-xl bg-[#0D4F4F] text-white font-bold text-xs shadow-md hover:bg-[#093A3A] transition-all flex items-center gap-2"
              >
                <Database className="w-4 h-4 text-[#D4AF37]" /> Take Manual System Snapshot Now
              </button>
            </div>
          </div>

          {/* Full System Data Restore Card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-sm space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-600" /> Restore System Data from Backup File
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload a previously downloaded <span className="font-mono font-bold text-slate-800">.json</span> backup file to restore all client quotations, settings, and studio records.
              </p>
            </div>

            {restoreSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{restoreSuccessMsg}</span>
              </div>
            )}

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-3">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️ RESTORE INSTRUCTION</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900">
                Select your saved <span className="font-mono font-bold">the-snap-service-backup.json</span> project file below. Uploading will update local storage and restore all studio quotations and configurations.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const parsed = JSON.parse(event.target?.result as string);
                        const success = storage.restoreFromBackupData(parsed);
                        if (success) {
                          setRestoreSuccessMsg(`✅ System restored successfully! ${parsed.quotations?.length || 0} Quotation(s) & Studio Settings imported.`);
                          setTimeout(() => {
                            setRestoreSuccessMsg('');
                            window.location.reload();
                          }, 2000);
                        } else {
                          alert('Invalid backup file format.');
                        }
                      } catch (err) {
                        alert('Failed to parse backup JSON file.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0D4F4F] file:text-[#D4AF37] hover:file:bg-[#093A3A] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
