import { NextRequest, NextResponse } from 'next/server';
import { marketIntelligenceService, MarketIntelligenceError } from '../../../../services/MarketIntelligenceService';

const VALID_COMPANY = /^[a-zA-Z0-9 ]{1,100}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ company: string }> }
) {
  const { company } = await params;
  const decoded = decodeURIComponent(company ?? '').trim();

  if (!decoded || !VALID_COMPANY.test(decoded)) {
    return NextResponse.json(
      { error: 'Invalid or missing company name.' },
      { status: 400 }
    );
  }

  try {
    const data = await marketIntelligenceService.getMarketIntelligence(decoded);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof MarketIntelligenceError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
