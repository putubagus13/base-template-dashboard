// src/lib/export-file.ts
// ============================================================
// CLIENT-SIDE FILE EXPORT UTILITY
// Helper untuk trigger download file dari API response (Blob).
// ============================================================

/**
 * Trigger a file download from a URL with optional query params.
 * Fetches the file as a blob and triggers a browser download.
 *
 * @param url - The API endpoint URL
 * @param params - Optional query parameters
 * @param fallbackFilename - Fallback filename if Content-Disposition is missing
 */
export async function exportFileFromApi(
  url: string,
  params?: Record<string, string | undefined>,
  fallbackFilename: string = "export.xlsx"
): Promise<void> {
  // Build query string
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.set(key, value);
      }
    });
  }

  const queryString = searchParams.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  const response = await fetch(fullUrl, {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Export failed with status ${response.status}`);
  }

  const blob = await response.blob();

  // Try to extract filename from Content-Disposition header
  const disposition = response.headers.get("Content-Disposition");
  let filename = fallbackFilename;
  if (disposition) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match?.[1]) {
      filename = match[1];
    }
  }

  // Trigger download
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
