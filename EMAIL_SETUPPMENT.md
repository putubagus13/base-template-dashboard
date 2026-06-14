# Email Integration — Resend

Dokumen ini menjelaskan proses integrasi email menggunakan [Resend](https://resend.com) sebagai pengganti Nodemailer/SMTP.

---

## Daftar Isi

1. [Mengapa Resend?](#mengapa-resend)
2. [Prasyarat](#prasyarat)
3. [Setup & Konfigurasi](#setup--konfigurasi)
4. [Struktur File](#struktur-file)
5. [Flow Pengiriman Email](#flow-pengiriman-email)
6. [Jenis Email yang Dikirim](#jenis-email-yang-dikirim)
7. [Testing di Development](#testing-di-development)
8. [Troubleshooting](#troubleshooting)

---

## Mengapa Resend?

| Aspek               | Nodemailer (SMTP)                  | Resend                          |
| ------------------- | ---------------------------------- | ------------------------------- |
| Setup               | Butuh SMTP server, port, auth      | Cukup API key                   |
| Deliverability      | Bergantung pada SMTP provider      | Tinggi (infrastruktur khusus)   |
| Dashboard           | Tidak ada                          | Ada (tracking, logs, analytics) |
| Domain Verification | Manual (SPF/DKIM di DNS)           | Guided setup di dashboard       |
| Rate Limit          | Bergantung provider                | 100 emails/day (free tier)      |
| SDK                 | `nodemailer` + `@types/nodemailer` | `resend` (lightweight, typed)   |

---

## Prasyarat

- Akun Resend (daftar di [resend.com](https://resend.com))
- Domain yang sudah diverifikasi di Resend dashboard
- API key dari Resend dashboard

---

## Setup & Konfigurasi

### 1. Install Dependency

```bash
npm install resend
```

### 2. Dapatkan API Key

1. Login ke [Resend Dashboard](https://resend.com/dashboard)
2. Navigasi ke **API Keys** → **Create API Key**
3. Beri nama (misal: `dashboard-app`) → copy key yang dimulai dengan `re_`

### 3. Verifikasi Domain

1. Navigasi ke **Domains** → **Add Domain**
2. Masukkan domain kamu (misal: `stttunasgunadharma.com`)
3. Tambahkan DNS records yang diminta:
   - **MX** records (untuk menerima reply)
   - **TXT** records (untuk SPF & DKIM verification)
   - **CNAME** record (untuk tracking)
4. Tunggu verifikasi (biasanya beberapa menit hingga 1 jam)

> **Tip:** Untuk testing, Resend menyediakan domain `onboarding@resend.dev` yang bisa langsung dipakai tanpa verifikasi domain.

### 4. Set Environment Variables

Update file `.env`:

```env
# ─── Email (Resend) ────────────────────────────────────────────
RESEND_API_KEY="re_your_actual_api_key_here"
EMAIL_FROM="Dashboard <noreply@yourdomain.com>"
```

| Variable         | Deskripsi                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | API key dari Resend dashboard (dimulai dengan `re_`)                                                              |
| `EMAIL_FROM`     | Alamat pengirim. Format: `"Display Name <email@domain.com>"`. Domain **harus** yang sudah diverifikasi di Resend. |

---

## Struktur File

```
src/lib/email/
├── transport.ts   ← Resend SDK client & sendEmail() function
├── templates.ts   ← HTML email templates (verification, reset, invitation)
└── index.ts       ← High-level functions (sendVerificationEmail, dll)
```

### `transport.ts` — Resend Client

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Dashboard <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}
```

**Key behaviors:**

- Jika `RESEND_API_KEY` tidak diset, email akan di-skip (tidak throw error)
- Error dari Resend di-log ke console, tidak propagate ke caller
- Ini memastikan flow bisnis tetap berjalan meskipun email gagal

### `templates.ts` — HTML Templates

Template email branded dengan:

- Header gradient (brand color `#1f7ea6`)
- Responsive layout (max-width 480px)
- CTA button yang prominent
- Footer dengan copyright

### `index.ts` — High-Level Functions

```typescript
sendVerificationEmail(email, name, token); // Verifikasi email saat registrasi
sendPasswordResetEmail(email, name, token); // Reset password
sendInvitationEmail(email, token); // Undangan registrasi dari admin
```

---

## Flow Pengiriman Email

### 1. Email Verification (saat registrasi via invitation)

```
Admin creates user → POST /api/users
  → Creates user (status: PENDING_VERIFICATION)
  → Creates EMAIL_VERIFICATION token (24h expiry)
  → sendVerificationEmail() → Resend API
  → User clicks link → GET /api/auth/verify-email?token=xxx
  → User status → ACTIVE
```

### 2. Password Reset

```
User requests reset → POST /api/auth/forgot-password
  → Creates PASSWORD_RESET token (1h expiry)
  → sendPasswordResetEmail() → Resend API
  → User clicks link → /auth/reset-password?token=xxx
  → User submits new password → POST /api/auth/reset-password
  → Password updated, token revoked
```

### 3. Invitation Email

```
Admin adds user → POST /api/users
  → Creates INVITATION token (7d expiry)
  → sendInvitationEmail() → Resend API
  → User clicks link → /auth/register?token=xxx
  → Form validates token → GET /api/auth/validate-invitation
  → User fills form → POST /api/auth/register
  → User created, invitation marked as used
  → Verification email sent (flow #1)
```

---

## Jenis Email yang Dikirim

| Email              | Trigger                        | Template                    | Expiry |
| ------------------ | ------------------------------ | --------------------------- | ------ |
| **Verification**   | Admin add user / Self-register | `emailVerificationTemplate` | 24 jam |
| **Password Reset** | Forgot password                | `passwordResetTemplate`     | 1 jam  |
| **Invitation**     | Admin add user                 | `invitationTemplate`        | 7 hari |

---

## Testing di Development

### Tanpa Domain Verifikasi

Jika belum setup domain, Resend akan mengirim menggunakan `onboarding@resend.dev`:

```env
RESEND_API_KEY="re_test_key_123"
# EMAIL_FROM tidak perlu diset — akan fallback ke onboarding@resend.dev
```

Email tetap terkirim tapi hanya ke **email yang sama dengan akun Resend kamu** (restricted di free tier).

### Verifikasi Lokal

1. Set `RESEND_API_KEY` dengan test key
2. Trigger salah satu flow (misal: forgot password)
3. Cek inbox email tujuan
4. Cek Resend dashboard → **Emails** untuk melihat status delivery

### Cek Logs

```bash
# Di terminal Next.js dev server, lihat log:
[Email] Sent to user@example.com: Verify your email address (id: email_xxx)

# Jika API key tidak diset:
[Email] Skipped (no API key) — to: user@example.com, subject: ...

# Jika gagal:
[Email] Failed to send to user@example.com: error message
```

---

## Troubleshooting

### `RESEND_API_KEY is not set`

Pastikan `.env` sudah berisi `RESEND_API_KEY` dan server sudah di-restart.

### `Invalid sender address`

`EMAIL_FROM` harus menggunakan domain yang sudah diverifikasi di Resend dashboard. Untuk testing, hapus `EMAIL_FROM` agar fallback ke `onboarding@resend.dev`.

### Email masuk ke spam

1. Verifikasi domain di Resend (SPF, DKIM, DMARC)
2. Gunakan alamat pengirim yang jelas (bukan noreply@ jika memungkinkan)
3. Pastikan isi email tidak terlalu banyak link atau gambar

### Rate limit exceeded

Free tier Resend membatasi **100 emails/hari** dan **3 emails/second**. Jika butuh lebih, upgrade ke paid plan.

### Migrasi dari Nodemailer

Jika sebelumnya sudah pakai Nodemailer:

1. Hapus dependency: `npm uninstall nodemailer @types/nodemailer`
2. Install Resend: `npm install resend`
3. Ganti env vars: hapus `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
4. Tambah env var: `RESEND_API_KEY`
5. File `templates.ts` dan `index.ts` **tidak perlu diubah** — hanya `transport.ts` yang berubah
