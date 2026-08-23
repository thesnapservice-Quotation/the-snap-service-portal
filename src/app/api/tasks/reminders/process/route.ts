import { NextRequest, NextResponse } from 'next/server';
import { getTasksFromDb, saveTaskToDb } from '@/lib/server-db';
import { sendPushNotificationToUser } from '@/lib/push-server';
import { formatTaskDateTime } from '@/lib/tasks-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Validate Cron Secret for Vercel Cron and External Cron Services
 */
function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // If no CRON_SECRET is configured in environment, allow execution (with server warning)
  if (!cronSecret) {
    return true;
  }

  // 1. Check standard Authorization Header: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.replace(/^Bearer\s+/i, '') === cronSecret) {
    return true;
  }

  // 2. Check query parameter: ?secret=<CRON_SECRET> or ?key=<CRON_SECRET>
  const searchParams = request.nextUrl.searchParams;
  const querySecret = searchParams.get('secret') || searchParams.get('key');
  if (querySecret && querySecret === cronSecret) {
    return true;
  }

  // 3. Check Vercel Cron header (when triggered automatically by Vercel infrastructure)
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  if (vercelCronHeader) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  return handleCronProcessing(request);
}

export async function POST(request: NextRequest) {
  return handleCronProcessing(request);
}

async function handleCronProcessing(request: NextRequest) {
  const startTime = Date.now();
  const now = new Date();
  const nowTime = now.getTime();
  const nowIso = now.toISOString();

  console.log(`[CRON /api/tasks/reminders/process] ⏰ Automated reminder check started at ${nowIso}`);

  // 1. Security Check
  if (!isCronAuthorized(request)) {
    console.warn(`[CRON] ❌ Unauthorized reminder trigger attempt from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
    return NextResponse.json({ error: 'Unauthorized cron request. Invalid or missing secret.' }, { status: 401 });
  }

  try {
    const tasks = await getTasksFromDb();
    console.log(`[CRON] 📋 Scanning ${tasks.length} total tasks from database...`);

    let remindersSent = 0;
    let followUpAlertsSent = 0;
    let overdueAlertsSent = 0;
    let skippedCompleted = 0;
    let tasksUpdatedCount = 0;

    for (const task of tasks) {
      let isTaskUpdated = false;
      const assignedUserId = task.assignedToUserId || 'user-super-admin';
      const isCompleted = task.manualStatus === 'completed';

      // Skip completed tasks
      if (isCompleted) {
        skippedCompleted++;
        continue;
      }

      // -------------------------------------------------------------
      // 1. Task Scheduled Reminder Processing
      // -------------------------------------------------------------
      if (task.reminderDateTime && !task.reminderSentAt) {
        const reminderTime = new Date(task.reminderDateTime).getTime();

        if (!isNaN(reminderTime) && nowTime >= reminderTime) {
          console.log(`[CRON] 🔔 Triggering reminder for task: "${task.title}" (ID: ${task.id}) for user ${assignedUserId}`);

          const deadlineFormatted = formatTaskDateTime(task.deadlineDateTime);
          const clientInfo = task.clientName ? `Client: ${task.clientName}` : '';
          const priorityInfo = task.priority === 'urgent' ? '🚨 URGENT' : task.priority === 'high' ? '⚠️ High Priority' : '';

          let bodyParts = [];
          if (clientInfo) bodyParts.push(clientInfo);
          if (deadlineFormatted) bodyParts.push(`Deadline: ${deadlineFormatted}`);
          if (priorityInfo) bodyParts.push(priorityInfo);

          const pushTitle = `🔔 Snap Service Reminder: ${task.title}`;
          const pushBody = bodyParts.length > 0 ? bodyParts.join(' • ') : `Scheduled operation task reminder.`;

          const pushResult = await sendPushNotificationToUser(assignedUserId, {
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

          console.log(`[CRON] ✅ Reminder push dispatched for "${task.title}": ${pushResult.sent} device(s) received, ${pushResult.failed} failed`);

          task.reminderSentAt = nowIso;
          isTaskUpdated = true;
          remindersSent++;
        }
      }

      // -------------------------------------------------------------
      // 2. Follow-Up Alarm Processing
      // -------------------------------------------------------------
      if (task.manualStatus === 'waiting' && task.followUpDateTime && !task.followUpAlertSentAt) {
        const followUpTime = new Date(task.followUpDateTime).getTime();

        if (!isNaN(followUpTime) && nowTime >= followUpTime) {
          console.log(`[CRON] ⏰ Triggering follow-up alert for task: "${task.title}" (ID: ${task.id})`);

          const pushTitle = `⏰ Follow-up Due: ${task.title}`;
          const pushBody = task.clientName
            ? `Follow-up time has arrived for ${task.clientName}. Tap to review.`
            : `Follow-up time has arrived for this waiting task. Tap to review.`;

          const pushResult = await sendPushNotificationToUser(assignedUserId, {
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

          console.log(`[CRON] ✅ Follow-up push dispatched for "${task.title}": ${pushResult.sent} device(s) received`);

          task.followUpAlertSentAt = nowIso;
          isTaskUpdated = true;
          followUpAlertsSent++;
        }
      }

      // -------------------------------------------------------------
      // 3. Overdue Alert Processing
      // -------------------------------------------------------------
      if (!isCompleted && task.deadlineDateTime && !task.overdueAlertSentAt) {
        const deadlineTime = new Date(task.deadlineDateTime).getTime();

        if (!isNaN(deadlineTime) && nowTime > deadlineTime) {
          console.log(`[CRON] 🚨 Triggering overdue alert for task: "${task.title}" (ID: ${task.id})`);

          const deadlineFormatted = formatTaskDateTime(task.deadlineDateTime);
          const pushTitle = `🚨 Task Overdue: ${task.title}`;
          const pushBody = `Deadline (${deadlineFormatted}) has passed. Please complete or reschedule.`;

          const pushResult = await sendPushNotificationToUser(assignedUserId, {
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

          console.log(`[CRON] ✅ Overdue push dispatched for "${task.title}": ${pushResult.sent} device(s) received`);

          task.overdueAlertSentAt = nowIso;
          isTaskUpdated = true;
          overdueAlertsSent++;
        }
      }

      // Persist updated notification flags to database to guarantee 0 duplicate notifications
      if (isTaskUpdated) {
        await saveTaskToDb(task);
        tasksUpdatedCount++;
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[CRON] 🏁 Finished in ${durationMs}ms: ${remindersSent} reminders, ${followUpAlertsSent} follow-ups, ${overdueAlertsSent} overdue alerts sent.`);

    return NextResponse.json({
      success: true,
      message: 'Automated reminder check processed successfully',
      timestamp: nowIso,
      durationMs,
      metrics: {
        totalTasksScanned: tasks.length,
        skippedCompleted,
        remindersSent,
        followUpAlertsSent,
        overdueAlertsSent,
        tasksUpdatedCount,
      },
    });
  } catch (error: any) {
    console.error('[CRON] 💥 Error in /api/tasks/reminders/process:', error);
    return NextResponse.json(
      { error: 'Failed to process task reminders', details: error?.message },
      { status: 500 }
    );
  }
}
