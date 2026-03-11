'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  Suspense,
} from 'react';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import { useErrorReporting } from '../hooks/useErrorReporting';
import { useExport } from '../hooks/useExport';
import { Alert } from '../lib/alerts';
import { Customer } from '../data/mock-customers';
import {
  ExportFormat,
  ExportDataSource,
  ExportFilters,
  ExportRequest,
} from '../lib/exportUtils';
import { mockCustomers } from '../data/mock-customers';

// ---------------------------------------------------------------------------
// Re-export key spec interfaces so consumers can import from this module
// ---------------------------------------------------------------------------

export type { ExportRequest, ExportFormat, ExportDataSource, ExportFilters };
export type { ErrorReport } from '../hooks/useErrorReporting';

// ---------------------------------------------------------------------------
// DashboardConfig interface (spec requirement)
// ---------------------------------------------------------------------------

export type DashboardEnvironment = 'development' | 'staging' | 'production';

export interface DashboardFeatureFlags {
  /** Enable the export panel. */
  exportEnabled: boolean;
  /** Enable the predictive intelligence panel. */
  predictiveIntelligenceEnabled: boolean;
  /** Enable virtual scrolling for large customer lists (>50 rows). */
  virtualScrollEnabled: boolean;
}

export interface DashboardExportSettings {
  /** Maximum exports per session per minute (default: 10). */
  rateLimitPerMinute: number;
  /** Available export formats. */
  formats: ExportFormat[];
  /** Available data sources for export. */
  dataSources: ExportDataSource[];
}

export interface DashboardMonitoringEndpoints {
  /** URL for error reporting (e.g. Sentry ingest). */
  errorReportingUrl?: string;
  /** URL for performance metrics. */
  metricsUrl?: string;
}

export interface DashboardConfig {
  environment: DashboardEnvironment;
  featureFlags: DashboardFeatureFlags;
  exportSettings: DashboardExportSettings;
  monitoring: DashboardMonitoringEndpoints;
}

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: DashboardConfig = {
  environment:
    (process.env.NODE_ENV as DashboardEnvironment | undefined) ?? 'development',
  featureFlags: {
    exportEnabled: true,
    predictiveIntelligenceEnabled: true,
    virtualScrollEnabled: true,
  },
  exportSettings: {
    rateLimitPerMinute: 10,
    formats: ['csv', 'json'],
    dataSources: ['customers', 'health-reports', 'alert-history', 'market-intelligence'],
  },
  monitoring: {},
};

// ---------------------------------------------------------------------------
// Lazy-loaded widgets for code splitting (React.lazy + Suspense)
// ---------------------------------------------------------------------------

const CustomerCard = React.lazy(() => import('./CustomerCard'));
const CustomerHealthDisplay = React.lazy(() => import('./CustomerHealthDisplay'));
const AlertsPanel = React.lazy(() => import('./AlertsPanel'));
const MarketIntelligenceWidget = React.lazy(() => import('./MarketIntelligenceWidget'));
const PredictiveIntelligencePanel = React.lazy(() => import('./PredictiveIntelligencePanel'));

// ---------------------------------------------------------------------------
// Loading skeleton for Suspense fallbacks
// ---------------------------------------------------------------------------

function WidgetSkeleton({ height = 'h-48' }: { height?: string }): React.JSX.Element {
  return (
    <div
      aria-busy="true"
      aria-label="Loading widget"
      className={`rounded-xl border border-gray-200 bg-white ${height} animate-pulse`}
    />
  );
}

// ---------------------------------------------------------------------------
// Export dialog — keyboard accessible, focus-trapped
// ---------------------------------------------------------------------------

export interface ExportDialogProps {
  isOpen: boolean;
  config: DashboardConfig;
  isExporting: boolean;
  progress: number;
  exportError: string | null;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onExport: (request: ExportRequest) => void;
  onCancel: () => void;
  onClose: () => void;
}

