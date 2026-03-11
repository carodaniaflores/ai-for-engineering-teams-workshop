import { Customer } from '../data/mock-customers';

export interface CustomerCardProps {
  customer: Customer;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

function healthColorClasses(score: number): { badge: string; border: string } {
  if (score <= 30) {
    return { badge: 'bg-red-100 text-red-800', border: 'border-red-400' };
  }
  if (score <= 70) {
    return { badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-400' };
  }
  return { badge: 'bg-green-100 text-green-800', border: 'border-green-400' };
}

function healthLabel(score: number): string {
  if (score <= 30) return 'Critical';
  if (score <= 70) return 'Warning';
  return 'Healthy';
}

const tierStyles: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700',
  premium: 'bg-blue-100 text-blue-700',
  basic: 'bg-gray-100 text-gray-600',
};

export default function CustomerCard({ customer, onSelect, isSelected = false }: CustomerCardProps) {
  const { badge, border } = healthColorClasses(customer.healthScore);
  const domains = customer.domains ?? [];
  const firstDomain = domains[0];
  const extraCount = domains.length - 1;
  const tierStyle = tierStyles[customer.subscriptionTier] ?? tierStyles.basic;

  // Avatar initials
  const initials = customer.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect?.(customer.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(customer.id);
        }
      }}
      className={[
        'w-full rounded-xl border-2 bg-white p-4 text-left shadow-sm',
        'cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isSelected ? `${border} bg-gray-50` : 'border-gray-200',
      ].join(' ')}
    >
      {/* Header: avatar + name + health badge */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold select-none">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="font-semibold text-gray-900 truncate text-sm">{customer.name}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${badge}`}
              aria-label={`Health score ${customer.healthScore} — ${healthLabel(customer.healthScore)}`}
            >
              {customer.healthScore}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{customer.company}</p>
        </div>
      </div>

      {/* Health bar */}
      <div className="mt-3 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            customer.healthScore <= 30
              ? 'bg-red-400'
              : customer.healthScore <= 70
              ? 'bg-yellow-400'
              : 'bg-green-400'
          }`}
          style={{ width: `${customer.healthScore}%` }}
        />
      </div>

      {/* Tier + status */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tierStyle}`}>
          {customer.subscriptionTier}
        </span>
        <span className="text-xs text-gray-400">{healthLabel(customer.healthScore)}</span>
      </div>

      {/* Domain */}
      {firstDomain && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <span className="truncate">{firstDomain}</span>
          {extraCount > 0 && <span className="shrink-0">+{extraCount}</span>}
        </div>
      )}
    </div>
  );
}
