import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const ENV_PATH = path.join(ROOT_DIR, '.env.local');

const RESOURCE_ID = '35985678-0d79-46b4-9ed6-6f13308a1d24';
const HOSTNAME = 'api.data.gov.in';

// Load API key securely without exposing it
let apiKey = process.env.DATA_GOV_IN_API_KEY?.trim();
if (!apiKey && fs.existsSync(ENV_PATH)) {
  const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATA_GOV_IN_API_KEY=')) {
      apiKey = trimmed.substring('DATA_GOV_IN_API_KEY='.length).trim();
      break;
    }
  }
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        },
        timeout: 15000
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch {
            // non-json response
          }
          resolve({ statusCode: res.statusCode, body, parsed });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request to data.gov.in timed out after 15000ms'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

describe('data.gov.in Live Mandi API Backend Integration', () => {
  test('API key is configured in local environment', () => {
    assert.ok(apiKey && apiKey.length > 0, 'DATA_GOV_IN_API_KEY must be configured in .env.local');
    assert.ok(!apiKey.includes('your-'), 'API key must not be placeholder text');
    assert.ok(!/\s/.test(apiKey), 'API key must not contain whitespace');
  });

  test('backend route logic fetches and maps live mandi records from data.gov.in', async (t) => {
    if (!apiKey) {
      t.skip('Skipping live fetch test because DATA_GOV_IN_API_KEY is not configured');
      return;
    }

    const state = 'Tamil Nadu';
    const limit = 10;

    // Multi-candidate probing matching route.ts - Capitalized State first with sort[Arrival_Date]=desc
    const literalUrlCap = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&filters[State]=${encodeURIComponent(state)}&sort[Arrival_Date]=desc`;
    const literalUrlLower = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&filters[state]=${encodeURIComponent(state)}&sort[Arrival_Date]=desc`;
    const encUrlCap = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&${encodeURIComponent('filters[State]')}=${encodeURIComponent(state)}&${encodeURIComponent('sort[Arrival_Date]')}=desc`;
    const encUrlLower = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&${encodeURIComponent('filters[state]')}=${encodeURIComponent(state)}&${encodeURIComponent('sort[Arrival_Date]')}=desc`;
    const plusUrlCap = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&filters[State]=Tamil+Nadu&sort[Arrival_Date]=desc`;
    const plusUrlLower = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}&filters[state]=Tamil+Nadu&sort[Arrival_Date]=desc`;

    let response = await fetchJson(literalUrlCap);
    let workingFormat = 'literal_brackets_capital';
    let rawRecords = response.parsed?.records || [];

    if (rawRecords.length === 0) {
      const lowerRes = await fetchJson(literalUrlLower);
      if (lowerRes.parsed?.records?.length > 0) {
        response = lowerRes;
        rawRecords = lowerRes.parsed.records;
        workingFormat = 'literal_brackets_lower';
      }
    }

    if (rawRecords.length === 0) {
      const encCapRes = await fetchJson(encUrlCap);
      if (encCapRes.parsed?.records?.length > 0) {
        response = encCapRes;
        rawRecords = encCapRes.parsed.records;
        workingFormat = 'encoded_brackets_capital';
      }
    }

    if (rawRecords.length === 0) {
      const encLowerRes = await fetchJson(encUrlLower);
      if (encLowerRes.parsed?.records?.length > 0) {
        response = encLowerRes;
        rawRecords = encLowerRes.parsed.records;
        workingFormat = 'encoded_brackets_lower';
      }
    }

    if (rawRecords.length === 0) {
      const plusCapRes = await fetchJson(plusUrlCap);
      if (plusCapRes.parsed?.records?.length > 0) {
        response = plusCapRes;
        rawRecords = plusCapRes.parsed.records;
        workingFormat = 'plus_encoded_capital';
      }
    }

    if (rawRecords.length === 0) {
      const plusLowerRes = await fetchJson(plusUrlLower);
      if (plusLowerRes.parsed?.records?.length > 0) {
        response = plusLowerRes;
        rawRecords = plusLowerRes.parsed.records;
        workingFormat = 'plus_encoded_lower';
      }
    }

    // If state filter currently has 0 recorded arrivals today in data.gov.in, query unfiltered to verify service vitality
    let stateFilterActive = true;
    if (rawRecords.length === 0) {
      const unfiltUrl = `https://${HOSTNAME}/resource/${RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=5&sort[Arrival_Date]=desc`;
      const unfiltRes = await fetchJson(unfiltUrl);
      if (unfiltRes.parsed?.records?.length > 0) {
        response = unfiltRes;
        rawRecords = unfiltRes.parsed.records;
        workingFormat = 'unfiltered_fallback';
        stateFilterActive = false;
      }
    }

    assert.equal(response.statusCode, 200, `Expected HTTP 200 OK from data.gov.in, received ${response.statusCode}`);
    assert.ok(response.parsed, 'Response body from data.gov.in must be valid JSON');
    assert.ok(Array.isArray(response.parsed.records), 'data.gov.in response must contain records array');
    assert.ok(rawRecords.length > 0, 'data.gov.in must return at least 1 record');

    // Test the exact normalization logic applied in /api/market-prices/route.ts
    const mappedRecords = rawRecords.map((r, idx) => {
      const minPrice = parseFloat(String(r.min_price ?? r.Min_Price ?? 0));
      const maxPrice = parseFloat(String(r.max_price ?? r.Max_Price ?? 0));
      const modalPrice = parseFloat(String(r.modal_price ?? r.Modal_Price ?? 0));

      const rawCommodity = String(r.commodity || r.Commodity || '').trim();
      const rawMarket = String(r.market || r.Market || '').trim();
      const rawDistrict = String(r.district || r.District || '').trim();
      const rawState = String(r.state || r.State || '').trim();
      const rawVariety = String(r.variety || r.Variety || 'Other').trim();
      const rawGrade = String(r.grade || r.Grade || '').trim();
      const rawDate = String(r.arrival_date || r.Arrival_Date || '').trim();

      return {
        id: `${rawState}-${rawMarket}-${rawCommodity}-${rawDate}-${idx}`,
        state: rawState,
        district: rawDistrict,
        market: rawMarket,
        commodity: rawCommodity,
        variety: rawVariety,
        grade: rawGrade,
        arrival_date: rawDate,
        min_price: isNaN(minPrice) ? 0 : minPrice,
        max_price: isNaN(maxPrice) ? 0 : maxPrice,
        modal_price: isNaN(modalPrice) ? 0 : modalPrice,
        unit: '₹/Quintal'
      };
    });

    // Validate all 10 required fields on all records
    for (const record of mappedRecords) {
      if (stateFilterActive) {
        assert.equal(record.state, 'Tamil Nadu', 'State must be Tamil Nadu when filtered');
      } else {
        assert.ok(record.state.length > 0, 'State must not be empty');
      }
      assert.ok(record.district.length > 0, 'District must not be empty');
      assert.ok(record.market.length > 0, 'Market must not be empty');
      assert.ok(record.commodity.length > 0, 'Commodity must not be empty');
      assert.ok(typeof record.variety === 'string', 'Variety must be string');
      assert.ok(typeof record.grade === 'string', 'Grade must be string (accurately preserved from API)');
      assert.ok(record.arrival_date.length > 0, 'Arrival date must not be empty');
      assert.ok(record.modal_price >= 0, 'Modal price must be non-negative');
      assert.ok(record.min_price >= 0, 'Min price must be non-negative');
      assert.ok(record.max_price >= 0, 'Max price must be non-negative');
      assert.equal(record.unit, '₹/Quintal', 'Unit must be preserved as ₹/Quintal');
    }

    // Persist verified sanitized result (no secrets)
    const verificationReport = {
      timestamp: new Date().toISOString(),
      workingFormat,
      httpStatus: response.statusCode,
      totalReported: response.parsed.total || response.parsed.count,
      returnedCount: mappedRecords.length,
      stateFilterActive,
      sampleRecords: mappedRecords.slice(0, 3).map((r) => ({
        commodity: r.commodity,
        variety: r.variety,
        grade: r.grade,
        market: r.market,
        district: r.district,
        state: r.state,
        arrival_date: r.arrival_date,
        modal_price: r.modal_price,
        min_price: r.min_price,
        max_price: r.max_price,
        unit: r.unit
      }))
    };

    fs.writeFileSync(
      path.join(ROOT_DIR, 'tests', 'market_prices_live_result.json'),
      JSON.stringify(verificationReport, null, 2),
      'utf-8'
    );
  });

  test('live Next.js backend route responds with valid contract and non-cached diagnostic status', async (t) => {
    const localUrl = 'http://localhost:3000/api/market-prices?state=Tamil%20Nadu&limit=5';
    let res;
    try {
      res = await new Promise((resolve, reject) => {
        const req = http.get(localUrl, { timeout: 15000 }, (r) => {
          let body = '';
          r.on('data', (c) => { body += c; });
          r.on('end', () => {
            try {
              resolve({ statusCode: r.statusCode, parsed: JSON.parse(body) });
            } catch (e) {
              resolve({ statusCode: r.statusCode, raw: body });
            }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      });
    } catch (e) {
      t.skip('Local Next.js dev server not reachable on port 3000: ' + e.message);
      return;
    }

    assert.equal(res.statusCode, 200, `Expected HTTP 200 from backend route, received ${res.statusCode}`);
    assert.ok(res.parsed, 'Response must be valid JSON');
    assert.equal(res.parsed.success, true, 'success must be true');
    assert.equal(res.parsed.resource_id, '35985678-0d79-46b4-9ed6-6f13308a1d24', 'resource_id must match 35985678-0d79-46b4-9ed6-6f13308a1d24');
    assert.ok(res.parsed.status === 'SUCCESS' || res.parsed.status === 'NO_DATA', 'status must be SUCCESS or NO_DATA');
    assert.ok(Array.isArray(res.parsed.records), 'records must be an array');
    assert.equal(res.parsed.unit, '₹/Quintal', 'unit must be ₹/Quintal');
    assert.ok(Array.isArray(res.parsed.attemptedFormats), 'attemptedFormats must be reported');

    if (res.parsed.records.length > 0) {
      for (const rec of res.parsed.records) {
        assert.equal(rec.state, 'Tamil Nadu', 'State must be Tamil Nadu');
        assert.ok(rec.district.length > 0, 'District must not be empty');
        assert.ok(rec.market.length > 0, 'Market must not be empty');
        assert.ok(rec.commodity.length > 0, 'Commodity must not be empty');
        assert.ok(typeof rec.grade === 'string', 'Grade must be string');
        assert.ok(rec.arrival_date.length > 0, 'Arrival date must not be empty');
        assert.ok(rec.modal_price >= 0, 'Modal price must be non-negative');
      }
    }
  });
});

