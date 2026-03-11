'use client';

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  /** Called with sanitized error info when an error is caught. */
  onError?: (errorId: string, message: string) => void;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  errorId: string;
  /** Dev-only: full error message + stack. */
  devMessage: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateErrorId(): string {
  return `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function sanitizeMessage(message: string): string {
  // Strip file paths and stack frames from production-facing messages.
  return message.replace(/(\s+at\s+.+)+/g, '').replace(/\/.+\.(ts|tsx|js|jsx)/g, '[file]').trim();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DashboardErrorBoundary
 *
 * Application-level error boundary. Catches unhandled errors anywhere in the
 * dashboard and renders a full-page fallback with a retry option.
 *
 * Development: full error message + component stack.
 * Production: sanitized "something went wrong" message — no internal disclosure.
 */
export default class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorId: '', devMessage: '' };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<DashboardErrorBoundaryState> {
    return {
      hasError: true,
      errorId: generateErrorId(),
      devMessage: `${error.message}\n\n${error.stack ?? ''}`,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const sanitized = sanitizeMessage(error.message);
    this.props.onError?.(this.state.errorId, sanitized);

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[DashboardErrorBoundary]', error, info.componentStack);
    }
  }

  handleRetry(): void {
    this.setState({ hasError: false, errorId: '', devMessage: '' });
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const isDev = process.env.NODE_ENV === 'development';

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center bg-gray-50 p-8"
      >
        <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-8 shadow-lg text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg
              aria-hidden="true"
              className="h-7 w-7 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 className="mb-2 text-xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="mb-1 text-sm text-gray-600">
            The dashboard encountered an unexpected error.
          </p>
          <p className="mb-6 text-xs text-gray-400">
            Error ID: <span className="font-mono">{this.state.errorId}</span>
          </p>

          {/* Dev-only: full error details */}
          {isDev && (
            <pre className="mb-6 max-h-48 overflow-auto rounded-md bg-gray-900 p-4 text-left text-xs text-gray-100 whitespace-pre-wrap">
              {this.state.devMessage}
            </pre>
          )}

          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
