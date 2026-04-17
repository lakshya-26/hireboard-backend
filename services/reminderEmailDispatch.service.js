import { Reminder } from '../models/Reminder.js';
import { sendApplicationReminderEmail } from './email.service.js';
import {
  releaseReminderDispatchLock,
  tryAcquireReminderDispatchLock,
} from './reminderEmailLock.service.js';

const BATCH_SIZE = 40;
const MAX_ROUNDS = 30;
const CONCURRENCY = 5;

/**
 * Sends due reminder emails and sets `sent: true` only after a successful send.
 * Uses Redis NX locks to avoid duplicate sends across processes.
 */
export async function processDueReminderEmails() {
  const now = new Date();

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const batch = await Reminder.find({
      deletedAt: null,
      sent: false,
      remindAt: { $lte: now },
    })
      .sort({ remindAt: 1 })
      .limit(BATCH_SIZE)
      .select('_id')
      .lean();

    if (!batch.length) {
      break;
    }

    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const slice = batch.slice(i, i + CONCURRENCY);
      await Promise.all(slice.map((row) => dispatchOneDueReminder(row._id.toString())));
    }

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    if (batch.length < BATCH_SIZE) {
      break;
    }
  }
}

async function dispatchOneDueReminder(reminderId) {
  let locked = false;
  try {
    locked = await tryAcquireReminderDispatchLock(reminderId);
    if (!locked) {
      return;
    }

    const reminder = await Reminder.findOne({
      _id: reminderId,
      deletedAt: null,
      sent: false,
      remindAt: { $lte: new Date() },
    })
      .populate({ path: 'userId', select: 'email name' })
      .populate({ path: 'applicationId', select: 'companyName role userId deletedAt' })
      .lean();

    if (!reminder) {
      return;
    }

    const user = reminder.userId;
    const application = reminder.applicationId;

    if (!user?.email) {
      console.error(
        `[reminder-dispatch] skip reminder=${reminderId}: user has no email`,
      );
      return;
    }

    if (!application || application.deletedAt != null) {
      console.error(
        `[reminder-dispatch] skip reminder=${reminderId}: application missing or deleted`,
      );
      return;
    }

    const userIdStr = user._id?.toString?.() ?? String(user);
    const appOwnerStr =
      application.userId?._id?.toString?.() ?? application.userId?.toString?.() ?? String(application.userId);
    if (userIdStr !== appOwnerStr) {
      console.error(
        `[reminder-dispatch] skip reminder=${reminderId}: application does not belong to user`,
      );
      return;
    }

    await sendApplicationReminderEmail({
      to: user.email,
      companyName: application.companyName,
      role: application.role,
      message: reminder.message,
      remindAt: reminder.remindAt,
    });

    const upd = await Reminder.updateOne(
      { _id: reminderId, sent: false },
      { $set: { sent: true } },
    );

    if (upd.modifiedCount === 0) {
      console.warn(
        `[reminder-dispatch] reminder=${reminderId}: email sent but document was already marked sent`,
      );
    }
  } catch (err) {
    console.error(
      `[reminder-dispatch] reminder=${reminderId}:`,
      err?.message || err,
    );
  } finally {
    if (locked) {
      await releaseReminderDispatchLock(reminderId);
    }
  }
}
