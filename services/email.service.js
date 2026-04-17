import nodemailer from 'nodemailer';

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends a 6-digit verification code to the user.
 */
export async function sendVerificationEmail(to, otp) {
  const from = process.env.EMAIL_FROM?.trim();
  const transporter = createTransport();
  await transporter.sendMail({
    from,
    to,
    subject: 'Your HireBoard verification code',
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\nIf you did not create an account, you can ignore this email.`,
    html: `<p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${otp}</p><p>This code expires in <strong>10 minutes</strong>.</p><p>If you did not create an account, you can ignore this email.</p>`,
  });
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats remindAt for display. Mongo stores UTC; we label explicitly to avoid ambiguity.
 */
function formatReminderDate(remindAt) {
  const d = remindAt instanceof Date ? remindAt : new Date(remindAt);
  if (Number.isNaN(d.getTime())) {
    return { line: '—', iso: '' };
  }
  const readable = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return { line: `${readable} (UTC)`, iso: d.toISOString() };
}

/**
 * Due reminder notification (plain + HTML).
 */
export async function sendApplicationReminderEmail({
  to,
  companyName,
  role,
  message,
  remindAt,
}) {
  const from = process.env.EMAIL_FROM?.trim();
  const { line: dateLine, iso } = formatReminderDate(remindAt);
  const company = String(companyName ?? '').trim() || '—';
  const roleTitle = String(role ?? '').trim() || '—';
  const bodyMessage = String(message ?? '').trim();

  const text = [
    'Hello,',
    '',
    'This is a reminder to follow up on:',
    '',
    `Company: ${company}`,
    `Role: ${roleTitle}`,
    '',
    'Message:',
    bodyMessage,
    '',
    `Reminder time: ${dateLine}`,
    iso ? `ISO: ${iso}` : '',
    '',
    'Stay consistent and keep applying 🚀',
    '',
    '— HireBoard',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.5; color: #111827;">
  <p>Hello,</p>
  <p>This is a reminder to follow up on:</p>
  <p><strong>Company:</strong> ${escapeHtml(company)}<br/>
     <strong>Role:</strong> ${escapeHtml(roleTitle)}</p>
  <p><strong>Message:</strong></p>
  <p style="white-space: pre-wrap; border-left: 3px solid #6366f1; padding-left: 12px; margin: 0 0 1rem;">${escapeHtml(bodyMessage)}</p>
  <p><strong>Reminder time:</strong> ${escapeHtml(dateLine)}</p>
  ${iso ? `<p style="font-size: 12px; color: #6b7280;">ISO (UTC): ${escapeHtml(iso)}</p>` : ''}
  <p style="margin-top: 1.5rem;">Stay consistent and keep applying 🚀</p>
  <p style="margin-top: 1.5rem; font-size: 12px; color: #6b7280;">— HireBoard</p>
</body>
</html>`.trim();

  const transporter = createTransport();
  await transporter.sendMail({
    from,
    to,
    subject: 'Reminder: Follow up on your job application',
    text,
    html,
  });
}
