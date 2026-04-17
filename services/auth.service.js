import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../helpers/jwt.helper.js';
import { serializeUser } from '../serializers/user.serializer.js';
import { CustomException } from '../utils/errorHandler.js';
import { sendVerificationEmail } from './email.service.js';
import { deleteOtp, generateSixDigitOtp, otpMatchesStored, saveOtp } from './otp.service.js';
import {
  formatZodIssues,
  loginSchema,
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '../validators/auth.validator.js';

const BCRYPT_ROUNDS = 12;

async function issueAndEmailOtp(email) {
  const otp = generateSixDigitOtp();
  await saveOtp(email, otp);
  await sendVerificationEmail(email, otp);
}

export async function register(payload) {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  try {
    user = await User.create({ name, email, passwordHash, isVerified: false });
  } catch (err) {
    if (err.code === 11000) {
      throw CustomException('An account with this email already exists', 409);
    }
    throw err;
  }

  try {
    await issueAndEmailOtp(user.email);
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    console.error('[auth.register] OTP email failed:', err?.message || err);
    throw CustomException(
      'We could not send the verification email. Check SMTP settings and try again.',
      503,
    );
  }

  return {
    user: serializeUser(user),
  };
}

export async function login(payload) {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email, deletedAt: null }).select('+passwordHash');

  if (!user) {
    throw CustomException('Account not found', 404);
  }

  if (!user.isVerified) {
    throw CustomException(
      'Please verify your email before signing in. Check your inbox for a code, or open the verification page to request a new one.',
      403,
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw CustomException('Invalid credentials', 403);
  }

  const userId = user._id.toString();
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
    user: serializeUser(user),
  };
}

export async function refreshToken(cookieRefreshToken) {
  if (!cookieRefreshToken) {
    throw CustomException('Refresh token required', 401);
  }

  let payload;
  try {
    payload = verifyRefreshToken(cookieRefreshToken);
  } catch {
    throw CustomException('Invalid or expired refresh token', 401);
  }

  if (!mongoose.Types.ObjectId.isValid(payload.sub)) {
    throw CustomException('Invalid or expired refresh token', 401);
  }

  const user = await User.findOne({ _id: payload.sub, deletedAt: null });
  if (!user) {
    throw CustomException('Invalid or expired refresh token', 401);
  }

  if (!user.isVerified) {
    throw CustomException('Please verify your email to continue.', 401);
  }

  return {
    accessToken: signAccessToken(user._id.toString()),
  };
}

export async function sendOtp(payload) {
  const parsed = sendOtpSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const { email } = parsed.data;
  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    throw CustomException('No account found with this email address.', 404);
  }
  if (user.isVerified) {
    throw CustomException('This email is already verified. You can log in.', 400);
  }

  await issueAndEmailOtp(user.email);
}

export async function verifyOtp(payload) {
  const parsed = verifyOtpSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const { email, otp } = parsed.data;
  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    throw CustomException('No account found with this email address.', 404);
  }
  if (user.isVerified) {
    throw CustomException('This email is already verified. You can log in.', 400);
  }

  const matches = await otpMatchesStored(email, otp);
  if (!matches) {
    throw CustomException(
      'Invalid or expired verification code. Request a new code and try again.',
      400,
    );
  }

  user.isVerified = true;
  await user.save();
  await deleteOtp(email);

  return {
    user: serializeUser(user),
  };
}
