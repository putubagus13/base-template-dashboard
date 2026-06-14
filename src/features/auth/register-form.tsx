// src/components/auth/register-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ROUTES } from "@/config/routes";

type InvitationInfo = {
  email: string;
  roleIds: string[];
  organizationId: string | null;
};

export function RegisterForm() {
  const register_ = useRegister();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InvitationInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);

  // Validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setInviteError(
        "No invitation token provided. Registration requires a valid invitation link."
      );
      setInviteLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await apiClient.get<{
          email: string;
          roleIds: string[];
          organizationId: string | null;
        }>(`${ROUTES.api.auth.validateInvitation}?token=${token}`);
        if (res.data) {
          setInviteInfo(res.data);
        } else {
          setInviteError(res.message ?? "Invalid invitation.");
        }
      } catch {
        setInviteError(
          "Failed to validate invitation. The link may be invalid or expired."
        );
      } finally {
        setInviteLoading(false);
      }
    })();
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { token },
  });

  // Pre-fill email from invitation and set token
  useEffect(() => {
    if (inviteInfo?.email) {
      setValue("email", inviteInfo.email);
    }
    setValue("token", token);
  }, [inviteInfo, token, setValue]);

  const onSubmit = (data: RegisterInput) => {
    register_.mutate(data);
  };

  // Loading state
  if (inviteLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        <span className="ml-2 text-sm text-slate-500">
          Validating invitation...
        </span>
      </div>
    );
  }

  // Error state (no valid invitation)
  if (inviteError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <h2 className="mt-3 text-lg font-semibold text-red-800">
          Invalid Invitation
        </h2>
        <p className="mt-1 text-sm text-red-600">{inviteError}</p>
        <p className="mt-4 text-sm text-slate-500">
          Registration is only available via invitation link. Please contact
          your administrator.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          Back to Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Hidden token field */}
      <input type="hidden" {...register("token")} />

      <FormField
        label="Full name"
        htmlFor="name"
        error={errors.name?.message}
        required
      >
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register("name")}
        />
      </FormField>

      <FormField
        label="Email address"
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
          readOnly={!!inviteInfo?.email}
          className={inviteInfo?.email ? "bg-slate-50" : ""}
          {...register("email")}
        />
        {inviteInfo?.email && (
          <p className="mt-1 text-xs text-slate-400">
            Email is pre-filled from your invitation.
          </p>
        )}
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
        hint="Min. 8 characters with uppercase, lowercase, number & special character"
        required
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </FormField>

      <FormField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
        required
      >
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            className="pr-10"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </FormField>

      <Button type="submit" className="w-full" isLoading={register_.isPending}>
        Create account
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-brand-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
