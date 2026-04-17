import cron from 'node-cron';
import { processDueReminderEmails } from '../services/reminderEmailDispatch.service.js';

let scheduledTask = null;
let tickRunning = false;

function getCronTimezone() {
  return process.env.CRON_TIMEZONE.trim();
}

export function startReminderEmailCron() {
  if (scheduledTask) {
    return;
  }

  scheduledTask = cron.schedule(
    '*/5 * * * *',
    () => {
      if (tickRunning) {
        return;
      }
      tickRunning = true;
      void processDueReminderEmails()
        .catch((err) => {
          console.error('[reminder-email-cron]', err?.message || err);
        })
        .finally(() => {
          tickRunning = false;
        });
    },
    { timezone: getCronTimezone() },
  );

  console.log(`[reminder-email-cron] scheduled every 5 minutes (${getCronTimezone()})`);
}

export function stopReminderEmailCron() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
}
