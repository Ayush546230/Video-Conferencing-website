import cron from 'node-cron';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import { sendMeetingReminder } from './emailService.js';
import webPush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

// Configure web-push if VAPID keys exist
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@airender.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ─── Calculate reminder trigger time (UTC) ──────────────────
function getReminderTriggerTime(meeting) {
  const start = new Date(meeting.startTime);
  const notif = meeting.notification || { amount: 30, unit: 'minutes before' };
  const amount = parseInt(notif.amount) || 30;

  let msOffset = 0;
  switch (notif.unit) {
    case 'minutes before': msOffset = amount * 60 * 1000; break;
    case 'hours before': msOffset = amount * 60 * 60 * 1000; break;
    case 'days before': msOffset = amount * 24 * 60 * 60 * 1000; break;
    case 'weeks before': msOffset = amount * 7 * 24 * 60 * 60 * 1000; break;
    default: msOffset = 30 * 60 * 1000;
  }

  return new Date(start.getTime() - msOffset);
}

// ─── Send Push Notification ─────────────────────────────────
async function sendPushReminder(meeting, user) {
  if (!user.pushSubscription || !user.pushSubscription.endpoint) {
    console.warn(`🔔 Push skipped: No push subscription for user ${user.email}`);
    return;
  }

  const notif = meeting.notification || { amount: 30, unit: 'minutes before' };
  const timeText = `${notif.amount} ${notif.unit.replace(' before', '')}`;

  const payload = JSON.stringify({
    title: `Reminder: ${meeting.title}`,
    body: `Your video conference is starting in ${timeText}. Click to join.`,
    icon: '/Hi_Logo.png',
    tag: 'meeting-reminder',
    data: { url: meeting.link },
    actions: [
      { action: 'ok', title: 'OK' }
    ]
  });

  try {
    await webPush.sendNotification(user.pushSubscription, payload);
    console.log(`🔔 Push reminder sent to ${user.email} for "${meeting.title}"`);
  } catch (err) {
    console.error(`🔔 Push failed for ${user.email}:`, err.message);
  }
}

// ─── Process Reminders ──────────────────────────────────────
async function processReminders() {
  try {
    const now = new Date();

    // Find meetings that are scheduled, not yet reminded, and upcoming
    const pendingMeetings = await Meeting.find({
      status: 'scheduled',
      reminderSent: false,
      startTime: { $gt: now }, // Only future meetings
    });

    for (const meeting of pendingMeetings) {
      const triggerTime = getReminderTriggerTime(meeting);

      if (now >= triggerTime) {
        console.log(`⏰ Triggering reminder for "${meeting.title}" (starts at ${meeting.startTime})`);

        // Get the meeting owner
        const owner = await User.findById(meeting.userId);
        if (!owner) continue;

        const notifType = meeting.notification?.type || 'As Notification';

        if (notifType === 'As Email') {
          // Send email to the owner
          await sendMeetingReminder(meeting.toJSON(), owner.email).catch(err =>
            console.error(`Email reminder failed for ${owner.email}:`, err.message)
          );
        } else {
          // Send push notification to owner
          await sendPushReminder(meeting, owner);
        }

        // ALWAYS send email to all participants
        for (const p of meeting.participants) {
          if (p.email && p.email !== owner.email) {
            await sendMeetingReminder(meeting.toJSON(), p.email).catch(err =>
              console.error(`Email reminder failed for ${p.email}:`, err.message)
            );
          }
        }

        // Mark as reminded
        meeting.reminderSent = true;
        await meeting.save();
      }
    }
  } catch (err) {
    console.error('Reminder scheduler error:', err);
  }
}

// ─── Auto-complete past meetings ────────────────────────────
async function autoCompleteMeetings() {
  try {
    const now = new Date();
    await Meeting.updateMany(
      {
        status: 'scheduled',
        endTime: { $lt: now },
      },
      { $set: { status: 'completed' } }
    );
  } catch (err) {
    console.error('Auto-complete error:', err);
  }
}

// ─── Start Scheduler ────────────────────────────────────────
export function startReminderScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await processReminders();
    await autoCompleteMeetings();
  });

  console.log('🕐 Reminder scheduler started (runs every 60 seconds)');
}
