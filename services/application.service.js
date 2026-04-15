import mongoose from 'mongoose';
import { Application } from '../models/index.js';
import { serializeApplication } from '../serializers/application.serializer.js';
import { CustomException } from '../utils/errorHandler.js';
import {
  addNoteSchema,
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

function buildListFilter(userId, query) {
  const filter = {
    userId,
    deletedAt: null,
  };

  if (query.status) filter.status = query.status;
  if (query.workType) filter.workType = query.workType;
  if (query.priority) filter.priority = query.priority;

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
