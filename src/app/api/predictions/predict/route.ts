import { NextRequest, NextResponse } from 'next/server';
import { predictCropPrice } from '@/lib/ml-prediction-service';
import { MOCK_CROPS, MOCK_MARKETS } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cropId = searchParams.get('crop_id') || 'c1';
    const marketId = searchParams.get('market_id') || 'm1';
    const currentPrice = parseFloat(searchParams.get('current_price') || '3450');
    const horizonParam = searchParams.get('horizon') || '15 Days';

    const horizon = (['7 Days', '15 Days', '30 Days'].includes(horizonParam) 
      ? horizonParam 
      : '15 Days') as '7 Days' | '15 Days' | '30 Days';

    const crop = MOCK_CROPS.find((c) => c.id === cropId);
    const market = MOCK_MARKETS.find((m) => m.id === marketId);

    const result = predictCropPrice({
      cropId,
      marketId,
      currentPrice,
      horizon,
      crop,
      market
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'ML Prediction failed'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cropId, marketId, currentPrice, horizon = '15 Days' } = body;

    if (!cropId || !marketId || currentPrice == null) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: cropId, marketId, currentPrice' },
        { status: 400 }
      );
    }

    const crop = MOCK_CROPS.find((c) => c.id === cropId);
    const market = MOCK_MARKETS.find((m) => m.id === marketId);

    const result = predictCropPrice({
      cropId,
      marketId,
      currentPrice: Number(currentPrice),
      horizon,
      crop,
      market
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'ML Prediction failed'
      },
      { status: 500 }
    );
  }
}
