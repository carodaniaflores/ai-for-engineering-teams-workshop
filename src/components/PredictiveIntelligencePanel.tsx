'use client';

import React, { useState } from 'react';
import { Customer } from '../data/mock-customers';
import { Alert, AlertType, getActiveAlerts, dismissAlert } from '../lib/alerts';
import { useMarketIntelligence } from '../hooks/useMarketIntelligence';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PredictiveIntelligencePanelProps {
  customer: Customer | null;
  alerts: Alert[];
  onAlertsChange: (alerts: Alert[]) => void;
  isLoadingAlerts?: boolean;
  alertsError?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  payment_risk: 'Payment Risk',
  engagement_cliff: 'Engagement Cliff',
  contract_expiration: 'Contract Expiration',
  support_spike: 'Support Ticket Spike',
  feature_adoption_stall: 'Feature Adoption Stall',
};

const ALERT_TYPE_ACTIONS: Record<AlertType, string> = {
  payment_risk: 'Contact the billing team immediately and schedule a call with the account owner.',
  engagement_cliff: 'Reach out with a personalised check-in and share relevant product use-case content.',
  contract_expiration: 'Schedule a renewal discussion and address any outstanding health concerns.',
  support_spike: 'Review all open tickets, escalate if needed, and proactively contact the customer.',
  feature_adoption_stall: 'Share feature highlights and offer a guided walkthrough session.',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface AlertItemProps {
  alert: Alert;
  onDismiss: (id: string) => void;
}

function AlertItem({ alert, onDismiss }: AlertItemProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const isHigh = alert.priority === 'high';
  const borderClass = isHigh ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50';
  const badgeClass = isHigh ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
  const dotClass = isHigh ? 'bg-red-500' : 'bg-yellow-400';

  return (
    <li className={`rounded-lg border p-3 transition-colors duration-150 ${borderClass}`}>
      <div className="flex items-start gap-2">
        {/* Priority dot — non-color cue: dot + badge label */}
        <span aria-hidden="true" className={`mt-1.5 shrink-0 h-2 w-2 rounded-full ${dotClass}`} />

        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-800">
                {ALERT_TYPE_LABELS[alert.type]}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeClass}`}>
                {alert.priority}
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

          {/* Message */}
          <p className="mt-1 text-xs text-gray-600 leading-snug">{alert.message}</p>

          {/* Actions row */}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              aria-expanded={expanded}
              className="min-h-[44px] text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            >
              {expanded ? 'Hide action' : 'Recommended action'}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              aria-label={`Dismiss ${ALERT_TYPE_LABELS[alert.type]} alert`}
              className="min-h-[44px] text-xs text-gray-400 hover:text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
            >
              Dismiss
            </button>
          </div>

          {/* Recommended action panel */}
          {expanded && (
            <div className="mt-2 rounded bg-white border border-gray-200 px-3 py-2">
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
// Alert feed section
// ---------------------------------------------------------------------------

interface AlertFeedProps {
  alerts: Alert[];
  onAlertsChange: (alerts: Alert[]) => void;
  isLoading: boolean;
  error: string | null;
  showHistory: boolean;
  onToggleHistory: () => void;
}

function AlertFeed({
  alerts,
  onAlertsChange,
  isLoading,
  error,
  showHistory,
  onToggleHistory,
}: AlertFeedProps): React.JSX.Element {
  const activeAlerts = getActiveAlerts(alerts);
  const history = alerts.filter((a) => a.dismissed);

  function handleDismiss(alertId: string): void {
    onAlertsChange(dismissAlert(alerts, alertId));
  }

  const displayed = showHistory ? history : activeAlerts;

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading alerts" className="animate-pulse space-y-2">
        <div className="h-14 bg-gray-200 rounded" />
        <div className="h-14 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-xs font-semibold text-red-700">Alerts unavailable</p>
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab toggle: active / history */}
      <div className="flex gap-3 mb-3">
        <button
          type="button"
          onClick={() => showHistory && onToggleHistory()}
          aria-pressed={!showHistory}
          className={`text-xs font-medium px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            !showHistory ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active
          {activeAlerts.length > 0 && (
            <span className="ml-1 rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 text-xs font-semibold">
              {activeAlerts.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => !showHistory && onToggleHistory()}
          aria-pressed={showHistory}
          className={`text-xs font-medium px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            showHistory ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History ({history.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <p className="text-xs text-gray-500 py-4 text-center">
          {showHistory ? 'No dismissed alerts.' : 'No active alerts — all clear.'}
        </p>
      ) : (
        <ul role="list" className="space-y-2">
          {displayed.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onDismiss={handleDismiss} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Market intelligence section
// ---------------------------------------------------------------------------

interface MarketIntelSectionProps {
  company: string | null;
}

function MarketIntelSection({ company }: MarketIntelSectionProps): React.JSX.Element {
  const { data, isLoading, error, refetch } = useMarketIntelligence(company);

  if (!company) {
    return (
      <p className="text-xs text-gray-400">Select a customer to view market intelligence.</p>
    );
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading market intelligence" className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-20 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-xs font-semibold text-red-700">Market data unavailable</p>
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-2 text-xs text-red-700 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const sentimentStyles: Record<string, { badge: string; dot: string }> = {
    positive: { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
    neutral: { badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
    negative: { badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  };
  const sentimentLabel = data.sentiment.label;
  const { badge: sentBadge, dot: sentDot } =
    sentimentStyles[sentimentLabel] ?? sentimentStyles.neutral;

  return (
    <div className="space-y-3">
      {/* Sentiment */}
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full shrink-0 ${sentDot}`} />
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${sentBadge}`}>
          {sentimentLabel}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          {Math.round(data.sentiment.confidence * 100)}% confidence
        </span>
      </div>

      {/* Sentiment bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            sentimentLabel === 'positive'
              ? 'bg-green-500'
              : sentimentLabel === 'negative'
              ? 'bg-red-500'
              : 'bg-yellow-400'
          }`}
          style={{ width: `${((data.sentiment.score + 1) / 2) * 100}%` }}
        />
      </div>

      {/* Meta */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>{data.articleCount} articles</span>
        <span>
          Updated{' '}
          {new Date(data.lastUpdated).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Headlines */}
      {data.headlines.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Top Headlines
          </p>
          <ul className="space-y-2">
            {data.headlines.slice(0, 3).map((h, i) => (
              <li
                key={i}
                className="rounded-md bg-gray-50 border border-gray-100 p-3 hover:bg-gray-100 transition-colors duration-100"
              >
                <p className="text-xs font-medium text-gray-800 leading-snug">{h.title}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {h.source} &middot;{' '}
                  {new Date(h.publishedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
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
 * Unified panel combining the predictive alert feed and market intelligence
 * side by side on ≥768px viewports, stacked on mobile.
 *
 * Alert state is owned by the parent and passed in via `alerts` /
 * `onAlertsChange`. Market intelligence is fetched internally based on the
 * active customer's company name.
 */
export default function PredictiveIntelligencePanel({
  customer,
  alerts,
  onAlertsChange,
  isLoadingAlerts = false,
  alertsError = null,
}: PredictiveIntelligencePanelProps): React.JSX.Element {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Predictive Intelligence</h3>
        {customer && (
          <p className="text-xs text-gray-400 mt-0.5">{customer.name} · {customer.company}</p>
        )}
      </div>

      {/* Two-column layout: alerts left, market intel right */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Alert feed */}
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Alert Feed
          </p>
          <AlertFeed
            alerts={alerts}
            onAlertsChange={onAlertsChange}
            isLoading={isLoadingAlerts}
            error={alertsError}
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory((p) => !p)}
          />
        </div>

        {/* Market intelligence */}
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Market Intelligence
          </p>
          <MarketIntelSection company={customer?.company ?? null} />
        </div>
      </div>
    </div>
  );
}
