// src/types/api.ts
// ============================================================
// BASE API RESPONSE TYPES
// Semua response dari API harus mengikuti struktur ini.
// ============================================================

/**
 * Standard API response structure.
 * Selalu gunakan tipe ini sebagai return type dari API routes.
 *
 * @template T - Tipe data payload
 *
 * @example
 * // Success response
 * const response: ApiResponse<User> = {
 *   success: true,
 *   message: "User fetched successfully",
 *   data: { id: "1", name: "John" }
 * }
 *
 * // Error response
 * const response: ApiResponse<null> = {
 *   success: false,
 *   message: "User not found",
 *   error: { code: "NOT_FOUND", details: [...] }
 * }
 */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
};

/**
 * Standard error structure dalam API response.
 */
export type ApiError = {
  code: ErrorCode;
  details?: ValidationError[];
};

/**
 * Validation error per-field, digunakan untuk form feedback.
 */
export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Standard error codes untuk konsistensi handling di frontend.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "ACCOUNT_INACTIVE"
  | "EMAIL_NOT_VERIFIED"
  | "RATE_LIMIT_EXCEEDED";

/**
 * Paginated response wrapper untuk list endpoints.
 *
 * @template T - Tipe item dalam array
 */
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: PaginationMeta;
};

/**
 * Metadata pagination yang dikirim bersama list response.
 */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/**
 * Query parameters umum untuk list endpoints.
 */
export type ListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
