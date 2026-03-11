import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------
// Health check endpoint for load balancer probes.
// Returns 200 + { status: 'ok' } when all dependencies are reachable.
// Returns 503 + { status: 'degraded' } otherwise.

interface HealthCheckResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  version: string;
  checks: Record<string, 'ok' | 'degraded'>;
}

async function checkDependencies(): Promise<Record<string, 'ok' | 'degraded'>> {
  // Expand with real dependency probes (DB, external APIs) as the app grows.
  return {
    app: 'ok',
  };
}

export async function GET(): Promise<NextResponse<HealthCheckResult>> {
  const checks = await checkDependencies();
  const allOk = Object.values(checks).every((v) => v === 'ok');

  const body: HealthCheckResult = {
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.0.0',
    checks,
  };

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
