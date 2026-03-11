'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import type { MarketIntelligenceResponse } from '../services/MarketIntelligenceService';

// ---------------------------------------------------------------------------
// Types — all exported per spec
// ---------------------------------------------------------------------------

export type { MarketIntelligenceResponse };

export interface MarketIntelligenceWidgetProps {
  /** Pre-populated from the selected customer; editable by the user. */
  company?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SENTIMENT_BADGE_CLASSES: Record<
  MarketIntelligenceResponse['sentiment']['label'],
  string
> = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-yellow-100 text-yellow-800',
  negative: 'bg-red-100 text-red-800',
};

const SENTIMENT_BAR_CLASSES: Record<
  MarketIntelligenceResponse['sentiment']['label'],
  string
> = {
  positive: 'bg-green-500',
  neutral: 'bg-yellow-400',
  negative: 'bg-red-500',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Maps a sentiment score in [-1, 1] to a CSS width percentage string. */
function sentimentScoreToWidth(score: number): string {
  return `${((score + 1) / 2) * 100}%`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MarketIntelligenceWidget
 *
 * Displays market sentiment and top headlines for a given company name.
 * Fetches from `/api/market-intelligence/[company]` on form submit and
 * whenever the `company` prop changes.
 *
 * Designed to slot into the Dashboard grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
 */
export default function MarketIntelligenceWidget({
  company,
}: MarketIntelligenceWidgetProps): React.JSX.Element {
  const [input, setInput] = useState<string>(company ?? '');
  const [data, setData] = useState<MarketIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stable fetch function — wrapped in useCallback so the useEffect dependency
  // array remains correct without triggering infinite re-renders.
  const fetchIntelligence = useCallback(async (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/market-intelligence/${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Request failed');
      }
      const json = (await res.json()) as MarketIntelligenceResponse;
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with external `company` prop changes.
  useEffect(() => {
    if (company) {
      setInput(company);
      fetchIntelligence(company);
    }
  }, [company, fetchIntelligence]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    fetchIntelligence(input);
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        Market Intelligence
      </h3>

      {/* ------------------------------------------------------------------ */}
      {/* Input form                                                          */}
      {/* ------------------------------------------------------------------ */}
      <form className="flex gap-2 mb-4" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Company name…"
          aria-label="Company name"
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={loading || !input.trim()}
          isLoading={loading}
          aria-label="Get market intelligence"
        >
          Get Intelligence
        </Button>
      </form>

      {/* ------------------------------------------------------------------ */}
      {/* Loading state                                                       */}
      {/* ------------------------------------------------------------------ */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-gray-500 py-4"
        >
          <Spinner />
          <span>Fetching market data…</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error state                                                         */}
      {/* ------------------------------------------------------------------ */}
      {!loading && error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700"
        >
          <p className="mb-2">{error}</p>
          <Button
            size="sm"
            variant="danger"
            onClick={() => fetchIntelligence(input)}
            aria-label="Retry fetching market intelligence"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Results                                                             */}
      {/* ------------------------------------------------------------------ */}
      {!loading && !error && data && (
        <div className="space-y-4">
          {/* Sentiment card */}
          <div className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-2">
            {/* Badge + confidence */}
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${SENTIMENT_BADGE_CLASSES[data.sentiment.label]}`}
                aria-label={`Sentiment: ${data.sentiment.label}`}
              >
                {data.sentiment.label}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(data.sentiment.confidence * 100)}% confidence
              </span>
            </div>

            {/* Sentiment score bar — maps -1..1 to 0..100% */}
            <div
              role="meter"
              aria-label="Sentiment score"
              aria-valuenow={data.sentiment.score}
              aria-valuemin={-1}
              aria-valuemax={1}
              className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden"
            >
              <div
                className={`h-full rounded-full transition-all ${SENTIMENT_BAR_CLASSES[data.sentiment.label]}`}
                style={{ width: sentimentScoreToWidth(data.sentiment.score) }}
              />
            </div>

            {/* Stats row */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>{data.articleCount} articles</span>
              <span>Updated {formatDate(data.lastUpdated)}</span>
            </div>
          </div>

          {/* Headlines */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
              Top Headlines
            </p>
            <ul className="space-y-2" aria-label="Top headlines">
              {data.headlines.map((headline) => (
                <li
                  key={`${headline.source}-${headline.publishedAt}`}
                  className="rounded-md bg-gray-50 p-3 border border-gray-100"
                >
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    {headline.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {headline.source}&nbsp;&middot;&nbsp;{formatDate(headline.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Empty / initial state                                               */}
      {/* ------------------------------------------------------------------ */}
      {!loading && !error && !data && (
        <p className="text-sm text-gray-400">
          Enter a company name to see market intelligence.
        </p>
      )}
    </div>
  );
}
