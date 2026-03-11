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

export default function CustomerCard({ customer, onSelect, isSelected = false }: CustomerCardProps) {
  const { badge, border } = healthColorClasses(customer.healthScore);
  const domains = customer.domains ?? [];
  const firstDomain = domains[0];
  const extraCount = domains.length - 1;

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
        'w-full min-h-[44px] rounded-lg border-2 bg-white p-4 text-left',
        'cursor-pointer transition-colors',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isSelected ? `${border} bg-gray-50` : 'border-gray-200',
      ].join(' ')}
    >
      {/* Identity row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
          <p className="text-sm text-gray-500 truncate">{customer.company}</p>
        </div>

        {/* Health score badge */}
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}
          aria-label={`Health score ${customer.healthScore} — ${healthLabel(customer.healthScore)}`}
        >
          {customer.healthScore}
        </span>
      </div>

      {/* Domains row */}
      {domains.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-xs text-gray-400 mr-1">Domains:</span>
          <span className="text-xs text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">
            {firstDomain}
          </span>
          {extraCount > 0 && (
            <span className="text-xs text-gray-400">
              +{extraCount} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
