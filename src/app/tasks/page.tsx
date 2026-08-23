'use client';

import React, { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { useQuotations } from '@/hooks/use-quotations';
import { 
  TaskItem, 
  TaskCategory, 
  TaskPriority, 
  TaskStatus,
  TaskReminderTiming,
  TaskReminderItem
} from '@/lib/types';
import { 
  TASK_CATEGORIES_CONFIG, 
  computeTaskStatus, 
  formatTaskDateTime,
  getStatusBadgeConfig,
  getPriorityBadgeConfig,
  calculateReminderTimestamp,
  getReminderTimingLabel
} from '@/lib/tasks-utils';
import { DateTimePicker } from '@/components/tasks/date-time-picker';
import { usePushNotifications } from '@/hooks/use-push-notifications';
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
  Share2,
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  Save
} from 'lucide-react';

export default function TasksPage() {
  const { tasks, createTask, updateTask, toggleTaskComplete, setTaskWaiting, deleteTask, refreshTasks } = useTasks();
  const { currentUser, users } = useAuth();
  const { quotations } = useQuotations();
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    subscribe: subscribePush,
    sendTestNotification,
    triggerReminderCheck,
  } = usePushNotifications();

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
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);

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
  const [formReminders, setFormReminders] = useState<TaskReminderItem[]>([]);
  const [formNotes, setFormNotes] = useState('');

  // Form State for Waiting / Follow-up modal
  const [waitingFollowUpTime, setWaitingFollowUpTime] = useState(() => {
    const d = new Date(Date.now() + 4 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [waitingNotes, setWaitingNotes] = useState('');

  // Auto update reminders when start/deadline changes
  const handleStartDateTimeChange = (newStart: string) => {
    setFormStartDateTime(newStart);
    setFormReminders((prev) =>
      prev.map((r) => {
        if (r.timing === 'custom') return r;
        return {
          ...r,
          reminderDateTime: calculateReminderTimestamp(newStart, formDeadlineDateTime, r.timing),
        };
      })
    );
  };

  const handleDeadlineDateTimeChange = (newDeadline: string) => {
    setFormDeadlineDateTime(newDeadline);
    setFormReminders((prev) =>
      prev.map((r) => {
        if (r.timing === 'custom') return r;
        return {
          ...r,
          reminderDateTime: calculateReminderTimestamp(formStartDateTime, newDeadline, r.timing),
        };
      })
    );
  };

  const addReminderPreset = (timing: TaskReminderTiming = '15_min_before_start') => {
    const calcTime = calculateReminderTimestamp(formStartDateTime, formDeadlineDateTime, timing);
    const newRem: TaskReminderItem = {
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timing,
      reminderDateTime: calcTime || formStartDateTime,
    };
    setFormReminders((prev) => [...prev, newRem]);
  };

  const updateReminderItem = (id: string, updates: Partial<TaskReminderItem>) => {
    setFormReminders((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        if (updates.timing && updates.timing !== 'custom') {
          updated.reminderDateTime = calculateReminderTimestamp(
            formStartDateTime,
            formDeadlineDateTime,
            updates.timing
          );
        }
        return updated;
      })
    );
  };

  const removeReminderItem = (id: string) => {
    setFormReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Open Create Modal with clean fields
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormCategory('events');
    setTemplateCategory('events');
    setFormSubCategory('');
    setFormQuotationId('');
    setFormAssignedUserId(currentUser?.id || 'user-super-admin');
    const now = new Date();
    const startIso = now.toISOString().slice(0, 16);
    const later = new Date(Date.now() + 2 * 3600000);
    const deadlineIso = later.toISOString().slice(0, 16);
    setFormStartDateTime(startIso);
    setFormDeadlineDateTime(deadlineIso);
    setFormPriority('medium');
    setFormFollowUpDateTime('');

    // Standard Automatic Default Checkpoints for Every Task:
    // 1. Midway Progress Check (50% of task duration)
    // 2. 1 Hour Before Deadline
    // 3. At Deadline / End Time
    const defaultReminders: TaskReminderItem[] = [
      {
        id: `rem-mid-${Date.now()}-1`,
        timing: 'halfway',
        reminderDateTime: calculateReminderTimestamp(startIso, deadlineIso, 'halfway'),
      },
      {
        id: `rem-1h-${Date.now()}-2`,
        timing: '1_hour_before_deadline',
        reminderDateTime: calculateReminderTimestamp(startIso, deadlineIso, '1_hour_before_deadline'),
      },
      {
        id: `rem-end-${Date.now()}-3`,
        timing: 'at_deadline',
        reminderDateTime: calculateReminderTimestamp(startIso, deadlineIso, 'at_deadline'),
      },
    ];
    setFormReminders(defaultReminders);
    setFormNotes('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormCategory(task.category);
    setTemplateCategory(task.category);
    setFormSubCategory(task.subCategory || '');
    setFormQuotationId(task.quotationId || '');
    setFormAssignedUserId(task.assignedToUserId || currentUser?.id || 'user-super-admin');
    setFormStartDateTime(task.startDateTime || '');
    setFormDeadlineDateTime(task.deadlineDateTime || '');
    setFormPriority(task.priority);
    setFormFollowUpDateTime(task.followUpDateTime || '');

    if (Array.isArray(task.reminders) && task.reminders.length > 0) {
      setFormReminders(task.reminders);
    } else if (task.reminderDateTime) {
      setFormReminders([
        {
          id: `rem-legacy-${Date.now()}`,
          timing: task.reminderTiming || 'custom',
          reminderDateTime: task.reminderDateTime,
          sentAt: task.reminderSentAt,
        },
      ]);
    } else {
      setFormReminders([]);
    }

    setFormNotes(task.notes || '');
    setShowCreateModal(true);
  };

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

  // Quick Category Template Click
  const handleSelectTemplate = (cat: TaskCategory, template: string) => {
    setFormCategory(cat);
    setFormSubCategory(template);
    setFormTitle(template);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || isSavingTask) return;

    setIsSavingTask(true);

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

    const titleToSave = formTitle.trim();
    const catToSave = formCategory;
    const subCatToSave = formSubCategory;
    const quotIdToSave = formQuotationId || undefined;
    const startDtToSave = formStartDateTime;
    const deadlineDtToSave = formDeadlineDateTime;
    const priorityToSave = formPriority;
    const followUpDtToSave = formFollowUpDateTime || undefined;
    const remindersToSave = [...formReminders];
    const notesToSave = formNotes.trim();
    const assignedUserIdToSave = formAssignedUserId;
    const editing = editingTask;

    // Immediately close modal so UI response is instant and blocks double clicks
    setShowCreateModal(false);

    try {
      if (editing) {
        await updateTask(
          {
            ...editing,
            title: titleToSave,
            category: catToSave,
            subCategory: subCatToSave,
            quotationId: quotIdToSave,
            quotationNumber: quotationNumber || undefined,
            clientName: clientName || undefined,
            assignedToUserId: assignedUserIdToSave,
            assignedToName: assignedName,
            startDateTime: startDtToSave,
            deadlineDateTime: deadlineDtToSave,
            priority: priorityToSave,
            followUpDateTime: followUpDtToSave,
            reminders: remindersToSave,
            reminderTiming: remindersToSave[0]?.timing || undefined,
            reminderDateTime: remindersToSave[0]?.reminderDateTime || undefined,
            notes: notesToSave,
          },
          'Task details updated'
        );
      } else {
        await createTask({
          title: titleToSave,
          category: catToSave,
          subCategory: subCatToSave,
          quotationId: quotIdToSave,
          quotationNumber: quotationNumber || undefined,
          clientName: clientName || undefined,
          assignedToUserId: assignedUserIdToSave,
          assignedToName: assignedName,
          startDateTime: startDtToSave,
          deadlineDateTime: deadlineDtToSave,
          priority: priorityToSave,
          followUpDateTime: followUpDtToSave,
          reminders: remindersToSave,
          reminderTiming: remindersToSave[0]?.timing || undefined,
          reminderDateTime: remindersToSave[0]?.reminderDateTime || undefined,
          notes: notesToSave,
        });

        // Instant Push Notification upon Task Generation (non-blocking)
        try {
          const deadlineFormatted = formatTaskDateTime(deadlineDtToSave);
          const priorityLabel = priorityToSave === 'urgent' ? '🚨 URGENT' : priorityToSave === 'high' ? '⚠️ High' : '';
          const bodyText = [
            `Deadline: ${deadlineFormatted}`,
            clientName ? `Client: ${clientName}` : '',
            priorityLabel,
          ].filter(Boolean).join(' • ');

          fetch('/api/notifications/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: assignedUserIdToSave,
              userName: assignedName,
              title: `✨ New Task Assigned: ${titleToSave}`,
              body: bodyText || `New studio task assigned. Tap to view.`,
              url: '/tasks',
              type: 'new_task',
            }),
          }).catch(() => {});
        } catch {}
      }

      triggerReminderCheck();
    } finally {
      setIsSavingTask(false);
    }
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
    <div className="space-y-5 max-w-7xl mx-auto pb-16 font-sans">
      {/* MINIMAL HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Tasks & Operations
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
              {counts.total}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Daily studio schedules, team assignments, and automatic push reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refreshTasks()}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Refresh tasks from cloud"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-[#0D4F4F] hover:bg-[#093A3A] text-white font-medium text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* MINIMAL PUSH NOTIFICATION BANNER */}
      {isPushSupported && (
        <div className="bg-slate-50/80 rounded-xl px-4 py-2.5 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${isPushSubscribed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-medium text-slate-700">
              {isPushSubscribed
                ? 'Push reminders active on this device'
                : 'Push reminders are not enabled on this browser'}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isPushSubscribed ? (
              <button
                type="button"
                onClick={async () => {
                  setTestPushStatus('Sending...');
                  const res = await sendTestNotification();
                  setTestPushStatus(res.message || 'Sent ✓');
                  setTimeout(() => setTestPushStatus(null), 3000);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3 h-3 text-slate-400" />
                <span>{testPushStatus || 'Test Push'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={pushLoading}
                onClick={async () => {
                  const res = await subscribePush();
                  if (!res.success && res.error) {
                    alert(res.error);
                  }
                }}
                className="px-3 py-1 rounded-lg bg-[#0D4F4F] text-[#D4AF37] font-medium text-[11px] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Bell className="w-3 h-3" />
                <span>{pushLoading ? 'Enabling...' : 'Enable Push'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MINIMAL STATUS METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* 1. Upcoming */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
            statusFilter === 'upcoming'
              ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Upcoming</span>
            <span className="text-lg font-bold text-blue-700">{counts.upcoming}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* 2. Due Now */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'due_now' ? 'all' : 'due_now')}
          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
            statusFilter === 'due_now'
              ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Due Now</span>
            <span className="text-lg font-bold text-amber-700">{counts.due_now}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </button>

        {/* 3. Overdue */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
            statusFilter === 'overdue'
              ? 'bg-red-50/80 border-red-300 ring-1 ring-red-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Overdue</span>
            <span className="text-lg font-bold text-red-600">{counts.overdue}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* 4. Waiting */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'waiting' ? 'all' : 'waiting')}
          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
            statusFilter === 'waiting'
              ? 'bg-yellow-50/80 border-yellow-300 ring-1 ring-yellow-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Waiting</span>
            <span className="text-lg font-bold text-yellow-700">{counts.waiting}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
        </button>

        {/* 5. Completed */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
            statusFilter === 'completed'
              ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Completed</span>
            <span className="text-lg font-bold text-emerald-700">{counts.completed}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
        </button>
      </div>

      {/* MINIMAL FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('my_tasks')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors ${
              categoryFilter === 'my_tasks'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👤 My Tasks
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('team_tasks')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors ${
              categoryFilter === 'team_tasks'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
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
                className={`px-3 py-1.5 rounded-lg shrink-0 font-medium transition-colors flex items-center gap-1.5 ${
                  categoryFilter === catKey
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {getCategoryIcon(catKey)}
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Search + Event + Time */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, client, assignee, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Event Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">All Events</option>
              {quotations
                .filter((q) => q.status === 'confirmed' || q.status === 'completed')
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    #{q.quotationNumber} — {q.client.name}
                  </option>
                ))}
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* MINIMAL TASK LIST / CARDS */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200 space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ListTodo className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-700">No Tasks Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No tasks match your current filters. Create a new task to get started.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-1 px-4 py-2 rounded-xl bg-[#0D4F4F] text-white font-medium text-xs shadow-xs hover:bg-[#093A3A] transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
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
                className={`bg-white rounded-xl p-3.5 sm:p-4 border transition-all shadow-2xs hover:border-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  task.computedStatus === 'overdue'
                    ? 'border-red-200 bg-red-50/20'
                    : task.computedStatus === 'due_now'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                } ${isDone ? 'opacity-60 bg-slate-50' : ''}`}
              >
                {/* Left Area: Checkbox + Title + Metadata */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Checkbox Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleTaskComplete(task.id)}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-slate-500'
                    }`}
                    title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        onClick={() => setDetailTask(task)}
                        className={`font-semibold text-xs sm:text-sm text-slate-900 hover:text-[#0D4F4F] transition-colors cursor-pointer ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-medium border flex items-center gap-1 shrink-0 ${statusConfig.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                        <span>{statusConfig.label}</span>
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-medium border uppercase ${getPriorityBadgeConfig(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* Metadata Line */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="text-slate-600 font-medium">
                        {catConfig.label}
                      </span>

                      <span className="text-slate-300">•</span>
                      <span>{task.assignedToName || 'Unassigned'}</span>

                      {task.clientName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-700 font-medium">
                            {task.quotationNumber ? `#${task.quotationNumber} ` : ''}
                            {task.clientName}
                          </span>
                        </>
                      )}

                      <span className="text-slate-300">•</span>
                      <span>
                        Due: <strong className={task.computedStatus === 'overdue' ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                          {formatTaskDateTime(task.deadlineDateTime)}
                        </strong>
                      </span>

                      {task.manualStatus === 'waiting' && task.followUpDateTime && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-yellow-800 font-medium bg-yellow-100/70 px-1.5 py-0.2 rounded text-[10.5px]">
                            Follow-up: {formatTaskDateTime(task.followUpDateTime)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Task Notes Snippet */}
                    {task.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic pt-0.5">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action Toolbar */}
                <div className="flex items-center gap-1 self-end md:self-center shrink-0">
                  {/* Waiting Trigger Button */}
                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => {
                        setWaitingModalTask(task);
                        const d = new Date(Date.now() + 4 * 3600000);
                        setWaitingFollowUpTime(d.toISOString().slice(0, 16));
                      }}
                      className="px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Set task to Waiting and schedule follow-up alarm"
                    >
                      <Hourglass className="w-3 h-3 text-amber-600" />
                      <span className="hidden sm:inline">Waiting</span>
                    </button>
                  )}

                  {/* View Details */}
                  <button
                    type="button"
                    onClick={() => setDetailTask(task)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                    title="View task details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(task)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                    title="Edit task"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete task "${task.title}"?`)) {
                        deleteTask(task.id);
                      }
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: CREATE / EDIT TASK */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-[#0D4F4F]">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                    {editingTask ? 'Edit Task' : 'New Operation Task'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Schedule start times, deadlines, and multi-reminder push alerts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates (Only when creating new task) */}
            {!editingTask && (
              <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <span className="text-[10.5px] font-semibold text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Quick Templates:
                  </span>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <select
                      value={templateCategory}
                      onChange={(e) => {
                        const newCat = e.target.value as TaskCategory;
                        setTemplateCategory(newCat);
                        setFormCategory(newCat);
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:outline-none"
                    >
                      {(Object.keys(TASK_CATEGORIES_CONFIG) as TaskCategory[]).map((catKey) => (
                        <option key={catKey} value={catKey}>
                          {TASK_CATEGORIES_CONFIG[catKey].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Templates List */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {TASK_CATEGORIES_CONFIG[templateCategory].templates.map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => handleSelectTemplate(templateCategory, tpl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-normal border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                        formTitle === tpl
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <span>{tpl}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
              {/* Task Title */}
              <div className="space-y-1">
                <label className="block font-medium text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up with Photographer for upcoming event..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="block font-medium text-slate-700">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-800 focus:bg-white focus:outline-none"
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
                  <label className="block font-medium text-slate-700">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none"
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
                  <label className="block font-medium text-slate-700">Assign To Team Member</label>
                  <select
                    value={formAssignedUserId}
                    onChange={(e) => setFormAssignedUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-800 focus:bg-white focus:outline-none"
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
                  <label className="block font-medium text-slate-700">Link Event (Optional)</label>
                  <select
                    value={formQuotationId}
                    onChange={(e) => setFormQuotationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-800 focus:bg-white focus:outline-none"
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
                <DateTimePicker
                  label="Start Date & Time"
                  value={formStartDateTime}
                  onChange={(val) => handleStartDateTimeChange(val)}
                  required
                />

                <DateTimePicker
                  label="Deadline"
                  value={formDeadlineDateTime}
                  onChange={(val) => handleDeadlineDateTimeChange(val)}
                  required
                />
              </div>

              {/* Push Notification Reminders Container */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                {/* Header matching user's image */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#0D4F4F]" />
                    <label className="font-bold text-slate-800 text-xs tracking-tight">
                      Push Notification Reminder
                    </label>
                  </div>

                  {/* Top + Add Button */}
                  <button
                    type="button"
                    onClick={() => addReminderPreset('15_min_before_start')}
                    className="px-2.5 py-1 rounded-lg bg-[#0D4F4F] text-[#D4AF37] hover:bg-[#093A3A] text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Reminder</span>
                  </button>
                </div>

                <div className="text-[10.5px] text-slate-500 font-medium -mt-1">
                  Delivered to assigned user's phone &amp; laptop
                </div>

                {/* Reminder Boxes List */}
                {formReminders.length === 0 ? (
                  <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No reminder boxes. Click <strong>+ Add Reminder</strong> to set an alert.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {formReminders.map((rem, idx) => {
                      const isSent = !!rem.sentAt;
                      return (
                        <div
                          key={rem.id}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                        >
                          {/* Left Box: Dropdown Selector */}
                          <div className="flex-1 min-w-0">
                            <select
                              value={rem.timing}
                              onChange={(e) => updateReminderItem(rem.id, { timing: e.target.value as TaskReminderTiming })}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0D4F4F] transition-colors cursor-pointer"
                            >
                              <optgroup label="⚡ Start Time Reminders">
                                <option value="15_min_before_start">⚡ 15 Minutes Before Start</option>
                                <option value="30_min_before_start">⌛ 30 Minutes Before Start</option>
                                <option value="1_hour_before_start">🕒 1 Hour Before Start</option>
                                <option value="at_start">🔔 At Start Time</option>
                              </optgroup>
                              <optgroup label="⏰ Deadline & End Time Reminders">
                                <option value="1_hour_before_deadline">⏰ 1 Hour Before Deadline</option>
                                <option value="30_min_before_deadline">🚨 30 Mins Before Deadline</option>
                                <option value="2_hours_before_deadline">⏳ 2 Hours Before Deadline</option>
                                <option value="at_deadline">🏁 At Deadline / Task End Time</option>
                              </optgroup>
                              <optgroup label="⏱️ Progress Checkpoints">
                                <option value="halfway">⏱️ Midway / Halfway Progress Check</option>
                              </optgroup>
                              <optgroup label="📅 Custom">
                                <option value="custom">📅 Custom Date &amp; Time...</option>
                              </optgroup>
                            </select>
                          </div>

                          {/* Right Box: Scheduled Time Display OR Custom DateTimePicker */}
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            {rem.timing === 'custom' ? (
                              <div className="w-full">
                                <DateTimePicker
                                  value={rem.reminderDateTime}
                                  onChange={(val) => updateReminderItem(rem.id, { reminderDateTime: val })}
                                />
                              </div>
                            ) : (
                              <div className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">
                                  Scheduled for: <strong className="font-semibold text-slate-700">{formatTaskDateTime(rem.reminderDateTime)}</strong>
                                </span>
                              </div>
                            )}

                            {/* Row Actions (+ and Delete) */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* In-row + button */}
                              <button
                                type="button"
                                onClick={() => addReminderPreset('15_min_before_start')}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-[#0D4F4F] hover:text-[#D4AF37] text-slate-600 transition-all cursor-pointer"
                                title="Add another reminder box"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                              {/* Delete button (if more than 1 or not sent) */}
                              {formReminders.length > 1 && !isSent && (
                                <button
                                  type="button"
                                  onClick={() => removeReminderItem(rem.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                  title="Delete this reminder box"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}

                              {isSent && (
                                <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                  Sent ✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom + Add Another Reminder Box Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => addReminderPreset('15_min_before_start')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-dashed border-[#0D4F4F]/40 hover:border-[#0D4F4F] text-[#0D4F4F] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4 text-[#D4AF37]" />
                    <span>+ Add Another Reminder Box</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block font-medium text-slate-700">Instructions & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add specific instructions or notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTask}
                  className={`px-5 py-2 rounded-xl bg-[#0D4F4F] hover:bg-[#093A3A] text-white font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSavingTask ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isSavingTask ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WAITING & FOLLOW-UP SCHEDULER */}
      {waitingModalTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Hourglass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                    Schedule Follow-up Alarm
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Task will remain in Waiting until follow-up time arrives
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWaitingModalTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWaiting} className="space-y-3.5 text-xs">
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                <strong className="block font-medium mb-0.5">{waitingModalTask.title}</strong>
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
                <label className="block font-medium text-slate-700">Waiting Reason / Status Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Waiting for printer to complete album binding..."
                  value={waitingNotes}
                  onChange={(e) => setWaitingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-normal focus:bg-white focus:border-slate-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWaitingModalTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D4F4F] hover:bg-[#093A3A] text-white font-medium shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Hourglass className="w-4 h-4 text-[#D4AF37]" />
                  <span>Set Waiting</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TASK DETAILS & AUDIT HISTORY */}
      {detailTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900">Task Details & History</h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Created: {formatTaskDateTime(detailTask.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Info Summary */}
            <div className="space-y-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
              <h4 className="font-semibold text-sm text-slate-900">{detailTask.title}</h4>

              <div className="grid grid-cols-2 gap-2.5 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Category</span>
                  <span className="font-medium text-slate-800 capitalize">{detailTask.category.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Priority</span>
                  <span className="font-medium text-slate-800 capitalize">{detailTask.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Assigned To</span>
                  <span className="font-medium text-slate-800">{detailTask.assignedToName || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Linked Event</span>
                  <span className="font-medium text-slate-800">
                    {detailTask.clientName ? `${detailTask.quotationNumber ? `#${detailTask.quotationNumber} ` : ''}${detailTask.clientName}` : 'General Task'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Start Time</span>
                  <span className="font-medium text-slate-800">{formatTaskDateTime(detailTask.startDateTime)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Deadline</span>
                  <span className="font-medium text-slate-800">{formatTaskDateTime(detailTask.deadlineDateTime)}</span>
                </div>
              </div>

              {/* Scheduled Reminders */}
              {Array.isArray(detailTask.reminders) && detailTask.reminders.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-[#0D4F4F]" /> Scheduled Push Reminders:
                  </span>
                  <div className="space-y-1.5">
                    {detailTask.reminders.map((rem, idx) => (
                      <div key={rem.id || idx} className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] flex items-center justify-between">
                        <span className="font-bold text-slate-700">{getReminderTimingLabel(rem.timing)}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-500">{formatTaskDateTime(rem.reminderDateTime)}</span>
                          {rem.sentAt ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                              Delivered ✓
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
