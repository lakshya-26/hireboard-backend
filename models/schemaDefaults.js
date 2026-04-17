/**
 * Shared Mongoose schema options: createdAt / updatedAt via timestamps,
 * plus soft-delete field deletedAt (null = not deleted).
 */
export const defaultSchemaOptions = {
  timestamps: true,
};

export const softDeleteField = {
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
};
