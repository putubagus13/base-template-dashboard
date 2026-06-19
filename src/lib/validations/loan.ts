// src/lib/validations/loan.ts
// ============================================================
// LOAN (PINJAMAN) VALIDATION SCHEMAS
// ============================================================

import { z } from "zod";

export const createLoanSchema = z.object({
  borrowerId: z.string().uuid("Peminjam tidak valid"),
  accountId: z.string().uuid("Akun kas tidak valid"),
  principal: z.number().positive("Nominal pinjaman harus lebih dari 0"),
  interestRate: z
    .number()
    .min(0, "Suku bunga tidak boleh negatif")
    .max(100, "Suku bunga maksimal 100%"),
  durationMonths: z
    .number()
    .int("Durasi harus bilangan bulat")
    .positive("Durasi harus lebih dari 0 bulan"),
  loanDate: z.string().min(1, "Tanggal pinjaman wajib diisi"),
  purpose: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateLoanSchema = createLoanSchema.partial();

export const verifyLoanSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional().nullable(),
});

export const createLoanPaymentSchema = z.object({
  amount: z.number().positive("Nominal pembayaran harus lebih dari 0"),
  paymentDate: z.string().min(1, "Tanggal pembayaran wajib diisi"),
  notes: z.string().optional().nullable(),
});

export const updateLoanPaymentSchema = createLoanPaymentSchema.partial();

export const createBorrowerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  memberId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});
