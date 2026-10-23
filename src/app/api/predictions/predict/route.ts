import { NextRequest, NextResponse } from 'next/server';
import { predictCropPriceWithTreeEnsemble } from '@/lib/tree-inference-engine';
import { predictCropPrice, generateAllMLPredictions } from '@/lib/ml-prediction-service';
import { queryHistoricalPrices, slugify } from '@/lib/historical-data';
import { MOCK_CROP_PRICES, MOCK_CROPS, MOCK_MARKETS } from '@/lib/mock-data';

function computeForecast(params: {
  cropSlug: string;
  cropName: string;
  marketName: string;
  districtName: string;
  currentPrice: number;
  horizon: '7 Days' | '15 Days' | '30 Days';
  date: string;
  minPrice: number;
  maxPrice: number;
  rollMean7d: number;
  rollMean30d: number;
  rollStd30d: number;
}) {
  try {
    return predictCropPriceWithTreeEnsemble({
      cropId: params.cropSlug,
      marketId: slugify(params.marketName),
      currentPrice: params.currentPrice,
      horizon: params.horizon,
      crop: {
        id: params.cropSlug,
        name: params.cropName,
        category: 'Vegetables',
        icon: '🌾'
      },
      market: {
        id: slugify(params.marketName),
        name: params.marketName,
        location: params.districtName,
        district: params.districtName,
        latitude: 11.0,
        longitude: 77.0
      },
      district: params.districtName,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      rollMean7d: params.rollMean7d,
      rollMean30d: params.rollMean30d,
      rollStd30d: params.rollStd30d,
      date: params.date
    });
  } catch (err) {
    console.warn('Tree ensemble prediction fallback to parametric service:', err);
    return predictCropPrice({
      cropId: params.cropSlug,
      marketId: slugify(params.marketName),
      currentPrice: params.currentPrice,
      horizon: params.horizon,
      crop: {
        id: params.cropSlug,
        name: params.cropName,
        category: 'Vegetables',
        icon: '🌾'
      },
      market: {
        id: slugify(params.marketName),
        name: params.marketName,
        location: params.districtName,
        district: params.districtName,
        latitude: 11.0,
        longitude: 77.0
      },
      date: params.date
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Support bulk prediction retrieval for all tracked crops and markets
    if (searchParams.get('all') === 'true' || searchParams.get('suite') === 'true') {
      const allPredictions = generateAllMLPredictions(MOCK_CROP_PRICES, MOCK_CROPS, MOCK_MARKETS);
      return NextResponse.json({
        success: true,
        data: allPredictions
      });
    }

    const cropParam = searchParams.get('crop') || searchParams.get('crop_id') || 'tomato';
    const districtParam = searchParams.get('district') || undefined;
    const marketParam = searchParams.get('market') || searchParams.get('market_id') || undefined;
    const horizonParam = searchParams.get('horizon') || '15 Days';
    let currentPrice = parseFloat(searchParams.get('current_price') || '0');

    const horizon = (['7 Days', '15 Days', '30 Days'].includes(horizonParam)
      ? horizonParam
      : '15 Days') as '7 Days' | '15 Days' | '30 Days';

    const cropSlug = slugify(cropParam);

    // Fetch genuine historical context from the 10-year dataset
    const histResult = queryHistoricalPrices({
      crop: cropSlug,
      district: districtParam && districtParam !== 'all' ? districtParam : undefined,
      market: marketParam && marketParam !== 'all' ? marketParam : undefined,
      pageSize: 30,
      sortBy: 'date',
      sortOrder: 'desc'
    });

    if (histResult.summaryCards.matchingRecords === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient historical observations for ${cropParam} in the selected market to generate an authentic ML forecast. Please select a supported crop or broader mandi.`
        },
        { status: 400 }
      );
    }

    // If current price was not explicitly provided or is 0, use latest historical modal price
    if (!currentPrice || currentPrice <= 0) {
      currentPrice =
        histResult.priceSummary.latestRecord?.modal_price ||
        histResult.priceSummary.modalPrice ||
        histResult.priceSummary.avgPrice;
    }

    const cropName = histResult.priceSummary.latestRecord?.crop || cropParam;
    const districtName = districtParam || histResult.priceSummary.latestRecord?.district || 'Tamil Nadu';
    const marketName = marketParam || histResult.priceSummary.latestRecord?.market || 'All Mandis';
    const latestDate = histResult.priceSummary.latestDate || new Date().toISOString().split('T')[0];

    // Compute genuine rolling statistics from historical observations
    const recentPrices = histResult.records.map((r) => r.modal_price).filter((p) => p > 0);
    const minPrice = histResult.priceSummary.latestRecord?.min_price || currentPrice * 0.94;
    const maxPrice = histResult.priceSummary.latestRecord?.max_price || currentPrice * 1.06;
    const p7 = recentPrices.slice(0, 7);
    const rollMean7d = p7.length > 0 ? p7.reduce((a, b) => a + b, 0) / p7.length : currentPrice;
    const p30 = recentPrices.slice(0, 30);
    const rollMean30d = p30.length > 0 ? p30.reduce((a, b) => a + b, 0) / p30.length : currentPrice;
    let rollStd30d = (maxPrice - minPrice) / 4.0;
    if (p30.length >= 2) {
      const mean = rollMean30d;
      const variance = p30.reduce((acc, p) => acc + (p - mean) * (p - mean), 0) / (p30.length - 1);
      rollStd30d = Math.sqrt(variance);
    }

    // Compute main forecast using authentic Scikit-Learn tree ensemble
    const mainForecast = computeForecast({
      cropSlug,
      cropName,
      marketName,
      districtName,
      currentPrice,
      horizon,
      date: latestDate,
      minPrice,
      maxPrice,
      rollMean7d,
      rollMean30d,
      rollStd30d
    });

    // Compute multi-horizon projections (7, 15, 30 days)
    const horizonsList: ('7 Days' | '15 Days' | '30 Days')[] = ['7 Days', '15 Days', '30 Days'];
    const baseDate = new Date(latestDate);

    const multiHorizonProjections = horizonsList.map((h) => {
      const days = h === '7 Days' ? 7 : h === '15 Days' ? 15 : 30;
      const targetDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = computeForecast({
        cropSlug,
        cropName,
        marketName,
        districtName,
        currentPrice,
        horizon: h,
        date: latestDate,
        minPrice,
        maxPrice,
        rollMean7d,
        rollMean30d,
        rollStd30d
      });

      return {
        horizon: h,
        days,
        targetDate,
        predictedPrice: res.predictedPrice,
        predictedMin: res.predictedMin,
        predictedMax: res.predictedMax,
        trend: res.trend
      };
    });

    // Format chronological historical context points (oldest to newest)
    const historicalPoints = histResult.records
      .slice(0, 20)
      .reverse()
      .map((r) => ({
        date: r.arrival_date,
        modal_price: r.modal_price,
        min_price: r.min_price,
        max_price: r.max_price,
        market: r.market
      }));

    return NextResponse.json({
      success: true,
      data: {
        selectedCrop: {
          slug: cropSlug,
          name: cropName
        },
        selectedDistrict: districtName,
        selectedMarket: marketName,
        currentPrice,
        currentPriceDate: latestDate,
        horizon,
        forecastDate: multiHorizonProjections.find((p) => p.horizon === horizon)?.targetDate || latestDate,
        predictedPrice: mainForecast.predictedPrice,
        predictedMin: mainForecast.predictedMin,
        predictedMax: mainForecast.predictedMax,
        trend: mainForecast.trend,
        confidenceIntervalPct: mainForecast.confidenceIntervalPct,
        unit: '₹ / Quintal',
        mlMetrics: mainForecast.mlMetrics,
        historicalContext: historicalPoints,
        multiHorizonProjections
      }
    });
  } catch (err: any) {
    console.error('Prediction API GET error:', err);
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
    const { crop, district, market, horizon = '15 Days', currentPrice: reqPrice } = body;

    if (!crop) {
      return NextResponse.json(
        { success: false, error: 'Crop selection is required.' },
        { status: 400 }
      );
    }

    const cropSlug = slugify(crop);

    const histResult = queryHistoricalPrices({
      crop: cropSlug,
      district: district && district !== 'all' ? district : undefined,
      market: market && market !== 'all' ? market : undefined,
      pageSize: 30,
      sortBy: 'date',
      sortOrder: 'desc'
    });

    if (histResult.summaryCards.matchingRecords === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient historical observations for ${crop} in the selected market to generate an authentic ML forecast.`
        },
        { status: 400 }
      );
    }

    let currentPrice = Number(reqPrice);
    if (!currentPrice || currentPrice <= 0) {
      currentPrice =
        histResult.priceSummary.latestRecord?.modal_price ||
        histResult.priceSummary.modalPrice ||
        histResult.priceSummary.avgPrice;
    }

    const cropName = histResult.priceSummary.latestRecord?.crop || crop;
    const districtName = district || histResult.priceSummary.latestRecord?.district || 'Tamil Nadu';
    const marketName = market || histResult.priceSummary.latestRecord?.market || 'All Mandis';
    const latestDate = histResult.priceSummary.latestDate || new Date().toISOString().split('T')[0];

    // Compute genuine rolling statistics from historical observations
    const recentPrices = histResult.records.map((r) => r.modal_price).filter((p) => p > 0);
    const minPrice = histResult.priceSummary.latestRecord?.min_price || currentPrice * 0.94;
    const maxPrice = histResult.priceSummary.latestRecord?.max_price || currentPrice * 1.06;
    const p7 = recentPrices.slice(0, 7);
    const rollMean7d = p7.length > 0 ? p7.reduce((a, b) => a + b, 0) / p7.length : currentPrice;
    const p30 = recentPrices.slice(0, 30);
    const rollMean30d = p30.length > 0 ? p30.reduce((a, b) => a + b, 0) / p30.length : currentPrice;
    let rollStd30d = (maxPrice - minPrice) / 4.0;
    if (p30.length >= 2) {
      const mean = rollMean30d;
      const variance = p30.reduce((acc, p) => acc + (p - mean) * (p - mean), 0) / (p30.length - 1);
      rollStd30d = Math.sqrt(variance);
    }

    const mainForecast = computeForecast({
      cropSlug,
      cropName,
      marketName,
      districtName,
      currentPrice,
      horizon: (['7 Days', '15 Days', '30 Days'].includes(horizon) ? horizon : '15 Days') as any,
      date: latestDate,
      minPrice,
      maxPrice,
      rollMean7d,
      rollMean30d,
      rollStd30d
    });

    const horizonsList: ('7 Days' | '15 Days' | '30 Days')[] = ['7 Days', '15 Days', '30 Days'];
    const baseDate = new Date(latestDate);

    const multiHorizonProjections = horizonsList.map((h) => {
      const days = h === '7 Days' ? 7 : h === '15 Days' ? 15 : 30;
      const targetDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = computeForecast({
        cropSlug,
        cropName,
        marketName,
        districtName,
        currentPrice,
        horizon: h,
        date: latestDate,
        minPrice,
        maxPrice,
        rollMean7d,
        rollMean30d,
        rollStd30d
      });

      return {
        horizon: h,
        days,
        targetDate,
        predictedPrice: res.predictedPrice,
        predictedMin: res.predictedMin,
        predictedMax: res.predictedMax,
        trend: res.trend
      };
    });

    const historicalPoints = histResult.records
      .slice(0, 20)
      .reverse()
      .map((r) => ({
        date: r.arrival_date,
        modal_price: r.modal_price,
        min_price: r.min_price,
        max_price: r.max_price,
        market: r.market
      }));

    return NextResponse.json({
      success: true,
      data: {
        selectedCrop: {
          slug: cropSlug,
          name: cropName
        },
        selectedDistrict: districtName,
        selectedMarket: marketName,
        currentPrice,
        currentPriceDate: latestDate,
        horizon,
        forecastDate: multiHorizonProjections.find((p) => p.horizon === horizon)?.targetDate || latestDate,
        predictedPrice: mainForecast.predictedPrice,
        predictedMin: mainForecast.predictedMin,
        predictedMax: mainForecast.predictedMax,
        trend: mainForecast.trend,
        confidenceIntervalPct: mainForecast.confidenceIntervalPct,
        unit: '₹ / Quintal',
        mlMetrics: mainForecast.mlMetrics,
        historicalContext: historicalPoints,
        multiHorizonProjections
      }
    });
  } catch (err: any) {
    console.error('Prediction API POST error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'ML Prediction failed'
      },
      { status: 500 }
    );
  }
}
