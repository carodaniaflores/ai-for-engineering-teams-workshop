'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ExportRequest,
  buildFileName,
  convertToCSV,
  convertToJSON,
  downloadFile,
  createAuditEntry,
} from '../lib/exportUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseExportReturn {
  isExporting: boolean;
  progress: number; // 0–100
  error: string | null;
  startExport: (request: ExportRequest, data: unknown[]) => void;
  cancelExport: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useExport
 *
 * Provides export capability to any widget.
 * Handles progress tracking, cancellation, audit logging, and file download.
 */
export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const cancelExport = useCallback(() => {
    cancelledRef.current = true;
    setIsExporting(false);
    setProgress(0);
  }, []);

  const startExport = useCallback(
    (request: ExportRequest, data: unknown[]) => {
      if (isExporting) return;

      cancelledRef.current = false;
      setIsExporting(true);
      setProgress(0);
      setError(null);

      // Run asynchronously so UI can update
      (async () => {
        try {
          // Simulate chunked processing with progress
          for (let i = 0; i <= 100; i += 20) {
            if (cancelledRef.current) return;
            setProgress(i);
            // Yield to event loop
            await new Promise((resolve) => setTimeout(resolve, 50));
          }

          if (cancelledRef.current) return;

          const fileName = buildFileName(request.dataSource, request.format);
          let content: string;
          let mimeType: string;

          if (request.format === 'csv') {
            content = convertToCSV(data);
            mimeType = 'text/csv';
          } else {
            content = convertToJSON(data);
            mimeType = 'application/json';
          }

          downloadFile(content, fileName, mimeType);
          createAuditEntry(request);

          setProgress(100);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Export failed.');
        } finally {
          setIsExporting(false);
        }
      })();
    },
    [isExporting],
  );

  return { isExporting, progress, error, startExport, cancelExport };
}
