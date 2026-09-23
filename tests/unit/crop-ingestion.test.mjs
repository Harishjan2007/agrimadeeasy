import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Logic matching src/lib/crop-ingestion.ts
function normalizeCropName(rawCommodity) {
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
  return rawCommodity.trim();
}

function determineProvenance(arrivalDateStr) {
  try {
    const arrivalDate = new Date(arrivalDateStr);
    const now = new Date();
    const diffHours = (now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60);

    if (diffHours >= 0 && diffHours <= 36) {
      return 'LIVE';
    } else if (diffHours > 36 && diffHours <= 168) {
      return 'RECENT';
    } else {
      return 'REFERENCE';
    }
  } catch {
    return 'REFERENCE';
  }
}

function validateAndNormalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const commodity = String(raw.commodity || '').trim();
  const market = String(raw.market || '').trim();
  if (!commodity || !market) return null;

  let minPrice = parseFloat(raw.min_price || 0);
  let maxPrice = parseFloat(raw.max_price || 0);
  let modalPrice = parseFloat(raw.modal_price || 0);

  if (modalPrice <= 0 && minPrice > 0 && maxPrice > 0) {
    modalPrice = Math.round((minPrice + maxPrice) / 2);
  }

  if (modalPrice < 100 || modalPrice > 300000) return null;

  if (minPrice > maxPrice) {
    const tmp = minPrice;
    minPrice = maxPrice;
    maxPrice = tmp;
  }

  return {
    commodity,
    normalized: normalizeCropName(commodity),
    market,
    min_price: minPrice,
    max_price: maxPrice,
    modal_price: modalPrice
  };
}

describe('Crop Price Ingestion & Normalization Unit Tests', () => {
  test('normalizeCropName maps messy commodity strings to canonical names', () => {
    assert.equal(normalizeCropName('Paddy(Dhan)(Common)'), 'Paddy (Common)');
    assert.equal(normalizeCropName('Paddy Basmati Pusa'), 'Paddy (Basmati)');
    assert.equal(normalizeCropName('Groundnut Pods'), 'Groundnut (Peanut)');
    assert.equal(normalizeCropName('Tomato Local Hybrid'), 'Tomato (Hybrid)');
    assert.equal(normalizeCropName('Cotton Medium Staple'), 'Cotton (Long Staple)');
  });

  test('validateAndNormalizeRecord rejects empty commodity or market', () => {
    assert.equal(validateAndNormalizeRecord({ commodity: '', market: 'Vellore' }), null);
    assert.equal(validateAndNormalizeRecord({ commodity: 'Paddy', market: '' }), null);
  });

  test('validateAndNormalizeRecord rejects unrealistic/corrupt prices', () => {
    // Negative price
    assert.equal(validateAndNormalizeRecord({ commodity: 'Paddy', market: 'Vellore', modal_price: -500 }), null);
    // Zero price
    assert.equal(validateAndNormalizeRecord({ commodity: 'Paddy', market: 'Vellore', modal_price: 0 }), null);
    // Absurdly high corrupt entry (> ₹300,000/Q)
    assert.equal(validateAndNormalizeRecord({ commodity: 'Paddy', market: 'Vellore', modal_price: 9999999 }), null);
  });

  test('validateAndNormalizeRecord automatically repairs inverted min/max prices', () => {
    const res = validateAndNormalizeRecord({
      commodity: 'Tomato',
      market: 'Kanchipuram',
      min_price: 2400,
      max_price: 1800,
      modal_price: 2000
    });
    assert.ok(res !== null);
    assert.equal(res.min_price, 1800);
    assert.equal(res.max_price, 2400);
    assert.equal(res.modal_price, 2000);
  });

  test('determineProvenance classifies fresh vs historical dates truthfully', () => {
    const today = new Date().toISOString().split('T')[0];
    assert.equal(determineProvenance(today), 'LIVE');

    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    assert.equal(determineProvenance(fourDaysAgo), 'RECENT');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    assert.equal(determineProvenance(thirtyDaysAgo), 'REFERENCE');
  });
});
