import { z } from 'zod';

const objectId = z.string().trim().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const createReminderSchema = z.object({
  applicationId: objectId,
  message: z.string().trim().min(1).max(2000),
  remindAt: z.coerce.date(),
});

export const listRemindersQuerySchema = z.object({
  applicationId: objectId,
});
