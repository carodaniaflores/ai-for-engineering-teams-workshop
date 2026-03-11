// src/lib/alerts.ts
// Rule-based predictive alert engine — pure evaluation functions plus
// in-memory cooldown and deduplication state.

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export type AlertType =
  | 'payment_risk'
  | 'engagement_cliff'
  | 'contract_expiration'
  | 'support_spike'
  | 'feature_adoption_stall';

export interface Alert {
  id: string;
  customerId: string;
  type: AlertType;
  priority: 'high' | 'medium';
  /** Human-readable description — must not contain PII or credentials. */
  message: string;
  triggeredAt: string; // ISO-8601
  dismissed: boolean;
}

export interface AlertCustomerData {
  customerId: string;
  /** Number of days the most recent payment is overdue. */
  paymentOverdueDays: number;
  /** Current composite health score (0–100). */
  healthScore: number;
  /** Health score recorded 7 days ago (for trend detection). */
  previousHealthScore: number;
  /** Current logins per day. */
  loginFrequency: number;
  /** Rolling 30-day average logins per day. */
  loginFrequency30DayAvg: number;
  /** Days until the contract expires (may be negative). */
  daysUntilContractExpiry: number;
  /** Number of support tickets opened in the last 7 days. */
  recentSupportTickets: number;
  /** Whether any open ticket has been escalated. */
  hasEscalatedTicket: boolean;
  /** Days since any new feature was used. */
  daysSinceLastFeatureUsage: number;
  /** True for accounts on a growth / expanding plan tier. */
  isGrowingAccount: boolean;
}

// ---------------------------------------------------------------------------
// Cooldown tracking (in-memory; reset between test runs via clearCooldowns)
// ---------------------------------------------------------------------------

const alertCooldowns = new Map<string, number>();
/** 24-hour cooldown to prevent alert fatigue. */
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function cooldownKey(customerId: string, type: AlertType): string {
  return `${customerId}:${type}`;
}

function isOnCooldown(customerId: string, type: AlertType, now: number): boolean {
  const last = alertCooldowns.get(cooldownKey(customerId, type));
  return last !== undefined && now - last < COOLDOWN_MS;
}

function setCooldown(customerId: string, type: AlertType, now: number): void {
  alertCooldowns.set(cooldownKey(customerId, type), now);
}

/** Reset cooldown state — useful for tests and session resets. */
export function clearCooldowns(): void {
  alertCooldowns.clear();
}

// ---------------------------------------------------------------------------
// Deduplication helpers
// ---------------------------------------------------------------------------

function isAlreadyActive(existingAlerts: Alert[], customerId: string, type: AlertType): boolean {
  return existingAlerts.some(
    (a) => a.customerId === customerId && a.type === type && !a.dismissed,
  );
}

function generateAlertId(customerId: string, type: AlertType, timestamp: number): string {
  return `${customerId}-${type}-${timestamp}`;
}

// ---------------------------------------------------------------------------
// Alert evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate all alert rules against current customer data.
 * Returns only *new* alerts — excludes rules already active or on cooldown.
 * No PII or credentials are included in any generated message string.
 */
export function evaluateAlerts(
  data: AlertCustomerData,
  existingAlerts: Alert[],
): Alert[] {
  const newAlerts: Alert[] = [];
  const now = Date.now();
  const triggeredAt = new Date(now).toISOString();

  function addAlert(type: AlertType, priority: 'high' | 'medium', message: string): void {
    if (isAlreadyActive(existingAlerts, data.customerId, type)) return;
    if (isOnCooldown(data.customerId, type, now)) return;
    setCooldown(data.customerId, type, now);
    newAlerts.push({
      id: generateAlertId(data.customerId, type, now),
      customerId: data.customerId,
      type,
      priority,
      message,
      triggeredAt,
      dismissed: false,
    });
  }

  // --- High priority ---

  // Payment Risk: overdue >30 days OR health score dropped >20 pts in 7 days
  const healthDrop = data.previousHealthScore - data.healthScore;
  if (data.paymentOverdueDays > 30 || healthDrop > 20) {
    addAlert(
      'payment_risk',
      'high',
      'Payment risk detected: account requires immediate billing review.',
    );
  }

  // Engagement Cliff: current login frequency <50% of 30-day average
  if (
    data.loginFrequency30DayAvg > 0 &&
    data.loginFrequency < data.loginFrequency30DayAvg * 0.5
  ) {
    addAlert(
      'engagement_cliff',
      'high',
      'Engagement has dropped significantly below the 30-day average.',
    );
  }

  // Contract Expiration Risk: expiring in <90 days AND health score <50
  if (data.daysUntilContractExpiry < 90 && data.healthScore < 50) {
    addAlert(
      'contract_expiration',
      'high',
      'Contract renewal is approaching and health indicators are below threshold.',
    );
  }

  // --- Medium priority ---

  // Support Ticket Spike: >3 tickets in 7 days OR escalated ticket present
  if (data.recentSupportTickets > 3 || data.hasEscalatedTicket) {
    addAlert(
      'support_spike',
      'medium',
      'Elevated support activity detected. Review open tickets and consider proactive outreach.',
    );
  }

  // Feature Adoption Stall: no new feature usage in 30 days for growing accounts
  if (data.daysSinceLastFeatureUsage > 30 && data.isGrowingAccount) {
    addAlert(
      'feature_adoption_stall',
      'medium',
      'No new feature usage recorded in the past 30 days for a growth-tier account.',
    );
  }

  return newAlerts;
}

// ---------------------------------------------------------------------------
// Alert state helpers
// ---------------------------------------------------------------------------

/** Return a new alerts array with the specified alert marked as dismissed. */
export function dismissAlert(alerts: Alert[], alertId: string): Alert[] {
  return alerts.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a));
}

/**
 * Return undismissed alerts sorted by priority (high first),
 * then by most recently triggered.
 */
export function getActiveAlerts(alerts: Alert[]): Alert[] {
  return alerts
    .filter((a) => !a.dismissed)
    .sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
    });
}
