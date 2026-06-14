// src/lib/email/index.ts
// ============================================================
// Email service — high-level send functions
// ============================================================

import { sendEmail } from "./transport";
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  invitationTemplate,
} from "./templates";

const APP_URL = () =>
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${APP_URL()}/auth/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your email address",
    html: emailVerificationTemplate(name, verifyUrl),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${APP_URL()}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: passwordResetTemplate(name, resetUrl),
  });
}

export async function sendInvitationEmail(email: string, token: string) {
  const inviteUrl = `${APP_URL()}/auth/register?token=${token}`;
  await sendEmail({
    to: email,
    subject: "You've been invited to join",
    html: invitationTemplate(email, inviteUrl),
  });
}
