// src/app/dashboard/profile/_components/profile-client.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Shield, Mail, Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
} from "@/hooks/use-profile";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/badge";

// ─── Schemas ──────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

// ─── Profile Info Form ────────────────────────────────────────

function ProfileInfoSection() {
  const { data, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (data?.data) {
      reset({ name: data.data.name });
    }
  }, [data?.data, reset]);

  const onSubmit = (values: ProfileInput) => {
    updateProfile.mutate(values, { onSuccess: () => reset(values) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const user = data?.data;
  if (!user) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">
          Personal Information
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Update your name and account details.
        </p>
      </div>

      <div className="p-6">
        {/* Avatar + Meta */}
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user.name} src={user.avatar} size="xl" />
          <div>
            <p className="text-lg font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <StatusBadge status={user.status} />
              {user.roles.map((r) => (
                <Badge key={r.id} variant="secondary">
                  {r.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{user.email}</span>
            {user.emailVerifiedAt && (
              <span className="ml-auto shrink-0 text-xs text-emerald-600 font-medium">
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              Joined{" "}
              {new Date(user.createdAt).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {user.lastLoginAt && (
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                Last login {new Date(user.lastLoginAt).toLocaleString("id-ID")}
              </span>
            </div>
          )}
        </div>

        {/* Edit form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 max-w-sm"
          noValidate
        >
          <FormField
            label="Full name"
            htmlFor="profile-name"
            error={errors.name?.message}
            required
          >
            <Input
              id="profile-name"
              error={errors.name?.message}
              {...register("name")}
            />
          </FormField>

          <div className="flex gap-2">
            <Button
              type="submit"
              isLoading={updateProfile.isPending}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
            {isDirty && (
              <Button type="button" variant="ghost" onClick={() => reset()}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Roles & Permissions summary */}
      {user.roles.length > 0 && (
        <div className="border-t border-slate-200 px-6 py-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Shield className="h-4 w-4 text-indigo-500" />
            Permissions
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {user.roles.flatMap((r) =>
              r.permissions.map((p, _i) => (
                <Badge
                  key={p.id + _i}
                  variant="outline"
                  className="text-[11px]"
                >
                  {p.action}:{p.subject}
                </Badge>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Change Password Section ──────────────────────────────────

function ChangePasswordSection() {
  const changePassword = useChangePassword();
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: PasswordInput) => {
    changePassword.mutate(data, { onSuccess: () => reset() });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">
          Change Password
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          After changing your password, you will be logged out from all devices.
        </p>
      </div>

      <div className="p-6">
        <Alert variant="warning" className="mb-5">
          Changing your password will immediately invalidate all active sessions
          and you&apos;ll need to sign in again.
        </Alert>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 max-w-sm"
          noValidate
        >
          <FormField
            label="Current password"
            htmlFor="curr-pass"
            error={errors.currentPassword?.message}
            required
          >
            <div className="relative">
              <Input
                id="curr-pass"
                type={show.current ? "text" : "password"}
                error={errors.currentPassword?.message}
                className="pr-10"
                {...register("currentPassword")}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {show.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          <FormField
            label="New password"
            htmlFor="new-pass"
            error={errors.newPassword?.message}
            hint="Min 8 chars with uppercase, lowercase, number & special character"
            required
          >
            <div className="relative">
              <Input
                id="new-pass"
                type={show.new ? "text" : "password"}
                error={errors.newPassword?.message}
                className="pr-10"
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {show.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          <FormField
            label="Confirm new password"
            htmlFor="conf-pass"
            error={errors.confirmPassword?.message}
            required
          >
            <div className="relative">
              <Input
                id="conf-pass"
                type={show.confirm ? "text" : "password"}
                error={errors.confirmPassword?.message}
                className="pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {show.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          <Button type="submit" isLoading={changePassword.isPending}>
            Change Password
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────

export function ProfileClient() {
  return (
    <div className="space-y-6 max-w-2xl">
      <ProfileInfoSection />
      <ChangePasswordSection />
    </div>
  );
}
