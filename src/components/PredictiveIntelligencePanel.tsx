'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '../data/mock-customers';
import { Alert, AlertType, AlertCustomerData } from '../lib/alerts';
import { useMarketIntelligence } from '../hooks/useMarketIntelligence';
import { useAlerts } from '../hooks/useAlerts';

// ---------------------------------------------------------------------------
// Exported interfaces (spec: export all interfaces)
// ---------------------------------------------------------------------------

export interface PredictiveIntelligencePanelProps {
  /** The currently active customer. Null when none is selected. */
  customer: Customer | null;
}

/** Maps AlertType to a human-readable label (no PII). */
export type { AlertType };
export type { Alert };

// ---------------------------------------------------------------------------
// Constants — recommended actions per alert type (no PII)
// ---------------------------------------------------------------------------

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  payment_risk: 'Payment Risk',
  engagement_cliff: 'Engagement Cliff',
  contract_expiration: 'Contract Expiration Risk',
  support_spike: 'Support Ticket Spike',
  feature_adoption_stall: 'Feature Adoption Stall',
};

const ALERT_TYPE_ACTIONS: Record<AlertType, string> = {
  payment_risk:
    'Contact the billing team immediately and schedule a call with the account owner.',
  engagement_cliff:
    'Reach out with a personalised check-in and share relevant product use-case content.',
  contract_expiration:
    'Schedule a renewal discussion and address any outstanding health concerns.',
  support_spike:
    'Review all open tickets, escalate if needed, and proactively contact the customer.',
  feature_adoption_stall:
    'Share feature highlights and offer a guided walkthrough session.',
};

// ---------------------------------------------------------------------------
// AlertItem — expandable row with dismiss action
// ---------------------------------------------------------------------------

interface AlertItemProps {
  alert: Alert;
  onDismiss: (id: string) => void;
}

