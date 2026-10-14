import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const CSV_FILE = path.join(ROOT_DIR, 'ml', 'data', 'processed', 'tamil_nadu_last_10_years.csv');
const CACHE_DIR = path.join(ROOT_DIR, 'ml', 'data', 'processed', 'cache');
const CROPS_DIR = path.join(CACHE_DIR, 'crops');
const FILTER_OPTIONS_FILE = path.join(CACHE_DIR, 'filter_options.json');
const STATUS_FILE = path.join(CACHE_DIR, 'cache_status.json');

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function buildHistoricalCache() {
  console.log('⚡ Starting Historical Data Cache Builder...');

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV not found at: ${CSV_FILE}`);
    return;
  }

  // Check if cache already built
  if (fs.existsSync(STATUS_FILE) && fs.existsSync(FILTER_OPTIONS_FILE)) {
    try {
      const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
      if (status.status === 'completed') {
        console.log('✅ Historical cache already built and ready.');
        return;
      }
    } catch (e) {
      // Rebuild if invalid
    }
  }

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (!fs.existsSync(CROPS_DIR)) fs.mkdirSync(CROPS_DIR, { recursive: true });

  fs.writeFileSync(STATUS_FILE, JSON.stringify({ status: 'running', started_at: new Date().toISOString() }, null, 2));

  const startTime = Date.now();
  const fileStream = fs.createReadStream(CSV_FILE, { encoding: 'utf-8', highWaterMark: 2 * 1024 * 1024 });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isHeader = true;
  let totalRows = 0;

  const cropMap = new Map(); // slug -> { name, count, minP, maxP, latestDate, records: [] }
  const marketsByDistrictMap = new Map(); // district -> Set<market>
  const uniqueDistricts = new Set();
  const uniqueVarieties = new Set();
  const uniqueGrades = new Set();

  let globalMinPrice = Infinity;
  let globalMaxPrice = -Infinity;
  let globalPriceSum = 0;
  let earliestDate = '9999-99-99';
  let latestDate = '0000-00-00';

  for await (const line of rl) {
    if (!line) continue;
    if (isHeader) {
      isHeader = false;
      continue;
    }

    totalRows++;

    // Fast split
    let parts;
    if (line.includes('"')) {
      parts = [];
      let inQuotes = false;
      let cur = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          parts.push(cur);
          cur = '';
        } else cur += char;
      }
      parts.push(cur);
    } else {
      parts = line.split(',');
    }

    if (parts.length < 14) continue;

    const [
      state,
      district,
      market,
      commodity,
      commodity_raw,
      variety,
      grade,
      arrival_date,
      year,
      month,
      day,
      min_price_str,
      max_price_str,
      modal_price_str
    ] = parts;

    const modalPrice = parseFloat(modal_price_str);
    const minPrice = parseFloat(min_price_str);
    const maxPrice = parseFloat(max_price_str);

    if (isNaN(modalPrice) || modalPrice <= 0) continue;

    // Global aggregations
    if (modalPrice < globalMinPrice) globalMinPrice = modalPrice;
    if (modalPrice > globalMaxPrice) globalMaxPrice = modalPrice;
    globalPriceSum += modalPrice;
    if (arrival_date < earliestDate) earliestDate = arrival_date;
    if (arrival_date > latestDate) latestDate = arrival_date;

    uniqueDistricts.add(district);
    if (!marketsByDistrictMap.has(district)) {
      marketsByDistrictMap.set(district, new Set());
    }
    marketsByDistrictMap.get(district).add(market);

    if (variety) uniqueVarieties.add(variety);
    if (grade) uniqueGrades.add(grade);

    // Group by crop
    const slug = slugify(commodity);
    let cropEntry = cropMap.get(slug);
    if (!cropEntry) {
      cropEntry = {
        slug,
        name: commodity,
        count: 0,
        minP: modalPrice,
        maxP: modalPrice,
        latestDate: arrival_date,
        records: []
      };
      cropMap.set(slug, cropEntry);
    }

    cropEntry.count++;
    if (modalPrice < cropEntry.minP) cropEntry.minP = modalPrice;
    if (modalPrice > cropEntry.maxP) cropEntry.maxP = modalPrice;
    if (arrival_date > cropEntry.latestDate) cropEntry.latestDate = arrival_date;

    // Keep compact array: [arrival_date, district, market, variety, grade, minPrice, maxPrice, modalPrice]
    cropEntry.records.push([
      arrival_date,
      district,
      market,
      variety || '',
      grade || '',
      minPrice || modalPrice,
      maxPrice || modalPrice,
      modalPrice
    ]);

    if (totalRows % 1000000 === 0) {
      console.log(`Indexed ${totalRows.toLocaleString()} rows...`);
    }
  }

  console.log(`CSV read complete. Writing ${cropMap.size} crop partition caches...`);

  // Write individual crop files
  for (const [slug, cropEntry] of cropMap.entries()) {
    // Sort records chronologically (ascending date)
    cropEntry.records.sort((a, b) => a[0].localeCompare(b[0]));

    const cropFilePath = path.join(CROPS_DIR, `${slug}.json`);
    const cropData = {
      slug,
      name: cropEntry.name,
      totalCount: cropEntry.count,
      minPrice: cropEntry.minP,
      maxPrice: cropEntry.maxP,
      latestDate: cropEntry.latestDate,
      // records: [arrival_date, district, market, variety, grade, minPrice, maxPrice, modalPrice]
      records: cropEntry.records
    };
    fs.writeFileSync(cropFilePath, JSON.stringify(cropData), 'utf-8');
  }

  // Build filter options
  const cropsList = Array.from(cropMap.values())
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: c.count,
      minPrice: c.minP,
      maxPrice: c.maxP,
      latestDate: c.latestDate
    }))
    .sort((a, b) => b.count - a.count);

  const districtsList = Array.from(uniqueDistricts).sort();
  const marketsByDistrict = {};
  for (const [dist, mSet] of marketsByDistrictMap.entries()) {
    marketsByDistrict[dist] = Array.from(mSet).sort();
  }

  const avgPrice = totalRows > 0 ? Math.round((globalPriceSum / totalRows) * 100) / 100 : 0;

  const filterOptions = {
    totalRecords: totalRows,
    dateRange: {
      min: earliestDate,
      max: latestDate
    },
    datasetSummary: {
      totalRecords: totalRows,
      uniqueCropsCount: cropsList.length,
      uniqueDistrictsCount: districtsList.length,
      uniqueMarketsCount: Array.from(marketsByDistrictMap.values()).reduce((acc, s) => acc + s.size, 0),
      minPrice: globalMinPrice,
      maxPrice: globalMaxPrice,
      averagePrice: avgPrice,
      unit: '₹ / Quintal'
    },
    crops: cropsList,
    districts: districtsList,
    marketsByDistrict,
    varieties: Array.from(uniqueVarieties).slice(0, 100),
    grades: Array.from(uniqueGrades)
  };

  fs.writeFileSync(FILTER_OPTIONS_FILE, JSON.stringify(filterOptions, null, 2), 'utf-8');

  const dur = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Historical cache built successfully in ${dur}s.`);

  fs.writeFileSync(STATUS_FILE, JSON.stringify({
    status: 'completed',
    built_at: new Date().toISOString(),
    duration_seconds: dur,
    total_records: totalRows,
    total_crops: cropsList.length,
    total_districts: districtsList.length
  }, null, 2));
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('build-historical-cache.mjs')) {
  buildHistoricalCache().catch(console.error);
}
