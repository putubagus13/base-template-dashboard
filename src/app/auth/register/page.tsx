// src/app/auth/register/page.tsx
import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Terima Undangan" };

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Siapkan Akun Anda</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lengkapi registrasi Anda menggunakan tautan undangan yang dikirim ke
          email Anda.
        </p>
      </div>
      <RegisterForm />
    </>
  );
}
