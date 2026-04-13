import mongoose from 'mongoose';
import { defaultSchemaOptions, softDeleteField } from './schemaDefaults.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    ...softDeleteField,
  },
  defaultSchemaOptions,
);

export const User = mongoose.model('User', userSchema);
