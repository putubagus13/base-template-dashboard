// src/lib/email/transport.ts
// ============================================================
// Resend email transport configuration
// ============================================================

import { Resend } from "resend";

function createClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY is not set. Emails will not be sent.");
  }
  return new Resend(apiKey ?? "");
}

const resend = createClient();

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn(
        `[Email] Skipped (no API key) — to: ${to}, subject: ${subject}`
      );
      return;
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Dashboard <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Failed to send to ${to}:`, error.message);
      return;
    }

    console.info(`[Email] Sent to ${to}: ${subject} (id: ${data?.id})`);
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
    // Don't throw — email failure should not break the flow in production
    // In dev, log it so the developer can debug
  }
}