function AlertItem({ alert, onDismiss }: AlertItemProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const isHigh = alert.priority === 'high';
  const containerClass = isHigh
    ? 'border-red-200 bg-red-50 hover:bg-red-100'
    : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
  const badgeClass = isHigh
    ? 'bg-red-100 text-red-700'
    : 'bg-yellow-100 text-yellow-700';
  const dotClass = isHigh ? 'bg-red-500' : 'bg-yellow-400';
  const priorityLabel = isHigh ? 'High' : 'Medium';

  return (
    <li
      className={`rounded-lg border p-3 transition-colors duration-150 focus-within:ring-2 focus-within:ring-blue-500 ${containerClass}`}
    >
      <div className="flex items-start gap-2">
        {/* Priority indicator — color dot (non-color text label follows) */}
        <span
          aria-hidden="true"
          className={`mt-1.5 shrink-0 h-2.5 w-2.5 rounded-full ${dotClass}`}
        />

        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-800">
                {ALERT_TYPE_LABELS[alert.type]}
              </span>
              {/* Non-color label for accessibility */}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                aria-label={`Priority: ${priorityLabel}`}
              >
                {priorityLabel}
              </span>
            </div>
            <span className="shrink-0 text-xs text-gray-400">
              {new Date(alert.triggeredAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Alert message */}
          <p className="mt-1 text-xs text-gray-600 leading-snug">{alert.message}</p>

          {/* Action buttons */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              aria-controls={`alert-action-${alert.id}`}
              className="min-h-[44px] text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
            >
              {expanded ? 'Hide recommended action' : 'Show recommended action'}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              aria-label={`Dismiss ${ALERT_TYPE_LABELS[alert.type]} alert`}
              className="min-h-[44px] text-xs text-gray-400 hover:text-gray-700 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 rounded"
            >
              Dismiss
            </button>
          </div>

          {/* Recommended action expansion panel */}
          {expanded && (
            <div
              id={`alert-action-${alert.id}`}
              role="region"
              aria-label="Recommended action"
              className="mt-2 rounded bg-white border border-gray-200 px-3 py-2"
            >
              <p className="text-xs font-semibold text-gray-600 mb-1">Recommended Action</p>
              <p className="text-xs text-gray-600 leading-snug">
                {ALERT_TYPE_ACTIONS[alert.type]}
              </p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function AlertSkeleton(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading alerts" className="animate-pulse space-y-2">
      <div className="h-16 bg-gray-200 rounded-lg" />
      <div className="h-16 bg-gray-200 rounded-lg" />
      <div className="h-10 bg-gray-200 rounded-lg" />
    </div>
  );
}

function MarketSkeleton(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading market intelligence" className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-2 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-14 bg-gray-200 rounded" />
      <div className="h-14 bg-gray-200 rounded" />
      <div className="h-14 bg-gray-200 rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alert Feed section
// ---------------------------------------------------------------------------

interface AlertFeedProps {
  activeAlerts: Alert[];
  alertHistory: Alert[];
  onDismiss: (id: string) => void;
  onRetry: () => void;
  isLoading: boolean;
  error: string | null;
}

function AlertFeed({
  activeAlerts,
  alertHistory,
  onDismiss,
  onRetry,
  isLoading,
  error,
}: AlertFeedProps): React.JSX.Element {
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return <AlertSkeleton />;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-xs font-semibold text-red-700">Alerts unavailable</p>
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 min-h-[44px] text-xs text-red-700 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  const displayed = showHistory ? alertHistory : activeAlerts;

  return (
    <div>
      {/* Tab bar: Active / History */}
      <div className="flex gap-2 mb-3" role="tablist" aria-label="Alert views">
        <button
          type="button"
          role="tab"
          aria-selected={!showHistory}
          onClick={() => setShowHistory(false)}
          className={`min-h-[44px] text-xs font-medium px-3 py-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            !showHistory
              ? 'text-blue-700 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Active
          {activeAlerts.length > 0 && (
            <span
              aria-label={`${activeAlerts.length} active alerts`}
              className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-xs font-semibold"
            >
              {activeAlerts.length}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showHistory}
          onClick={() => setShowHistory(true)}
          className={`min-h-[44px] text-xs font-medium px-3 py-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            showHistory
              ? 'text-blue-700 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          History ({alertHistory.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <p className="text-xs text-gray-500 py-6 text-center">
          {showHistory ? 'No dismissed alerts.' : 'No active alerts — all clear.'}
        </p>
      ) : (
        <ul role="list" className="space-y-2">
          {displayed.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onDismiss={onDismiss} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Market Intelligence section
// ---------------------------------------------------------------------------

interface MarketIntelSectionProps {
  company: string | null;
}

function MarketIntelSection({ company }: MarketIntelSectionProps): React.JSX.Element {
  const { data, isLoading, error, refetch } = useMarketIntelligence(company);

  if (!company) {
    return (
      <p className="text-xs text-gray-400 py-4 text-center">
        Select a customer to view market intelligence.
      </p>
    );
  }

  if (isLoading) {
    return <MarketSkeleton />;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-xs font-semibold text-red-700">Market data unavailable</p>
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-2 min-h-[44px] text-xs text-red-700 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <MarketSkeleton />;

  const sentimentLabel = data.sentiment.label;
  const sentimentStyles: Record<'positive' | 'neutral' | 'negative', { badge: string; dot: string }> = {
    positive: { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
    neutral: { badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
    negative: { badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  };
  const { badge: sentBadge, dot: sentDot } =
    sentimentStyles[sentimentLabel] ?? sentimentStyles.neutral;

  // Normalize score from [-1, 1] to [0, 100] for bar width
  const sentimentBarWidth = Math.round(((data.sentiment.score + 1) / 2) * 100);
  const sentimentBarColor =
    sentimentLabel === 'positive'
      ? 'bg-green-500'
      : sentimentLabel === 'negative'
      ? 'bg-red-500'
      : 'bg-yellow-400';

  return (
    <div className="space-y-3">
      {/* Sentiment indicator — color dot + text label for accessibility */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full shrink-0 ${sentDot}`}
        />
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${sentBadge}`}
          aria-label={`Market sentiment: ${sentimentLabel}`}
        >
          {sentimentLabel}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          {Math.round(data.sentiment.confidence * 100)}% confidence
        </span>
      </div>

      {/* Sentiment score bar */}
      <div
        role="progressbar"
        aria-valuenow={sentimentBarWidth}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Sentiment score ${sentimentBarWidth}%`}
        className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${sentimentBarColor}`}
          style={{ width: `${sentimentBarWidth}%` }}
        />
      </div>

      {/* Meta: article count + updatedAt */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{data.articleCount} {data.articleCount === 1 ? 'article' : 'articles'}</span>
        <span>
          Updated{' '}
          {new Date(data.lastUpdated).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Top 3 headlines */}
      {data.headlines.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Top Headlines
          </p>
          <ul role="list" className="space-y-2">
            {data.headlines.slice(0, 3).map((headline, index) => (
              <li
                key={index}
                className="rounded-md bg-gray-50 border border-gray-100 p-3 hover:bg-gray-100 focus-within:ring-2 focus-within:ring-blue-500 transition-colors duration-100"
              >
                <p className="text-xs font-medium text-gray-800 leading-snug">
                  {headline.title}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  <span>{headline.source}</span>
                  <span aria-hidden="true"> &middot; </span>
                  <time dateTime={headline.publishedAt}>
                    {new Date(headline.publishedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

/**
 * PredictiveIntelligencePanel
 *
 * Unified panel combining predictive alert feed and market intelligence.
 * Side-by-side on ≥768px viewports; stacked on mobile.
 *
 * Alert state is managed internally via `useAlerts`. Market intelligence
 * is fetched and cached via `useMarketIntelligence`. Both sections are
 * independently functional — one failing does not affect the other.
 *
 * Wrapped externally by `WidgetErrorBoundary` (via DashboardOrchestrator).
 */
export default function PredictiveIntelligencePanel({
  customer,
}: PredictiveIntelligencePanelProps): React.JSX.Element {
  const { activeAlerts, alertHistory, dismiss, evaluate } = useAlerts(customer?.id);

  // Derive mock AlertCustomerData from the Customer record for demonstration.
  // In production this would come from a dedicated API endpoint.
  useEffect(() => {
    if (!customer) return;

    const healthScore = customer.healthScore;
    // Synthesize plausible behavioral metrics from health score for demo purposes
    const mockData: AlertCustomerData = {
      customerId: customer.id,
      paymentOverdueDays: healthScore < 30 ? 35 : 0,
      healthScore,
      previousHealthScore: Math.min(100, healthScore + (healthScore < 50 ? 25 : 5)),
      loginFrequency: healthScore < 40 ? 0.5 : 3,
      loginFrequency30DayAvg: 3,
      daysUntilContractExpiry: healthScore < 50 ? 60 : 180,
      recentSupportTickets: healthScore < 35 ? 5 : 1,
      hasEscalatedTicket: healthScore <= 30,
      daysSinceLastFeatureUsage: healthScore < 60 ? 35 : 10,
      isGrowingAccount: customer.subscriptionTier === 'enterprise' || customer.subscriptionTier === 'premium',
    };

    evaluate(mockData);
  }, [customer, evaluate]);

  return (
    <section
      aria-label="Predictive Intelligence"
      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Predictive Intelligence</h2>
        {customer && (
          <p className="text-xs text-gray-400 mt-0.5">
            {customer.company}
          </p>
        )}
      </div>

      {/* Two-column on md+; stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Alert feed */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Alert Feed
          </h3>
          <AlertFeed
            activeAlerts={activeAlerts}
            alertHistory={alertHistory}
            onDismiss={dismiss}
            onRetry={() => {}}
            isLoading={false}
            error={null}
          />
        </div>

        {/* Market intelligence */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Market Intelligence
          </h3>
          <MarketIntelSection company={customer?.company ?? null} />
        </div>
      </div>
    </section>
  );
}
