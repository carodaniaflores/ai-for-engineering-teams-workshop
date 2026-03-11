'use client';

import React, { useState, useCallback, Suspense } from 'react';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import { useErrorReporting } from '../hooks/useErrorReporting';
import { Alert } from '../lib/alerts';
import { Customer } from '../data/mock-customers';

// Lazy-load widgets for code splitting
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
// Types
// ---------------------------------------------------------------------------

export interface DashboardOrchestratorProps {
  customers: Customer[];
  initialAlerts?: Alert[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DashboardOrchestrator
 *
 * Root orchestration component for the Customer Intelligence Dashboard.
 * - Multi-level error boundaries (dashboard + per-widget)
 * - React.lazy + Suspense for code-split widget loading
 * - ARIA live region for alert notifications
 * - Skip-to-content link for keyboard navigation
 * - Semantic HTML landmarks
 * - Unified customer selection state
 */
export default function DashboardOrchestrator({
  customers,
  initialAlerts = [],
}: DashboardOrchestratorProps): React.JSX.Element {
  const { reportError } = useErrorReporting();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

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

  const activeAlertCount = alerts.filter((a) => !a.dismissed).length;

  return (
    <DashboardErrorBoundary onError={handleBoundaryError}>
      {/* Skip-to-content: first focusable element per WCAG 2.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow focus:ring-2 focus:ring-blue-500"
      >
        Skip to content
      </a>

      {/* ARIA live region — announces new alerts without stealing focus */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      >
        {activeAlertCount > 0 && `${activeAlertCount} active alert${activeAlertCount !== 1 ? 's' : ''}`}
      </div>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 md:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Customer Intelligence Dashboard</h1>
        </header>

        {/* Main content */}
        <main id="main-content" className="px-4 py-6 md:px-8 space-y-6">
          {/* Customer list */}
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
              <WidgetErrorBoundary widgetName="CustomerHealthDisplay" onError={handleWidgetError}>
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
              <WidgetErrorBoundary widgetName="MarketIntelligenceWidget" onError={handleWidgetError}>
                <Suspense fallback={<WidgetSkeleton />}>
                  <MarketIntelligenceWidget
                    company={selectedCustomer?.company}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            </aside>
          </div>

          {/* Predictive intelligence panel (full width) */}
          <section aria-label="Predictive intelligence">
            <WidgetErrorBoundary widgetName="PredictiveIntelligencePanel" onError={handleWidgetError}>
              <Suspense fallback={<WidgetSkeleton height="h-64" />}>
                <PredictiveIntelligencePanel
                  customer={selectedCustomer}
                  alerts={alerts}
                  onAlertsChange={handleAlertsChange}
                />
              </Suspense>
            </WidgetErrorBoundary>
          </section>
        </main>
      </div>
    </DashboardErrorBoundary>
  );
}
