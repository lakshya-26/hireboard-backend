import * as reminderService from '../services/reminder.service.js';
import { sendResponse } from '../middlewares/reqRes.middleware.js';
import { commonErrorHandler } from '../utils/errorHandler.js';

export async function create(req, res) {
  try {
    const data = await reminderService.createReminder(req.userId, req.body);
    req.statusCode = 201;
    req.data = data;
    req.message = 'Reminder created successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function list(req, res) {
  try {
    const data = await reminderService.listRemindersForApplication(req.userId, req.query);
    req.statusCode = 200;
    req.data = data;
    req.message = 'Reminders fetched successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function markComplete(req, res) {
  try {
    const data = await reminderService.markReminderComplete(req.userId, req.params.id);
    req.statusCode = 200;
    req.data = data;
    req.message = 'Reminder marked as done';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

export async function dueCount(req, res) {
  try {
    const data = await reminderService.countDueReminders(req.userId);
    req.statusCode = 200;
    req.data = data;
    req.message = 'Due reminder count fetched successfully';
    return sendResponse(req, res);
  } catch (error) {
    return commonErrorHandler(req, res, error.message, error.statusCode, error);
  }
}
