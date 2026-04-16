import mongoose from 'mongoose';
import { Application } from '../models/index.js';
import { serializeApplication } from '../serializers/application.serializer.js';
import { CustomException } from '../utils/errorHandler.js';
import {
  addNoteSchema,
  applicationsExportQuerySchema,
  applicationsQuerySchema,
  createApplicationSchema,
  formatZodIssues,
  updateApplicationSchema,
} from '../validators/application.validator.js';

function parseApplicationId(applicationId) {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw CustomException('Invalid application id', 400);
  }
  return applicationId;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildListFilter(userId, query) {
  const filter = {
    userId,
    deletedAt: null,
  };

  if (query.status) filter.status = query.status;
  if (query.workType) filter.workType = query.workType;
  if (query.priority) filter.priority = query.priority;

  const search = query.search?.trim();
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { companyName: { $regex: safe, $options: 'i' } },
      { role: { $regex: safe, $options: 'i' } },
    ];
  }

  const appliedDate = {};
  if (query.appliedFrom) {
    appliedDate.$gte = query.appliedFrom;
  }
  if (query.appliedTo) {
    const end = new Date(query.appliedTo);
    end.setUTCHours(23, 59, 59, 999);
    appliedDate.$lte = end;
  }
  if (Object.keys(appliedDate).length) {
    filter.appliedDate = appliedDate;
  }

  return filter;
}

export async function createApplication(userId, payload) {
  const parsed = createApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const doc = await Application.create({
    ...parsed.data,
    userId,
  });

  return serializeApplication(doc);
}

export async function getApplications(userId, queryParams) {
  const parsed = applicationsQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const { page, limit, sortBy, sortOrder } = parsed.data;
  const filter = buildListFilter(userId, parsed.data);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter).sort(sort).skip(skip).limit(limit),
    Application.countDocuments(filter),
  ]);

  return {
    applications: applications.map(serializeApplication),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
    filters: {
      status: parsed.data.status ?? null,
      workType: parsed.data.workType ?? null,
      priority: parsed.data.priority ?? null,
      search: parsed.data.search?.trim() || null,
      appliedFrom: parsed.data.appliedFrom ?? null,
      appliedTo: parsed.data.appliedTo ?? null,
    },
  };
}

export async function getApplicationById(userId, applicationId) {
  const id = parseApplicationId(applicationId);
  const application = await Application.findOne({ _id: id, userId, deletedAt: null });

  if (!application) {
    throw CustomException('Application not found', 404);
  }

  return serializeApplication(application);
}

export async function updateApplication(userId, applicationId, payload) {
  const id = parseApplicationId(applicationId);
  const parsed = updateApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  if (Object.keys(parsed.data).length === 0) {
    throw CustomException('No fields provided for update', 400);
  }

  const updated = await Application.findOneAndUpdate(
    { _id: id, userId, deletedAt: null },
    {
      $set: {
        ...parsed.data,
        lastUpdated: new Date(),
      },
    },
    { new: true },
  );

  if (!updated) {
    throw CustomException('Application not found', 404);
  }

  return serializeApplication(updated);
}

export async function deleteApplication(userId, applicationId) {
  const id = parseApplicationId(applicationId);
  const deleted = await Application.findOneAndUpdate(
    { _id: id, userId, deletedAt: null },
    { $set: { deletedAt: new Date(), lastUpdated: new Date() } },
    { new: true },
  );

  if (!deleted) {
    throw CustomException('Application not found', 404);
  }

  return { id: deleted._id.toString() };
}

export async function addNoteToApplication(userId, applicationId, payload) {
  const id = parseApplicationId(applicationId);
  const parsed = addNoteSchema.safeParse(payload);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const updated = await Application.findOneAndUpdate(
    { _id: id, userId, deletedAt: null },
    {
      $push: {
        notes: {
          text: parsed.data.text,
          createdAt: new Date(),
        },
      },
      $set: { lastUpdated: new Date() },
    },
    { new: true },
  );

  if (!updated) {
    throw CustomException('Application not found', 404);
  }

  return serializeApplication(updated);
}

const CSV_EXPORT_MAX = 5000;

function csvEscape(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatCsvDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function buildApplicationsCsvBody(rows) {
  const headers = [
    'ID',
    'Company',
    'Role',
    'Status',
    'Applied date',
    'Priority',
    'Location',
    'Work type',
    'Job URL',
    'Tags',
    'Created at',
  ];
  const lines = [headers.join(',')];
  for (const a of rows) {
    const tags = Array.isArray(a.tags) ? a.tags.join('; ') : '';
    lines.push(
      [
        csvEscape(a.id),
        csvEscape(a.companyName),
        csvEscape(a.role),
        csvEscape(a.status),
        csvEscape(formatCsvDate(a.appliedDate)),
        csvEscape(a.priority),
        csvEscape(a.location),
        csvEscape(a.workType),
        csvEscape(a.jobUrl),
        csvEscape(tags),
        csvEscape(formatCsvDate(a.createdAt)),
      ].join(','),
    );
  }
  return `\ufeff${lines.join('\n')}`;
}

/**
 * Returns CSV text and a safe filename for Content-Disposition.
 * Respects the same filters as the applications list (capped at CSV_EXPORT_MAX rows).
 */
export async function getApplicationsCsvExport(userId, queryParams) {
  const parsed = applicationsExportQuerySchema.safeParse(queryParams);
  if (!parsed.success) {
    throw CustomException('Validation failed', 400, formatZodIssues(parsed.error));
  }

  const filter = buildListFilter(userId, parsed.data);
  const sort = { [parsed.data.sortBy]: parsed.data.sortOrder === 'asc' ? 1 : -1 };

  const docs = await Application.find(filter).sort(sort).limit(CSV_EXPORT_MAX);
  const rows = docs.map(serializeApplication);
  const csv = buildApplicationsCsvBody(rows);
  const filename = `hireboard-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}
