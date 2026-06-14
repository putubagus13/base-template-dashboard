// src/app/auth/register/page.tsx
import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Accept Invitation" };

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Set Up Your Account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete your registration using the invitation link sent to your
          email.
        </p>
      </div>
      <RegisterForm />
    </>
  );
}
