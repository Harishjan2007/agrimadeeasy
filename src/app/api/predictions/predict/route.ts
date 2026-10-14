import { NextRequest, NextResponse } from 'next/server';
import { predictCropPrice } from '@/lib/ml-prediction-service';
import { queryHistoricalPrices, slugify, getHistoricalFilterOptions } from '@/lib/historical-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
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

    // Compute main forecast
    const mainForecast = predictCropPrice({
      cropId: cropSlug,
      marketId: slugify(marketName),
      currentPrice,
      horizon,
      crop: {
        id: cropSlug,
        name: cropName,
        category: 'Vegetables',
        icon: '🌾'
      },
      market: {
        id: slugify(marketName),
        name: marketName,
        location: districtName,
        district: districtName,
        latitude: 11.0,
        longitude: 77.0
      },
      date: latestDate
    });

    // Compute multi-horizon projections (7, 15, 30 days)
    const horizonsList: ('7 Days' | '15 Days' | '30 Days')[] = ['7 Days', '15 Days', '30 Days'];
    const baseDate = new Date(latestDate);

    const multiHorizonProjections = horizonsList.map((h) => {
      const days = h === '7 Days' ? 7 : h === '15 Days' ? 15 : 30;
      const targetDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = predictCropPrice({
        cropId: cropSlug,
        marketId: slugify(marketName),
        currentPrice,
        horizon: h,
        date: latestDate
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

    const mainForecast = predictCropPrice({
      cropId: cropSlug,
      marketId: slugify(marketName),
      currentPrice,
      horizon: horizon as any,
      date: latestDate
    });

    const horizonsList: ('7 Days' | '15 Days' | '30 Days')[] = ['7 Days', '15 Days', '30 Days'];
    const baseDate = new Date(latestDate);

    const multiHorizonProjections = horizonsList.map((h) => {
      const days = h === '7 Days' ? 7 : h === '15 Days' ? 15 : 30;
      const targetDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = predictCropPrice({
        cropId: cropSlug,
        marketId: slugify(marketName),
        currentPrice,
        horizon: h,
        date: latestDate
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
