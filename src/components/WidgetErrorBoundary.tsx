'use client';

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  /** Widget name shown in the error fallback card. */
  widgetName?: string;
  /** Called with sanitized error info when an error is caught. */
  onError?: (errorId: string, message: string) => void;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  errorId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateErrorId(): string {
  return `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function sanitizeMessage(message: string): string {
  return message.replace(/(\s+at\s+.+)+/g, '').replace(/\/.+\.(ts|tsx|js|jsx)/g, '[file]').trim();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * WidgetErrorBoundary
 *
 * Widget-level error boundary. Isolates a single widget failure so all other
 * widgets remain functional and visible. Renders an error fallback card that
 * visually matches the bounding box of the replaced widget.
 *
 * Provides a retry button that resets the boundary and re-mounts the subtree.
 */
export default class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorId: '' };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(): Partial<WidgetErrorBoundaryState> {
    return { hasError: true, errorId: generateErrorId() };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const sanitized = sanitizeMessage(error.message);
    this.props.onError?.(this.state.errorId, sanitized);

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(
        `[WidgetErrorBoundary: ${this.props.widgetName ?? 'unknown'}]`,
        error,
        info.componentStack,
      );
    }
  }

  handleRetry(): void {
    this.setState({ hasError: false, errorId: '' });
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const name = this.props.widgetName ?? 'Widget';

    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm min-h-[120px] flex flex-col items-center justify-center gap-3 text-center"
      >
        <p className="text-sm font-semibold text-red-700">{name} failed to load</p>
        <p className="text-xs text-red-500">
          Error ID: <span className="font-mono">{this.state.errorId}</span>
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="rounded-md bg-white border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }
}
