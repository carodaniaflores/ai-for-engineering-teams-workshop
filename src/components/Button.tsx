import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<'button'> {
  /** Visual style variant. Default: `"primary"` */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Size of the button. Default: `"md"` */
  size?: 'sm' | 'md' | 'lg';
  /** When true, shows a spinner and prevents interaction. Default: `false` */
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Style maps — pure Tailwind, no runtime computation
// ---------------------------------------------------------------------------

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-blue-600 text-white border border-transparent hover:bg-blue-700 focus-visible:ring-blue-500',
  secondary:
    'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500',
  danger:
    'bg-red-600 text-white border border-transparent hover:bg-red-700 focus-visible:ring-red-500',
  ghost:
    'bg-transparent text-blue-600 border border-transparent hover:bg-blue-50 focus-visible:ring-blue-500',
};

/**
 * All sizes meet the 44×44 px minimum touch target.
 * `sm` uses `min-h-[44px]` to satisfy mobile requirement while keeping compact text.
 */
const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-[44px] px-3 py-2 text-sm',
  md: 'min-h-[44px] px-4 py-2.5 text-sm',
  lg: 'min-h-[44px] px-6 py-3 text-base',
};

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Button
 *
 * Reusable accessible button with four visual variants, three sizes,
 * and dedicated loading and disabled states.
 *
 * Spreads all standard HTML button attributes so it is a drop-in
 * replacement for `<button>`.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className,
  onClick,
  ...rest
}: ButtonProps): React.JSX.Element {
  const isInteractionBlocked = disabled || isLoading;

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (isInteractionBlocked) return;
    onClick?.(e);
  }

  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      disabled={isInteractionBlocked}
      aria-disabled={isInteractionBlocked}
      aria-busy={isLoading}
      onClick={handleClick}
      className={[
        // Base layout
        'inline-flex items-center justify-center gap-2',
        'rounded-md font-medium',
        'transition-colors duration-150',
        // Focus ring (WCAG 2.1 AA — only on keyboard navigation)
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // Variant colours
        VARIANT_CLASSES[variant],
        // Size
        SIZE_CLASSES[size],
        // Disabled / loading state
        isInteractionBlocked
          ? 'opacity-50 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}
