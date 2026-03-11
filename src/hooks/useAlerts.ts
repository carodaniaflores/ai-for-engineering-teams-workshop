'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  AlertCustomerData,
  evaluateAlerts,
  dismissAlert as dismissAlertUtil,
  getActiveAlerts,
  clearCooldowns,
} from '../lib/alerts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAlertsReturn {
  /** All alerts (active + dismissed) — full history. */
  alerts: Alert[];
  /** Undismissed alerts sorted by priority (high first), then recency. */
  activeAlerts: Alert[];
  /** Dismissed alerts for history view. */
  alertHistory: Alert[];
  /** Evaluate alert rules for a customer and add any new alerts to state. */
  evaluate: (data: AlertCustomerData) => void;
  /** Dismiss a single alert by id. */
  dismiss: (alertId: string) => void;
  /** Reset all alert state (e.g. when active customer changes). */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAlerts
 *
 * Encapsulates alert state, evaluation, dismissal, and history.
 * Re-evaluate by calling `evaluate(data)` whenever the active customer changes.
 * Call `reset()` to clear state when switching customers.
 */
export function useAlerts(customerId?: string): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Reset when the customer changes so stale alerts don't persist.
  useEffect(() => {
    setAlerts([]);
    // Cooldowns are global; clear them so the new customer evaluation is fresh.
    clearCooldowns();
  }, [customerId]);

  const evaluate = useCallback((data: AlertCustomerData) => {
    setAlerts((prev) => {
      const newAlerts = evaluateAlerts(data, prev);
      if (newAlerts.length === 0) return prev;
      return [...prev, ...newAlerts];
    });
  }, []);

  const dismiss = useCallback((alertId: string) => {
    setAlerts((prev) => dismissAlertUtil(prev, alertId));
  }, []);

  const reset = useCallback(() => {
    setAlerts([]);
    clearCooldowns();
  }, []);

  return {
    alerts,
    activeAlerts: getActiveAlerts(alerts),
    alertHistory: alerts.filter((a) => a.dismissed),
    evaluate,
    dismiss,
    reset,
  };
}
