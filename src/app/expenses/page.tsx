'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/use-expenses';
import { useQuotations } from '@/hooks/use-quotations';
import { useAuth } from '@/hooks/use-auth';
import { StudioExpense, ExpenseCategory, Quotation } from '@/lib/types';
import { formatCurrency, formatDate, getTodayDateString, calculateQuotationInternalCost, calculateQuotationNetProfit } from '@/lib/utils';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Wallet, 
  CreditCard, 
  Landmark, 
  Banknote, 
  Trash2, 
  Edit3, 
  User, 
  Users, 
  Check, 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Camera, 
  Fuel, 
  BookOpen, 
  Building, 
  Megaphone, 
  Briefcase, 
  Layers, 
  TrendingUp,
  Clock,
  ChevronRight,
  UserCheck,
  Zap,
  Wifi,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const CATEGORY_CONFIG: Record<
  ExpenseCategory, 
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  event_profit: {
    label: 'Event Profit (Income)',
    icon: TrendingUp,
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
  },
  office_rent: {
    label: 'Office Rent',
    icon: Building,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  electricity: {
    label: 'Electricity',
    icon: Zap,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  internet: {
    label: 'Internet / Wi-Fi',
    icon: Wifi,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  salary: {
    label: 'Salaries',
    icon: Wallet,
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  marketing_ads: {
    label: 'Marketing & Ads',
    icon: Megaphone,
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  travel_fuel: {
    label: 'Transport & Fuel',
    icon: Fuel,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  gear_equipment: {
    label: 'Equipment & Gear',
    icon: Camera,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  team_advance: {
    label: 'Team Advance',
    icon: UserCheck,
    color: 'text-amber-800',
    bg: 'bg-amber-100/60',
    border: 'border-amber-300',
  },
  printing_albums: {
    label: 'Printing & Albums',
    icon: BookOpen,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  studio_utilities: {
    label: 'Studio Utilities',
    icon: Building,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  vendor_payout: {
    label: 'Vendor Payout',
    icon: Briefcase,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  other: {
    label: 'Other Studio Expenses',
    icon: Layers,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
};

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  cash: { label: 'Cash', icon: Banknote },
  bank_transfer: { label: 'Bank Transfer', icon: Landmark },
  online: { label: 'Online Transfer', icon: CreditCard },
  cheque: { label: 'Cheque', icon: Receipt },
  other: { label: 'Other', icon: Wallet },
};

// Categories user can select when adding manual expenses (Event Profit is auto-synced)
const MANUAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'office_rent',
  'electricity',
  'internet',
  'salary',
  'marketing_ads',
  'travel_fuel',
  'gear_equipment',
  'team_advance',
  'printing_albums',
  'studio_utilities',
  'other',
];

export default function ExpensesPage() {
  const { expenses, loading, addExpense, updateExpense, deleteExpense, totalExpenses, totalTeamAdvances } = useExpenses();
  const { quotations } = useQuotations();
  const { users } = useAuth();

  // Navigation Tabs: 'all' (Combined Ledger), 'expenses_only' (Studio Expenses), 'team_ledger' (Team Advances)
  const [activeTab, setActiveTab] = useState<'all' | 'expenses_only' | 'team_ledger'>('all');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<StudioExpense | null>(null);

  // Form State
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('office_rent');
  const [formPersonName, setFormPersonName] = useState('');
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formMethod, setFormMethod] = useState<'cash' | 'bank_transfer' | 'online' | 'cheque' | 'other'>('bank_transfer');
  const [formDescription, setFormDescription] = useState('');
  const [formReference, setFormReference] = useState('');

  // Selected Team Member Drawer/Modal State
  const [selectedPersonForDetail, setSelectedPersonForDetail] = useState<string | null>(null);

  // ----------------------------------------------------
  // 1. AUTO-SYNCED EVENT PROFIT FROM CONFIRMED BOOKINGS
  // ----------------------------------------------------
  const getQuotationProfit = (q: Quotation): number => {
    return Math.max(0, calculateQuotationNetProfit(q));
  };

  const getQuotationTotal = (q: Quotation): number => {
    return q.payment?.grandTotal || (q.events || []).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  };

  const getQuotationExpenses = (q: Quotation): number => {
    return calculateQuotationInternalCost(q);
  };

  // Confirmed & Completed Quotations
  const confirmedQuotations = useMemo(() => {
    return quotations.filter((q) => q.status === 'confirmed' || q.status === 'completed');
  }, [quotations]);

  // Synthetic auto-synced Event Profit entries
  const eventProfitEntries: StudioExpense[] = useMemo(() => {
    return confirmedQuotations.map((q) => {
      const profit = getQuotationProfit(q);
      const pkgTotal = getQuotationTotal(q);
      const expTotal = getQuotationExpenses(q);
      const dateStr = q.client?.quotationDate || q.createdAt?.split('T')[0] || getTodayDateString();

      return {
        id: `auto-profit-${q.id}`,
        workspaceId: q.workspaceId || 'ws_user-super-admin',
        amount: profit,
        category: 'event_profit' as ExpenseCategory,
        type: 'income',
        quotationId: q.id,
        quotationNumber: q.quotationNumber,
        clientName: q.client?.name,
        date: dateStr,
        personName: q.client?.name ? `${q.client.name}` : 'Confirmed Client',
        paymentMethod: 'bank_transfer',
        description: `Event Profit: ${q.client?.name || 'Client'} (${q.quotationNumber || 'SS-2026'}) — Package: ${formatCurrency(pkgTotal)} − Costs: ${formatCurrency(expTotal)}`,
        reference: q.quotationNumber,
        createdAt: q.createdAt || new Date().toISOString(),
        updatedAt: q.updatedAt || new Date().toISOString(),
      };
    });
  }, [confirmedQuotations]);

  // Combined Ledger Items (Income Profits + Manual Studio Expenses)
  const allLedgerItems = useMemo(() => {
    const combined = [...eventProfitEntries, ...expenses];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [eventProfitEntries, expenses]);

  // ----------------------------------------------------
  // 2. FINANCIAL RECONCILIATION TOTALS
  // ----------------------------------------------------
  // Total Event Profit (Income)
  const totalEventProfit = useMemo(() => {
    return eventProfitEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [eventProfitEntries]);

  // Total Studio Expenses (Manual studio operating costs & advances)
  const totalStudioExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // Studio Remaining Balance = Total Event Profit − Total Studio Expenses
  const studioRemainingBalance = totalEventProfit - totalStudioExpenses;

  // ----------------------------------------------------
  // 3. FILTERING
  // ----------------------------------------------------
  const filteredLedgerItems = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const sourceList = activeTab === 'expenses_only' ? expenses : allLedgerItems;

    return sourceList.filter((item) => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const matchSearch =
        !search ||
        (item.personName || '').toLowerCase().includes(search) ||
        (item.description || '').toLowerCase().includes(search) ||
        (item.reference || '').toLowerCase().includes(search) ||
        (item.quotationNumber || '').toLowerCase().includes(search);

      // Category
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;

      // Date
      let matchDate = true;
      if (dateFilter === 'this_month') {
        const itemDate = new Date(item.date);
        matchDate = itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
      } else if (dateFilter === 'last_month') {
        const itemDate = new Date(item.date);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        matchDate = itemDate.getFullYear() === prevYear && itemDate.getMonth() === prevMonth;
      }

      return matchSearch && matchCategory && matchDate;
    });
  }, [activeTab, expenses, allLedgerItems, searchQuery, selectedCategory, dateFilter]);

  // Grouped Team Advances Ledger
  const teamMemberLedgers = useMemo(() => {
    const map: Record<
      string,
      {
        personName: string;
        totalAdvances: number;
        totalAllPaid: number;
        count: number;
        lastDate: string;
        transactions: StudioExpense[];
      }
    > = {};

    // Populate registered users
    users.forEach((u) => {
      if (u.role === 'super_admin') return;
      const key = u.name.trim().toLowerCase();
      map[key] = {
        personName: u.name,
        totalAdvances: 0,
        totalAllPaid: 0,
        count: 0,
        lastDate: '',
        transactions: [],
      };
    });

    // Populate expenses
    expenses.forEach((exp) => {
      const rawName = (exp.personName || '').trim();
      const name = rawName || 'General / Studio Outflow';
      const key = name.toLowerCase();

      if (!map[key]) {
        map[key] = {
          personName: name,
          totalAdvances: 0,
          totalAllPaid: 0,
          count: 0,
          lastDate: '',
          transactions: [],
        };
      }

      const amt = Number(exp.amount) || 0;
      if (exp.category === 'team_advance') {
        map[key].totalAdvances += amt;
      }
      map[key].totalAllPaid += amt;
      map[key].count += 1;
      map[key].transactions.push(exp);

      if (!map[key].lastDate || exp.date > map[key].lastDate) {
        map[key].lastDate = exp.date;
      }
    });

    return Object.values(map).sort((a, b) => b.totalAllPaid - a.totalAllPaid);
  }, [expenses, users]);

  // Open Modal for New Record
  const handleOpenAddModal = (presetCategory: ExpenseCategory = 'office_rent', presetPersonName: string = '') => {
    setEditingExpense(null);
    setFormAmount('');
    setFormCategory(presetCategory === 'event_profit' ? 'office_rent' : presetCategory);
    setFormPersonName(presetPersonName);
    setFormDate(getTodayDateString());
    setFormMethod('bank_transfer');
    setFormDescription(
      presetCategory === 'team_advance'
        ? 'Advance payment for wedding shoot'
        : presetCategory === 'office_rent'
        ? 'Studio Office Rent'
        : presetCategory === 'electricity'
        ? 'Electricity & Power Bill'
        : ''
    );
    setFormReference('');
    setIsModalOpen(true);
  };

  // Open Modal for Editing
  const handleOpenEditModal = (expense: StudioExpense) => {
    if (expense.type === 'income' || expense.category === 'event_profit') return;
    setEditingExpense(expense);
    setFormAmount(expense.amount);
    setFormCategory(expense.category);
    setFormPersonName(expense.personName || '');
    setFormDate(expense.date);
    setFormMethod(expense.paymentMethod);
    setFormDescription(expense.description);
    setFormReference(expense.reference || '');
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) return;

    if (editingExpense) {
      await updateExpense({
        ...editingExpense,
        amount: Number(formAmount),
        category: formCategory,
        personName: formPersonName.trim() || undefined,
        date: formDate,
        paymentMethod: formMethod,
        description: formDescription.trim(),
        reference: formReference.trim() || undefined,
      });
    } else {
      await addExpense({
        amount: Number(formAmount),
        category: formCategory,
        personName: formPersonName.trim() || undefined,
        date: formDate,
        paymentMethod: formMethod,
        description: formDescription.trim(),
        reference: formReference.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  // Quick Team Suggestions
  const teamMemberSuggestions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.role !== 'super_admin') set.add(u.name);
    });
    expenses.forEach((e) => {
      if (e.personName) set.add(e.personName);
    });
    return Array.from(set);
  }, [users, expenses]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center shadow-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl text-[#0D4F4F] tracking-tight">
                Studio Expenses &amp; Team Ledger
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Auto-synced event profits minus studio operating costs (Rent, Electricity, Salaries, Transport) with live Studio Balance
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/analytics"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0D4F4F] font-bold text-xs shadow-2xs transition-all"
          >
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            <span>Financial Intelligence</span>
          </Link>
          <button
            type="button"
            onClick={() => handleOpenAddModal('team_advance')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#D4AF37] text-[#0D4F4F] hover:bg-[#FAF9F6]/80 font-bold text-xs shadow-2xs transition-all"
          >
            <UserCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Disburse Advance</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('office_rent')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0D4F4F] to-[#156060] text-white hover:opacity-95 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Record Studio Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Event Profit (Auto-Synced Income) */}
        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Event Profit</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-extrabold text-xl sm:text-2xl text-emerald-700">
            {formatCurrency(totalEventProfit)}
          </div>
          <span className="text-[10px] text-emerald-600 block">⚡ Auto-synced from {confirmedQuotations.length} confirmed bookings</span>
        </div>

        {/* 2. Total Studio Expenses */}
        <div className="bg-white p-4 rounded-2xl border-2 border-rose-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Studio Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-extrabold text-xl sm:text-2xl text-rose-600">
            {formatCurrency(totalStudioExpenses)}
          </div>
          <span className="text-[10px] text-slate-400 block">{expenses.length} recorded operating expenses</span>
        </div>

        {/* 3. Studio Remaining Balance */}
        <div className="bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-4 rounded-2xl border-2 border-[#D4AF37] shadow-md space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">Studio Remaining Balance</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
              Net Balance
            </span>
          </div>
          <div className="font-serif font-extrabold text-xl sm:text-2xl text-emerald-300 tracking-tight relative z-10">
            {formatCurrency(studioRemainingBalance)}
          </div>
          <span className="text-[10px] text-teal-200 block relative z-10">Event Profit − Total Studio Expenses</span>
        </div>

        {/* 4. Active Team Advances */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Team Advances Given</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-extrabold text-xl sm:text-2xl text-amber-700">
            {formatCurrency(totalTeamAdvances)}
          </div>
          <span className="text-[10px] text-amber-600 block">Total advances disbursed to crew</span>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Navigation Pill Tabs */}
          <div className="overflow-x-auto no-scrollbar inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#0D4F4F] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4 text-[#D4AF37]" />
              <span>Combined Studio Ledger</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] text-[10px]">
                {allLedgerItems.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses_only')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all ${
                activeTab === 'expenses_only'
                  ? 'bg-white text-[#0D4F4F] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4 text-[#D4AF37]" />
              <span>Studio Expenses Only</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] text-[10px]">
                {expenses.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('team_ledger')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg shrink-0 whitespace-nowrap transition-all ${
                activeTab === 'team_ledger'
                  ? 'bg-white text-[#0D4F4F] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <span>Team Member Ledgers</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#0D4F4F]/10 text-[#0D4F4F] text-[10px]">
                {teamMemberLedgers.length}
              </span>
            </button>
          </div>

          {/* Search & Date Filter Bar */}
          <div className="flex items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search client, note, quotation #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0D4F4F] text-xs w-48 sm:w-60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Date Filter Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'all' | 'this_month' | 'last_month')}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0D4F4F] text-xs"
            >
              <option value="all">All Dates</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills (Visible when in All or Studio Expenses Tab) */}
        {(activeTab === 'all' || activeTab === 'expenses_only') && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full shrink-0 whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#0D4F4F] text-[#D4AF37] font-bold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Categories
            </button>
            {Object.entries(CATEGORY_CONFIG)
              .filter(([catKey]) => activeTab === 'all' || catKey !== 'event_profit')
              .map(([catKey, config]) => {
                const Icon = config.icon;
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={`px-3 py-1 rounded-full shrink-0 whitespace-nowrap flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#0D4F4F] text-[#D4AF37] font-bold shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{config.label}</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1 & 2: COMBINED LEDGER / STUDIO EXPENSES TABLE   */}
      {/* ---------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'expenses_only') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3 whitespace-nowrap">Date</th>
                  <th className="p-3 whitespace-nowrap">Category / Type</th>
                  <th className="p-3 whitespace-nowrap">Source / Recipient</th>
                  <th className="p-3 whitespace-nowrap">Description / Quotation Details</th>
                  <th className="p-3 whitespace-nowrap text-right">Inflow (+) / Outflow (-)</th>
                  <th className="p-3 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedgerItems.map((item) => {
                  const isIncome = item.type === 'income' || item.category === 'event_profit';
                  const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
                  const CatIcon = catConfig.icon;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isIncome ? 'bg-emerald-50/30' : ''}`}>
                      {/* Date */}
                      <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>

                      {/* Category Badge */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{catConfig.label}</span>
                        </span>
                      </td>

                      {/* Source / Recipient */}
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                        {item.personName || <span className="text-slate-400 italic font-normal">—</span>}
                      </td>

                      {/* Description */}
                      <td className="p-3 text-slate-700 max-w-sm">
                        <div className="font-medium truncate">{item.description}</div>
                        {isIncome && item.quotationId && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-emerald-700 font-bold">⚡ Live Quotation Sync</span>
                            <Link
                              href={`/quotations/${item.quotationId}/compare`}
                              className="text-[10px] text-[#0D4F4F] hover:underline font-bold inline-flex items-center gap-0.5"
                            >
                              <span>View Costing</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        )}
                      </td>

                      {/* Amount: Inflow (+) / Outflow (-) */}
                      <td className="p-3 text-right whitespace-nowrap font-mono">
                        {isIncome ? (
                          <span className="font-serif font-extrabold text-emerald-700 text-sm">
                            +{formatCurrency(item.amount)}
                          </span>
                        ) : (
                          <span className="font-serif font-bold text-rose-600 text-sm">
                            -{formatCurrency(item.amount)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        {isIncome ? (
                          <Link
                            href={`/quotations/${item.quotationId}/compare`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] transition-colors inline-flex items-center gap-1 border border-emerald-300 shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                            <span>Quotation</span>
                          </Link>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D4F4F] hover:bg-slate-100 transition-colors inline-flex items-center"
                              title="Edit Entry"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Delete this expense record?')) {
                                  deleteExpense(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLedgerItems.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-sm">No ledger entries found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery ? 'Try changing your search keywords or date filter.' : 'Record a studio operating expense or confirm a quotation to generate event profits.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: TEAM MEMBER LEDGER VIEW                      */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'team_ledger' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMemberLedgers.map((member) => {
              return (
                <div
                  key={member.personName}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Person Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#0D4F4F] text-[#D4AF37] font-serif font-bold text-sm flex items-center justify-center border border-[#D4AF37]/30 shadow-2xs">
                          {member.personName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{member.personName}</h3>
                          <span className="text-[10px] text-slate-400 font-medium">Team Member</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold shrink-0 whitespace-nowrap">
                        {member.count} {member.count === 1 ? 'Entry' : 'Entries'}
                      </span>
                    </div>

                    {/* Balance / Advance Stat Box */}
                    <div className="bg-[#FAF9F6] p-3 rounded-xl border border-amber-200/70 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Total Advances Given:</span>
                        <span className="font-serif font-bold text-amber-700 text-sm">
                          {formatCurrency(member.totalAdvances)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                        <span className="text-slate-400">Total All Payouts:</span>
                        <span className="font-bold text-slate-800">{formatCurrency(member.totalAllPaid)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPersonForDetail(member.personName)}
                      className="text-xs text-[#0D4F4F] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>View Statement</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAddModal('team_advance', member.personName)}
                      className="px-2.5 py-1 bg-[#0D4F4F] text-[#D4AF37] rounded-lg font-bold text-[11px] hover:bg-[#156060] transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Give Advance</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {teamMemberLedgers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-sm">No team member records yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Disburse an advance to start tracking team balances.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddModal('team_advance')}
                className="px-4 py-2 bg-[#0D4F4F] text-[#D4AF37] rounded-xl font-bold text-xs shadow-xs"
              >
                + Disburse First Team Advance
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT STUDIO EXPENSE ENTRY           */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#0D4F4F]">
                  {editingExpense ? 'Edit Studio Expense' : 'Record Studio Expense / Advance'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              {/* Category Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Expense Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {MANUAL_EXPENSE_CATEGORIES.map((key) => {
                    const config = CATEGORY_CONFIG[key];
                    const Icon = config.icon;
                    const isSelected = formCategory === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormCategory(key)}
                        className={`p-2 rounded-lg text-left text-[11px] font-semibold flex items-center gap-1.5 border transition-all ${
                          isSelected
                            ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#0D4F4F] shadow-2xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Amount (PKR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-base text-[#0D4F4F] focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">PKR</span>
                </div>
              </div>

              {/* Recipient / Person Name (Optional or for advances) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Paid To / Recipient / Vendor Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Landlord, LESCO Electricity, PTCL Internet, Jawad Shooter"
                  value={formPersonName}
                  onChange={(e) => setFormPersonName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
                {/* Suggestions */}
                {teamMemberSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 self-center">Quick Select:</span>
                    {teamMemberSuggestions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFormPersonName(name)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date & Payment Method Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none bg-white"
                  >
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="cash">💵 Cash</option>
                    <option value="online">📱 Online Transfer</option>
                    <option value="cheque">📜 Cheque</option>
                    <option value="other">💳 Other</option>
                  </select>
                </div>
              </div>

              {/* Purpose / Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. September Studio Rent, Electricity Bill, Internet Subscription"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              {/* Reference / Transaction ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reference / Transaction ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Meezan Tx #8492024"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37] font-bold hover:bg-[#156060] transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingExpense ? 'Update Entry' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: TEAM MEMBER STATEMENT DRAWER / MODAL         */}
      {/* ---------------------------------------------------- */}
      {selectedPersonForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0D4F4F] text-[#D4AF37] font-serif font-bold text-sm flex items-center justify-center">
                  {selectedPersonForDetail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0D4F4F]">
                    {selectedPersonForDetail} — Statement
                  </h3>
                  <span className="text-xs text-slate-400">Team Ledger History</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPersonForDetail(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Statement Table */}
            <div className="overflow-y-auto flex-1 border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Purpose</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5 text-right">Amount (PKR)</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses
                    .filter((e) => {
                      if (selectedPersonForDetail === 'General / Studio Outflow') {
                        return !e.personName || e.personName.toLowerCase() === 'general / studio outflow';
                      }
                      return (e.personName || '').toLowerCase() === selectedPersonForDetail.toLowerCase();
                    })
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-700">{formatDate(item.date)}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                            {CATEGORY_CONFIG[item.category]?.label || item.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">{item.description || '—'}</td>
                        <td className="p-2.5 text-slate-500 capitalize">{item.paymentMethod.replace('_', ' ')}</td>
                        <td className="p-2.5 font-serif font-bold text-rose-600 text-right">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D4F4F] hover:bg-slate-100 transition-colors inline-flex items-center"
                            title="Edit / Modify Entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete this expense entry of ${formatCurrency(item.amount)}?`)) {
                                deleteExpense(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center"
                            title="Delete / Remove Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const name = selectedPersonForDetail;
                  setSelectedPersonForDetail(null);
                  handleOpenAddModal('team_advance', name);
                }}
                className="px-4 py-2 bg-[#0D4F4F] text-[#D4AF37] rounded-xl font-bold text-xs hover:bg-[#156060] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Give Advance to {selectedPersonForDetail}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPersonForDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
