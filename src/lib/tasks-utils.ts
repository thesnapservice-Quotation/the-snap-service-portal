import { TaskItem, TaskCategory, TaskPriority, TaskStatus, TaskReminderTiming } from './types';

export interface CategoryMeta {
  id: TaskCategory;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: string;
  templates: string[];
}

export const TASK_CATEGORIES_CONFIG: Record<TaskCategory, CategoryMeta> = {
  events: {
    id: 'events',
    label: 'Events',
    color: '#0D4F4F',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-[#0D4F4F]',
    badgeBorder: 'border-[#0D4F4F]/30',
    iconName: 'Calendar',
    templates: [
      'Prepare team for event',
      'Contact specific photographer',
      'Follow up with photographer/videographer',
      'Assign event team',
      'Prepare gear',
      'Share event details with team',
    ],
  },
  albums: {
    id: 'albums',
    label: 'Albums',
    color: '#D4AF37',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    iconName: 'BookOpen',
    templates: [
      'Send album for designing',
      'Get design update',
      'Request design changes',
      'Send album for printing',
      'Follow up with printer',
      'Receive album',
      'Send album to client through InDrive',
    ],
  },
  editing: {
    id: 'editing',
    label: 'Video & Photo Editing',
    color: '#3B82F6',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-900',
    badgeBorder: 'border-blue-300',
    iconName: 'Film',
    templates: [
      'Assign editing',
      'Get editing update',
      'Send client changes',
      'Follow up on revisions',
      'Verify final edit',
      'Final delivery',
    ],
  },
  clients: {
    id: 'clients',
    label: 'Clients',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
    iconName: 'Users',
    templates: [
      'Call client',
      'Client follow-up',
      'Confirm event details',
      'Get approval',
      'Payment reminder',
    ],
  },
  team: {
    id: 'team',
    label: 'Team',
    color: '#EC4899',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-900',
    badgeBorder: 'border-pink-300',
    iconName: 'UserCheck',
    templates: [
      'Assign work',
      'Follow up on assigned work',
      'Check progress',
      'Verify completed work',
    ],
  },
  social_media: {
    id: 'social_media',
    label: 'Social Media',
    color: '#F97316',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300',
    iconName: 'Share2',
    templates: [
      'Send post for editing/design',
      'Prepare caption',
      'Schedule post',
      'Publish post',
      'Send reel for editing',
      'Follow up on content',
    ],
  },
};

export function isFollowUpDue(task: TaskItem): boolean {
  if (task.manualStatus !== 'waiting' || !task.followUpDateTime) return false;
  const t = new Date(task.followUpDateTime).getTime();
  return !isNaN(t) && new Date().getTime() >= t;
}

/**
 * Real-time dynamic time-based status calculator:
 * 1. Completed -> completed
 * 2. Waiting -> waiting (with follow-up due alert flag)
 * 3. Before Start -> upcoming
 * 4. Start <= Now <= Deadline -> due_now
 * 5. Past Deadline -> overdue
 */
export function computeTaskStatus(task: TaskItem): TaskStatus {
  if (task.manualStatus === 'completed') {
    return 'completed';
  }

  // If manually set to waiting, always remain in waiting
  if (task.manualStatus === 'waiting') {
    return 'waiting';
  }

  const now = new Date().getTime();
  const startTime = task.startDateTime ? new Date(task.startDateTime).getTime() : 0;
  const deadlineTime = task.deadlineDateTime ? new Date(task.deadlineDateTime).getTime() : 0;

  if (deadlineTime && now > deadlineTime) {
    return 'overdue';
  }

  if (startTime && now < startTime) {
    return 'upcoming';
  }

  return 'due_now';
}

export function formatTaskDateTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function getStatusBadgeConfig(status: TaskStatus, task?: TaskItem) {
  if (status === 'waiting' && task && isFollowUpDue(task)) {
    return {
      label: '🔔 Follow-up Due Now!',
      badgeClass: 'bg-yellow-100 text-yellow-950 border-yellow-400 font-extrabold animate-pulse',
      dotColor: 'bg-amber-600',
      icon: 'Hourglass',
    };
  }

  switch (status) {
    case 'upcoming':
      return {
        label: 'Upcoming',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
        dotColor: 'bg-blue-500',
        icon: 'Clock',
      };
    case 'due_now':
      return {
        label: 'Due / Start Now',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold animate-pulse',
        dotColor: 'bg-amber-500',
        icon: 'PlayCircle',
      };
    case 'overdue':
      return {
        label: 'Overdue',
        badgeClass: 'bg-red-50 text-red-700 border-red-300 font-extrabold',
        dotColor: 'bg-red-600',
        icon: 'AlertTriangle',
      };
    case 'waiting':
      return {
        label: 'Waiting / Follow-up',
        badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-300 font-bold',
        dotColor: 'bg-yellow-500',
        icon: 'Hourglass',
      };
    case 'completed':
      return {
        label: 'Completed',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
        dotColor: 'bg-emerald-600',
        icon: 'CheckCircle2',
      };
  }
}

export function getPriorityBadgeConfig(priority: TaskPriority) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-300 font-extrabold uppercase';
    case 'high':
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    case 'medium':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low':
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function calculateReminderTimestamp(
  startStr: string,
  deadlineStr: string,
  timing: TaskReminderTiming,
  customVal?: string
): string {
  if (timing === 'none') return '';
  if (timing === 'custom') return customVal || '';

  const startDate = startStr ? new Date(startStr) : null;
  const deadlineDate = deadlineStr ? new Date(deadlineStr) : null;
  const startTime = startDate && !isNaN(startDate.getTime()) ? startDate.getTime() : 0;
  const deadlineTime = deadlineDate && !isNaN(deadlineDate.getTime()) ? deadlineDate.getTime() : 0;

  switch (timing) {
    case 'at_start':
      return startStr || '';
    case '15_min_before':
    case '15_min_before_start':
      return startTime ? new Date(startTime - 15 * 60000).toISOString().slice(0, 16) : '';
    case '30_min_before':
    case '30_min_before_start':
      return startTime ? new Date(startTime - 30 * 60000).toISOString().slice(0, 16) : '';
    case '1_hour_before':
    case '1_hour_before_start':
      return startTime ? new Date(startTime - 60 * 60000).toISOString().slice(0, 16) : '';
    case '30_min_before_deadline':
      return deadlineTime ? new Date(deadlineTime - 30 * 60000).toISOString().slice(0, 16) : '';
    case '1_hour_before_deadline':
      return deadlineTime ? new Date(deadlineTime - 60 * 60000).toISOString().slice(0, 16) : '';
    case '2_hours_before_deadline':
      return deadlineTime ? new Date(deadlineTime - 120 * 60000).toISOString().slice(0, 16) : '';
    case 'halfway':
      if (startTime && deadlineTime && deadlineTime > startTime) {
        const mid = startTime + (deadlineTime - startTime) / 2;
        return new Date(mid).toISOString().slice(0, 16);
      }
      return startTime ? new Date(startTime).toISOString().slice(0, 16) : '';
    default:
      return '';
  }
}

export function getReminderTimingLabel(timing: TaskReminderTiming): string {
  switch (timing) {
    case '1_hour_before_deadline':
      return '⏰ 1 Hour Before Deadline';
    case '2_hours_before_deadline':
      return '⏳ 2 Hours Before Deadline';
    case '30_min_before_deadline':
      return '🚨 30 Mins Before Deadline';
    case 'halfway':
      return '⏱️ Midway / Half-Time Check';
    case 'at_start':
      return '🔔 At Start Time';
    case '15_min_before':
    case '15_min_before_start':
      return '⚡ 15 Mins Before Start';
    case '30_min_before':
    case '30_min_before_start':
      return '⌛ 30 Mins Before Start';
    case '1_hour_before':
    case '1_hour_before_start':
      return '🕒 1 Hour Before Start';
    case 'custom':
      return '📅 Custom Date & Time';
    default:
      return 'Notification Reminder';
  }
}

