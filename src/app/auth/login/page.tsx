// src/app/auth/login/page.tsx
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Selamat datang kembali
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Masuk ke akun Anda untuk melanjutkan
        </p>
      </div>
      <LoginForm />
    </>
  );
}
