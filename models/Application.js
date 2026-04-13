import mongoose from 'mongoose';
import { defaultSchemaOptions, softDeleteField } from './schemaDefaults.js';

const APPLICATION_STATUSES = [
  'Saved',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Ghosted',
];

const WORK_TYPES = ['Remote', 'Hybrid', 'Onsite'];

const PRIORITIES = ['Low', 'Medium', 'High'];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    role: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    linkedin: { type: String, trim: true },
  },
  { _id: true },
);

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    jobUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'Saved',
      index: true,
    },
    appliedDate: { type: Date },
    lastUpdated: { type: Date, default: Date.now },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, trim: true, default: 'USD' },
    },
    location: { type: String, trim: true },
    workType: {
      type: String,
      enum: WORK_TYPES,
    },
    notes: [noteSchema],
    contacts: [contactSchema],
    tags: [{ type: String, trim: true }],
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'Medium',
      index: true,
    },
    ...softDeleteField,
  },
  defaultSchemaOptions,
);

applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ userId: 1, updatedAt: -1 });
applicationSchema.index({ userId: 1, companyName: 1, role: 1 });

applicationSchema.pre('save', function updateLastUpdated(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

export const Application = mongoose.model('Application', applicationSchema);
export { APPLICATION_STATUSES, WORK_TYPES, PRIORITIES };
