import * as statsService from '../services/stats.service.js';
import { sendResponse } from '../middlewares/reqRes.middleware.js';
import { commonErrorHandler } from '../utils/errorHandler.js';

export async function overview(req, res) {
  try {
    const data = await statsService.getOverview(req.userId);
    req.statusCode = 200;
    req.data = data;
    req.message = 'Stats overview fetched successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}
