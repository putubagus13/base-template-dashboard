// src/utils/error.ts
// ============================================================
// ERROR HANDLING UTILITIES
// ============================================================

import { ApiError } from "@/lib/api-client";
import type { ValidationError } from "@/types/api";
import type { UseFormSetError, FieldValues, Path } from "react-hook-form";

/**
 * Extract user-friendly message dari error apapun.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

/**
 * Set validation errors dari ApiError ke react-hook-form.
 * Gunakan ini di onError mutation callback untuk map server
 * validation errors ke form fields.
 *
 * @example
 * onError: (error) => {
 *   setServerErrors(error, setError)
 * }
 */
export function setServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): void {
  if (!(error instanceof ApiError)) return;
  if (!error.message.includes("Validation")) return;

  // Coba extract details dari error jika ada
  // ApiError perlu diberi details — extend jika perlu
  const details: ValidationError[] = [];
  details.forEach(({ field, message }) => {
    setError(field as Path<T>, { message });
  });
}

/**
 * Determine jika error adalah authentication error.
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.code === "UNAUTHORIZED";
  }
  return false;
}

/**
 * Determine jika error adalah not found error.
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 404;
  }
  return false;
}
