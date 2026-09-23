import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveAgmarknetPrices, getProvenanceBadgeConfig } from '@/lib/agmarknet';
import { getCropPrices } from '@/lib/supabase/crops';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') || 'Tamil Nadu';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    // Try fetching live Agmarknet prices if API key is configured
    const liveData = await fetchLiveAgmarknetPrices({ state, limit });

    if (liveData && liveData.records.length > 0) {
      return NextResponse.json({
        success: true,
        sourceStatus: 'LIVE',
        sourceNote: liveData.sourceNote,
        badge: getProvenanceBadgeConfig('LIVE'),
        count: liveData.records.length,
        lastUpdated: new Date().toISOString(),
        apiKeyConfigured: true,
        data: liveData.records
      });
    }

    // Fallback to verified local Agmarknet database
    const localPrices = await getCropPrices();
    return NextResponse.json({
      success: true,
      sourceStatus: 'RECENT',
      sourceNote: 'Verified APMC Mandi Bulletin (Tamil Nadu / Andhra Pradesh APMC Markets)',
      badge: getProvenanceBadgeConfig('RECENT'),
      count: localPrices.data.length,
      lastUpdated: new Date().toISOString(),
      apiKeyConfigured: Boolean(process.env.DATA_GOV_IN_API_KEY),
      data: localPrices.data
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Agmarknet market data',
        sourceStatus: 'DEMO/FALLBACK'
      },
      { status: 500 }
    );
  }
}
