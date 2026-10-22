import fs from 'node:fs';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), 'ml', 'data', 'processed', 'cache');
const CROPS_DIR = path.join(CACHE_DIR, 'crops');
const FILTER_OPTIONS_FILE = path.join(CACHE_DIR, 'filter_options.json');
const CSV_FILE = path.join(process.cwd(), 'ml', 'data', 'processed', 'tamil_nadu_last_10_years.csv');

export interface FilterOptions {
  totalRecords: number;
  dateRange: {
    min: string;
    max: string;
  };
  datasetSummary: {
    totalRecords: number;
    uniqueCropsCount: number;
    uniqueDistrictsCount: number;
    uniqueMarketsCount: number;
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    unit: string;
  };
  crops: {
    slug: string;
    name: string;
    count: number;
    minPrice: number;
    maxPrice: number;
    latestDate: string;
  }[];
  districts: string[];
  marketsByDistrict: Record<string, string[]>;
  varieties: string[];
  grades: string[];
}

export interface HistoricalQueryParams {
  crop?: string;
  district?: string;
  market?: string;
  startDate?: string;
  endDate?: string;
  variety?: string;
  grade?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'modal_price' | 'min_price' | 'max_price' | 'crop';
  sortOrder?: 'asc' | 'desc';
}

export interface HistoricalRecord {
  id: string;
  arrival_date: string;
  crop: string;
  district: string;
  market: string;
  variety: string;
  grade: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
}

export interface HistoricalChartPoint {
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  count: number;
}

export interface HistoricalQueryResult {
  summaryCards: {
    matchingRecords: number;
    totalDatasetRecords: number;
    availableCrops: number;
    availableMarkets: number;
    availableDistricts: number;
    dateRange: {
      start: string;
      end: string;
    };
    datasetWideDateRange: {
      start: string;
      end: string;
    };
  };
  priceSummary: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    modalPrice: number;
    latestRecord: HistoricalRecord | null;
    latestDate: string | null;
    unit: string;
  };
  chartData: HistoricalChartPoint[];
  records: HistoricalRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
}

let cachedFilterOptions: FilterOptions | null = null;
const cropDataMemoryCache = new Map<string, any>();

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Retrieve cached dataset filter options and metadata
 */
export function getHistoricalFilterOptions(): FilterOptions {
  if (cachedFilterOptions) {
    return cachedFilterOptions;
  }

  if (!fs.existsSync(FILTER_OPTIONS_FILE)) {
    throw new Error('Historical dataset filter options file not found. Ensure cache builder has run.');
  }

  const raw = fs.readFileSync(FILTER_OPTIONS_FILE, 'utf-8');
  cachedFilterOptions = JSON.parse(raw) as FilterOptions;
  return cachedFilterOptions;
}

/**
 * Load crop partition into memory cache
 */
function loadCropPartition(slug: string): any | null {
  if (cropDataMemoryCache.has(slug)) {
    return cropDataMemoryCache.get(slug);
  }

  const filePath = path.join(CROPS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    // Keep max 20 crops in memory LRU-style
    if (cropDataMemoryCache.size >= 20) {
      const firstKey = cropDataMemoryCache.keys().next().value;
      if (firstKey) cropDataMemoryCache.delete(firstKey);
    }
    cropDataMemoryCache.set(slug, data);
    return data;
  } catch (err) {
    console.error(`Error loading crop partition ${slug}:`, err);
    return null;
  }
}

/**
 * Query historical prices with server-side filtering, aggregations, chart generation, and pagination
 */
