import { getRedis } from '../config/redis.js';

const PREFIX = 'hireboard:reminder-dispatch:';
const LOCK_TTL_SEC = 300;

/**
 * Try to acquire a short-lived lock so only one worker sends a given reminder.
 * @returns {Promise<boolean>} true if this caller holds the lock
 */
export async function tryAcquireReminderDispatchLock(reminderId) {
  try {
    const redis = getRedis();
    const result = await redis.set(`${PREFIX}${reminderId}`, '1', 'EX', LOCK_TTL_SEC, 'NX');
    return result === 'OK';
  } catch (err) {
    console.error('[reminder-dispatch] Redis lock error:', err.message);
    // Degrade: allow send without distributed lock (single-instance setups still work).
    return true;
  }
}

export async function releaseReminderDispatchLock(reminderId) {
  try {
    await getRedis().del(`${PREFIX}${reminderId}`);
  } catch (err) {
    console.error('[reminder-dispatch] Redis unlock error:', err.message);
  }
}
