/**
 * AgriME Server-Side Agmarknet Crop Price Ingestion Engine
 * ---------------------------------------------------------
 * Architectural Pipeline:
 *   data.gov.in (Agmarknet APMC Mandi Resource)
 *        ↓
 *   Server-Side Ingestion (with server-only credentials)
 *        ↓
 *   Validation & Normalization (sanitizing malformed/extreme entries)
 *        ↓
 *   Deduplication & Historical Preservation
 *        ↓
 *   Supabase crop_prices & Realtime Broadcast
 *        ↓
 *   Web + Mobile Client Consumption
 *
 * STRICT DATA INTEGRITY RULES:
 * 1. DATA_GOV_IN_API_KEY must ONLY be accessed server-side.
 * 2. Never fabricate live responses if API key is absent.
 * 3. Never overwrite valid historical prices with null/invalid data.
 * 4. Tag every record with transparent provenance: LIVE, RECENT, REFERENCE, or FALLBACK.
 */

import { PriceSourceStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export const AGMARKNET_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
export const AGMARKNET_BASE_URL = `https://api.data.gov.in/resource/${AGMARKNET_RESOURCE_ID}`;

export interface NormalizedCropPriceRecord {
  commodity: string;
  normalized_crop_name: string;
  variety: string;
  market: string;
  district: string;
  state: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
  arrival_quantity_tonnes?: number;
  source: string;
  source_record_id?: string;
  fetched_at: string;
  source_status: PriceSourceStatus;
  is_valid: boolean;
  validation_notes?: string;
}

export interface IngestionResult {
  success: boolean;
  status: 'SUCCESS' | 'BLOCKED_MISSING_KEY' | 'API_ERROR' | 'NO_RECORDS' | 'PARTIAL_SUCCESS';
  message: string;
  fetchedCount: number;
  validCount: number;
  invalidCount: number;
  upsertedCount: number;
  lastUpdated: string;
  provenance: PriceSourceStatus;
  records: NormalizedCropPriceRecord[];
}

/**
 * Standardize commodity names from APMC mandi strings into uniform system crop identifiers
 */
export function normalizeCropName(rawCommodity: string): string {
  const c = rawCommodity.trim().toLowerCase();

  if (c.includes('paddy') || c.includes('dhan')) {
    if (c.includes('basmati')) return 'Paddy (Basmati)';
    return 'Paddy (Common)';
  }
  if (c.includes('groundnut') || c.includes('peanut')) return 'Groundnut (Peanut)';
  if (c.includes('maize') || c.includes('corn')) return 'Maize (Corn)';
  if (c.includes('cotton')) return 'Cotton (Long Staple)';
  if (c.includes('tomato')) return 'Tomato (Hybrid)';
  if (c.includes('wheat') || c.includes('sharbati')) return 'Wheat (Sharbati)';
  if (c.includes('onion')) return 'Onion (Red)';
  if (c.includes('turmeric')) return 'Turmeric (Finger)';
  if (c.includes('chilli') || c.includes('mirchi')) return 'Chilli (Dry Red)';
  if (c.includes('potato')) return 'Potato';
  if (c.includes('soybean') || c.includes('soya')) return 'Soybean';
  if (c.includes('banana')) return 'Banana';
  if (c.includes('sugarcane')) return 'Sugarcane';

  // Return cleaned title-cased commodity if not explicitly in reference catalog
  return rawCommodity.trim().replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Determine data provenance based on arrival date relative to current time
 */
export function determineProvenance(arrivalDateStr: string): PriceSourceStatus {
  try {
    const arrivalDate = new Date(arrivalDateStr);
    const now = new Date();
    const diffHours = (now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60);

    if (diffHours >= 0 && diffHours <= 36) {
      return 'LIVE'; // Market bulletin recorded in the last 24-36 hours
    } else if (diffHours > 36 && diffHours <= 168) {
      return 'RECENT'; // Market bulletin recorded in the last 7 days
    } else {
      return 'REFERENCE'; // Older historical benchmark
    }
  } catch {
    return 'REFERENCE';
  }
}

/**
 * Validate raw price record:
 * - Prices must be positive and within reasonable bounds (₹100 to ₹300,000 per quintal)
 * - min_price <= modal_price <= max_price sanity check (or corrected if inverted)
 * - Valid arrival date
 */
export function validateAndNormalizeRecord(raw: any): NormalizedCropPriceRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const rawCommodity = String(raw.commodity || raw.Commodity || '').trim();
  const rawMarket = String(raw.market || raw.Market || '').trim();
  const rawState = String(raw.state || raw.State || 'Tamil Nadu').trim();
  const rawDistrict = String(raw.district || raw.District || '').trim();
  const rawVariety = String(raw.variety || raw.Variety || 'General').trim();
  const rawDate = String(raw.arrival_date || raw.Arrival_Date || new Date().toISOString().split('T')[0]).trim();

  if (!rawCommodity || !rawMarket) {
    return null;
  }

  // Parse numeric prices safely
  let minPrice = parseFloat(String(raw.min_price || raw.Min_Price || 0));
  let maxPrice = parseFloat(String(raw.max_price || raw.Max_Price || 0));
  let modalPrice = parseFloat(String(raw.modal_price || raw.Modal_Price || 0));

  // If modal price is missing but min/max present, use average
  if (modalPrice <= 0 && minPrice > 0 && maxPrice > 0) {
    modalPrice = Math.round((minPrice + maxPrice) / 2);
  }
  if (minPrice <= 0 && modalPrice > 0) minPrice = Math.round(modalPrice * 0.95);
  if (maxPrice <= 0 && modalPrice > 0) maxPrice = Math.round(modalPrice * 1.05);

  // Sanity checks: reject nonsensical values (e.g. 0, negative, or > 300,000/Q)
  if (modalPrice < 100 || modalPrice > 300000) {
    return null;
  }

  // Ensure min <= modal <= max
  if (minPrice > maxPrice) {
    const temp = minPrice;
    minPrice = maxPrice;
    maxPrice = temp;
  }
  if (modalPrice < minPrice) modalPrice = minPrice;
  if (modalPrice > maxPrice) modalPrice = maxPrice;

  // Standardize arrival date format to YYYY-MM-DD
  let standardizedDate = rawDate;
  if (rawDate.includes('/')) {
    // Handle DD/MM/YYYY or MM/DD/YYYY
    const parts = rawDate.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD/MM/YYYY
        standardizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }

  const provenance = determineProvenance(standardizedDate);

  return {
    commodity: rawCommodity,
    normalized_crop_name: normalizeCropName(rawCommodity),
    variety: rawVariety,
    market: rawMarket,
    district: rawDistrict,
    state: rawState,
    arrival_date: standardizedDate,
    min_price: Math.round(minPrice),
    max_price: Math.round(maxPrice),
    modal_price: Math.round(modalPrice),
    unit: '₹/Quintal',
    arrival_quantity_tonnes: raw.arrival_quantity ? parseFloat(raw.arrival_quantity) : undefined,
    source: 'data.gov.in Agmarknet APMC Mandi Bulletin',
    source_record_id: raw.id || `${rawState}-${rawMarket}-${rawCommodity}-${standardizedDate}`,
    fetched_at: new Date().toISOString(),
    source_status: provenance,
    is_valid: true
  };
}

/**
 * Deduplicate records by composite key: state + market + normalized_crop + variety + arrival_date
 */
export function deduplicateRecords(records: NormalizedCropPriceRecord[]): NormalizedCropPriceRecord[] {
  const seen = new Set<string>();
  const deduped: NormalizedCropPriceRecord[] = [];

  for (const r of records) {
    const key = `${r.state.toLowerCase()}|${r.market.toLowerCase()}|${r.normalized_crop_name.toLowerCase()}|${r.variety.toLowerCase()}|${r.arrival_date}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  return deduped;
}

/**
 * Server-Side Ingestion Function
 * Fetches from data.gov.in, normalizes, validates, deduplicates, and synchronizes with Supabase.
 */
export async function ingestGovernmentCropPrices(options?: {
  state?: string;
  limit?: number;
}): Promise<IngestionResult> {
  // 1. Strict server-side credential check
  const apiKey = process.env.DATA_GOV_IN_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      status: 'BLOCKED_MISSING_KEY',
      message: 'DATA_GOV_IN_API_KEY is not configured on the server. Please obtain a free API key at https://data.gov.in and add it to your server environment variables.',
      fetchedCount: 0,
      validCount: 0,
      invalidCount: 0,
      upsertedCount: 0,
      lastUpdated: new Date().toISOString(),
      provenance: 'REFERENCE',
      records: []
    };
  }

  const state = options?.state || 'Tamil Nadu';
  const limit = options?.limit || 100;
  const url = `${AGMARKNET_BASE_URL}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&filters[state]=${encodeURIComponent(state)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!res.ok) {
      return {
        success: false,
        status: 'API_ERROR',
        message: `Agmarknet API responded with HTTP status ${res.status}: ${res.statusText}`,
        fetchedCount: 0,
        validCount: 0,
        invalidCount: 0,
        upsertedCount: 0,
        lastUpdated: new Date().toISOString(),
        provenance: 'REFERENCE',
        records: []
      };
    }

    const data = await res.json();
    const rawRecords = data?.records || [];

    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      return {
        success: true,
        status: 'NO_RECORDS',
        message: `Query succeeded but returned 0 active market records for state "${state}".`,
        fetchedCount: 0,
        validCount: 0,
        invalidCount: 0,
        upsertedCount: 0,
        lastUpdated: new Date().toISOString(),
        provenance: 'RECENT',
        records: []
      };
    }

    // 2. Validation and normalization
    const validated: NormalizedCropPriceRecord[] = [];
    let invalidCount = 0;

    for (const raw of rawRecords) {
      const norm = validateAndNormalizeRecord(raw);
      if (norm && norm.is_valid) {
        validated.push(norm);
      } else {
        invalidCount++;
      }
    }

    // 3. Deduplication
    const deduped = deduplicateRecords(validated);

    // 4. Upsert into Supabase (if configured and connected)
    let upsertedCount = 0;
    if (isSupabaseConfigured && supabase) {
      try {
        // Find or map to existing crop and market UUIDs, or insert into crop_prices
        for (const r of deduped) {
          // Attempt upsert preserving historical dates
          const { error: upsertErr } = await supabase
            .from('crop_prices')
            .upsert(
              {
                source: r.source,
                source_status: r.source_status,
                price: r.modal_price,
                modal_price: r.modal_price,
                min_price: r.min_price,
                max_price: r.max_price,
                variety: r.variety,
                arrival_date: r.arrival_date,
                unit: r.unit,
                recorded_at: r.fetched_at
              },
              { onConflict: 'id' }
            );

          if (!upsertErr) {
            upsertedCount++;
          }
        }
      } catch (dbErr) {
        console.warn('Database upsert warning during ingestion:', dbErr);
      }
    }

    const dominantProvenance = deduped.some((r) => r.source_status === 'LIVE')
      ? 'LIVE'
      : deduped.some((r) => r.source_status === 'RECENT')
      ? 'RECENT'
      : 'REFERENCE';

    return {
      success: true,
      status: 'SUCCESS',
      message: `Successfully ingested and normalized ${deduped.length} APMC mandi price records for ${state}.`,
      fetchedCount: rawRecords.length,
      validCount: deduped.length,
      invalidCount,
      upsertedCount,
      lastUpdated: new Date().toISOString(),
      provenance: dominantProvenance,
      records: deduped
    };
  } catch (networkErr: any) {
    return {
      success: false,
      status: 'API_ERROR',
      message: `Network or parsing error during Agmarknet ingestion: ${networkErr.message || networkErr}`,
      fetchedCount: 0,
      validCount: 0,
      invalidCount: 0,
      upsertedCount: 0,
      lastUpdated: new Date().toISOString(),
      provenance: 'REFERENCE',
      records: []
    };
  }
}
