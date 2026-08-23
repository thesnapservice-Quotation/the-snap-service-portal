'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { useServices } from '@/hooks/use-services';
import { useAuth } from '@/hooks/use-auth';
import { useQuotations } from '@/hooks/use-quotations';
import { AppSettings, Service, UserRole, Quotation, UserAccount } from '@/lib/types';
import { storage } from '@/lib/storage';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, syncQuotationToGoogleDrive } from '@/lib/google-drive-sync';
import {
  getStoredGoogleDriveUser,
  getStoredGoogleDriveToken,
  initiateGoogleDriveConnect,
  disconnectGoogleDrive,
  uploadAllQuotationsDirectToDrive,
  importQuotationsFromGoogleDrive,
  GoogleDriveUser,
} from '@/lib/google-drive-oauth';
import { GoogleDriveRestoreModal } from '@/components/layout/google-drive-restore-modal';
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
  Clock,
  HardDrive,
  Copy,
  ExternalLink,
  RefreshCw,
  Share2,
  FolderSync,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldAlert,
  Bell,
  BellRing,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

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
  const { quotations, saveQuotation } = useQuotations();
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    registeredDevices,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    sendTestNotification,
    refreshDevices,
  } = usePushNotifications();
  const { 
    users, 
    currentUser, 
    isSuperAdmin, 
    approveUser, 
    toggleUserActive, 
    deleteUser, 
    changeUserPassword,
    createUserDirectly,
    switchUserAccount,
    refreshAuth
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'business' | 'bank' | 'services' | 'terms' | 'quotation' | 'users' | 'notifications' | 'backup'>('business');
  const [testPushMsg, setTestPushMsg] = useState('');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('');

  // User Password Change Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<UserAccount | null>(null);
  const [pwdCurrentPass, setPwdCurrentPass] = useState('');
  const [pwdNewPass, setPwdNewPass] = useState('');
  const [pwdConfirmPass, setPwdConfirmPass] = useState('');
  const [pwdTwoStepCode, setPwdTwoStepCode] = useState('');
  const [pwdShowPass, setPwdShowPass] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Auto-refresh users from cloud when switching to users tab
  useEffect(() => {
    if (activeTab === 'users') {
      refreshAuth();
    }
  }, [activeTab, refreshAuth]);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    setPwdError('');
    setPwdSuccess('');
    setPwdLoading(true);

    const res = await changeUserPassword({
      targetUserId: passwordModalUser.id,
      currentPassword: pwdCurrentPass,
      newPassword: pwdNewPass,
      confirmPassword: pwdConfirmPass,
      twoStepCode: pwdTwoStepCode,
    });

    setPwdLoading(false);
    if (!res.success) {
      setPwdError(res.message);
    } else {
      setPwdSuccess(res.message);
      setTimeout(() => {
        setPasswordModalUser(null);
        setPwdCurrentPass('');
        setPwdNewPass('');
        setPwdConfirmPass('');
        setPwdTwoStepCode('');
        setPwdSuccess('');
      }, 1500);
    }
  };

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

  // Live Database Test state
  const [dbTestRunning, setDbTestRunning] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Google Drive & Sheets Integration state
  const [googleOAuthUser, setGoogleOAuthUser] = useState<GoogleDriveUser | null>(null);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleDirectSyncRunning, setGoogleDirectSyncRunning] = useState(false);
  const [googleImportRunning, setGoogleImportRunning] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [googleWebhookUrl, setGoogleWebhookUrl] = useState(
    settings.integrations?.googleDriveWebhookUrl || ''
  );
  const [googleSyncRunning, setGoogleSyncRunning] = useState(false);
  const [googleSyncResult, setGoogleSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);

  React.useEffect(() => {
    setGoogleOAuthUser(getStoredGoogleDriveUser());
  }, []);

  const handleDirectGoogleConnect = async () => {
    setGoogleConnecting(true);
    const res = await initiateGoogleDriveConnect();
    setGoogleConnecting(false);

    if (res.success && res.user) {
      setGoogleOAuthUser(res.user);
      setSaveSuccessMsg(`Connected to Google Drive as ${res.user.email}!`);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } else if (res.error) {
      alert(`Google Sign-In: ${res.error}`);
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleDrive();
    setGoogleOAuthUser(null);
    setSaveSuccessMsg('Google Drive disconnected.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleDirectSyncAll = async () => {
    setGoogleDirectSyncRunning(true);
    setGoogleSyncResult(null);
    const allQuotes = quotations.length > 0 ? quotations : storage.getQuotations();
    const res = await uploadAllQuotationsDirectToDrive(allQuotes);
    setGoogleDirectSyncRunning(false);
    if (res.success) {
      setGoogleSyncResult({
        success: true,
        message: `✓ Saved ${res.count} Quotation(s) directly into your Google Drive folder "The Snap Service — Quotations Archive"!`,
      });
    } else {
      setGoogleSyncResult({
        success: false,
        message: res.error || 'Failed to upload to Google Drive.',
      });
    }
  };

  const handleImportSelectedQuotations = async (toImport: Quotation[]): Promise<number> => {
    let savedCount = 0;
    for (const q of toImport) {
      await saveQuotation(q);
      savedCount++;
    }
    setGoogleSyncResult({
      success: true,
      message: `✓ Successfully imported and restored ${savedCount} quotation(s) from your Google Drive folder!`,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_quotation_updated'));
    }
    return savedCount;
  };

  const handleTestDatabase = async () => {
    setDbTestRunning(true);
    setDbTestResult(null);
    const startTime = Date.now();

    try {
      const res = await fetch('/api/db-status');
      const statusData = await res.json();

      const testQuote = {
        id: `quote-test-${Date.now()}`,
        quotationNumber: `TEST-SYNC-${Math.floor(100 + Math.random() * 900)}`,
        userId: currentUser?.id || 'user-super-admin',
        status: 'sent' as const,
        client: {
          name: 'Supabase Sync Test Client',
          phone: '+92 323 9244924',
          quotationDate: new Date().toISOString().split('T')[0],
          eventDates: '17th Aug 2026',
        },
        packageType: 'single_event' as const,
        events: [
          {
            id: 'evt-test-1',
            name: 'Barat',
            dayNumber: 1,
            services: [{ id: 's1', serviceId: 'srv-1', serviceName: 'Photographer', quantity: 1 }],
            price: 50000,
          },
        ],
        inclusions: [],
        payment: { grandTotal: 50000, advanceReceived: 25000, advanceType: 'fixed' as const, balancePayable: 25000 },
        termsAndConditions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saveRes = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testQuote),
      });
      const saveData = await saveRes.json();
      const elapsed = Date.now() - startTime;

      if (saveRes.ok && saveData?.quotation) {
        setDbTestResult({
          success: true,
          message: `✓ Connected! Real PostgreSQL row (${testQuote.quotationNumber}) created in Supabase in ${elapsed}ms!`,
          details: statusData,
        });
      } else {
        setDbTestResult({
          success: false,
          message: `Database save returned: ${JSON.stringify(saveData)}`,
          details: statusData,
        });
      }
    } catch (e: any) {
      setDbTestResult({
        success: false,
        message: `Network error connecting to database API: ${e?.message || e}`,
      });
    } finally {
      setDbTestRunning(false);
    }
  };

  const handleSaveGoogleDriveWebhook = () => {
    const updated: AppSettings = {
      ...formData,
      integrations: {
        ...formData.integrations,
        googleDriveWebhookUrl: googleWebhookUrl.trim(),
        autoSyncGoogleDrive: true,
        googleDriveFolderName: 'Snap Service Quotations Archive',
      },
    };
    setFormData(updated);
    updateSettings(updated);
    setSaveSuccessMsg('Google Drive Webhook URL saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleTestGoogleDriveSync = async () => {
    if (!googleWebhookUrl) {
      setGoogleSyncResult({ success: false, message: 'Please enter your Google Apps Script Webhook URL first.' });
      return;
    }
    setGoogleSyncRunning(true);
    setGoogleSyncResult(null);

    const testQuote: Quotation = {
      id: `quote-gdrive-test-${Date.now()}`,
      quotationNumber: `TEST-GDRIVE-${Math.floor(100 + Math.random() * 900)}`,
      userId: currentUser?.id || 'user-super-admin',
      status: 'confirmed',
      client: {
        name: 'Google Drive Sync Test Client',
        phone: '+92 323 9244924',
        quotationDate: new Date().toISOString().split('T')[0],
        eventDates: '18th Aug 2026',
      },
      packageType: 'single_day',
      events: [
        {
          id: 'evt-1',
          name: 'Barat Coverage',
          dayNumber: 1,
          services: [{ id: 's1', serviceId: 'srv-1', serviceName: 'Photographer', quantity: 2 }],
          guestCount: 300,
          price: 55000,
        },
      ],
      inclusions: [{ id: 'inc-1', name: 'Raw Footage + Highlight Film', included: true, quantity: 1 }],
      payment: {
        grandTotal: 55000,
        advanceReceived: 25000,
        advanceType: 'fixed',
        balancePayable: 30000,
      },
      termsAndConditions: ['50% advance to lock date'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await syncQuotationToGoogleDrive(testQuote, googleWebhookUrl.trim());
    setGoogleSyncRunning(false);
    setGoogleSyncResult(res);
  };

  const handleSyncAllToGoogleDrive = async () => {
    if (!googleWebhookUrl) {
      setGoogleSyncResult({ success: false, message: 'Please enter your Google Apps Script Webhook URL first.' });
      return;
    }
    setGoogleSyncRunning(true);
    setGoogleSyncResult(null);

    const allQuotes = quotations.length > 0 ? quotations : storage.getQuotations();
    if (allQuotes.length === 0) {
      setGoogleSyncRunning(false);
      setGoogleSyncResult({ success: false, message: 'No quotations found in system to sync.' });
      return;
    }

    const res = await syncQuotationToGoogleDrive(allQuotes, googleWebhookUrl.trim());
    setGoogleSyncRunning(false);
    if (res.success) {
      setGoogleSyncResult({
        success: true,
        message: `✓ Successfully synced all ${allQuotes.length} quotation(s) to your Google Drive & Google Sheets!`,
      });
    } else {
      setGoogleSyncResult(res);
    }
  };

  // Sync state when settings load
  React.useEffect(() => {
    setFormData(settings);
    if (settings.integrations?.googleDriveWebhookUrl) {
      setGoogleWebhookUrl(settings.integrations.googleDriveWebhookUrl);
    }
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
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
            activeTab === 'notifications'
              ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#D4AF37] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4 text-[#D4AF37]" /> Push Notifications &amp; Devices ({registeredDevices.length})
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
            activeTab === 'backup'
              ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#D4AF37] shadow-md'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          }`}
        >
          <Database className="w-4 h-4 text-[#D4AF37]" /> System Backup &amp; Data Restore ⚡
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
                placeholder="e.g. PK84MEZN0004240104676435"
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
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newUserName.trim() || !newUserEmail.trim() || !newUserPass.trim()) return;
              const res = await createUserDirectly(newUserName, newUserEmail, newUserPass, newUserRole);
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
            <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Registered User Accounts ({users.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Super Admin can approve pending signups or deactivate team access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => refreshAuth()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Fetch latest pending signups from cloud"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#0D4F4F]" />
                <span>Refresh Requests</span>
              </button>
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

                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordModalUser(u);
                          setPwdCurrentPass('');
                          setPwdNewPass('');
                          setPwdConfirmPass('');
                          setPwdTwoStepCode('');
                          setPwdError('');
                          setPwdSuccess('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1 shadow-2xs hover:bg-amber-100 transition-all"
                        title="Change / Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>Password</span>
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

          {/* USER PASSWORD CHANGE MODAL */}
          {passwordModalUser && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl border-2 border-[#D4AF37] space-y-4 animate-in fade-in zoom-in-95 duration-150 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37] shadow-sm">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                        {passwordModalUser.role === 'super_admin' ? 'Change Super Admin Password' : `Reset Password for ${passwordModalUser.name}`}
                      </h3>
                      <p className="text-[10.5px] text-slate-500 font-medium">
                        {passwordModalUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPasswordModalUser(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5 text-xs">
                  {passwordModalUser.role === 'super_admin' ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-tight space-y-1">
                      <span className="font-bold flex items-center gap-1 text-amber-950">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Super Admin Security Verification
                      </span>
                      <p>
                        Changing Super Admin password requires current password and 2-step verification code.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[11px] leading-tight">
                      <span>
                        👑 Super Admin Direct Reset: Set a new login password for <strong>{passwordModalUser.name}</strong>.
                      </span>
                    </div>
                  )}

                  {/* Super Admin specific fields: Current Password */}
                  {passwordModalUser.role === 'super_admin' && (
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Current Password / PIN</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter current password..."
                        value={pwdCurrentPass}
                        onChange={(e) => {
                          setPwdCurrentPass(e.target.value);
                          setPwdError('');
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">New Password / PIN</label>
                    <div className="relative">
                      <input
                        type={pwdShowPass ? 'text' : 'password'}
                        required
                        placeholder="Enter new password (min 4 chars)..."
                        value={pwdNewPass}
                        onChange={(e) => {
                          setPwdNewPass(e.target.value);
                          setPwdError('');
                        }}
                        className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setPwdShowPass(!pwdShowPass)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {pwdShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Re-enter New Password */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Re-enter New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm new password..."
                      value={pwdConfirmPass}
                      onChange={(e) => {
                        setPwdConfirmPass(e.target.value);
                        setPwdError('');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                    />
                  </div>

                  {/* Super Admin specific fields: 2-Step Verification Code */}
                  {passwordModalUser.role === 'super_admin' && (
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 flex items-center justify-between">
                        <span>2-Step Verification Code</span>
                        <span className="text-[10px] text-amber-700 font-semibold">Admin Required</span>
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter 6-digit 2-step code..."
                        value={pwdTwoStepCode}
                        onChange={(e) => {
                          setPwdTwoStepCode(e.target.value);
                          setPwdError('');
                        }}
                        className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-xl font-mono font-bold tracking-widest text-slate-900 focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {pwdError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{pwdError}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {pwdSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{pwdSuccess}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPasswordModalUser(null)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pwdLoading || !pwdNewPass || !pwdConfirmPass || (passwordModalUser.role === 'super_admin' && (!pwdCurrentPass || !pwdTwoStepCode))}
                      className="px-5 py-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37] font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {pwdLoading ? (
                        <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Save Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Push Notifications & Multi-Device Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 text-xs font-sans">
          {/* Main Push Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    isPushSubscribed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {isPushSubscribed ? (
                    <BellRing className="w-6 h-6 text-emerald-600 animate-bounce" />
                  ) : (
                    <Bell className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base text-[#0D4F4F] flex items-center gap-2">
                    <span>Web Push &amp; PWA Task Reminders</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPushSubscribed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isPushSubscribed ? 'Active on This Device' : 'Not Subscribed'}
                    </span>
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Receive operation reminders, follow-up alarms, and deadline alerts on your phone &amp; laptop even when portal is closed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {isPushSubscribed ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        setTestPushMsg('Sending test push...');
                        const res = await sendTestNotification();
                        setTestPushMsg(res.message || 'Test delivered!');
                        setTimeout(() => setTestPushMsg(''), 4000);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#0D4F4F]" />
                      <span>{testPushMsg || 'Send Test Push'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={pushLoading}
                      onClick={async () => {
                        if (confirm('Unsubscribe this device from task push notifications?')) {
                          await unsubscribePush();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition-all cursor-pointer"
                    >
                      Unsubscribe Device
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pushLoading || !isPushSupported}
                    onClick={async () => {
                      const res = await subscribePush();
                      if (!res.success && res.error) {
                        alert(res.error);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Bell className="w-4 h-4" />
                    <span>{pushLoading ? 'Enabling...' : 'Enable Task Notifications on This Device'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Architecture Details Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs space-y-2">
              <span className="font-bold text-slate-800 block">
                ⚡ Push Notification Architecture &amp; Device Compatibility:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>
                  <strong className="text-slate-800">iPhone / iPad (iOS 16.4+):</strong> Open Safari, tap Share, and select <em>&ldquo;Add to Home Screen&rdquo;</em>, then open the Snap Service app and tap Enable Notifications.
                </li>
                <li>
                  <strong className="text-slate-800">Android:</strong> Works natively in Chrome or when installed as a Standalone PWA.
                </li>
                <li>
                  <strong className="text-slate-800">Mac / Windows PC:</strong> Works natively in Chrome, Safari, Edge, and desktop browsers.
                </li>
                <li>
                  <strong className="text-slate-800">Multi-Device Sync:</strong> One user can have multiple phones and computers registered. Reminders will be delivered to all active devices.
                </li>
              </ul>
            </div>
          </div>

          {/* Registered Devices for Current User */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                  Registered Devices for {currentUser?.name || 'Current User'}
                </h3>
                <p className="text-slate-500 text-xs">
                  Active devices configured to receive task push reminders
                </p>
              </div>
              <button
                type="button"
                onClick={() => refreshDevices()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Devices</span>
              </button>
            </div>

            {registeredDevices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Smartphone className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No devices registered yet</p>
                <p className="text-xs">
                  Click &quot;Enable Task Notifications&quot; on your phone or laptop to register your device.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {registeredDevices.map((dev) => {
                  return (
                    <div key={dev.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 text-[#0D4F4F]">
                          {dev.deviceType === 'ios_pwa' || dev.deviceType === 'android' ? (
                            <Smartphone className="w-5 h-5" />
                          ) : (
                            <Laptop className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">{dev.deviceName}</span>
                            <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9.5px]">
                              Active
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 font-mono">
                            Registered: {new Date(dev.createdAt).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Remove device "${dev.deviceName}"?`)) {
                            await fetch(`/api/notifications/subscribe?id=${encodeURIComponent(dev.id)}`, {
                              method: 'DELETE',
                            });
                            refreshDevices();
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Backup, Export & Complete Data Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6 text-xs font-sans">
          {/* Supabase Central Production Database Connection Card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                      Supabase PostgreSQL Production Database
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected (Single Source of Truth)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target Table: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[#0D4F4F] font-bold">public.quotations</code> | Endpoint: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">lwsmgogcxngolukwqnjj.supabase.co</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={dbTestRunning}
                onClick={handleTestDatabase}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {dbTestRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Testing Database...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>⚡ Run 1-Click Database Read & Write Test</span>
                  </>
                )}
              </button>
            </div>

            {dbTestResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                  dbTestResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                <span>{dbTestResult.message}</span>
                {dbTestResult.details && (
                  <span className="text-[11px] font-mono opacity-80">
                    Status: {dbTestResult.details.status} | DB Count: {dbTestResult.details.totalQuotationsInDb}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Google Drive Direct OAuth & Cloud Sync Card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#D4AF37]/60 shadow-md space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#0D4F4F] text-[#D4AF37] shadow-sm">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                      Google Drive Cloud Storage & Permanent Archival
                    </h3>
                    {googleOAuthUser ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google Drive Connected
                      </span>
                    ) : googleWebhookUrl ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Webhook Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] uppercase tracking-wider border border-amber-300">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect your personal Google Account to automatically mirror and archive every single quotation directly onto Google Drive.
                  </p>
                </div>
              </div>
            </div>

            {/* Option A: Direct 1-Click Google Sign-In & Connect */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span>⚡ 1-Click Direct Google Sign-In</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sign in with Google to automatically create a dedicated <em>&quot;The Snap Service — Quotations Archive&quot;</em> folder in your Google Drive.
                  </p>
                </div>
              </div>

              {googleOAuthUser ? (
                <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0D4F4F] text-[#D4AF37] font-bold flex items-center justify-center text-sm shadow-xs uppercase">
                      {googleOAuthUser.name.charAt(0) || 'G'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{googleOAuthUser.name}</span>
                      <span className="text-[11px] text-slate-500 block">{googleOAuthUser.email}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                        📁 Target Folder: The Snap Service — Quotations Archive
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={googleDirectSyncRunning}
                      onClick={handleDirectSyncAll}
                      className="px-4 py-2 bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs rounded-xl shadow-sm hover:bg-[#093A3A] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Upload all quotations to Google Drive"
                    >
                      {googleDirectSyncRunning ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5" />
                      )}
                      <span>Backup All ({quotations.length}) to Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRestoreModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs rounded-xl shadow-sm hover:brightness-105 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Select & restore quotations from Google Drive"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Restore from Google Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={googleConnecting}
                    onClick={handleDirectGoogleConnect}
                    className="px-6 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-[#0D4F4F] text-slate-800 font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{googleConnecting ? 'Connecting to Google...' : 'Sign in with Google & Connect Google Drive'}</span>
                  </button>
                </div>
              )}
            </div>

            {googleSyncResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                  googleSyncResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                <span>{googleSyncResult.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Apps Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border-2 border-[#D4AF37] space-y-4 animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37]">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                    Google Apps Script Integration Code
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Copy and paste into your Google Sheet Apps Script Editor
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowScriptModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Code.gs</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs hover:bg-[#093A3A] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script Code'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 border border-slate-800 leading-relaxed select-all">
                {GOOGLE_APPS_SCRIPT_TEMPLATE}
              </pre>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Google Drive Quotations Selection & Restore Modal */}
      <GoogleDriveRestoreModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        existingQuotations={quotations}
        onImportQuotations={handleImportSelectedQuotations}
      />
    </div>
  );
}
