// src/lib/api-response.ts
// ============================================================
// API RESPONSE BUILDER
// Gunakan helper ini di semua API route handlers.
// JANGAN buat response manual tanpa menggunakan helper ini.
//
// Contoh penggunaan:
//   return ApiResponseBuilder.success({ user }, "User fetched", 200)
//   return ApiResponseBuilder.error("NOT_FOUND", "User not found", 404)
// ============================================================

import { NextResponse } from "next/server";
import type {
  ApiResponse,
  ApiError,
  ErrorCode,
  ValidationError,
} from "@/types/api";

export class ApiResponseBuilder {
  /**
   * Buat success response.
   *
   * @param data - Payload data
   * @param message - Pesan sukses
   * @param statusCode - HTTP status code (default: 200)
   */
  static success<T>(
    data: T,
    message: string = "Request successful",
    statusCode: number = 200,
    meta?: Record<string, unknown>
  ): NextResponse<ApiResponse<T>> {
    const body: ApiResponse<T> = {
      success: true,
      message,
      data,
      ...(meta && meta !== undefined ? { meta } : {}),
    };
    return NextResponse.json(body, { status: statusCode });
  }

  /**
   * Buat error response.
   *
   * @param code - Error code dari ErrorCode type
   * @param message - Pesan error yang human-readable
   * @param statusCode - HTTP status code
   * @param details - Array validation errors (opsional)
   */
  static error(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: ValidationError[]
  ): NextResponse<ApiResponse<null>> {
    const error: ApiError = {
      code,
      ...(details && details.length > 0 ? { details } : {}),
    };

    return NextResponse.json(
      {
        success: false,
        message,
        error,
      },
      { status: statusCode }
    );
  }

  /**
   * Buat validation error response (400).
   * Digunakan untuk Zod validation failures.
   */
  static validationError(
    details: ValidationError[]
  ): NextResponse<ApiResponse<null>> {
    return this.error(
      "VALIDATION_ERROR",
      "Validation failed. Please check your input.",
      400,
      details
    );
  }

  /**
   * Buat unauthorized response (401).
   */
  static unauthorized(
    message: string = "Authentication required."
  ): NextResponse<ApiResponse<null>> {
    return this.error("UNAUTHORIZED", message, 401);
  }

  /**
   * Buat forbidden response (403).
   */
  static forbidden(
    message: string = "You do not have permission to perform this action."
  ): NextResponse<ApiResponse<null>> {
    return this.error("FORBIDDEN", message, 403);
  }

  /**
   * Buat not found response (404).
   */
  static notFound(
    resource: string = "Resource"
  ): NextResponse<ApiResponse<null>> {
    return this.error("NOT_FOUND", `${resource} not found.`, 404);
  }

  /**
   * Buat conflict response (409).
   * Digunakan untuk duplicate data.
   */
  static conflict(message: string): NextResponse<ApiResponse<null>> {
    return this.error("CONFLICT", message, 409);
  }

  /**
   * Buat internal server error response (500).
   * Log error sebelum mengirim response ini.
   */
  static internalError(
    message: string = "An unexpected error occurred. Please try again later."
  ): NextResponse<ApiResponse<null>> {
    return this.error("INTERNAL_SERVER_ERROR", message, 500);
  }
}

/**
 * Helper untuk extract Zod validation errors ke ValidationError[].
 *
 * @example
 * const result = schema.safeParse(body)
 * if (!result.success) {
 *   return ApiResponseBuilder.validationError(formatZodErrors(result.error))
 * }
 */
export function formatZodErrors(zodError: {
  errors: Array<{ path: (string | number)[]; message: string }>;
}): ValidationError[] {
  return zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}
