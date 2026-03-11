import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthIndicatorProps {
  /** Health score in the range 0–100. Values outside this range are clamped. */
  score: number;
  /** When true, renders the severity label ("Critical" / "Warning" / "Healthy"). Default: true */
  showLabel?: boolean;
  /** When true, renders the filled progress bar. Default: true */
  showBar?: boolean;
  /** Optional Tailwind class override for the outer wrapper. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

interface HealthTier {
  badge: string;
  bar: string;
  label: string;
}

/**
 * Maps a clamped health score to its corresponding Tailwind color classes and
 * human-readable severity label.
 *
 * Thresholds:
 *   0–30   → Critical (red)
 *   31–70  → Warning  (yellow)
 *   71–100 → Healthy  (green)
 */
function getHealthTier(score: number): HealthTier {
  if (score <= 30) {
    return {
      badge: 'bg-red-100 text-red-800',
      bar: 'bg-red-400',
      label: 'Critical',
    };
  }
  if (score <= 70) {
    return {
      badge: 'bg-yellow-100 text-yellow-800',
      bar: 'bg-yellow-400',
      label: 'Warning',
    };
  }
  return {
    badge: 'bg-green-100 text-green-800',
    bar: 'bg-green-400',
    label: 'Healthy',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * HealthIndicator
 *
 * Purely presentational component that renders a color-coded score badge and
 * an optional filled progress bar for a numeric health score (0–100).
 *
 * - No state, no effects — renders in a single pass.
 * - Safe to use inside React.memo-wrapped parents.
 * - Stretches to 100% of its container width.
 */
export default function HealthIndicator({
  score,
  showLabel = true,
  showBar = true,
  className = '',
}: HealthIndicatorProps): React.JSX.Element {
  // Clamp to valid range to guard against bad data
  const clamped = Math.min(100, Math.max(0, score));
  const { badge, bar, label } = getHealthTier(clamped);

  return (
    <div className={['flex flex-col gap-1 w-full', className].filter(Boolean).join(' ')}>
      {/* Badge row: score pill + optional severity label */}
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${badge}`}
          aria-label={`Health score ${clamped} — ${label}`}
        >
          {clamped}
        </span>
        {showLabel && (
          <span className="text-xs text-gray-400 shrink-0">{label}</span>
        )}
      </div>

      {/* Progress bar */}
      {showBar && (
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Health score ${clamped} — ${label}`}
          className="h-1 w-full rounded-full bg-gray-100 overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ease-in-out ${bar}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      )}
    </div>
  );
}
