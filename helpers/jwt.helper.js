import jwt from 'jsonwebtoken';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export function signAccessToken(userId) {
  return jwt.sign(
    { sub: userId, typ: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN },
  );
}

export function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, typ: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN },
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  if (payload.typ !== 'access') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  if (payload.typ !== 'refresh') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return payload;
}
