'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MarketIntelligenceResponse } from '../services/MarketIntelligenceService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseMarketIntelligenceReturn {
  data: MarketIntelligenceResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useMarketIntelligence
 *
 * Fetches market intelligence for the given company name.
 * Caching is handled by the server-side MarketIntelligenceService (10-min TTL).
 * Pass null/undefined to reset to empty state.
 */
export function useMarketIntelligence(
  company: string | null | undefined,
): UseMarketIntelligenceReturn {
  const [data, setData] = useState<MarketIntelligenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/market-intelligence/${encodeURIComponent(trimmed)}`,
      );

      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }

      const json: MarketIntelligenceResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load market intelligence.',
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (company) {
      fetchData(company);
    } else {
      setData(null);
      setError(null);
    }
  }, [company, fetchData]);

  const refetch = useCallback(() => {
    if (company) fetchData(company);
  }, [company, fetchData]);

  return { data, isLoading, error, refetch };
}
