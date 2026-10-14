import { NextRequest, NextResponse } from 'next/server';
import {
  getHistoricalFilterOptions,
  queryHistoricalPrices,
  exportHistoricalCSV,
  HistoricalQueryParams
} from '@/lib/historical-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'query';

    if (action === 'options') {
      const options = getHistoricalFilterOptions();
      return NextResponse.json({
        success: true,
        data: options
      });
    }

    if (action === 'export') {
      const params: HistoricalQueryParams = {
        crop: searchParams.get('crop') || undefined,
        district: searchParams.get('district') || undefined,
        market: searchParams.get('market') || undefined,
        startDate: searchParams.get('start_date') || undefined,
        endDate: searchParams.get('end_date') || undefined,
        variety: searchParams.get('variety') || undefined,
        grade: searchParams.get('grade') || undefined,
        search: searchParams.get('search') || undefined,
        sortBy: (searchParams.get('sort_by') as any) || 'date',
        sortOrder: (searchParams.get('sort_order') as any) || 'desc'
      };

      const csvContent = exportHistoricalCSV(params);
      const cropName = params.crop || 'tamil_nadu';
      const filename = `agrime_historical_${cropName}_${Date.now()}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Default: query historical prices
    const params: HistoricalQueryParams = {
      crop: searchParams.get('crop') || undefined,
      district: searchParams.get('district') || undefined,
      market: searchParams.get('market') || undefined,
      startDate: searchParams.get('start_date') || undefined,
      endDate: searchParams.get('end_date') || undefined,
      variety: searchParams.get('variety') || undefined,
      grade: searchParams.get('grade') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!) : 20,
      sortBy: (searchParams.get('sort_by') as any) || 'date',
      sortOrder: (searchParams.get('sort_order') as any) || 'desc'
    };

    const result = queryHistoricalPrices(params);
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error('Error in /api/historical-prices:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to process historical price query'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = queryHistoricalPrices(body);
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    console.error('Error in /api/historical-prices POST:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to process historical price query'
      },
      { status: 500 }
    );
  }
}
