/**
 * Validates JWT-related environment variables at startup.
 */
export function assertAuthEnv() {
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of required) {
    const value = process.env[key];
    if (!value || !String(value).trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
