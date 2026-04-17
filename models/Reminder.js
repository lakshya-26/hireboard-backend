import mongoose from 'mongoose';
import { defaultSchemaOptions, softDeleteField } from './schemaDefaults.js';

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    message: { type: String, required: true, trim: true },
    remindAt: { type: Date, required: true, index: true },
    sent: { type: Boolean, default: false, index: true },
    ...softDeleteField,
  },
  defaultSchemaOptions,
);

reminderSchema.index({ sent: 1, remindAt: 1 });
reminderSchema.index({ userId: 1, remindAt: 1 });

export const Reminder = mongoose.model('Reminder', reminderSchema);
