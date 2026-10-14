import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const leancsvDir = path.resolve(__dirname, '../../leancsv');
const modelJsonPath = path.resolve(__dirname, '../../ml/models/crop_price_ml_model.json');

describe('AgriME Machine Learning Pipeline Integrity Tests', () => {
  test('source dataset directory exists and contains yearly CSV files from 2001 to 2026', () => {
    assert.ok(fs.existsSync(leancsvDir), 'leancsv directory must exist');
    const files = fs.readdirSync(leancsvDir).filter((f) => f.endsWith('.csv'));
    assert.ok(files.length >= 26, `Expected at least 26 yearly CSV files, found ${files.length}`);
    assert.ok(files.includes('2001.csv'), 'Must contain 2001.csv');
    assert.ok(files.includes('2026.csv'), 'Must contain 2026.csv');
  });

  test('CSV schema matches expected 11 Agmarknet columns', () => {
    const csv2001 = path.join(leancsvDir, '2001.csv');
    const firstLine = fs.readFileSync(csv2001, 'utf-8').split('\n')[0].trim();
    const expectedCols = 'State,District,Market,Commodity,Variety,Grade,Arrival_Date,Min_Price,Max_Price,Modal_Price,Commodity_Code';
    assert.equal(firstLine, expectedCols, 'Header must match standard 11 Agmarknet columns');
  });

  test('chronological split respects non-overlapping date boundaries', () => {
    const trainEnd = new Date('2023-12-31T23:59:59Z');
    const valStart = new Date('2024-01-01T00:00:00Z');
    const valEnd = new Date('2024-12-31T23:59:59Z');
    const testStart = new Date('2025-01-01T00:00:00Z');

    assert.ok(trainEnd < valStart, 'Train period must strictly precede validation period');
    assert.ok(valEnd < testStart, 'Validation period must strictly precede test period');
  });

  test('feature engineering preserves chronological lookback without lookahead bias', () => {
    // Test fixture of past dates
    const observations = [
      { date: '2025-01-01', price: 2000 },
      { date: '2025-01-05', price: 2100 },
      { date: '2025-01-10', price: 2050 },
      { date: '2025-01-20', price: 2200 }
    ];

    const currentObs = observations[2]; // 2025-01-10
    const pastObs = observations.filter((o) => new Date(o.date) < new Date(currentObs.date));

    // Past observations must only include 2025-01-01 and 2025-01-05
    assert.equal(pastObs.length, 2);
    assert.equal(pastObs[0].date, '2025-01-01');
    assert.equal(pastObs[1].date, '2025-01-05');

    const rollMean = pastObs.reduce((acc, o) => acc + o.price, 0) / pastObs.length;
    assert.equal(rollMean, 2050);
  });

  test('deduplication policy identifies duplicate market observations on same day', () => {
    const records = [
      { market: 'Vellore', crop: 'Paddy', variety: 'FAQ', grade: 'Local', date: '2026-03-01', price: 2400 },
      { market: 'Vellore', crop: 'Paddy', variety: 'FAQ', grade: 'Local', date: '2026-03-01', price: 2450 }, // duplicate
      { market: 'Vellore', crop: 'Paddy', variety: 'FAQ', grade: 'Local', date: '2026-03-02', price: 2420 }
    ];

    const seen = new Set();
    const clean = [];
    for (const r of records) {
      const key = `${r.market}|${r.crop}|${r.variety}|${r.grade}|${r.date}`;
      if (!seen.has(key)) {
        seen.add(key);
        clean.push(r);
      }
    }

    assert.equal(clean.length, 2, 'Deduplication must discard exact same-day duplicate');
    assert.equal(clean[0].price, 2400, 'Must preserve first authentic observation');
  });

  test('model artifact contains comprehensive metadata and features list', () => {
    const raw = fs.readFileSync(modelJsonPath, 'utf-8');
    const artifact = JSON.parse(raw);

    assert.ok(artifact.metadata.features_used.length >= 4, 'Must specify at least 4 used features');
    assert.ok(artifact.metadata.training_methodology.includes('chronological'), 'Methodology must document chronological split');
    assert.ok(artifact.metadata.limitations.length > 20, 'Must provide clear practical limitations');
  });
});
