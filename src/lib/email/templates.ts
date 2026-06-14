// src/lib/email/templates.ts
// ============================================================
// Reusable HTML email templates
// ============================================================

const APP_NAME = "STT Tunas Guna Dharma";
const BASE_STYLE = `
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1f7ea6, #0c5f8c); padding: 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
  .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; }
  .body { padding: 32px; }
  .body p { color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
  .btn { display: inline-block; background: #1f7ea6; color: #fff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 0; }
  .btn:hover { background: #0c5f8c; }
  .muted { color: #94a3b8; font-size: 12px; }
  .footer { padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center; }
  .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
`;

function wrapEmail(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${title}</title>
    <style>${BASE_STYLE}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${APP_NAME}</h1>
          <p>Dashboard Management System</p>
        </div>
        <div class="body">${body}</div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── Email Verification ──────────────────────────────────────

export function emailVerificationTemplate(
  name: string,
  verifyUrl: string
): string {
  return wrapEmail(
    "Verify Your Email",
    `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Welcome! Please verify your email address to activate your account.</p>
      <p style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </p>
      <p class="muted">If you didn't create this account, you can safely ignore this email.</p>
      <p class="muted">This link will expire in 24 hours.</p>
    `
  );
}

// ─── Password Reset ──────────────────────────────────────────

export function passwordResetTemplate(name: string, resetUrl: string): string {
  return wrapEmail(
    "Reset Your Password",
    `
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </p>
      <p class="muted">If you didn't request this, you can safely ignore this email.</p>
      <p class="muted">This link will expire in 1 hour.</p>
    `
  );
}

// ─── Invitation ──────────────────────────────────────────────

export function invitationTemplate(email: string, inviteUrl: string): string {
  return wrapEmail(
    "You've Been Invited",
    `
      <p>Hello,</p>
      <p>You've been invited to join <strong>${APP_NAME}</strong> as a user. Click the button below to set up your account.</p>
      <p style="text-align: center;">
        <a href="${inviteUrl}" class="btn">Accept Invitation</a>
      </p>
      <p class="muted">This invitation was sent to <strong>${email}</strong>.</p>
      <p class="muted">This link will expire in 7 days.</p>
    `
  );
}
