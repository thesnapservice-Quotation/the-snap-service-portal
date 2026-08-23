'use client';

import React from 'react';
import Link from 'next/link';
import { useQuotations } from '@/hooks/use-quotations';
import { useTasks } from '@/hooks/use-tasks';
import { useProfitPrivacy } from '@/context/profit-privacy-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/quotation/status-badge';
import { 
  computeTaskStatus, 
  formatTaskDateTime, 
  getStatusBadgeConfig, 
  getPriorityBadgeConfig,
  TASK_CATEGORIES_CONFIG 
} from '@/lib/tasks-utils';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  TrendingUp, 
  PlusCircle, 
  ArrowRight,
  Eye,
  Edit3,
  Sparkles,
  Lock,
  Unlock,
  ListTodo,
  AlertTriangle,
  Check,
  User,
  Calendar
} from 'lucide-react';

export default function DashboardPage() {
  const { quotations, loading } = useQuotations();
  const { tasks, toggleTaskComplete } = useTasks();
  const { isProfitUnlocked, openUnlockModal, lockProfit } = useProfitPrivacy();

  // Metrics calculations
  const totalQuotations = quotations.length;
  const draftQuotations = quotations.filter((q) => q.status === 'draft').length;
  const sentQuotations = quotations.filter((q) => q.status === 'sent').length;
  const confirmedBookings = quotations.filter((q) => q.status === 'confirmed' || q.status === 'completed').length;
  
  // Financial metrics calculated ONLY for confirmed & completed bookings
  const confirmedQuotations = quotations.filter((q) => q.status === 'confirmed' || q.status === 'completed');
  const totalValue = confirmedQuotations.reduce((sum, q) => sum + (q.payment?.grandTotal || 0), 0);

  // Synchronized Total Net Profit (strictly confirmed/completed bookings)
  const totalNetProfit = confirmedQuotations.reduce((sum, q) => {
    const cost = q.internalAnalysis?.totalInternalCost ?? q.events.reduce((eSum, evt) => {
      return eSum + evt.services.reduce((sSum, s) => sSum + (s.quantity || 1) * (s.internalCostPerUnit ?? 5000), 0);
    }, 0);
    return sum + (q.payment.grandTotal - cost);
  }, 0);

  const overallMargin = totalValue > 0 ? (totalNetProfit / totalValue) * 100 : 0;

  const recentQuotations = quotations.slice(0, 5);

  // Tasks with computed dynamic statuses
  const computedTasks = tasks.map((t) => ({
    ...t,
    computedStatus: computeTaskStatus(t),
  }));

  // 1. Red Priority 5 Tasks (Urgent and High Priority active tasks)
  const redPriorityTasks = computedTasks
    .filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.computedStatus !== 'completed')
    .slice(0, 5);

  // 2. Recent 5 Tasks
  const recentTasks = computedTasks.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0D4F4F] via-[#093A3A] to-[#1B2A4A] text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-[#D4AF37]/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-[#D4AF37]" /> Snap Service Quotation Studio
            </div>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-wide">
              Wedding Studio Overview
            </h1>
            <p className="text-xs md:text-sm text-[#C3DFDF] mt-1 max-w-xl">
              Manage client quotations, compute custom package pricing, and issue luxury PDF quotations instantly.
            </p>
          </div>

          <Link
            href="/quotations/new"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-sm shadow-lg hover:brightness-110 transition-all shrink-0"
          >
            <PlusCircle className="w-5 h-5" /> New Quotation
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards (6 Synchronized Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Quotations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-[11px]">Total Quotations</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-[#0D4F4F]">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-xl text-slate-900">{totalQuotations}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">All time created</span>
          </div>
        </div>

        {/* Card 2: Draft Quotations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-[11px]">Drafts</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-xl text-slate-900">{draftQuotations}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">In progress</span>
          </div>
        </div>

        {/* Card 3: Sent Quotations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-[11px]">Sent to Client</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-xl text-slate-900">{sentQuotations}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Awaiting response</span>
          </div>
        </div>

        {/* Card 4: Confirmed Bookings */}
        <div className="bg-white p-4 rounded-xl border border-[#0D4F4F]/20 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-[#0D4F4F]/5">
          <div className="flex items-center justify-between">
            <span className="text-[#0D4F4F] font-semibold text-[11px]">Confirmed</span>
            <div className="p-1.5 rounded-lg bg-[#0D4F4F] text-[#D4AF37]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-xl text-[#0D4F4F]">{confirmedBookings}</span>
            <span className="text-[9px] text-[#0D4F4F]/70 block mt-0.5">Bookings locked</span>
          </div>
        </div>

        {/* Card 5: Total Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-[11px]">Total Value</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-bold text-base text-slate-900 block truncate">
              {formatCurrency(totalValue)}
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Active pipeline</span>
          </div>
        </div>

        {/* Card 6: Total Estimated Net Profit (Password Protected) */}
        <div 
          onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
          className="bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-4 rounded-xl border border-[#D4AF37]/50 shadow-md flex flex-col justify-between cursor-pointer group hover:border-[#D4AF37] transition-all relative overflow-hidden"
          title={isProfitUnlocked ? "Click to lock profit figures" : "Click to enter password and reveal profit figures"}
        >
          <div className="flex items-center justify-between">
            <span className="text-[#D4AF37] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              Est. Net Profit {isProfitUnlocked ? <Unlock className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3 text-[#D4AF37]" />}
            </span>
            <div className="px-1.5 py-0.5 rounded-md bg-[#D4AF37] text-[#0D4F4F] font-bold text-[10px] flex items-center gap-1 shadow-2xs">
              {isProfitUnlocked ? 'Unlocked' : 'Protected'}
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif font-extrabold text-base text-emerald-300 block truncate tracking-wider">
              {isProfitUnlocked ? formatCurrency(totalNetProfit) : '••••••••'}
            </span>
            <span className="text-[9px] text-slate-300 block mt-0.5 font-semibold flex items-center gap-1">
              {isProfitUnlocked ? `Avg Margin: ${overallMargin.toFixed(1)}%` : '🔒 Click to enter password'}
            </span>
          </div>
        </div>
      </div>

      {/* DAILY TASKS DASHBOARD OVERVIEW: RED PRIORITY + RECENT TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. RED PRIORITY (URGENT / HIGH) TASKS */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-red-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-red-900 flex items-center gap-1.5">
                  <span>🚨 Urgent & High Priority Tasks</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white font-mono text-[10px] font-black">
                    {redPriorityTasks.length}
                  </span>
                </h3>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Critical actions requiring immediate attention
                </p>
              </div>
            </div>
            <Link
              href="/tasks"
              className="text-[11px] font-bold text-red-700 hover:text-red-900 flex items-center gap-0.5"
            >
              Task Manager <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {redPriorityTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto opacity-80" />
              <p className="font-semibold text-slate-600">No urgent tasks pending!</p>
              <p className="text-[10.5px]">All critical operations are up to date.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {redPriorityTasks.map((task) => {
                const statusConfig = getStatusBadgeConfig(task.computedStatus, task);
                const isUrgent = task.priority === 'urgent';
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                      isUrgent
                        ? 'bg-red-50/60 border-red-300 ring-1 ring-red-300/60'
                        : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskComplete(task.id)}
                        className="mt-0.5 w-4 h-4 rounded border border-slate-300 hover:border-emerald-600 flex items-center justify-center bg-white shrink-0 cursor-pointer"
                        title="Mark as complete"
                      >
                        {task.computedStatus === 'completed' && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                      </button>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href="/tasks"
                            className="font-bold text-xs text-slate-900 hover:text-red-700 truncate"
                          >
                            {task.title}
                          </Link>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${getPriorityBadgeConfig(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                          {task.assignedToName && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <User className="w-3 h-3 text-slate-400" />
                              {task.assignedToName}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-red-700 font-bold">
                            <Clock className="w-3 h-3 text-red-500" />
                            Due: {formatTaskDateTime(task.deadlineDateTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border shrink-0 ${statusConfig.badgeClass}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. RECENT 5 DAILY TASKS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#0D4F4F]/10 text-[#0D4F4F]">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#0D4F4F] flex items-center gap-1.5">
                  <span>Recent Daily Tasks</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#0D4F4F] text-[#D4AF37] font-mono text-[10px] font-bold">
                    {recentTasks.length}
                  </span>
                </h3>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Latest active studio & operational items
                </p>
              </div>
            </div>
            <Link
              href="/tasks"
              className="text-[11px] font-bold text-[#0D4F4F] hover:text-[#093A3A] flex items-center gap-0.5"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 space-y-1">
              <ListTodo className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No recent tasks</p>
              <Link href="/tasks" className="text-[10.5px] text-[#0D4F4F] font-bold underline">
                Create a task in Task Manager
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => {
                const statusConfig = getStatusBadgeConfig(task.computedStatus, task);
                const catConfig = TASK_CATEGORIES_CONFIG[task.category];
                const isDone = task.computedStatus === 'completed';

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                      isDone ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskComplete(task.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-[#0D4F4F] bg-white'
                        }`}
                        title={isDone ? 'Reopen task' : 'Mark as complete'}
                      >
                        {isDone && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href="/tasks"
                            className={`font-bold text-xs truncate transition-colors ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900 hover:text-[#0D4F4F]'
                            }`}
                          >
                            {task.title}
                          </Link>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${catConfig.badgeBg} ${catConfig.badgeText}`}>
                            {catConfig.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                          {task.assignedToName && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <User className="w-3 h-3 text-slate-400" />
                              {task.assignedToName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTaskDateTime(task.startDateTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border shrink-0 ${statusConfig.badgeClass}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="font-serif font-bold text-base text-[#0D4F4F]">Recent Client Quotations</h2>
            <p className="text-xs text-slate-500">Latest wedding quotations created or modified</p>
          </div>
          <Link
            href="/quotations"
            className="flex items-center gap-1 text-xs font-bold text-[#0D4F4F] hover:text-[#093A3A]"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading recent quotations...</div>
        ) : recentQuotations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No quotations found. Click &quot;New Quotation&quot; above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D4F4F]/5 text-[#0D4F4F] font-serif uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Client Name</th>
                  <th className="px-4 py-3">Events</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3">
                    <button
                      onClick={isProfitUnlocked ? lockProfit : openUnlockModal}
                      className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors cursor-pointer group uppercase font-serif"
                      title={isProfitUnlocked ? "Click to lock profit" : "Click to enter password and reveal profit"}
                    >
                      <span>Est. Profit</span>
                      {isProfitUnlocked ? (
                        <Unlock className="w-3 h-3 text-[#0D4F4F]" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-400 group-hover:text-[#0D4F4F]" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {recentQuotations.map((q) => {
                  const totalCost = q.internalAnalysis?.totalInternalCost ?? q.events.reduce((sum, evt) => {
                    return sum + evt.services.reduce((sSum, s) => sSum + (s.quantity || 1) * (s.internalCostPerUnit ?? 5000), 0);
                  }, 0);
                  const netProfit = q.payment.grandTotal - totalCost;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 block">{q.client.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{q.quotationNumber}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {q.events.map((e) => e.name).join(', ') || 'None'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {formatCurrency(q.payment.grandTotal)}
                      </td>
                      <td className="px-4 py-3.5">
                        {isProfitUnlocked ? (
                          <span className={`font-bold text-xs ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {formatCurrency(netProfit)}
                          </span>
                        ) : (
                          <button
                            onClick={openUnlockModal}
                            className="text-left group cursor-pointer"
                            title="Click to enter password and reveal profit"
                          >
                            <span className="font-bold text-xs text-slate-400 group-hover:text-[#0D4F4F] transition-colors tracking-widest">
                              ••••••••
                            </span>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDate(q.client.quotationDate)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/quotations/${q.id}/compare`}
                            className="px-2 py-1 rounded-md bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-[10px] hover:brightness-105 transition-all shadow-2xs"
                            title="Internal Profit Analysis"
                          >
                            Compare
                          </Link>
                          <Link
                            href={`/quotations/${q.id}`}
                            className="p-1 rounded text-slate-500 hover:text-[#0D4F4F]"
                            title="View Quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/quotations/new?id=${q.id}`}
                            className="p-1 rounded text-slate-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
