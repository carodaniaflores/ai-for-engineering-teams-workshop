'use client';

import { useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorReport {
  errorId: string;
  boundary: 'dashboard' | 'widget';
  message: string;
  context: Record<string, unknown>;
  timestamp: string;
}

export interface UseErrorReportingReturn {
  reportError: (
    error: Error,
    boundary: ErrorReport['boundary'],
    context?: Record<string, unknown>,
  ) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateErrorId(): string {
  return `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Sanitize the error message for production: strip file paths and stack traces.
 * In development mode the full message is preserved.
 */
function sanitizeMessage(message: string): string {
  if (process.env.NODE_ENV === 'development') return message;
  // Remove anything that looks like a file path or stack frame
  return message.replace(/(\s+at\s+.+)+/g, '').replace(/\/.+\.(ts|tsx|js|jsx)/g, '[file]').trim();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useErrorReporting
 *
 * Provides a `reportError` function that logs structured error reports.
 * In production, sensitive details are stripped from the report payload.
 * Replace the console-based sink with your monitoring integration
 * (e.g. Sentry, Datadog) by updating the `sink` function below.
 */
export function useErrorReporting(): UseErrorReportingReturn {
  const reportError = useCallback(
    (
      error: Error,
      boundary: ErrorReport['boundary'],
      context: Record<string, unknown> = {},
    ) => {
      const report: ErrorReport = {
        errorId: generateErrorId(),
        boundary,
        message: sanitizeMessage(error.message),
        // Never include stack traces or PII in production context payloads.
        context:
          process.env.NODE_ENV === 'development'
            ? { ...context, stack: error.stack }
            : context,
        timestamp: new Date().toISOString(),
      };

      // Sink: swap for a real monitoring integration in production.
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[ErrorReporting]', report);
      }
      // Production: send to monitoring endpoint (implement as needed).
    },
    [],
  );

  return { reportError };
}
