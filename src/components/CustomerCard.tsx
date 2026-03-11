'use client';

import React from 'react';
import { Customer } from '../data/mock-customers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerCardProps {
  /** The customer record to display. */
  customer: Customer;
  /** Called with the customer id when the card is clicked or activated. */
  onSelect?: (id: string) => void;
  /** Highlights the card with a selection border when true. */
  isSelected?: boolean;
}

// ---------------------------------------------------------------------------
// Health-score helpers
// ---------------------------------------------------------------------------

/**
 * Returns Tailwind color classes for the given health score.
 *
 * Thresholds:
 *   0–30   → Red   (Critical / Poor)
 *   31–70  → Yellow (Moderate / Warning)
 *   71–100 → Green  (Good / Healthy)
 */
function getHealthColors(score: number): {
  badge: string;
  bar: string;
  border: string;
} {
  if (score <= 30) {
    return {
      badge: 'bg-red-100 text-red-800',
      bar: 'bg-red-500',
      border: 'border-red-400',
    };
  }
  if (score <= 70) {
    return {
      badge: 'bg-yellow-100 text-yellow-800',
      bar: 'bg-yellow-400',
      border: 'border-yellow-400',
    };
  }
  return {
    badge: 'bg-green-100 text-green-800',
    bar: 'bg-green-500',
    border: 'border-green-400',
  };
}

function getHealthLabel(score: number): string {
  if (score <= 30) return 'Critical';
  if (score <= 70) return 'Warning';
  return 'Healthy';
}

// ---------------------------------------------------------------------------
// Subscription tier badge styles
// ---------------------------------------------------------------------------

const TIER_STYLES: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700',
  premium: 'bg-blue-100 text-blue-700',
  basic: 'bg-gray-100 text-gray-600',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CustomerCard
 *
 * Displays a single customer's name, company, health score, subscription tier,
 * and domain information. The card is interactive — click or keyboard-activate
 * to trigger `onSelect`. Supports an optional selected state.
 *
 * Max width: 400px  |  Min height: 120px (enforced via Tailwind classes)
 */
export default function CustomerCard({
  customer,
  onSelect,
  isSelected = false,
}: CustomerCardProps): React.JSX.Element {
  // Clamp score to valid range to guard against bad data
  const score = Math.min(100, Math.max(0, customer.healthScore));
  const { badge, bar, border } = getHealthColors(score);
  const healthLabel = getHealthLabel(score);

  // Domains
  const domains = customer.domains ?? [];
  const primaryDomain = domains[0];
  const additionalCount = domains.length - 1;

  // Tier badge style — fall back to 'basic' if the tier is unrecognised
  const tierStyle = TIER_STYLES[customer.subscriptionTier ?? 'basic'] ?? TIER_STYLES.basic;

  // Avatar initials (up to 2 characters)
  const initials = customer.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleActivate() {
    onSelect?.(customer.id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${customer.name}, ${customer.company}, health score ${score} — ${healthLabel}`}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={[
        // Layout & sizing — spec: max-w-[400px], min-h-[120px]
        'w-full max-w-[400px] min-h-[120px]',
        // Base card styles
        'rounded-xl border-2 bg-white p-4 text-left shadow-sm',
        // Interaction
        'cursor-pointer select-none',
        'transition-all duration-150',
        'hover:shadow-md hover:-translate-y-0.5',
        // Keyboard focus ring
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        // Selected / unselected border
        isSelected ? `${border} bg-gray-50` : 'border-gray-200',
      ].join(' ')}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header: avatar + name + health score badge                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          aria-hidden="true"
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold"
        >
          {initials}
        </div>

        {/* Name + company + score */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {/* Customer name — largest text in hierarchy */}
            <p className="font-semibold text-gray-900 truncate text-sm leading-tight">
              {customer.name}
            </p>

            {/* Health score badge */}
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${badge}`}
            >
              {score}
            </span>
          </div>

          {/* Company name — secondary text */}
          <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">
            {customer.company}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Health progress bar                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Health score ${score}`}
        className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Footer row: tier badge + health label                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {/* Subscription tier */}
        {customer.subscriptionTier && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tierStyle}`}
          >
            {customer.subscriptionTier}
          </span>
        )}

        {/* Health status label */}
        <span className="ml-auto text-xs text-gray-400">{healthLabel}</span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Domain information                                                  */}
      {/* ------------------------------------------------------------------ */}
      {primaryDomain && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          {/* Globe icon (inline SVG — no extra dependency) */}
          <svg
            aria-hidden="true"
            className="shrink-0 h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
              clipRule="evenodd"
            />
          </svg>

          <span className="truncate">{primaryDomain}</span>

          {/* Additional domain count badge */}
          {additionalCount > 0 && (
            <span
              className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-500 font-medium"
              title={`${additionalCount} more domain${additionalCount > 1 ? 's' : ''}`}
            >
              +{additionalCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
