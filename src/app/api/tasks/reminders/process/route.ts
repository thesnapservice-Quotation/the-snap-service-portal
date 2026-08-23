import { NextRequest, NextResponse } from 'next/server';
import { getTasksFromDb, saveTaskToDb, getDeviceSubscriptionsFromDb, getHourlyDigestTracker, setHourlyDigestTracker } from '@/lib/server-db';
import { sendPushNotificationToUser } from '@/lib/push-server';
import { formatTaskDateTime } from '@/lib/tasks-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Safely parse a task date/time string into a Unix epoch timestamp (milliseconds).
 * Handles:
 * 1. Full ISO strings: '2026-08-23T07:45:00.000Z'
 * 2. ISO with offset: '2026-08-23T07:45:00+05:00'
 * 3. Local format: '2026-08-23T07:45' (Appends PKT +05:00 offset for accurate UTC conversion on Vercel)
 */
function parseTaskTimestamp(dateStr?: string, defaultUtcOffset = '+05:00'): number {
  if (!dateStr) return 0;

  // If already contains Z or +/- offset
  if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? 0 : t;
  }

  // If local format 'YYYY-MM-DDTHH:mm'
  const withOffset = `${dateStr.length === 16 ? dateStr + ':00' : dateStr}${defaultUtcOffset}`;
  const t = new Date(withOffset).getTime();
  if (!isNaN(t)) {
    return t;
  }

  const fallback = new Date(dateStr).getTime();
  return isNaN(fallback) ? 0 : fallback;
}

/**
 * Validate Cron Secret for External Cron Services (Cron-Job.org) and Vercel Cron
 */
