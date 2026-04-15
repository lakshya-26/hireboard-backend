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
import {
  formatZodIssues,
  loginSchema,
  registerSchema,
} from '../validators/auth.validator.js';

const BCRYPT_ROUNDS = 12;

export async function register(payload) {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await User.create({ name, email, passwordHash });
    const userId = user._id.toString();
    return {
      accessToken: signAccessToken(userId),
      refreshToken: signRefreshToken(userId),
      user: serializeUser(user),
    };
  } catch (err) {
    if (err.code === 11000) {
      throw CustomException('An account with this email already exists', 409);
    }
    throw err;
  }
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

  return {
    accessToken: signAccessToken(user._id.toString()),
  };
}
