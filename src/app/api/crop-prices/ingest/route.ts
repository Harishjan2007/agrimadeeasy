import { NextRequest, NextResponse } from 'next/server';
import { ingestGovernmentCropPrices } from '@/lib/crop-ingestion';

/**
 * AgriME Server-Side APMC Mandi Ingestion Endpoint
 * ------------------------------------------------
 * GET  - Check ingestion status, API key configuration, and trigger optional manual sync
 * POST - Execute manual or scheduled ingestion of government APMC mandi price feeds
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trigger = searchParams.get('trigger') === 'true';
  const state = searchParams.get('state') || 'Tamil Nadu';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const hasApiKey = Boolean(process.env.DATA_GOV_IN_API_KEY);

  if (trigger) {
    const result = await ingestGovernmentCropPrices({ state, limit });
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  }

  return NextResponse.json({
    status: 'READY',
    apiKeyConfigured: hasApiKey,
    credentialRequired: 'DATA_GOV_IN_API_KEY (Server environment variable from https://data.gov.in)',
    usage: 'Send POST to /api/crop-prices/ingest or GET with ?trigger=true to trigger near-real-time ingestion',
    supportedStates: ['Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Telangana'],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is allowed
    }

    const state = body.state || 'Tamil Nadu';
    const limit = body.limit ? parseInt(String(body.limit), 10) : 100;

    const result = await ingestGovernmentCropPrices({ state, limit });

    if (!result.success && result.status === 'BLOCKED_MISSING_KEY') {
      return NextResponse.json(result, { status: 403 });
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'SERVER_ERROR',
        message: error.message || 'Internal server error during crop price ingestion',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
