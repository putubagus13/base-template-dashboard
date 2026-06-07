// src/utils/format.ts
// ============================================================
// FORMATTING UTILITIES
// Gunakan fungsi-fungsi ini untuk format data secara konsisten.
// ============================================================

/**
 * Format date ke string yang human-readable (ID locale).
 *
 * @example
 * formatDate("2024-01-15") // "15 Jan 2024"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format datetime dengan jam dan menit.
 *
 * @example
 * formatDateTime("2024-01-15T10:30:00") // "15 Jan 2024, 10:30"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time (e.g. "2 hours ago").
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diff = new Date(date).getTime() - Date.now();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(seconds) < 60) return rtf.format(seconds, "second");
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(days, "day");
}

/**
 * Truncate string dengan ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

/**
 * Capitalize first letter.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format permission string untuk display.
 * "read:user" → "Read User"
 */
export function formatPermission(permission: string): string {
  const [action, subject] = permission.split(":");
  if (!action || !subject) return permission;
  return `${capitalize(action)} ${capitalize(subject)}`;
}

/**
 * Get initials dari nama.
 * "John Doe" → "JD"
 */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, maxChars)
    .join("")
    .toUpperCase();
}
