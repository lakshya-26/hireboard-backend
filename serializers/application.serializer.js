export function serializeApplication(applicationDoc) {
  return {
    id: applicationDoc._id.toString(),
    userId: applicationDoc.userId.toString(),
    companyName: applicationDoc.companyName,
    role: applicationDoc.role,
    jobUrl: applicationDoc.jobUrl,
    status: applicationDoc.status,
    appliedDate: applicationDoc.appliedDate,
    lastUpdated: applicationDoc.lastUpdated,
    salary: applicationDoc.salary,
    location: applicationDoc.location,
    workType: applicationDoc.workType,
    notes: applicationDoc.notes,
    contacts: applicationDoc.contacts,
    tags: applicationDoc.tags,
    priority: applicationDoc.priority,
    createdAt: applicationDoc.createdAt,
    updatedAt: applicationDoc.updatedAt,
  };
}
