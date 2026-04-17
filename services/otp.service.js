import crypto from 'crypto';
import { getRedis } from '../config/redis.js';

const OTP_TTL_SEC = 600; // 10 minutes

function redisKey(email) {
  return `hireboard:email-otp:${email.toLowerCase().trim()}`;
}

function normalizeOtp(input) {
  return String(input ?? '').replace(/\D/g, '').slice(0, 6);
}

export function generateSixDigitOtp() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

export async function saveOtp(email, otp) {
  const redis = getRedis();
  await redis.set(redisKey(email), otp, 'EX', OTP_TTL_SEC);
}

export async function readStoredOtp(email) {
  return getRedis().get(redisKey(email));
}

export async function deleteOtp(email) {
  await getRedis().del(redisKey(email));
}

/** True if the 6-digit code matches what is stored (caller clears Redis after a successful DB update). */
export async function otpMatchesStored(email, rawOtp) {
  const otp = normalizeOtp(rawOtp);
  if (otp.length !== 6) {
    return false;
  }
  const stored = await readStoredOtp(email);
  return Boolean(stored && stored === otp);
}
