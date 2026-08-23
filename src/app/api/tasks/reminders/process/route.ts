import { NextResponse } from 'next/server';
import { getTasksFromDb, saveTaskToDb } from '@/lib/server-db';
import { sendPushNotificationToUser } from '@/lib/push-server';
import { formatTaskDateTime } from '@/lib/tasks-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return handleReminderProcessing();
}

export async function POST() {
  return handleReminderProcessing();
}

async function handleReminderProcessing() {
  try {
    const tasks = await getTasksFromDb();
    const now = new Date();
    const nowTime = now.getTime();
    const nowIso = now.toISOString();

    let remindersSent = 0;
    let followUpAlertsSent = 0;
    let overdueAlertsSent = 0;

    for (const task of tasks) {
      let isTaskUpdated = false;
      const assignedUserId = task.assignedToUserId || 'user-super-admin';
      const isCompleted = task.manualStatus === 'completed';

      // 1. Task Reminder Processing
      if (!isCompleted && task.reminderDateTime && !task.reminderSentAt) {
        const reminderTime = new Date(task.reminderDateTime).getTime();
        if (!isNaN(reminderTime) && nowTime >= reminderTime) {
          const deadlineFormatted = formatTaskDateTime(task.deadlineDateTime);
          const pushTitle = `Snap Service — Reminder: ${task.title}`;
          const pushBody = deadlineFormatted
            ? `Reminder for scheduled task. Deadline: ${deadlineFormatted}`
            : `Scheduled operation task reminder.`;

          await sendPushNotificationToUser(assignedUserId, {
            title: pushTitle,
            body: pushBody,
            icon: '/snap-service-logo.png',
            badge: '/icon.png',
            tag: `reminder-${task.id}`,
            data: {
              url: `/tasks?taskId=${task.id}`,
              taskId: task.id,
              type: 'reminder',
            },
          });

          task.reminderSentAt = nowIso;
          isTaskUpdated = true;
          remindersSent++;
        }
      }

      // 2. Follow-Up Alert Processing
      if (task.manualStatus === 'waiting' && task.followUpDateTime && !task.followUpAlertSentAt) {
        const followUpTime = new Date(task.followUpDateTime).getTime();
        if (!isNaN(followUpTime) && nowTime >= followUpTime) {
          const pushTitle = `⏰ Follow-up Due: ${task.title}`;
          const pushBody = `Follow-up time has arrived for this waiting task. Tap to review.`;

          await sendPushNotificationToUser(assignedUserId, {
            title: pushTitle,
            body: pushBody,
            icon: '/snap-service-logo.png',
            badge: '/icon.png',
            tag: `followup-${task.id}`,
            data: {
              url: `/tasks?taskId=${task.id}`,
              taskId: task.id,
              type: 'follow_up',
            },
          });

          task.followUpAlertSentAt = nowIso;
          isTaskUpdated = true;
          followUpAlertsSent++;
        }
      }

      // 3. Overdue Alert Processing
      if (!isCompleted && task.deadlineDateTime && !task.overdueAlertSentAt) {
        const deadlineTime = new Date(task.deadlineDateTime).getTime();
        if (!isNaN(deadlineTime) && nowTime > deadlineTime) {
          const deadlineFormatted = formatTaskDateTime(task.deadlineDateTime);
          const pushTitle = `🚨 Task Overdue: ${task.title}`;
          const pushBody = `Deadline (${deadlineFormatted}) has passed. Please take action.`;

          await sendPushNotificationToUser(assignedUserId, {
            title: pushTitle,
            body: pushBody,
            icon: '/snap-service-logo.png',
            badge: '/icon.png',
            tag: `overdue-${task.id}`,
            data: {
              url: `/tasks?taskId=${task.id}`,
              taskId: task.id,
              type: 'overdue',
            },
          });

          task.overdueAlertSentAt = nowIso;
          isTaskUpdated = true;
          overdueAlertsSent++;
        }
      }

      // Save updated task with notification dispatch timestamp to prevent duplicate notifications
      if (isTaskUpdated) {
        await saveTaskToDb(task);
      }
    }

    return NextResponse.json({
      success: true,
      processedTotal: tasks.length,
      remindersSent,
      followUpAlertsSent,
      overdueAlertsSent,
      timestamp: nowIso,
    });
  } catch (error: any) {
    console.error('API /api/tasks/reminders/process error:', error);
    return NextResponse.json({ error: 'Reminder processing error' }, { status: 500 });
  }
}
