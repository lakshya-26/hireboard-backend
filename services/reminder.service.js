import mongoose from 'mongoose';
import { Application, Reminder } from '../models/index.js';
import { serializeReminder } from '../serializers/reminder.serializer.js';
import { CustomException } from '../utils/errorHandler.js';
import { formatZodIssues } from '../validators/application.validator.js';
import { createReminderSchema, listRemindersQuerySchema } from '../validators/reminder.validator.js';

function parseId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw CustomException('Invalid id', 400);
  }
  return id;
}

export async function createReminder(userId, payload) {
  const parsed = createReminderSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const { applicationId, message, remindAt } = parsed.data;
  const appId = parseId(applicationId);

  const application = await Application.findOne({
    _id: appId,
    userId,
    deletedAt: null,
  });

  if (!application) {
    throw CustomException('Application not found', 404);
  }

  const doc = await Reminder.create({
    userId,
    applicationId: appId,
    message,
    remindAt,
  });

  return serializeReminder(doc);
}

export async function listRemindersForApplication(userId, queryParams) {
  const parsed = listRemindersQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const { applicationId } = parsed.data;
  const appId = parseId(applicationId);

  const application = await Application.findOne({
    _id: appId,
    userId,
    deletedAt: null,
  });

  if (!application) {
    throw CustomException('Application not found', 404);
  }

  const reminders = await Reminder.find({
    userId,
    applicationId: appId,
    deletedAt: null,
  }).sort({ remindAt: 1 });

  return {
    reminders: reminders.map(serializeReminder),
  };
}

export async function markReminderComplete(userId, reminderId) {
  const id = parseId(reminderId);

  const updated = await Reminder.findOneAndUpdate(
    {
      _id: id,
      userId,
      deletedAt: null,
      sent: false,
    },
    { $set: { sent: true } },
    { new: true },
  );

  if (!updated) {
    throw CustomException('Reminder not found or already completed', 404);
  }

  return serializeReminder(updated);
}

export async function countDueReminders(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  const dueCount = await Reminder.countDocuments({
    userId: userObjectId,
    deletedAt: null,
    sent: false,
    remindAt: { $lte: now },
  });

  return { dueCount };
}
