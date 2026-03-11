// src/lib/exportUtils.ts
// Pure export utility functions — no side effects except file download trigger.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportFormat = 'csv' | 'json';

export type ExportDataSource =
  | 'customers'
  | 'health-reports'
  | 'alert-history'
  | 'market-intelligence';

export interface ExportFilters {
  /** ISO-8601 start date (inclusive). Omit for no lower bound. */
  fromDate?: string;
  /** ISO-8601 end date (inclusive). Omit for no upper bound. */
  toDate?: string;
  /** Filter by customer segment / subscription tier. */
  segment?: string;
}

export interface ExportRequest {
  format: ExportFormat;
  dataSource: ExportDataSource;
  filters: ExportFilters;
  requestedAt: string; // ISO-8601
}

export interface ExportAuditEntry {
  exportId: string;
  dataSource: ExportDataSource;
  format: ExportFormat;
  filters: ExportFilters;
  requestedAt: string;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// File naming
// ---------------------------------------------------------------------------

/**
 * Build a timestamped export filename.
 * e.g. `customers-export-2026-03-11.csv`
 */
export function buildFileName(dataSource: ExportDataSource, format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${dataSource}-export-${date}.${format}`;
}

// ---------------------------------------------------------------------------
// CSV conversion
// ---------------------------------------------------------------------------

/**
 * Convert an array of plain objects to a CSV string.
 * Keys of the first object become headers.
 * Values are escaped to prevent CSV injection.
 */
export function convertToCSV(data: unknown[]): string {
  if (data.length === 0) return '';

  const rows = data as Record<string, unknown>[];
  const headers = Object.keys(rows[0]);

  const escapeCellValue = (value: unknown): string => {
    const str = value === null || value === undefined ? '' : String(value);
    // Escape double-quotes and wrap in quotes if the value contains special chars
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCellValue).join(',');
  const dataLines = rows.map((row) =>
    headers.map((key) => escapeCellValue(row[key])).join(','),
  );

  return [headerLine, ...dataLines].join('\n');
}

// ---------------------------------------------------------------------------
// JSON conversion
// ---------------------------------------------------------------------------

/**
 * Convert data to a pretty-printed JSON string.
 */
export function convertToJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// ---------------------------------------------------------------------------
// File download (browser-only)
// ---------------------------------------------------------------------------

/**
 * Trigger a file download in the browser.
 * No-op in non-browser environments.
 */
export function downloadFile(content: string, fileName: string, mimeType: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

// In-memory audit log (replace with persistent storage / API call in production).
const auditLog: ExportAuditEntry[] = [];

/**
 * Append an audit entry for a completed export.
 * Returns the created entry for testing / further processing.
 */
export function createAuditEntry(request: ExportRequest): ExportAuditEntry {
  const entry: ExportAuditEntry = {
    exportId: `exp-${Date.now().toString(36)}`,
    dataSource: request.dataSource,
    format: request.format,
    filters: request.filters,
    requestedAt: request.requestedAt,
    completedAt: new Date().toISOString(),
  };
  auditLog.push(entry);
  return entry;
}

/** Return a copy of the full audit log. */
export function getAuditLog(): ExportAuditEntry[] {
  return [...auditLog];
}
