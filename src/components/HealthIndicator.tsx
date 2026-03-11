export interface HealthIndicatorProps {
  score: number;
  showLabel?: boolean;
  showBar?: boolean;
  className?: string;
}

function getHealthTier(score: number): { badge: string; bar: string; label: string } {
  if (score <= 30) return { badge: 'bg-red-100 text-red-800', bar: 'bg-red-400', label: 'Critical' };
  if (score <= 70) return { badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400', label: 'Warning' };
  return { badge: 'bg-green-100 text-green-800', bar: 'bg-green-400', label: 'Healthy' };
}

export default function HealthIndicator({
  score,
  showLabel = true,
  showBar = true,
  className = '',
}: HealthIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const { badge, bar, label } = getHealthTier(clamped);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${badge}`}
          aria-label={`Health score ${clamped} — ${label}`}
        >
          {clamped}
        </span>
        {showLabel && <span className="text-xs text-gray-400">{label}</span>}
      </div>
      {showBar && (
        <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${bar}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      )}
    </div>
  );
}
