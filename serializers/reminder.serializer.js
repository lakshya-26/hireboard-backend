export function serializeReminder(doc) {
  const sent = Boolean(doc.sent);
  return {
    id: doc._id.toString(),
    applicationId: doc.applicationId.toString(),
    message: doc.message,
    remindAt: doc.remindAt,
    sent,
    status: sent ? 'done' : 'pending',
    createdAt: doc.createdAt,
  };
}
