import * as authService from '../services/auth.service.js';
import { setRefreshTokenCookie } from '../helpers/cookie.helper.js';
import { REFRESH_TOKEN_COOKIE } from '../helpers/jwt.helper.js';
import { sendResponse } from '../middlewares/reqRes.middleware.js';
import { commonErrorHandler } from '../utils/errorHandler.js';

export async function register(req, res) {
  try {
    const data = await authService.register(req.body);

    setRefreshTokenCookie(res, data.refreshToken);

    req.statusCode = 201;
    req.data = {
      accessToken: data.accessToken,
      user: data.user,
    };
    req.message = 'Registration successful';

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
