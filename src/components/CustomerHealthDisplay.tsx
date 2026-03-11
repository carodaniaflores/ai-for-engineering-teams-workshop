'use client';

import React, { useState } from 'react';
import { HealthScoreResult } from '../lib/healthCalculator';

// ---------------------------------------------------------------------------
// Re-export library types so consumers can import everything from one place
// ---------------------------------------------------------------------------

export type { HealthScoreResult, FactorScores } from '../lib/healthCalculator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerHealthDisplayProps {
  /** The computed health result; null triggers the empty state. */
  healthResult: HealthScoreResult | null;
  /** Optional customer name shown in the widget header for context. */
  customerName?: string;
  /** When true, renders an animated loading skeleton. */
  isLoading?: boolean;
  /** When set, renders an error state with this message. */
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns Tailwind color tokens matching the CustomerCard health palette. */
function getRiskStyle(riskLevel: 'healthy' | 'warning' | 'critical'): {
  badge: string;
  bar: string;
  border: string;
  label: string;
} {
  switch (riskLevel) {
    case 'critical':
      return {
        badge: 'bg-red-100 text-red-800',
        bar: 'bg-red-500',
        border: 'border-red-300',
        label: 'Critical',
      };
    case 'warning':
      return {
        badge: 'bg-yellow-100 text-yellow-800',
        bar: 'bg-yellow-400',
        border: 'border-yellow-300',
        label: 'Warning',
      };
    default:
      return {
        badge: 'bg-green-100 text-green-800',
        bar: 'bg-green-500',
        border: 'border-green-300',
        label: 'Healthy',
      };
  }
}

const FACTOR_LABELS: Record<keyof HealthScoreResult['breakdown'], string> = {
  payment: 'Payment History',
  engagement: 'Engagement',
  contract: 'Contract',
  support: 'Support',
};

const FACTOR_WEIGHTS: Record<keyof HealthScoreResult['breakdown'], string> = {
  payment: '40%',
  engagement: '30%',
  contract: '20%',
  support: '10%',
};

const FACTOR_ORDER: Array<keyof HealthScoreResult['breakdown']> = [
  'payment',
  'engagement',
  'contract',
  'support',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CustomerHealthDisplay
 *
 * Renders the composite customer health score as a prominent numeric badge
 * with risk-level color coding (red / yellow / green), a progress bar, and
 * an expandable section showing individual factor sub-scores.
 *
 * Provides consistent loading and error states with other dashboard widgets.
 * The component is fully controlled: pass a new `healthResult` when the
 * active customer changes and the widget updates automatically.
 *
 * Color thresholds (aligned with CustomerCard palette):
 *   0–30   → Critical (red)
 *   31–70  → Warning  (yellow)
 *   71–100 → Healthy  (green)
 */
export default function CustomerHealthDisplay({
  healthResult,
  customerName,
  isLoading = false,
  error = null,
}: CustomerHealthDisplayProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  // ---- Loading skeleton -------------------------------------------------------
  if (isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading health score"
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse w-full"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 w-12 bg-gray-200 rounded-full" />
        </div>
        <div className="h-2 bg-gray-200 rounded mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    );
  }

  // ---- Error state ------------------------------------------------------------
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm w-full"
      >
        <p className="text-sm font-semibold text-red-700 mb-1">Health Score Unavailable</p>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  // ---- Empty state ------------------------------------------------------------
  if (!healthResult) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm w-full">
        <p className="text-sm text-gray-500">
          No health data available. Select a customer to see their score.
        </p>
      </div>
    );
  }

  const { overall, riskLevel, breakdown } = healthResult;
  const { badge, bar, border, label } = getRiskStyle(riskLevel);

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm overflow-hidden w-full ${border}`}
    >
      {/* ---- Main score section ---------------------------------------------- */}
      <div className="p-4">
        {/* Header: title + score badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-700 leading-tight">
            {customerName ? (
              <>
                Health Score{' '}
                <span className="font-normal text-gray-500 truncate">— {customerName}</span>
              </>
            ) : (
              'Customer Health Score'
            )}
          </h3>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xl font-bold tabular-nums ${badge}`}
            aria-label={`Health score ${overall} — ${label}`}
          >
            {overall}
          </span>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={overall}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Health score ${overall} out of 100`}
          className="h-2 w-full rounded-full bg-gray-100 overflow-hidden mb-2"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${bar}`}
            style={{ width: `${overall}%` }}
          />
        </div>

        {/* Risk label + toggle */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500 font-medium">{label}</span>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-controls="health-factor-breakdown"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
          >
            {expanded ? 'Hide breakdown' : 'Show breakdown'}
          </button>
        </div>
      </div>

      {/* ---- Expandable factor breakdown -------------------------------------- */}
      {expanded && (
        <div
          id="health-factor-breakdown"
          className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-3"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Factor Breakdown
          </p>

          {FACTOR_ORDER.map((factor) => {
            const score = breakdown[factor];
            const factorRisk: 'healthy' | 'warning' | 'critical' =
              score >= 71 ? 'healthy' : score >= 31 ? 'warning' : 'critical';
            const { bar: factorBar, badge: factorBadge } = getRiskStyle(factorRisk);

            return (
              <div key={factor}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-xs text-gray-600 truncate">
                    {FACTOR_LABELS[factor]}{' '}
                    <span className="text-gray-400">({FACTOR_WEIGHTS[factor]})</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${factorBadge}`}
                    aria-label={`${FACTOR_LABELS[factor]} score ${score}`}
                  >
                    {score}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${FACTOR_LABELS[factor]} score ${score} out of 100`}
                  className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${factorBar}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
