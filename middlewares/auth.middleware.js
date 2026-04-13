import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { verifyAccessToken } from '../helpers/jwt.helper.js';

/**
 * Requires `Authorization: Bearer <access_token>`.
 * Sets `req.user` to a lean user document (no passwordHash) and `req.userId`.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ data: {}, message: 'Unauthorized' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ data: {}, message: 'Unauthorized' });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ data: {}, message: 'Unauthorized' });
  }

  if (!mongoose.Types.ObjectId.isValid(payload.sub)) {
    return res.status(401).json({ data: {}, message: 'Unauthorized' });
  }

  try {
    const user = await User.findOne({
      _id: payload.sub,
      deletedAt: null,
    }).lean();

    if (!user) {
      return res.status(401).json({ data: {}, message: 'Unauthorized' });
    }

    delete user.passwordHash;
    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