function ExportDialog({
  isOpen,
  config,
  isExporting,
  progress,
  exportError,
  triggerRef,
  onExport,
  onCancel,
  onClose,
}: ExportDialogProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dataSource, setDataSource] = useState<ExportDataSource>('customers');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [segment, setSegment] = useState('');

  // Focus the dialog panel when it opens
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  // Focus trap: cycle through focusable elements within the dialog
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'Escape') {
      handleClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'));

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function handleClose(): void {
    onClose();
    // Restore focus to trigger element on close
    triggerRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const filters: ExportFilters = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    if (segment) filters.segment = segment;

    const request: ExportRequest = {
      format,
      dataSource,
      filters,
      requestedAt: new Date().toISOString(),
    };
    onExport(request);
  }

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      aria-modal="true"
      role="dialog"
      aria-labelledby="export-dialog-title"
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-200 p-6 focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            id="export-dialog-title"
            className="text-base font-semibold text-gray-900"
          >
            Export Data
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close export dialog"
            className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Export form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data source */}
          <div>
            <label
              htmlFor="export-data-source"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Data Source
            </label>
            <select
              id="export-data-source"
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as ExportDataSource)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
            >
              {config.exportSettings.dataSources.map((ds) => (
                <option key={ds} value={ds}>
                  {ds.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </legend>
            <div className="flex gap-4">
              {config.exportSettings.formats.map((fmt) => (
                <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="export-format"
                    value={fmt}
                    checked={format === fmt}
                    onChange={() => setFormat(fmt)}
                    disabled={isExporting}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 uppercase">{fmt}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Filters */}
          <fieldset className="border border-gray-100 rounded-lg p-3 space-y-3">
            <legend className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Filters (optional)
            </legend>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="export-from-date"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  From Date
                </label>
                <input
                  id="export-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  disabled={isExporting}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="export-to-date"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  To Date
                </label>
                <input
                  id="export-to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  disabled={isExporting}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="export-segment"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Customer Segment
              </label>
              <select
                id="export-segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                disabled={isExporting}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All segments</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </fieldset>

          {/* Progress indicator */}
          {isExporting && (
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Export progress: ${progress}%`}
              className="space-y-1"
            >
              <div className="flex justify-between text-xs text-gray-500">
                <span>Exporting…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Export error */}
          {exportError && !isExporting && (
            <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-xs text-red-700">{exportError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            {isExporting ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel Export
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Export
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const MemoizedExportDialog = React.memo(ExportDialog);

// ---------------------------------------------------------------------------
// DashboardOrchestrator Props
// ---------------------------------------------------------------------------

export interface DashboardOrchestratorProps {
  customers?: Customer[];
  initialAlerts?: Alert[];
  config?: Partial<DashboardConfig>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DashboardOrchestrator
 *
 * Root orchestration component for the Customer Intelligence Dashboard.
 *
 * Responsibilities:
 * - Multi-level error boundaries (DashboardErrorBoundary + per-widget WidgetErrorBoundary)
 * - React.lazy + Suspense for code-split widget loading
 * - Unified export system (useExport hook) with dialog, progress, and cancellation
 * - ARIA live region for alert notifications (polite, no focus steal)
 * - Skip-to-content link as first focusable element
 * - Semantic HTML landmarks with descriptive labels
 * - useCallback on all event handler props to memoized children
 * - useErrorReporting for manual and boundary error reporting
 */
export default function DashboardOrchestrator({
  customers = mockCustomers,
  initialAlerts = [],
  config: configOverride = {},
}: DashboardOrchestratorProps): React.JSX.Element {
  // Merge default config with any overrides — stable across renders
  const config = useMemo<DashboardConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ...configOverride,
      featureFlags: {
        ...DEFAULT_CONFIG.featureFlags,
        ...configOverride.featureFlags,
      },
      exportSettings: {
        ...DEFAULT_CONFIG.exportSettings,
        ...configOverride.exportSettings,
      },
      monitoring: {
        ...DEFAULT_CONFIG.monitoring,
        ...configOverride.monitoring,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { reportError } = useErrorReporting();
  const { isExporting, progress, error: exportError, startExport, cancelExport } = useExport();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Ref to restore focus to the export trigger button after the dialog closes
  const exportTriggerRef = useRef<HTMLButtonElement>(null);

  // ---------------------------------------------------------------------------
  // Stable event handlers (useCallback — passed to memoized children)
  // ---------------------------------------------------------------------------

  const handleCustomerSelect = useCallback(
    (id: string) => {
      const found = customers.find((c) => c.id === id) ?? null;
      setSelectedCustomer(found);
    },
    [customers],
  );

  const handleAlertsChange = useCallback((updated: Alert[]) => {
    setAlerts(updated);
  }, []);

  const handleBoundaryError = useCallback(
    (errorId: string, message: string) => {
      reportError(new Error(message), 'dashboard', { errorId });
    },
    [reportError],
  );

  const handleWidgetError = useCallback(
    (errorId: string, message: string) => {
      reportError(new Error(message), 'widget', { errorId });
    },
    [reportError],
  );

  const handleOpenExportDialog = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleCloseExportDialog = useCallback(() => {
    setExportDialogOpen(false);
  }, []);

  const handleExport = useCallback(
    (request: ExportRequest) => {
      // Build data payload based on dataSource — uses customer list as the base dataset
      const data: unknown[] =
        request.dataSource === 'customers'
          ? customers.map(({ id, name, company, healthScore, subscriptionTier, createdAt, updatedAt }) => ({
              id,
              name,
              company,
              healthScore,
              subscriptionTier: subscriptionTier ?? '',
              createdAt: createdAt ?? '',
              updatedAt: updatedAt ?? '',
            }))
          : request.dataSource === 'alert-history'
          ? alerts.map(({ id, customerId, type, priority, message, triggeredAt, dismissed }) => ({
              id,
              customerId,
              type,
              priority,
              message,
              triggeredAt,
              dismissed: String(dismissed),
            }))
          : [];

      startExport(request, data);
    },
    [customers, alerts, startExport],
  );

  const handleCancelExport = useCallback(() => {
    cancelExport();
  }, [cancelExport]);

  // ---------------------------------------------------------------------------
  // Derived state — memoized to avoid unnecessary child re-renders
  // ---------------------------------------------------------------------------

  const activeAlertCount = useMemo(
    () => alerts.filter((a) => !a.dismissed).length,
    [alerts],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <DashboardErrorBoundary onError={handleBoundaryError}>
      {/* Skip-to-content: must be the first focusable element per WCAG 2.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow focus:ring-2 focus:ring-blue-500"
      >
        Skip to content
      </a>

      {/* ARIA live region — announces new alerts without stealing focus */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {activeAlertCount > 0 &&
          `${activeAlertCount} active alert${activeAlertCount !== 1 ? 's' : ''}`}
      </div>

      {/* ARIA live region for export status announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isExporting ? `Exporting… ${progress}%` : ''}
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* ------------------------------------------------------------------ */}
        {/* Header                                                              */}
        {/* ------------------------------------------------------------------ */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 md:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              Customer Intelligence Dashboard
            </h1>

            {/* Export toolbar */}
            {config.featureFlags.exportEnabled && (
              <nav aria-label="Export controls">
                <button
                  ref={exportTriggerRef}
                  type="button"
                  onClick={handleOpenExportDialog}
                  aria-haspopup="dialog"
                  aria-expanded={exportDialogOpen}
                  className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {/* Download icon */}
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Export
                </button>
              </nav>
            )}
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* Main content                                                        */}
        {/* ------------------------------------------------------------------ */}
        <main id="main-content" className="px-4 py-6 md:px-8 space-y-6">
          {/* Customer selector */}
          <section aria-label="Customer selector">
            <h2 className="sr-only">Customers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {customers.map((customer) => (
                <WidgetErrorBoundary
                  key={customer.id}
                  widgetName="CustomerCard"
                  onError={handleWidgetError}
                >
                  <Suspense fallback={<WidgetSkeleton height="h-32" />}>
                    <CustomerCard
                      customer={customer}
                      isSelected={selectedCustomer?.id === customer.id}
                      onSelect={handleCustomerSelect}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
              ))}
            </div>
          </section>

          {/* Dashboard widgets grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Health display */}
            <aside aria-label="Customer health score">
              <WidgetErrorBoundary
                widgetName="CustomerHealthDisplay"
                onError={handleWidgetError}
              >
                <Suspense fallback={<WidgetSkeleton />}>
                  <CustomerHealthDisplay
                    healthResult={null}
                    isLoading={false}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            </aside>

            {/* Alerts panel */}
            <aside aria-label="Predictive alerts">
              <WidgetErrorBoundary widgetName="AlertsPanel" onError={handleWidgetError}>
                <Suspense fallback={<WidgetSkeleton />}>
                  <AlertsPanel
                    alerts={alerts}
                    onAlertsChange={handleAlertsChange}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            </aside>

            {/* Market intelligence */}
            <aside aria-label="Market intelligence">
              <WidgetErrorBoundary
                widgetName="MarketIntelligenceWidget"
                onError={handleWidgetError}
              >
                <Suspense fallback={<WidgetSkeleton />}>
                  <MarketIntelligenceWidget
                    company={selectedCustomer?.company}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            </aside>
          </div>

          {/* Predictive intelligence panel (full width) */}
          {config.featureFlags.predictiveIntelligenceEnabled && (
            <section aria-label="Predictive intelligence">
              <WidgetErrorBoundary
                widgetName="PredictiveIntelligencePanel"
                onError={handleWidgetError}
              >
                <Suspense fallback={<WidgetSkeleton height="h-64" />}>
                  <PredictiveIntelligencePanel
                    customer={selectedCustomer}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            </section>
          )}
        </main>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Export dialog — rendered at root so it can trap focus properly       */}
      {/* -------------------------------------------------------------------- */}
      {config.featureFlags.exportEnabled && (
        <MemoizedExportDialog
          isOpen={exportDialogOpen}
          config={config}
          isExporting={isExporting}
          progress={progress}
          exportError={exportError}
          triggerRef={exportTriggerRef}
          onExport={handleExport}
          onCancel={handleCancelExport}
          onClose={handleCloseExportDialog}
        />
      )}
    </DashboardErrorBoundary>
  );
}
