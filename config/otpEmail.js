/**
 * Validates env vars needed for OTP email verification.
 */
export function assertOtpEmailEnv() {
  const smtp = [
    ['SMTP_HOST', process.env.SMTP_HOST],
    ['SMTP_USER', process.env.SMTP_USER],
    ['SMTP_PASS', process.env.SMTP_PASS],
    ['EMAIL_FROM', process.env.EMAIL_FROM],
  ];
  for (const [key, value] of smtp) {
    if (!value || !String(value).trim()) {
      throw new Error(`Missing required environment variable: ${key} (needed to send verification emails)`);
    }
  }
  const port = process.env.SMTP_PORT;
  if (port != null && port !== '' && Number.isNaN(Number(port))) {
    throw new Error('SMTP_PORT must be a number when set');
  }
}
