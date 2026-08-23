'use client';

import React, { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { useQuotations } from '@/hooks/use-quotations';
import { 
  TaskItem, 
  TaskCategory, 
  TaskPriority, 
  TaskStatus 
} from '@/lib/types';
import { 
  TASK_CATEGORIES_CONFIG, 
  computeTaskStatus, 
  formatTaskDateTime,
  getStatusBadgeConfig,
  getPriorityBadgeConfig
} from '@/lib/tasks-utils';
import { DateTimePicker } from '@/components/tasks/date-time-picker';
import { 
  ListTodo, 
  Plus, 
  RefreshCw, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Hourglass, 
  CheckCircle2, 
  PlayCircle, 
  Search, 
  Filter, 
  User, 
  Building2, 
  Tag, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  Sparkles, 
  Check, 
  ChevronRight, 
  History, 
  ArrowRight,
  BookOpen,
  Film,
  Users,
  UserCheck,
  Share2
} from 'lucide-react';

export default function TasksPage() {
  const { tasks, createTask, updateTask, toggleTaskComplete, setTaskWaiting, deleteTask, refreshTasks } = useTasks();
  const { currentUser, users } = useAuth();
  const { quotations } = useQuotations();

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<string>('all'); // 'all', 'my_tasks', 'team_tasks', or TaskCategory
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'upcoming', 'due_now', 'overdue', 'waiting', 'completed'
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'this_week' | 'overdue'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [waitingModalTask, setWaitingModalTask] = useState<TaskItem | null>(null);

  // Form State for Create / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TaskCategory>('events');
  const [templateCategory, setTemplateCategory] = useState<TaskCategory>('events');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formQuotationId, setFormQuotationId] = useState('');
  const [formAssignedUserId, setFormAssignedUserId] = useState(currentUser?.id || 'user-super-admin');
  const [formStartDateTime, setFormStartDateTime] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16);
  });
  const [formDeadlineDateTime, setFormDeadlineDateTime] = useState(() => {
    const d = new Date(Date.now() + 2 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formFollowUpDateTime, setFormFollowUpDateTime] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form State for Waiting / Follow-up modal
  const [waitingFollowUpTime, setWaitingFollowUpTime] = useState(() => {
    const d = new Date(Date.now() + 4 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [waitingNotes, setWaitingNotes] = useState('');

  // Computed Tasks with Dynamic Status
  const computedTasks = useMemo(() => {
    return tasks.map((task) => ({
      ...task,
      computedStatus: computeTaskStatus(task),
    }));
  }, [tasks]);

  // Status Counts
  const counts = useMemo(() => {
    const res = {
      upcoming: 0,
      due_now: 0,
      overdue: 0,
      waiting: 0,
      completed: 0,
      total: computedTasks.length,
    };
    computedTasks.forEach((t) => {
      if (t.computedStatus in res) {
        res[t.computedStatus as keyof typeof res]++;
      }
    });
    return res;
  }, [computedTasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return computedTasks.filter((task) => {
      // Category filter
      if (categoryFilter === 'my_tasks') {
        if (task.assignedToUserId !== currentUser?.id) return false;
      } else if (categoryFilter === 'team_tasks') {
        if (task.assignedToUserId === currentUser?.id) return false;
      } else if (categoryFilter !== 'all') {
        if (task.category !== categoryFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (task.computedStatus !== statusFilter) return false;
      }

      // Time filter
      if (timeFilter === 'today') {
        const taskDate = task.startDateTime?.slice(0, 10) || task.deadlineDateTime?.slice(0, 10);
        if (taskDate !== todayStr && task.computedStatus !== 'overdue') return false;
      } else if (timeFilter === 'overdue') {
        if (task.computedStatus !== 'overdue') return false;
      }

      // Event filter
      if (eventFilter !== 'all') {
        if (task.quotationId !== eventFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchNotes = (task.notes || '').toLowerCase().includes(q);
        const matchAssignee = (task.assignedToName || '').toLowerCase().includes(q);
        const matchClient = (task.clientName || '').toLowerCase().includes(q);
        const matchQuot = (task.quotationNumber || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchAssignee && !matchClient && !matchQuot) {
          return false;
        }
      }

      return true;
    });
  }, [computedTasks, categoryFilter, statusFilter, timeFilter, eventFilter, searchQuery, currentUser?.id]);

  // Open Create Modal with clean fields
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormCategory('events');
    setFormSubCategory('');
    setFormQuotationId('');
    setFormAssignedUserId(currentUser?.id || 'user-super-admin');
    const now = new Date();
    setFormStartDateTime(now.toISOString().slice(0, 16));
    const later = new Date(Date.now() + 2 * 3600000);
    setFormDeadlineDateTime(later.toISOString().slice(0, 16));
    setFormPriority('medium');
    setFormFollowUpDateTime('');
    setFormNotes('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormCategory(task.category);
    setFormSubCategory(task.subCategory || '');
    setFormQuotationId(task.quotationId || '');
    setFormAssignedUserId(task.assignedToUserId || currentUser?.id || 'user-super-admin');
    setFormStartDateTime(task.startDateTime || '');
    setFormDeadlineDateTime(task.deadlineDateTime || '');
    setFormPriority(task.priority);
    setFormFollowUpDateTime(task.followUpDateTime || '');
    setFormNotes(task.notes || '');
    setShowCreateModal(true);
  };

  // Quick Category Template Click
  const handleSelectTemplate = (cat: TaskCategory, template: string) => {
    setFormCategory(cat);
    setFormSubCategory(template);
    setFormTitle(template);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    // Find assignee name
    const assignedUser = users.find((u) => u.id === formAssignedUserId);
    const assignedName = assignedUser ? assignedUser.name : currentUser?.name || 'Studio Admin';

    // Find linked quotation client & number
    let clientName = '';
    let quotationNumber = '';
    if (formQuotationId) {
      const q = quotations.find((quot) => quot.id === formQuotationId);
      if (q) {
        clientName = q.client?.name || '';
        quotationNumber = q.quotationNumber || '';
      }
    }

    if (editingTask) {
      await updateTask(
        {
          ...editingTask,
          title: formTitle.trim(),
          category: formCategory,
          subCategory: formSubCategory,
          quotationId: formQuotationId || undefined,
          quotationNumber: quotationNumber || undefined,
          clientName: clientName || undefined,
          assignedToUserId: formAssignedUserId,
          assignedToName: assignedName,
          startDateTime: formStartDateTime,
          deadlineDateTime: formDeadlineDateTime,
          priority: formPriority,
          followUpDateTime: formFollowUpDateTime || undefined,
          notes: formNotes.trim(),
        },
        'Task details updated'
      );
    } else {
      await createTask({
        title: formTitle.trim(),
        category: formCategory,
        subCategory: formSubCategory,
        quotationId: formQuotationId || undefined,
        quotationNumber: quotationNumber || undefined,
        clientName: clientName || undefined,
        assignedToUserId: formAssignedUserId,
        assignedToName: assignedName,
        startDateTime: formStartDateTime,
        deadlineDateTime: formDeadlineDateTime,
        priority: formPriority,
        followUpDateTime: formFollowUpDateTime || undefined,
        notes: formNotes.trim(),
      });
    }

    setShowCreateModal(false);
  };

  // Submit Waiting / Follow-up
  const handleSaveWaiting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitingModalTask) return;

    await setTaskWaiting(waitingModalTask.id, waitingFollowUpTime, waitingNotes.trim());
    setWaitingModalTask(null);
    setWaitingNotes('');
  };

  const getCategoryIcon = (cat: TaskCategory) => {
    switch (cat) {
      case 'events':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'albums':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'editing':
        return <Film className="w-3.5 h-3.5" />;
      case 'clients':
        return <Users className="w-3.5 h-3.5" />;
      case 'team':
        return <UserCheck className="w-3.5 h-3.5" />;
      case 'social_media':
        return <Share2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#0D4F4F] to-[#093A3A] text-white p-6 rounded-3xl shadow-xl border border-[#D4AF37]/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37] text-[#0D4F4F] shadow-sm">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl md:text-2xl text-[#FAF9F6] tracking-wide">
                Daily Operations & Task Manager
              </h1>
              <p className="text-xs text-[#A5C8C8] font-medium">
                Time-based operations, team assignments & live follow-up alarms
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refreshTasks()}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
            title="Refresh tasks from cloud"
          >
            <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
            <span>Sync Cloud</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0D4F4F]" />
            <span>Create New Task</span>
          </button>
        </div>
      </div>

      {/* TOP 5 TIME-BASED STATUS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Upcoming */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between shadow-2xs ${
            statusFilter === 'upcoming'
              ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">🔵 Upcoming</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{counts.upcoming}</span>
            <span className="text-[10px] text-slate-400">Scheduled</span>
          </div>
        </button>

        {/* 2. Due / Start Now */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'due_now' ? 'all' : 'due_now')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between shadow-2xs ${
            statusFilter === 'due_now'
              ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">🟠 Due / Start Now</span>
            <PlayCircle className="w-4 h-4 text-amber-600 animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{counts.due_now}</span>
            <span className="text-[10px] text-amber-800 font-semibold">Active now</span>
          </div>
        </button>

        {/* 3. Overdue */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between shadow-2xs ${
            statusFilter === 'overdue'
              ? 'bg-red-50/90 border-red-500 ring-2 ring-red-400'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">🔴 Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">{counts.overdue}</span>
            <span className="text-[10px] text-red-500 font-bold">Past deadline</span>
          </div>
        </button>

        {/* 4. Waiting / Follow-up */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'waiting' ? 'all' : 'waiting')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between shadow-2xs ${
            statusFilter === 'waiting'
              ? 'bg-yellow-50/90 border-yellow-500 ring-2 ring-yellow-400'
              : 'bg-white border-slate-200 hover:border-yellow-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-yellow-800 uppercase tracking-wider">🟡 Waiting</span>
            <Hourglass className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-yellow-700">{counts.waiting}</span>
            <span className="text-[10px] text-slate-400">Follow-up set</span>
          </div>
        </button>

        {/* 5. Completed */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between shadow-2xs ${
            statusFilter === 'completed'
              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">🟢 Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{counts.completed}</span>
            <span className="text-[10px] text-emerald-600">Done</span>
          </div>
        </button>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Category Horizontal Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-all ${
              categoryFilter === 'all'
                ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tasks ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('my_tasks')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-all ${
              categoryFilter === 'my_tasks'
                ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            👤 My Tasks
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('team_tasks')}
            className={`px-3.5 py-2 rounded-xl shrink-0 transition-all ${
              categoryFilter === 'team_tasks'
                ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            👥 Team Tasks
          </button>

          {(Object.keys(TASK_CATEGORIES_CONFIG) as TaskCategory[]).map((catKey) => {
            const config = TASK_CATEGORIES_CONFIG[catKey];
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(catKey)}
                className={`px-3.5 py-2 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                  categoryFilter === catKey
                    ? 'bg-[#0D4F4F] text-[#D4AF37] shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {getCategoryIcon(catKey)}
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Search + Event + Time */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, client, assignee, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
            />
          </div>

          {/* Event Booking Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">Event:</span>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0D4F4F]"
            >
              <option value="all">All Events & General</option>
              {quotations
                .filter((q) => q.status === 'confirmed' || q.status === 'completed')
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    #{q.quotationNumber} — {q.client.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Time Preset Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">Timeline:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0D4F4F]"
            >
              <option value="all">All Active</option>
              <option value="today">Today Only</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* TASK LIST / CARDS */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ListTodo className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-slate-700">No Tasks Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No tasks match your current filters. Create a new task or choose another category view.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#0D4F4F] text-[#D4AF37] font-bold text-xs shadow-md hover:brightness-110 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const statusConfig = getStatusBadgeConfig(task.computedStatus, task);
            const catConfig = TASK_CATEGORIES_CONFIG[task.category];
            const isDone = task.computedStatus === 'completed';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-2xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  task.computedStatus === 'overdue'
                    ? 'border-red-300 bg-red-50/10'
                    : task.computedStatus === 'due_now'
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200'
                } ${isDone ? 'opacity-70 bg-slate-50/50' : ''}`}
              >
                {/* Left Area: Checkbox + Title + Meta Badges */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Checkbox Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleTaskComplete(task.id)}
                    className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-[#0D4F4F]'
                    }`}
                    title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        onClick={() => setDetailTask(task)}
                        className={`font-bold text-sm text-slate-900 hover:text-[#0D4F4F] transition-colors cursor-pointer ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${statusConfig.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                        <span>{statusConfig.label}</span>
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] border ${getPriorityBadgeConfig(
                          task.priority
                        )}`}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Metadata Sub-Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      {/* Category Badge */}
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${catConfig.badgeBg} ${catConfig.badgeText}`}>
                        {catConfig.label}
                      </span>

                      {/* Assigned Person */}
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{task.assignedToName || 'Unassigned'}</span>
                      </span>

                      {/* Linked Event / Client */}
                      {task.clientName && (
                        <span className="flex items-center gap-1 text-[#0D4F4F] font-bold">
                          <Building2 className="w-3 h-3 text-[#D4AF37]" />
                          <span>
                            {task.quotationNumber ? `#${task.quotationNumber} ` : ''}
                            {task.clientName}
                          </span>
                        </span>
                      )}

                      {/* Start Time & Deadline */}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          Start: <strong className="text-slate-800">{formatTaskDateTime(task.startDateTime)}</strong>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>
                          Due: <strong className={task.computedStatus === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-800'}>
                            {formatTaskDateTime(task.deadlineDateTime)}
                          </strong>
                        </span>
                      </span>

                      {/* Follow-up Alarm (if waiting) */}
                      {task.manualStatus === 'waiting' && task.followUpDateTime && (
                        <span className="flex items-center gap-1 text-yellow-800 font-bold bg-yellow-100/60 px-2 py-0.5 rounded">
                          <Hourglass className="w-3 h-3 text-yellow-600" />
                          <span>Follow-up: {formatTaskDateTime(task.followUpDateTime)}</span>
                        </span>
                      )}
                    </div>

                    {/* Task Notes Snippet */}
                    {task.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action Toolbar */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  {/* Waiting Trigger Button */}
                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => {
                        setWaitingModalTask(task);
                        const d = new Date(Date.now() + 4 * 3600000);
                        setWaitingFollowUpTime(d.toISOString().slice(0, 16));
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 font-bold text-[11px] flex items-center gap-1 transition-all"
                      title="Set task to Waiting and schedule follow-up alarm"
                    >
                      <Hourglass className="w-3.5 h-3.5 text-yellow-700" />
                      <span className="hidden sm:inline">Waiting / Follow-up</span>
                    </button>
                  )}

                  {/* View Details */}
                  <button
                    type="button"
                    onClick={() => setDetailTask(task)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="View task details and audit history"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(task)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Edit task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete task "${task.title}"?`)) {
                        deleteTask(task.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: CREATE / EDIT TASK */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-[#D4AF37] space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37]">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                    {editingTask ? 'Edit Task' : 'Create New Operation Task'}
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    Assign work, set start times, deadlines, and follow-up alarms
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates Filtered by Category (Only when creating new task) */}
            {!editingTask && (
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> 1-Click Action Templates:
                  </span>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <span className="text-[10.5px] text-slate-500 font-bold">Category:</span>
                    <select
                      value={templateCategory}
                      onChange={(e) => {
                        const newCat = e.target.value as TaskCategory;
                        setTemplateCategory(newCat);
                        setFormCategory(newCat);
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#0D4F4F] focus:outline-none focus:ring-1 focus:ring-[#0D4F4F]"
                    >
                      {(Object.keys(TASK_CATEGORIES_CONFIG) as TaskCategory[]).map((catKey) => (
                        <option key={catKey} value={catKey}>
                          {TASK_CATEGORIES_CONFIG[catKey].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Templates of the Selected Category Only */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TASK_CATEGORIES_CONFIG[templateCategory].templates.map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => handleSelectTemplate(templateCategory, tpl)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                        formTitle === tpl
                          ? 'bg-[#0D4F4F] text-[#D4AF37] border-[#0D4F4F] shadow-xs ring-2 ring-[#D4AF37]/50'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-[#0D4F4F] hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      <span>{tpl}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
              {/* Task Title */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up with Photographer for upcoming event..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                  >
                    {(Object.keys(TASK_CATEGORIES_CONFIG) as TaskCategory[]).map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {TASK_CATEGORIES_CONFIG[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">🚨 Urgent Priority</option>
                  </select>
                </div>
              </div>

              {/* Assigned User & Linked Event */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Assigned To */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Assign To Team Member</label>
                  <select
                    value={formAssignedUserId}
                    onChange={(e) => setFormAssignedUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'super_admin' ? 'Owner' : 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Linked Quotation / Event */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Link to Event / Client (Optional)</label>
                  <select
                    value={formQuotationId}
                    onChange={(e) => setFormQuotationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                  >
                    <option value="">None (General Studio Task)</option>
                    {quotations
                      .filter((q) => q.status === 'confirmed' || q.status === 'completed')
                      .map((q) => (
                        <option key={q.id} value={q.id}>
                          #{q.quotationNumber} — {q.client.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Start Time & Deadline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Start Date & Time */}
                <DateTimePicker
                  label="Start Date & Time"
                  value={formStartDateTime}
                  onChange={(val) => setFormStartDateTime(val)}
                  required
                />

                {/* Deadline */}
                <DateTimePicker
                  label="Deadline"
                  value={formDeadlineDateTime}
                  onChange={(val) => setFormDeadlineDateTime(val)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Instructions & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add specific instructions, equipment lists, phone numbers, or delivery notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0D4F4F] font-bold shadow-md hover:brightness-105 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTask ? 'Update Task' : 'Save & Schedule Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SET WAITING & FOLLOW-UP ALARM */}
      {waitingModalTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#D4AF37] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-yellow-100 text-yellow-800">
                  <Hourglass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#0D4F4F]">
                    Schedule Follow-up Alarm
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    Task will remain in Waiting until follow-up time arrives
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWaitingModalTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWaiting} className="space-y-3.5 text-xs">
              <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-900">
                <strong className="block font-bold mb-0.5">{waitingModalTask.title}</strong>
                <span className="text-[10.5px] text-slate-500">
                  Assigned to: {waitingModalTask.assignedToName}
                </span>
              </div>

              {/* Follow-up DateTime */}
              <DateTimePicker
                label="Follow-up Date & Time *"
                value={waitingFollowUpTime}
                onChange={(val) => setWaitingFollowUpTime(val)}
                required
              />

              {/* Waiting Reason */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Waiting Reason / Status Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Waiting for printer to complete album binding..."
                  value={waitingNotes}
                  onChange={(e) => setWaitingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-[#0D4F4F] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWaitingModalTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37] font-bold shadow-md hover:brightness-110 flex items-center gap-1.5"
                >
                  <Hourglass className="w-4 h-4" />
                  <span>Set Waiting & Follow-up</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TASK DETAILS & AUDIT HISTORY */}
      {detailTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-[#D4AF37] space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37]">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#0D4F4F]">Task Details & History</h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    ID: {detailTask.id} • Created: {formatTaskDateTime(detailTask.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Info Summary */}
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-serif font-bold text-base text-slate-900">{detailTask.title}</h4>

              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category:</span>
                  <span className="font-bold text-slate-800 capitalize">{detailTask.category.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Priority:</span>
                  <span className="font-bold text-slate-800 capitalize">{detailTask.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned To:</span>
                  <span className="font-bold text-slate-800">{detailTask.assignedToName || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Linked Event:</span>
                  <span className="font-bold text-[#0D4F4F]">
                    {detailTask.clientName ? `${detailTask.quotationNumber ? `#${detailTask.quotationNumber} ` : ''}${detailTask.clientName}` : 'General Task'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Start Time:</span>
                  <span className="font-bold text-slate-800">{formatTaskDateTime(detailTask.startDateTime)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Deadline:</span>
                  <span className="font-bold text-slate-800">{formatTaskDateTime(detailTask.deadlineDateTime)}</span>
                </div>
              </div>

              {detailTask.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Notes:</span>
                  <p className="text-slate-700 whitespace-pre-line bg-white p-2.5 rounded-xl border border-slate-200 font-medium">
                    {detailTask.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#0D4F4F]" /> Audit Trail & History Log
              </h5>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(detailTask.history || []).map((hist, idx) => (
                  <div key={hist.id || idx} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-[#0D4F4F] text-[#D4AF37] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{hist.action}</span>
                        <span className="text-[9.5px] text-slate-400">{formatTaskDateTime(hist.timestamp)}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500">by {hist.userName}</p>
                      {hist.details && <p className="text-[10px] text-slate-400 italic mt-0.5">{hist.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  toggleTaskComplete(detailTask.id);
                  setDetailTask(null);
                }}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 ${
                  detailTask.manualStatus === 'completed'
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-emerald-700 text-white hover:bg-emerald-800'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{detailTask.manualStatus === 'completed' ? 'Reopen Task' : 'Mark as Completed'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const t = detailTask;
                    setDetailTask(null);
                    handleOpenEditModal(t);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTask(null)}
                  className="px-4 py-2 rounded-xl bg-[#0D4F4F] text-[#D4AF37] font-bold hover:brightness-110"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
