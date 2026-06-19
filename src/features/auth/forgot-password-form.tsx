// src/components/auth/forgot-password-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { useForgotPassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword.mutate(data);
  };

  if (forgotPassword.isSuccess) {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-6 w-6 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-emerald-900">
          Periksa email Anda
        </h3>
        <p className="mt-1 text-sm text-emerald-700">
          Jika akun terdaftar, kami telah mengirimkan tautan reset kata sandi ke
          kotak masuk Anda.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-block text-sm text-brand-600 hover:underline"
        >
          Kembali ke masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormField
        label="Alamat email"
        htmlFor="email"
        error={errors.email?.message}
        required
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
      </FormField>

      <Button
        type="submit"
        className="w-full"
        isLoading={forgotPassword.isPending}
      >
        Kirim tautan reset
      </Button>

      <Link
        href="/auth/login"
        className="flex items-center justify-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke masuk
      </Link>
    </form>
  );
}