export function queryHistoricalPrices(params: HistoricalQueryParams): HistoricalQueryResult {
  const options = getHistoricalFilterOptions();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(5, Number(params.pageSize) || 20));
  const sortBy = params.sortBy || 'date';
  const sortOrder = params.sortOrder || 'desc';

  // Determine crop to inspect
  let targetCropSlug = '';
  if (params.crop && params.crop !== 'all') {
    targetCropSlug = slugify(params.crop);
  }

  // If no crop specified, check options for top crop or search
  if (!targetCropSlug && options.crops.length > 0) {
    // If search term looks like a crop, find closest
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      const match = options.crops.find((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q));
      if (match) targetCropSlug = match.slug;
    }
    if (!targetCropSlug) {
      // Default to the highest-volume crop
      targetCropSlug = options.crops[0].slug;
    }
  }

  const cropData = loadCropPartition(targetCropSlug);
  if (!cropData || !Array.isArray(cropData.records)) {
    return {
      summaryCards: {
        matchingRecords: 0,
        totalDatasetRecords: options.totalRecords,
        availableCrops: 0,
        availableMarkets: 0,
        availableDistricts: 0,
        dateRange: { start: '', end: '' },
        datasetWideDateRange: {
          start: options.dateRange.min,
          end: options.dateRange.max
        }
      },
      priceSummary: {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        modalPrice: 0,
        latestRecord: null,
        latestDate: null,
        unit: '₹ / Quintal'
      },
      chartData: [],
      records: [],
      pagination: {
        page: 1,
        pageSize,
        totalRecords: 0,
        totalPages: 0
      }
    };
  }

  const cropName = cropData.name;
  const rawRecords: any[][] = cropData.records;

  // Filter criteria
  const reqDistrict = params.district && params.district !== 'all' ? params.district.toLowerCase() : null;
  const reqMarket = params.market && params.market !== 'all' ? params.market.toLowerCase() : null;
  const reqStart = params.startDate || null;
  const reqEnd = params.endDate || null;
  const reqVariety = params.variety && params.variety !== 'all' ? params.variety.toLowerCase() : null;
  const reqGrade = params.grade && params.grade !== 'all' ? params.grade.toLowerCase() : null;
  const searchQ = params.search ? params.search.toLowerCase().trim() : null;

  const matchedRows: HistoricalRecord[] = [];
  const uniqueDistricts = new Set<string>();
  const uniqueMarkets = new Set<string>();
  const uniqueCrops = new Set<string>([cropName]);

  let sumPrice = 0;
  let minPriceSeen = Infinity;
  let maxPriceSeen = -Infinity;
  let earliestDateSeen = '9999-99-99';
  let latestDateSeen = '0000-00-00';
  let latestRecordObj: HistoricalRecord | null = null;

  // Day grouping for chart: date -> { modalSum, minSum, maxSum, count }
  const dailyAggMap = new Map<string, { modalSum: number; minSum: number; maxSum: number; count: number }>();

  for (let i = 0; i < rawRecords.length; i++) {
    const r = rawRecords[i];
    // Schema: [arrival_date, district, market, variety, grade, minPrice, maxPrice, modalPrice]
    const arrivalDate = r[0];
    const district = r[1];
    const market = r[2];
    const variety = r[3];
    const grade = r[4];
    const minPrice = r[5];
    const maxPrice = r[6];
    const modalPrice = r[7];

    // Filter checks
    if (reqStart && arrivalDate < reqStart) continue;
    if (reqEnd && arrivalDate > reqEnd) continue;
    if (reqDistrict && district.toLowerCase() !== reqDistrict) continue;
    if (reqMarket && market.toLowerCase() !== reqMarket) continue;
    if (reqVariety && variety.toLowerCase() !== reqVariety) continue;
    if (reqGrade && grade.toLowerCase() !== reqGrade) continue;

    if (searchQ) {
      const match =
        cropName.toLowerCase().includes(searchQ) ||
        district.toLowerCase().includes(searchQ) ||
        market.toLowerCase().includes(searchQ) ||
        variety.toLowerCase().includes(searchQ) ||
        arrivalDate.includes(searchQ);
      if (!match) continue;
    }

    const recObj: HistoricalRecord = {
      id: `${targetCropSlug}-${arrivalDate}-${i}`,
      arrival_date: arrivalDate,
      crop: cropName,
      district,
      market,
      variety: variety || 'Standard',
      grade: grade || 'FAQ',
      min_price: minPrice,
      max_price: maxPrice,
      modal_price: modalPrice,
      unit: '₹/Quintal'
    };

    matchedRows.push(recObj);
    uniqueDistricts.add(district);
    uniqueMarkets.add(market);

    sumPrice += modalPrice;
    if (modalPrice < minPriceSeen) minPriceSeen = modalPrice;
    if (modalPrice > maxPriceSeen) maxPriceSeen = modalPrice;
    if (arrivalDate < earliestDateSeen) earliestDateSeen = arrivalDate;
    if (arrivalDate >= latestDateSeen) {
      latestDateSeen = arrivalDate;
      latestRecordObj = recObj;
    }

    // Chart daily aggregation
    let dayEntry = dailyAggMap.get(arrivalDate);
    if (!dayEntry) {
      dayEntry = { modalSum: 0, minSum: 0, maxSum: 0, count: 0 };
      dailyAggMap.set(arrivalDate, dayEntry);
    }
    dayEntry.modalSum += modalPrice;
    dayEntry.minSum += minPrice;
    dayEntry.maxSum += maxPrice;
    dayEntry.count++;
  }

  const totalMatching = matchedRows.length;
  const avgPrice = totalMatching > 0 ? Math.round((sumPrice / totalMatching) * 100) / 100 : 0;
  const resolvedMin = totalMatching > 0 ? minPriceSeen : 0;
  const resolvedMax = totalMatching > 0 ? maxPriceSeen : 0;
  const resolvedModal = latestRecordObj ? latestRecordObj.modal_price : (totalMatching > 0 ? Math.round(avgPrice) : 0);

  // Build chronological chart data
  const sortedDates = Array.from(dailyAggMap.keys()).sort();
  let chartData: HistoricalChartPoint[] = sortedDates.map((d) => {
    const entry = dailyAggMap.get(d)!;
    return {
      date: d,
      modal_price: Math.round(entry.modalSum / entry.count),
      min_price: Math.round(entry.minSum / entry.count),
      max_price: Math.round(entry.maxSum / entry.count),
      avg_price: Math.round(entry.modalSum / entry.count),
      count: entry.count
    };
  });

  // Downsample if more than 200 points for smooth charting
  if (chartData.length > 200) {
    const step = Math.ceil(chartData.length / 200);
    const downsampled: HistoricalChartPoint[] = [];
    for (let i = 0; i < chartData.length; i += step) {
      downsampled.push(chartData[i]);
    }
    // Always include the latest point
    if (chartData.length > 0 && downsampled[downsampled.length - 1] !== chartData[chartData.length - 1]) {
      downsampled.push(chartData[chartData.length - 1]);
    }
    chartData = downsampled;
  }

  // Sorting matched records
  matchedRows.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') cmp = a.arrival_date.localeCompare(b.arrival_date);
    else if (sortBy === 'modal_price') cmp = a.modal_price - b.modal_price;
    else if (sortBy === 'min_price') cmp = a.min_price - b.min_price;
    else if (sortBy === 'max_price') cmp = a.max_price - b.max_price;
    else if (sortBy === 'crop') cmp = a.crop.localeCompare(b.crop);

    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Pagination slice
  const startIndex = (page - 1) * pageSize;
  const paginatedRecords = matchedRows.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(totalMatching / pageSize);

  return {
    summaryCards: {
      matchingRecords: totalMatching,
      totalDatasetRecords: options.totalRecords,
      availableCrops: uniqueCrops.size,
      availableMarkets: uniqueMarkets.size,
      availableDistricts: uniqueDistricts.size,
      dateRange: {
        start: totalMatching > 0 ? earliestDateSeen : '',
        end: totalMatching > 0 ? latestDateSeen : ''
      },
      datasetWideDateRange: {
        start: options.dateRange.min,
        end: options.dateRange.max
      }
    },
    priceSummary: {
      minPrice: resolvedMin,
      maxPrice: resolvedMax,
      avgPrice,
      modalPrice: resolvedModal,
      latestRecord: latestRecordObj,
      latestDate: latestRecordObj ? latestRecordObj.arrival_date : null,
      unit: '₹ / Quintal'
    },
    chartData,
    records: paginatedRecords,
    pagination: {
      page,
      pageSize,
      totalRecords: totalMatching,
      totalPages
    }
  };
}

/**
 * Format matching records as CSV for export
 */
export function exportHistoricalCSV(params: HistoricalQueryParams): string {
  // Query with large page size for export (up to 5000 rows)
  const result = queryHistoricalPrices({
    ...params,
    page: 1,
    pageSize: 5000
  });

  const headers = [
    'Arrival Date',
    'Commodity',
    'District',
    'Market',
    'Variety',
    'Grade',
    'Min Price (Rs/Q)',
    'Max Price (Rs/Q)',
    'Modal Price (Rs/Q)'
  ];

  const lines = [headers.join(',')];
  for (const r of result.records) {
    const row = [
      r.arrival_date,
      `"${r.crop}"`,
      `"${r.district}"`,
      `"${r.market}"`,
      `"${r.variety}"`,
      `"${r.grade}"`,
      r.min_price,
      r.max_price,
      r.modal_price
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}
