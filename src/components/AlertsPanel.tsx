'use client';

import React from 'react';
import { Alert, AlertType, getActiveAlerts, dismissAlert } from '../lib/alerts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AlertsPanelProps {
  alerts: Alert[];
  onAlertsChange: (alerts: Alert[]) => void;
  isLoading?: boolean;
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  payment_risk: 'Payment Risk',
  engagement_cliff: 'Engagement Cliff',
  contract_expiration: 'Contract Expiration',
  support_spike: 'Support Ticket Spike',
  feature_adoption_stall: 'Feature Adoption Stall',
};

const ALERT_TYPE_ACTIONS: Record<AlertType, string> = {
  payment_risk: 'Contact billing team immediately and schedule a call with the account owner.',
  engagement_cliff: 'Reach out with a check-in call and share relevant use-case content.',
  contract_expiration: 'Schedule renewal discussion and address outstanding health concerns.',
  support_spike: 'Review open tickets, escalate if needed, and proactively contact the customer.',
  feature_adoption_stall: 'Share feature highlights and offer a guided walkthrough session.',
};

function getPriorityStyles(priority: 'high' | 'medium'): {
  border: string;
  badge: string;
  dot: string;
} {
  if (priority === 'high') {
    return {
      border: 'border-red-200 bg-red-50',
      badge: 'bg-red-100 text-red-700',
      dot: 'bg-red-500',
    };
  }
  return {
    border: 'border-yellow-200 bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-400',
  };
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

// ---------------------------------------------------------------------------
// Sub-component: AlertItem
// ---------------------------------------------------------------------------

interface AlertItemProps {
  alert: Alert;
  onDismiss: (id: string) => void;
}

function AlertItem({ alert, onDismiss }: AlertItemProps): React.JSX.Element {
  const [expanded, setExpanded] = React.useState(false);
  const { border, badge, dot } = getPriorityStyles(alert.priority);

  return (
    <div
      className={`rounded-lg border p-3 transition-all duration-150 ${border}`}
      role="listitem"
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        {/* Priority dot */}
        <span
          aria-hidden="true"
          className={`mt-1.5 shrink-0 h-2 w-2 rounded-full ${dot}`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Type label + priority badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-800">
                {ALERT_TYPE_LABELS[alert.type]}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badge}`}>
                {alert.priority}
              </span>
            </div>

            {/* Timestamp */}
            <span className="shrink-0 text-xs text-gray-400">
              {formatDate(alert.triggeredAt)}
            </span>
          </div>

          {/* Message */}
          <p className="mt-1 text-xs text-gray-600 leading-snug">{alert.message}</p>

          {/* Expand/collapse recommended action */}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              aria-expanded={expanded}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            >
              {expanded ? 'Hide action' : 'Recommended action'}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              aria-label={`Dismiss ${ALERT_TYPE_LABELS[alert.type]} alert`}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * AlertsPanel
 *
 * Displays active predictive alerts sorted by priority (high first),
 * with expandable recommended action panels and dismissal support.
 * Consistent loading and error states with other dashboard widgets.
 */
export default function AlertsPanel({
  alerts,
  onAlertsChange,
  isLoading = false,
  error = null,
}: AlertsPanelProps): React.JSX.Element {
  const activeAlerts = getActiveAlerts(alerts);

  function handleDismiss(alertId: string): void {
    onAlertsChange(dismissAlert(alerts, alertId));
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading alerts"
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse"
      >
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-14 bg-gray-200 rounded" />
          <div className="h-14 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-red-700 mb-1">Alerts Unavailable</p>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Predictive Alerts</h3>
        {activeAlerts.length > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 tabular-nums">
            {activeAlerts.length}
          </span>
        )}
      </div>

      {/* Alert list */}
      <div className="p-4">
        {activeAlerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No active alerts. All indicators look good.
          </p>
        ) : (
          <ul role="list" className="space-y-2">
            {activeAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onDismiss={handleDismiss} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
