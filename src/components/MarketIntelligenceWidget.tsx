'use client';

import { useState, useEffect } from 'react';
import type { MarketIntelligenceResponse } from '../services/MarketIntelligenceService';

export interface MarketIntelligenceWidgetProps {
  company?: string;
}

const sentimentStyles = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-yellow-100 text-yellow-800',
  negative: 'bg-red-100 text-red-800',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MarketIntelligenceWidget({ company }: MarketIntelligenceWidgetProps) {
  const [input, setInput] = useState(company ?? '');
  const [data, setData] = useState<MarketIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchIntelligence(name: string) {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market-intelligence/${encodeURIComponent(name.trim())}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Request failed');
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (company) {
      setInput(company);
      fetchIntelligence(company);
    }
  }, [company]);

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Market Intelligence</h3>

      {/* Input */}
      <form
        className="flex gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          fetchIntelligence(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Company name…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Company name"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Get Intelligence
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          Fetching market data…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          <p className="mb-2">{error}</p>
          <button
            onClick={() => fetchIntelligence(input)}
            className="text-red-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && data && (
        <div className="space-y-4">
          {/* Sentiment card */}
          <div className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${sentimentStyles[data.sentiment.label]}`}
              >
                {data.sentiment.label}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(data.sentiment.confidence * 100)}% confidence
              </span>
            </div>
            {/* Score bar: maps -1..1 to 0..100% */}
            <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  data.sentiment.label === 'positive'
                    ? 'bg-green-500'
                    : data.sentiment.label === 'negative'
                    ? 'bg-red-500'
                    : 'bg-yellow-400'
                }`}
                style={{ width: `${((data.sentiment.score + 1) / 2) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{data.articleCount} articles</span>
              <span>Updated {formatDate(data.lastUpdated)}</span>
            </div>
          </div>

          {/* Headlines */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Top Headlines</p>
            <ul className="space-y-2">
              {data.headlines.map((h, i) => (
                <li key={i} className="rounded-md bg-gray-50 p-3 border border-gray-100">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{h.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {h.source} &middot; {formatDate(h.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !data && (
        <p className="text-sm text-gray-400">Enter a company name to see market intelligence.</p>
      )}
    </div>
  );
}