function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret) {
    // 1. Standard Authorization Header: Bearer <CRON_SECRET> (Recommended for Cron-Job.org)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.replace(/^Bearer\s+/i, '').trim() === cronSecret) {
      return true;
    }

    // 2. Custom Header: x-cron-secret
    const customHeader = request.headers.get('x-cron-secret');
    if (customHeader && customHeader.trim() === cronSecret) {
      return true;
    }

    // 3. Query Parameter Fallback: ?secret=<CRON_SECRET> or ?key=<CRON_SECRET>
    const querySecret = request.nextUrl.searchParams.get('secret') || request.nextUrl.searchParams.get('key');
    if (querySecret && querySecret.trim() === cronSecret) {
      return true;
    }

    // 4. Vercel internal Cron header
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    if (vercelCronHeader) {
      return true;
    }

    return false;
  }

  // Reject if CRON_SECRET is not configured
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

  const isTestMode = request.nextUrl.searchParams.get('test') === '1';
  const isDryRun = request.nextUrl.searchParams.get('dryRun') === '1';

  console.log(`[CRON /api/tasks/reminders/process] ⏰ Automated reminder check started at ${nowIso}`);

  // 1. Security Check
  if (!isCronAuthorized(request)) {
    console.warn(`[CRON] ❌ Unauthorized reminder trigger attempt from ${request.headers.get('x-forwarded-for') || 'unknown IP'}`);
    return NextResponse.json({ error: 'Unauthorized cron request. Invalid or missing secret.' }, { status: 401 });
  }

  try {
    const tasks = await getTasksFromDb();
    const allDevices = await getDeviceSubscriptionsFromDb();
    const activeDevices = allDevices.filter((d) => d.active);

    console.log(`[CRON] 📋 Scanning ${tasks.length} total tasks. Total active registered devices: ${activeDevices.length}`);

    let remindersSent = 0;
    let followUpAlertsSent = 0;
    let overdueAlertsSent = 0;
    let skippedCompleted = 0;
    let tasksUpdatedCount = 0;
    const taskLogs: any[] = [];

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
      // 1. Task Scheduled Reminders Processing (Multi-Reminder Support)
      // -------------------------------------------------------------
      if (Array.isArray(task.reminders) && task.reminders.length > 0) {
        for (const rem of task.reminders) {
          if (!rem.sentAt && rem.reminderDateTime) {
            const reminderTime = parseTaskTimestamp(rem.reminderDateTime);

            if (reminderTime > 0 && nowTime >= reminderTime) {
              console.log(`[CRON] 🔔 Due Reminder [${rem.timing}] for task "${task.title}" (Scheduled: ${rem.reminderDateTime}, Parsed Epoch: ${reminderTime}, Now Epoch: ${nowTime})`);

              const deadlineFormatted = formatTaskDateTime(task.deadlineDateTime);
              const pushTitle = task.title;

              let bodyParts = [];
              if (task.notes && task.notes.trim()) {
                bodyParts.push(task.notes.trim());
              }
              if (deadlineFormatted) {
                bodyParts.push(`Deadline: ${deadlineFormatted}`);
              }

              const pushBody = bodyParts.length > 0 ? bodyParts.join(' • ') : (deadlineFormatted ? `Deadline: ${deadlineFormatted}` : 'Task reminder');

              if (!isDryRun) {
                const recipients = Array.from(new Set([assignedUserId, 'user-super-admin'])).filter(Boolean);
                for (const uid of recipients) {
                  await sendPushNotificationToUser(uid, {
                    title: pushTitle,
                    body: pushBody,
                    icon: '/snap-service-logo.png',
                    badge: '/icon.png',
                    tag: `reminder-${task.id}-${rem.id}-${uid}`,
                    data: {
                      url: `/tasks?taskId=${task.id}`,
                      taskId: task.id,
                      type: 'reminder',
                    },
                  });
                }

                console.log(`[CRON] ✅ Multi-reminder push dispatched for "${task.title}" to ${recipients.join(', ')}`);
                rem.sentAt = nowIso;
                isTaskUpdated = true;
                remindersSent++;

                taskLogs.push({
                  taskId: task.id,
                  taskTitle: task.title,
                  assignedToUserId: assignedUserId,
                  assignedToName: task.assignedToName,
                  reminderTiming: rem.timing,
                  status: 'dispatched',
                  recipients,
                });
              } else {
                taskLogs.push({
                  taskId: task.id,
                  taskTitle: task.title,
                  assignedToUserId: assignedUserId,
                  assignedToName: task.assignedToName,
                  reminderTiming: rem.timing,
                  status: 'due_dry_run',
                });
              }
            }
          }
        }
      } else if (task.reminderDateTime && !task.reminderSentAt) {
        // Legacy single reminder fallback
        const reminderTime = parseTaskTimestamp(task.reminderDateTime);

        if (reminderTime > 0 && nowTime >= reminderTime) {
          console.log(`[CRON] 🔔 Due Legacy Reminder for "${task.title}" (Scheduled: ${task.reminderDateTime})`);

          const deadlineFormatted = formatTaskDateTime(task.deadlineDateTime);
          const pushTitle = task.title;

          let bodyParts = [];
          if (task.notes && task.notes.trim()) {
            bodyParts.push(task.notes.trim());
          }
          if (deadlineFormatted) {
            bodyParts.push(`Deadline: ${deadlineFormatted}`);
          }

          const pushBody = bodyParts.length > 0 ? bodyParts.join(' • ') : (deadlineFormatted ? `Deadline: ${deadlineFormatted}` : 'Task reminder');

          if (!isDryRun) {
            const recipients = Array.from(new Set([assignedUserId, 'user-super-admin'])).filter(Boolean);
            for (const uid of recipients) {
              await sendPushNotificationToUser(uid, {
                title: pushTitle,
                body: pushBody,
                icon: '/snap-service-logo.png',
                badge: '/icon.png',
                tag: `reminder-${task.id}-${uid}`,
                data: {
                  url: `/tasks?taskId=${task.id}`,
                  taskId: task.id,
                  type: 'reminder',
                },
              });
            }

            console.log(`[CRON] ✅ Legacy reminder push dispatched for "${task.title}" to ${recipients.join(', ')}`);
            task.reminderSentAt = nowIso;
            isTaskUpdated = true;
            remindersSent++;

            taskLogs.push({
              taskId: task.id,
              taskTitle: task.title,
              assignedToUserId: assignedUserId,
              assignedToName: task.assignedToName,
              status: 'dispatched',
              recipients,
            });
          }
        }
      }

      // -------------------------------------------------------------
      // 2. Follow-Up Alarm Processing
      // -------------------------------------------------------------
      if (task.manualStatus === 'waiting' && task.followUpDateTime && !task.followUpAlertSentAt) {
        const followUpTime = parseTaskTimestamp(task.followUpDateTime);

        if (followUpTime > 0 && nowTime >= followUpTime) {
          console.log(`[CRON] ⏰ Due Follow-up Alert for task: "${task.title}" (ID: ${task.id})`);

          const pushTitle = `⏳ Follow-up Due: ${task.title}`;
          const pushBody = task.notes
            ? `${task.notes} • Waiting follow-up time reached`
            : `Follow-up time has arrived for this waiting task.`;

          if (!isDryRun) {
            const recipients = Array.from(new Set([assignedUserId, 'user-super-admin'])).filter(Boolean);
            for (const uid of recipients) {
              await sendPushNotificationToUser(uid, {
                title: pushTitle,
                body: pushBody,
                icon: '/snap-service-logo.png',
                badge: '/icon.png',
                tag: `followup-${task.id}-${uid}`,
                data: {
                  url: `/tasks?taskId=${task.id}`,
                  taskId: task.id,
                  type: 'follow_up',
                },
              });
            }

            console.log(`[CRON] ✅ Follow-up push dispatched for "${task.title}" to ${recipients.join(', ')}`);
            task.followUpAlertSentAt = nowIso;
            isTaskUpdated = true;
            followUpAlertsSent++;
          }
        }
      }

      // -------------------------------------------------------------
      // 3. Overdue Alert Processing
      // -------------------------------------------------------------
      if (!isCompleted && task.deadlineDateTime && !task.overdueAlertSentAt) {
        const deadlineTime = parseTaskTimestamp(task.deadlineDateTime);

        if (deadlineTime > 0 && nowTime > deadlineTime) {
          console.log(`[CRON] 🚨 Due Overdue Alert for task: "${task.title}" (ID: ${task.id})`);

          const deadlineFormatted = formatTaskDateTime(task.deadlineDateTime);
          const pushTitle = `🚨 Overdue: ${task.title}`;
          const pushBody = `Deadline (${deadlineFormatted}) has passed.${task.notes ? ` • ${task.notes}` : ''}`;

          if (!isDryRun) {
            const recipients = Array.from(new Set([assignedUserId, 'user-super-admin'])).filter(Boolean);
            for (const uid of recipients) {
              await sendPushNotificationToUser(uid, {
                title: pushTitle,
                body: pushBody,
                icon: '/snap-service-logo.png',
                badge: '/icon.png',
                tag: `overdue-${task.id}-${uid}`,
                data: {
                  url: `/tasks?taskId=${task.id}`,
                  taskId: task.id,
                  type: 'overdue',
                },
              });
            }

            console.log(`[CRON] ✅ Overdue push dispatched for "${task.title}" to ${recipients.join(', ')}`);
            task.overdueAlertSentAt = nowIso;
            isTaskUpdated = true;
            overdueAlertsSent++;
          }
        }
      }

      // Persist updated notification flags to database to guarantee 0 duplicate notifications
      if (isTaskUpdated && !isDryRun) {
        await saveTaskToDb(task);
        tasksUpdatedCount++;
      }
    }

    // -------------------------------------------------------------
    // 4. Hourly Studio Pending Operations Digest
    // Window: 10:00 AM to 11:00 PM PKT (10:00 - 23:59 Asia/Karachi, UTC+5)
    // Fires once every hour ONLY if there are active pending tasks
    // -------------------------------------------------------------
    let hourlyDigestSent = false;
    const pktDate = new Date(nowTime + 5 * 3600000);
    const pktHour = pktDate.getUTCHours(); // 0 to 23
    const pktDateStr = pktDate.toISOString().slice(0, 10);
    const currentHourKey = `${pktDateStr}-${pktHour}`;

    // Active operating window: 10:00 AM (10) to 11:00 PM (23) inclusive
    const isWithinOperatingHours = pktHour >= 10 && pktHour <= 23;

    if (isWithinOperatingHours && !isDryRun) {
      const lastSentHourKey = await getHourlyDigestTracker();

      if (lastSentHourKey !== currentHourKey) {
        // Collect active non-completed tasks
        const pendingTasks = tasks.filter((t) => t.manualStatus !== 'completed');

        if (pendingTasks.length > 0) {
          const pushTitle = `📋 Studio Operations (${pendingTasks.length} Pending Task${pendingTasks.length > 1 ? 's' : ''})`;
          const pushBody = `You have ${pendingTasks.length} pending studio operation task${pendingTasks.length > 1 ? 's' : ''}. Tap to review.`;

          const recipientIds = new Set<string>(['user-super-admin']);
          pendingTasks.forEach((t) => {
            if (t.assignedToUserId) recipientIds.add(t.assignedToUserId);
          });

          for (const uid of Array.from(recipientIds)) {
            await sendPushNotificationToUser(uid, {
              title: pushTitle,
              body: pushBody,
              icon: '/snap-service-logo.png',
              badge: '/icon.png',
              tag: `hourly-digest-${currentHourKey}-${uid}`,
              data: {
                url: '/tasks',
                type: 'hourly_digest',
              },
            });
          }

          console.log(`[CRON] ⏰ Hourly Digest dispatched for ${pktHour}:00 PKT to ${Array.from(recipientIds).join(', ')} (${pendingTasks.length} pending tasks)`);
          hourlyDigestSent = true;
        }

        // Mark this hour as processed to prevent repeated triggers during the same hour
        await setHourlyDigestTracker(currentHourKey);
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[CRON] 🏁 Finished in ${durationMs}ms: ${remindersSent} reminders, ${followUpAlertsSent} follow-ups, ${overdueAlertsSent} overdue alerts sent. (Hourly Digest Sent: ${hourlyDigestSent})`);

    return NextResponse.json({
      success: true,
      message: isDryRun ? 'Dry run completed' : 'Automated reminder check processed successfully',
      serverTime: {
        utc: nowIso,
        localPkt: new Date(nowTime + 5 * 3600000).toISOString().replace('Z', '+05:00'),
      },
      durationMs,
      metrics: {
        totalTasksScanned: tasks.length,
        skippedCompleted,
        activeDevicesCount: activeDevices.length,
        remindersSent,
        followUpAlertsSent,
        overdueAlertsSent,
        hourlyDigestSent,
        tasksUpdatedCount,
      },
      registeredDevices: isTestMode
        ? activeDevices.map((d) => ({
            id: d.id,
            userId: d.userId,
            userName: d.userName,
            deviceName: d.deviceName,
            deviceType: d.deviceType,
            hasFcmToken: !!d.fcmToken,
            hasWebPushSubscription: !!d.subscription?.endpoint,
            lastUpdated: d.updatedAt,
          }))
        : undefined,
      taskLogs: isTestMode ? taskLogs : undefined,
    });
  } catch (error: any) {
    console.error('[CRON] 💥 Error in /api/tasks/reminders/process:', error);
    return NextResponse.json(
      { error: 'Failed to process task reminders', details: error?.message },
      { status: 500 }
    );
  }
}
