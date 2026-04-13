/**
 * User document → safe client payload (no passwordHash or internal fields).
 */
export function serializeUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    createdAt: userDoc.createdAt,
  };
}
