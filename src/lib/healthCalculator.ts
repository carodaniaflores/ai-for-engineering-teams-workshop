// src/lib/healthCalculator.ts
// Pure functions — no side effects; safe for real-time dashboard use.

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PaymentData {
  /** Number of days since the most recent payment was recorded. */
  daysSinceLastPayment: number;
  /** Average number of days a payment is delayed past its due date. */
  averagePaymentDelayDays: number;
  /** Total outstanding overdue amount in dollars. */
  overdueAmount: number;
}

export interface EngagementData {
  /** Current average logins per day. */
  loginFrequency: number;
  /** Total number of distinct features used. */
  featureUsageCount: number;
  /** Total number of support tickets submitted. */
  supportTicketVolume: number;
}

export interface ContractData {
  /** Number of days remaining until contract renewal (may be negative if past due). */
  daysUntilRenewal: number;
  /** Annual contract value in dollars. */
  contractValue: number;
  /** Whether the customer has upgraded their plan within the last 90 days. */
  hasRecentUpgrade: boolean;
}

export interface SupportData {
  /** Average number of days to resolve a support ticket. */
  averageResolutionTimeDays: number;
  /** Customer satisfaction score on a 0–100 scale. */
  satisfactionScore: number;
  /** Number of tickets escalated to higher support tiers. */
  escalationCount: number;
}

export interface CustomerHealthInput {
  payment: PaymentData;
  engagement: EngagementData;
  contract: ContractData;
  support: SupportData;
}

export interface FactorScores {
  payment: number;
  engagement: number;
  contract: number;
  support: number;
}

