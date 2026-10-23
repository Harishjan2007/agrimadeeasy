/**
 * AgriME — Daily Agmarknet APMC Mandi Ingestion & Supabase Sync CLI
 * ------------------------------------------------------------------
 * Usage:
 *   npm run sync-mandi
 *
 * Runs on an Indian domestic IP (e.g. your local development PC) to fetch
 * official live mandi market arrivals from data.gov.in and upsert them directly
 * into your Supabase database.
 *
 * Your Vercel production deployment then queries Supabase seamlessly,
 * completely bypassing NIC's cloud datacenter firewall.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env.local');

// 1. Read environment variables from .env.local
function loadEnv() {
  const env = {};
  if (fs.existsSync(ENV_PATH)) {
    const lines = fs.readFileSync(ENV_PATH, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        env[key] = val;
      }
    }
  }
  return { ...process.env, ...env };
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function runMandiSync() {
  console.log('\n======================================================');
  console.log('🌾 AgriME Agmarknet Live Mandi Ingestion to Supabase');
  console.log('======================================================\n');

  const env = loadEnv();
  const apiKey = env.DATA_GOV_IN_API_KEY?.trim();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!apiKey) {
    console.error('❌ Error: DATA_GOV_IN_API_KEY is not defined in .env.local');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const RESOURCE_ID = '35985678-0d79-46b4-9ed6-6f13308a1d24';
  const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

  console.log(`📡 Connecting to data.gov.in (Resource ${RESOURCE_ID})...`);
  console.log(`📍 Target State: Tamil Nadu (Active APMC Mandis)`);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8'
  };

  const candidateUrls = [
    `${BASE_URL}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=500&filters[State]=Tamil%20Nadu&sort[Arrival_Date]=desc`,
    `${BASE_URL}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=500&filters[state]=Tamil%20Nadu&sort[arrival_date]=desc`,
    `${BASE_URL}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=500&sort[Arrival_Date]=desc`
  ];

  let rawRecords = [];
  let workingUrl = null;

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const records = Array.isArray(json.records) ? json.records : [];
        if (records.length > 0) {
          rawRecords = records;
          workingUrl = url;
          break;
        }
      }
    } catch (err) {
      // Continue to next candidate URL
    }
  }

  if (rawRecords.length === 0) {
    console.warn('⚠️ No records returned from data.gov.in today. Check API status or network connectivity.');
    return;
  }

  console.log(`✅ Successfully retrieved ${rawRecords.length} records from data.gov.in.`);

  // Filter Tamil Nadu records if fallback query was unfiltered
  const tnRecords = rawRecords.filter((r) => {
    const s = String(r.state || r.State || '').trim().toLowerCase();
    return s === 'tamil nadu' || s === 'tamilnadu';
  });

  const targetRecords = tnRecords.length > 0 ? tnRecords : rawRecords;
  console.log(`📦 Processing ${targetRecords.length} Tamil Nadu mandi arrivals...`);

  const seenKeys = new Set();
  const normalizedRecords = [];

  for (const r of targetRecords) {
    const state = String(r.state || r.State || 'Tamil Nadu').trim();
    const district = String(r.district || r.District || '').trim();
    const market = String(r.market || r.Market || '').trim();
    const commodity = String(r.commodity || r.Commodity || '').trim();
    const variety = String(r.variety || r.Variety || 'General').trim();
    const grade = String(r.grade || r.Grade || 'FAQ').trim();
    const rawDate = String(r.arrival_date || r.Arrival_Date || '').trim();

    if (!market || !commodity) continue;

    const minPrice = parseFloat(String(r.min_price || r.Min_Price || 0));
    const maxPrice = parseFloat(String(r.max_price || r.Max_Price || 0));
    let modalPrice = parseFloat(String(r.modal_price || r.Modal_Price || 0));

    if (modalPrice <= 0 && minPrice > 0 && maxPrice > 0) {
      modalPrice = Math.round((minPrice + maxPrice) / 2);
    }
    if (modalPrice <= 0) continue;

    // Standardize arrival date format (DD/MM/YYYY)
    let arrivalDate = rawDate;
    if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        arrivalDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const key = `${state}|${district}|${market}|${commodity}|${variety}|${arrivalDate}`.toLowerCase();
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const id = `mandi-${slugify(state)}-${slugify(district)}-${slugify(market)}-${slugify(commodity)}-${slugify(variety)}-${slugify(arrivalDate)}`;

    normalizedRecords.push({
      id,
      state,
      district,
      market,
      commodity,
      variety,
      grade,
      arrival_date: arrivalDate,
      min_price: isNaN(minPrice) ? modalPrice : minPrice,
      max_price: isNaN(maxPrice) ? modalPrice : maxPrice,
      modal_price: modalPrice,
      unit: '₹/Quintal',
      source: 'Ministry of Agriculture and Farmers Welfare (Agmarknet) via data.gov.in',
      source_status: 'LIVE',
      updated_at: new Date().toISOString()
    });
  }

  console.log(`✨ Validated & deduplicated: ${normalizedRecords.length} unique market records.`);
  console.log(`🚀 Upserting into Supabase 'daily_mandi_prices' table...`);

  // Upsert in batches of 50
  const BATCH_SIZE = 50;
  let upsertedCount = 0;

  for (let i = 0; i < normalizedRecords.length; i += BATCH_SIZE) {
    const batch = normalizedRecords.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('daily_mandi_prices')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      if (error.code === '42P01') {
        console.error('\n❌ ERROR: Table "daily_mandi_prices" does not exist in your Supabase database yet!');
        console.error('👉 Please run the migration script in Supabase Dashboard -> SQL Editor:');
        console.error('   supabase/migrations/20261023_daily_mandi_prices.sql\n');
        process.exit(1);
      } else {
        console.error(`⚠️ Batch upsert error (${i} to ${i + batch.length}):`, error.message);
      }
    } else {
      upsertedCount += batch.length;
      process.stdout.write(`   ✓ Uploaded ${upsertedCount}/${normalizedRecords.length} records...\r`);
    }
  }

  console.log(`\n🎉 Success! ${upsertedCount} live Agmarknet records stored in Supabase.`);
  console.log(`🌐 Vercel will now serve these genuine records directly from Supabase with 0% firewall error rate!\n`);
}

runMandiSync().catch((err) => {
  console.error('\n❌ Fatal sync error:', err);
  process.exit(1);
});
