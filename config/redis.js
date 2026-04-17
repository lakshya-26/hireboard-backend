import Redis from 'ioredis';

let redis = null;

/**
 * Singleton Redis client for OTP storage.
 */
export function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL.trim();
    redis = new Redis(url, { maxRetriesPerRequest: 3 });
    redis.on('error', (err) => {
      console.error('[redis]', err.message);
    });
    }
    console.log('Redis connected successfully');
  return redis;
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