export interface HealthScoreResult {
  overall: number;
  riskLevel: 'healthy' | 'warning' | 'critical';
  breakdown: FactorScores;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function assertNonNegative(value: number, fieldName: string): void {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number, got ${value}`);
  }
  if (value < 0) {
    throw new Error(`${fieldName} must be non-negative, got ${value}`);
  }
}

function assertInRange(value: number, min: number, max: number, fieldName: string): void {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number, got ${value}`);
  }
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}, got ${value}`);
  }
}

function validatePaymentData(data: PaymentData): void {
  if (!data || typeof data !== 'object') {
    throw new Error('payment data is required and must be an object');
  }
  assertNonNegative(data.daysSinceLastPayment, 'payment.daysSinceLastPayment');
  assertNonNegative(data.averagePaymentDelayDays, 'payment.averagePaymentDelayDays');
  assertNonNegative(data.overdueAmount, 'payment.overdueAmount');
}

function validateEngagementData(data: EngagementData): void {
  if (!data || typeof data !== 'object') {
    throw new Error('engagement data is required and must be an object');
  }
  assertNonNegative(data.loginFrequency, 'engagement.loginFrequency');
  assertNonNegative(data.featureUsageCount, 'engagement.featureUsageCount');
  assertNonNegative(data.supportTicketVolume, 'engagement.supportTicketVolume');
}

function validateContractData(data: ContractData): void {
  if (!data || typeof data !== 'object') {
    throw new Error('contract data is required and must be an object');
  }
  if (typeof data.daysUntilRenewal !== 'number' || !isFinite(data.daysUntilRenewal)) {
    throw new Error('contract.daysUntilRenewal must be a finite number');
  }
  assertNonNegative(data.contractValue, 'contract.contractValue');
  if (typeof data.hasRecentUpgrade !== 'boolean') {
    throw new Error('contract.hasRecentUpgrade must be a boolean');
  }
}

function validateSupportData(data: SupportData): void {
  if (!data || typeof data !== 'object') {
    throw new Error('support data is required and must be an object');
  }
  assertNonNegative(data.averageResolutionTimeDays, 'support.averageResolutionTimeDays');
  assertInRange(data.satisfactionScore, 0, 100, 'support.satisfactionScore');
  assertNonNegative(data.escalationCount, 'support.escalationCount');
}

// ---------------------------------------------------------------------------
// Individual factor scoring functions (each returns 0–100)
// ---------------------------------------------------------------------------

/**
 * Score payment health.
 * Thresholds: daysSinceLastPayment 0→100 / 60→0; delay 0→100 / 30→0; overdue $0→100 / $10k→0.
 */
export function scorePayment(data: PaymentData): number {
  validatePaymentData(data);

  const dayScore = Math.max(0, Math.min(100, 100 - (data.daysSinceLastPayment / 60) * 100));
  const delayScore = Math.max(0, Math.min(100, 100 - (data.averagePaymentDelayDays / 30) * 100));
  const overdueScore = Math.max(0, Math.min(100, 100 - (data.overdueAmount / 10000) * 100));

  return Math.round((dayScore + delayScore + overdueScore) / 3);
}

/**
 * Score engagement health.
 * loginFrequency: 1+/day → 100; featureUsageCount: 10+ → 100; supportTicketVolume: 0 → 100 (fewer = better).
 */
export function scoreEngagement(data: EngagementData): number {
  validateEngagementData(data);

  const loginScore = Math.min(100, data.loginFrequency * 100);
  const featureScore = Math.min(100, data.featureUsageCount * 10);
  const ticketScore = Math.max(0, Math.min(100, 100 - data.supportTicketVolume * 10));

  return Math.round((loginScore + featureScore + ticketScore) / 3);
}

/**
 * Score contract health.
 * daysUntilRenewal: 365+ → 100 / 0 → 0; contractValue: $100k → 100; hasRecentUpgrade adds bonus.
 */
export function scoreContract(data: ContractData): number {
  validateContractData(data);

  const renewalScore = Math.max(0, Math.min(100, (data.daysUntilRenewal / 365) * 100));
  const valueScore = Math.min(100, (data.contractValue / 100000) * 100);
  const upgradeScore = data.hasRecentUpgrade ? 100 : 50;

  return Math.round((renewalScore + valueScore + upgradeScore) / 3);
}

/**
 * Score support health.
 * resolutionTime: 1 day → 100 / 14+ days → 0; satisfactionScore: direct 0–100; escalations: 0 → 100 / 3+ → 0.
 */
export function scoreSupport(data: SupportData): number {
  validateSupportData(data);

  const resolutionScore = Math.max(0, Math.min(100, 100 - (data.averageResolutionTimeDays / 14) * 100));
  const satisfactionScore = data.satisfactionScore;
  const escalationScore = Math.max(0, Math.min(100, 100 - (data.escalationCount / 3) * 100));

  return Math.round((resolutionScore + satisfactionScore + escalationScore) / 3);
}

// ---------------------------------------------------------------------------
// Risk classification
// ---------------------------------------------------------------------------

function classifyRiskLevel(score: number): 'healthy' | 'warning' | 'critical' {
  if (score >= 71) return 'healthy';
  if (score >= 31) return 'warning';
  return 'critical';
}

// ---------------------------------------------------------------------------
// Main composite function
// ---------------------------------------------------------------------------

/**
 * Calculate a composite customer health score from 0–100 with factor breakdown.
 * Weights: Payment 40%, Engagement 30%, Contract 20%, Support 10%.
 * All inputs are validated; descriptive errors are thrown for invalid data.
 */
export function calculateHealthScore(input: CustomerHealthInput): HealthScoreResult {
  if (!input || typeof input !== 'object') {
    throw new Error('CustomerHealthInput is required');
  }

  // Validate each section (throws descriptive errors on bad input)
  validatePaymentData(input.payment);
  validateEngagementData(input.engagement);
  validateContractData(input.contract);
  validateSupportData(input.support);

  const paymentScore = scorePayment(input.payment);
  const engagementScore = scoreEngagement(input.engagement);
  const contractScore = scoreContract(input.contract);
  const supportScore = scoreSupport(input.support);

  // Weighted composite
  const raw =
    paymentScore * 0.4 +
    engagementScore * 0.3 +
    contractScore * 0.2 +
    supportScore * 0.1;

  const overall = Math.min(100, Math.max(0, Math.round(raw)));

  return {
    overall,
    riskLevel: classifyRiskLevel(overall),
    breakdown: {
      payment: paymentScore,
      engagement: engagementScore,
      contract: contractScore,
      support: supportScore,
    },
  };
}
