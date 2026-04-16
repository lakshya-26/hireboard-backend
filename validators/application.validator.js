import { z } from 'zod';
import { APPLICATION_STATUSES, PRIORITIES, WORK_TYPES } from '../models/index.js';

const dateLike = z.union([z.coerce.date(), z.null()]);

const salarySchema = z
  .object({
    min: z.number().nonnegative().optional(),
    max: z.number().nonnegative().optional(),
    currency: z.string().trim().min(1).max(10).optional(),
  })
  .refine(
    (value) =>
      value.min === undefined || value.max === undefined || value.min <= value.max,
    { message: 'salary.min must be less than or equal to salary.max', path: ['min'] },
  );

const contactSchema = z.object({
  _id: z.string().trim().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  linkedin: z.string().trim().url().optional(),
});

const noteSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  createdAt: z.coerce.date().optional(),
});

export const createApplicationSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  jobUrl: z.string().trim().url().optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  appliedDate: dateLike.optional(),
  salary: salarySchema.optional(),
  location: z.string().trim().max(200).optional(),
  workType: z.enum(WORK_TYPES).optional(),
  notes: z.array(noteSchema).optional(),
  contacts: z.array(contactSchema).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
  priority: z.enum(PRIORITIES).optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const addNoteSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const applicationsQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  workType: z.enum(WORK_TYPES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  search: z.string().trim().max(200).optional(),
  appliedFrom: z.coerce.date().optional(),
  appliedTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  sortBy: z.enum(['appliedDate', 'createdAt', 'updatedAt']).default('appliedDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Same filters as list, without pagination (used for CSV export). */
export const applicationsExportQuerySchema = applicationsQuerySchema.omit({ page: true, limit: true });

export function formatZodIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : 'root',
    message: issue.message,
  }));
}
