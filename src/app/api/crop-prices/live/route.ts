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
      const liveObservationDate = liveData.records[0]?.arrival_date || new Date().toISOString().split('T')[0];
      return NextResponse.json({
        success: true,
        isLive: true,
        sourceStatus: 'LIVE',
        sourceNote: liveData.sourceNote,
        badge: getProvenanceBadgeConfig('LIVE'),
        count: liveData.records.length,
        observationDate: liveObservationDate,
        lastUpdated: new Date().toISOString(),
        apiKeyConfigured: true,
        data: liveData.records
      });
    }

    // Fallback to verified local Agmarknet database snapshot
    const localPrices = await getCropPrices();
    const latestObservationDate = localPrices.data.length > 0
      ? (localPrices.data[0].arrival_date || localPrices.data[0].recorded_at.split('T')[0])
      : '2026-08-24';

    return NextResponse.json({
      success: true,
      isLive: false,
      sourceStatus: 'RECENT',
      sourceNote: 'Verified APMC Mandi Historical Snapshot (data.gov.in Agmarknet)',
      badge: getProvenanceBadgeConfig('RECENT'),
      count: localPrices.data.length,
      observationDate: latestObservationDate,
      lastUpdated: latestObservationDate,
      apiFallbackReason: process.env.DATA_GOV_IN_API_KEY
        ? 'Upstream Agmarknet server timed out or returned no daily arrivals; displaying verified APMC historical snapshot'
        : 'DATA_GOV_IN_API_KEY is not configured on server; displaying verified APMC historical snapshot',
      apiKeyConfigured: Boolean(process.env.DATA_GOV_IN_API_KEY),
      data: localPrices.data
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        isLive: false,
        error: error.message || 'Failed to fetch Agmarknet market data',
        sourceStatus: 'DEMO/FALLBACK'
      },
      { status: 500 }
    );
  }
}
