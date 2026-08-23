import { TaskItem, TaskCategory, TaskPriority, TaskStatus } from './types';

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

/**
 * Real-time dynamic time-based status calculator:
 * 1. Completed -> completed
 * 2. Waiting -> If follow-up time reached -> due_now (follow-up due); else waiting
 * 3. Before Start -> upcoming
 * 4. Start <= Now <= Deadline -> due_now
 * 5. Past Deadline -> overdue
 */
export function computeTaskStatus(task: TaskItem): TaskStatus {
  if (task.manualStatus === 'completed') {
    return 'completed';
  }

  const now = new Date().getTime();

  // If manually set to waiting, check if follow-up time is due
  if (task.manualStatus === 'waiting') {
    if (task.followUpDateTime) {
      const followUpTime = new Date(task.followUpDateTime).getTime();
      if (!isNaN(followUpTime) && now >= followUpTime) {
        return 'due_now'; // Follow-up time has arrived!
      }
    }
    return 'waiting';
  }

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

export function getStatusBadgeConfig(status: TaskStatus) {
  switch (status) {
    case 'upcoming':
      return {
        label: 'Upcoming',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
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
        badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-300',
        dotColor: 'bg-yellow-500',
        icon: 'Hourglass',
      };
    case 'completed':
      return {
        label: 'Completed',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
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
