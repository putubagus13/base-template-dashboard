// src/lib/validations/auth.ts
// ============================================================
// AUTH VALIDATION SCHEMAS (Zod)
// Schemas ini digunakan di API routes dan forms.
// ============================================================

import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter")
  .max(100, "Kata sandi maksimal 100 karakter")
  .regex(/[A-Z]/, "Kata sandi harus mengandung minimal satu huruf besar")
  .regex(/[a-z]/, "Kata sandi harus mengandung minimal satu huruf kecil")
  .regex(/[0-9]/, "Kata sandi harus mengandung minimal satu angka")
  .regex(
    /[^A-Za-z0-9]/,
    "Kata sandi harus mengandung minimal satu karakter khusus"
  );

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Masukkan alamat email yang valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter")
      .regex(/^[a-zA-Z\s]+$/, "Nama hanya boleh mengandung huruf dan spasi"),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Masukkan alamat email yang valid"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
    token: z.string().min(1, "Token undangan wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Masukkan alamat email yang valid"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token reset wajib diisi"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

// Infer types dari schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
