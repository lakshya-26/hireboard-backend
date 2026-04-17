import * as authService from '../services/auth.service.js';
import { setRefreshTokenCookie } from '../helpers/cookie.helper.js';
import { REFRESH_TOKEN_COOKIE } from '../helpers/jwt.helper.js';
import { sendResponse } from '../middlewares/reqRes.middleware.js';
import { commonErrorHandler } from '../utils/errorHandler.js';

export async function register(req, res) {
  try {
    const data = await authService.register(req.body);

    req.statusCode = 201;
    req.data = {
      user: data.user,
    };
    req.message =
      'Account created. We sent a 6-digit verification code to your email. Verify before signing in.';

    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function login(req, res) {
  try {
    const data = await authService.login(req.body);

    setRefreshTokenCookie(res, data.refreshToken);

    req.statusCode = 200;
    req.data = {
      accessToken: data.accessToken,
      user: data.user,
    };
    req.message = 'Login successful';

    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function refresh(req, res) {
  try {
    const data = await authService.refreshToken(req.cookies?.[REFRESH_TOKEN_COOKIE]);

    req.statusCode = 200;
    req.data = data;
    req.message = 'Token refreshed';

    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function sendOtp(req, res) {
  try {
    await authService.sendOtp(req.body);
    req.statusCode = 200;
    req.data = {};
    req.message = 'We sent a new verification code to your email.';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function verifyOtp(req, res) {
  try {
    const data = await authService.verifyOtp(req.body);
    req.statusCode = 200;
    req.data = data;
    req.message = 'Email verified. You can sign in now.';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}
