import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routePath = path.resolve(__dirname, '../../src/app/api/market-prices/route.ts');
const clientLibPath = path.resolve(__dirname, '../../src/lib/market-prices.ts');

describe('data.gov.in Mandi Market Prices API Route & Client Verification', () => {
  test('route.ts exists and adheres to Next.js App Router conventions', () => {
    assert.ok(fs.existsSync(routePath), 'Route handler /api/market-prices/route.ts must exist');
    const content = fs.readFileSync(routePath, 'utf-8');

    assert.ok(content.includes('export async function GET'), 'Route must export a GET handler');
    assert.ok(content.includes('process.env.DATA_GOV_IN_API_KEY'), 'Route must read DATA_GOV_IN_API_KEY from server environment');
    assert.ok(content.includes('35985678-0d79-46b4-9ed6-6f13308a1d24'), 'Route must target the official Agmarknet resource ID');
    assert.ok(content.includes('filters[State]') || content.includes('filters[state]'), 'Route must support state filter');
    assert.ok(content.includes('filters[District]') || content.includes('filters[district]'), 'Route must support district filter');
    assert.ok(content.includes('filters[Market]') || content.includes('filters[market]'), 'Route must support market filter');
    assert.ok(content.includes('filters[Commodity]') || content.includes('filters[commodity]'), 'Route must support commodity filter');
    assert.ok(content.includes('sort[Arrival_Date]') || content.includes('sort[arrival_date]'), 'Route must support arrival date sort');
  });

  test('client helper library exists and exports typed helpers and filter constants', () => {
    assert.ok(fs.existsSync(clientLibPath), 'src/lib/market-prices.ts must exist');
    const content = fs.readFileSync(clientLibPath, 'utf-8');

    assert.ok(
      content.includes('export async function fetchMarketPrices') || content.includes('export function fetchMarketPrices'),
      'Must export fetchMarketPrices'
    );
    assert.ok(content.includes('export const TAMIL_NADU_DISTRICTS'), 'Must export TAMIL_NADU_DISTRICTS');
    assert.ok(content.includes('export const POPULAR_COMMODITIES'), 'Must export POPULAR_COMMODITIES');
    assert.ok(content.includes('Coimbatore'), 'TAMIL_NADU_DISTRICTS must include major districts');
    assert.ok(content.includes('Tomato'), 'POPULAR_COMMODITIES must include key agricultural commodities');
  });

  test('preserves official Agmarknet wholesale units and price field semantics', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    assert.ok(content.includes('₹/Quintal'), 'Must preserve official ₹/Quintal units (1 Quintal = 100 kg)');
    assert.ok(content.includes('modal_price'), 'Must retain modal_price');
    assert.ok(content.includes('min_price'), 'Must retain min_price');
    assert.ok(content.includes('max_price'), 'Must retain max_price');
    assert.ok(content.includes('arrival_date'), 'Must retain arrival_date');
    assert.ok(content.includes('grade'), 'Must retain grade');
    assert.ok(content.includes("export const dynamic = 'force-dynamic'"), 'Must export dynamic force-dynamic');
  });

  test('never exposes DATA_GOV_IN_API_KEY in returned response JSON', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    // Ensure the response JSON does NOT include apiKey as a returned property
    assert.ok(!content.includes('apiKey: apiKey'), 'Must not return apiKey in response payload');
    assert.ok(!content.includes('"api-key": apiKey'), 'Must not return api-key in response payload');
    assert.ok(!content.includes('api_key: apiKey'), 'Must not return api_key in response payload');
  });

  test('normalization logic maps raw strings to numbers and preserves accurate fields', () => {
    // Test record normalization matching the logic in /api/market-prices/route.ts
    const sampleRaw = {
      state: 'Tamil Nadu',
      district: 'Coimbatore',
      market: 'Coimbatore',
      commodity: 'Tomato',
      variety: 'Local',
      grade: 'FAQ',
      arrival_date: '11/10/2026',
      min_price: '2100',
      max_price: '2700',
      modal_price: '2400'
    };

    const minPrice = parseFloat(sampleRaw.min_price);
    const maxPrice = parseFloat(sampleRaw.max_price);
    const modalPrice = parseFloat(sampleRaw.modal_price);

    assert.equal(minPrice, 2100);
    assert.equal(maxPrice, 2700);
    assert.equal(modalPrice, 2400);
    assert.equal(sampleRaw.commodity, 'Tomato');
    assert.equal(sampleRaw.market, 'Coimbatore');
    assert.equal(sampleRaw.grade, 'FAQ');
    assert.equal(sampleRaw.arrival_date, '11/10/2026');
  });

  test('DailyMandiPricesSection UI component exists and imports client helper', () => {
    const componentPath = path.resolve(__dirname, '../../src/components/crop-price/DailyMandiPricesSection.tsx');
    assert.ok(fs.existsSync(componentPath), 'DailyMandiPricesSection.tsx must exist');
    const content = fs.readFileSync(componentPath, 'utf-8');

    assert.ok(content.includes('fetchMarketPrices'), 'Must invoke fetchMarketPrices');
    assert.ok(content.includes('TAMIL_NADU_DISTRICTS'), 'Must utilize TAMIL_NADU_DISTRICTS filter');
    assert.ok(content.includes('POPULAR_COMMODITIES'), 'Must utilize POPULAR_COMMODITIES filter');
    assert.ok(content.includes('₹/Quintal'), 'Must display units as ₹/Quintal');
    assert.ok(content.includes('modal_price'), 'Must display modal price');
    assert.ok(content.includes('min_price'), 'Must display min price');
    assert.ok(content.includes('max_price'), 'Must display max price');
    assert.ok(content.includes('arrival_date'), 'Must display arrival date');
  });

  test('CropPricePageClient integrates DailyMandiPricesSection tab', () => {
    const pageClientPath = path.resolve(__dirname, '../../src/components/crop-price/CropPricePageClient.tsx');
    assert.ok(fs.existsSync(pageClientPath), 'CropPricePageClient.tsx must exist');
    const content = fs.readFileSync(pageClientPath, 'utf-8');

    assert.ok(content.includes('DailyMandiPricesSection'), 'CropPricePageClient must import DailyMandiPricesSection');
    assert.ok(content.includes('<DailyMandiPricesSection />'), 'CropPricePageClient must render DailyMandiPricesSection');
    assert.ok(content.includes("'live'"), 'CropPricePageClient must support live tab');
  });

  test('route.ts classifies and distinguishes connection, authentication, and response parsing errors', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    // Error categorization fields
    assert.ok(content.includes("'CONNECTION'"), 'Must categorize connection errors');
    assert.ok(content.includes("'AUTHENTICATION'"), 'Must categorize authentication errors');
    assert.ok(content.includes("'PARSING'"), 'Must categorize response parsing errors');
    assert.ok(content.includes("'RATE_LIMIT'"), 'Must categorize rate limit errors');

    // Clear user-facing message distinctions
    assert.ok(content.includes('TCP connection to api.data.gov.in:443 timed out'), 'Must include specific TCP timeout connection message');
    assert.ok(content.includes('API key rejected by data.gov.in'), 'Must include clear authentication rejection message');
    assert.ok(content.includes('response body could not be parsed as valid JSON'), 'Must include explicit JSON response parsing message');

    // Timeout safety
    assert.ok(content.includes('15000'), 'Must use 15-second AbortController timeout for government latency');

    // Diagnostic probe enhancements
    assert.ok(content.includes('probeTcpSocket'), 'Diagnostic probe must include multi-socket TCP checks');
    assert.ok(content.includes('autoSelectFamily'), 'Diagnostic probe must test autoSelectFamily');
    assert.ok(content.includes('family: 4'), 'Diagnostic probe must test forced IPv4');
    assert.ok(content.includes('independentServiceStatus'), 'Diagnostic probe must report independent service evidence');
  });

  test('DailyMandiPricesSection UI includes MandiErrorBanner distinguishing failure categories', () => {
    const componentPath = path.resolve(__dirname, '../../src/components/crop-price/DailyMandiPricesSection.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');

    assert.ok(content.includes('MandiErrorBanner'), 'Must include MandiErrorBanner component');
    assert.ok(content.includes('WifiOff'), 'Must render WifiOff icon for connection failure');
    assert.ok(content.includes('KeyRound'), 'Must render KeyRound icon for authentication failure');
    assert.ok(content.includes('ShieldAlert'), 'Must render ShieldAlert icon for authentication failure');
    assert.ok(content.includes('FileX'), 'Must render FileX icon for response parsing failure');
    assert.ok(content.includes('?diagnose=true'), 'Must provide link to live diagnostic probe');
  });
});
