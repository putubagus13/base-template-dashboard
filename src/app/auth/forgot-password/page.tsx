// src/app/auth/forgot-password/page.tsx
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Lupa kata sandi" };

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Lupa kata sandi Anda?
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Jangan khawatir — kami akan mengirimkan tautan reset ke email Anda.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
