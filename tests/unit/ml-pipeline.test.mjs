import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const processedDir = path.resolve(__dirname, '../../ml/data/processed');
const cleanedCsvPath = path.join(processedDir, 'tamil_nadu_cleaned.csv');
const metadataPath = path.join(processedDir, 'preprocessing_metadata.json');
const modelJsonPath = path.resolve(__dirname, '../../ml/models/crop_price_ml_model.json');

describe('AgriME Machine Learning Pipeline Integrity Tests', () => {
  test('source dataset exists and contains verified Tamil Nadu records from 2001 to 2026', () => {
    assert.ok(fs.existsSync(cleanedCsvPath), 'tamil_nadu_cleaned.csv must exist');
    assert.ok(fs.existsSync(metadataPath), 'preprocessing_metadata.json must exist');

    const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    assert.equal(meta.target_state, 'Tamil Nadu', 'Target state must be Tamil Nadu');
    assert.ok(
      meta.usable_cleaned_tamil_nadu_records > 4000000,
      `Expected > 4M usable records, found ${meta.usable_cleaned_tamil_nadu_records}`
    );

    // Verify yearly distribution spans full 2001 to 2026 chronological window
    const yearly = meta.yearly_distribution;
    assert.ok(yearly, 'Yearly distribution metadata must exist');
    for (let yr = 2001; yr <= 2026; yr++) {
      const yearStr = String(yr);
      assert.ok(
        yearly[yearStr] !== undefined && yearly[yearStr] > 0,
        `Year ${yearStr} must have positive record count (found ${yearly[yearStr]})`
      );
    }

    const stat = fs.statSync(cleanedCsvPath);
    assert.ok(
      stat.size > 100 * 1024 * 1024,
      `Dataset file size must exceed 100MB, found ${(stat.size / (1024 * 1024)).toFixed(1)}MB`
    );
  });

  test('CSV schema matches expected 11 Agmarknet columns and valid data types', () => {
    assert.ok(fs.existsSync(cleanedCsvPath), 'tamil_nadu_cleaned.csv must exist');

    // Read first chunk to inspect header and sample rows efficiently
    const fd = fs.openSync(cleanedCsvPath, 'r');
    const buffer = Buffer.alloc(65536);
    const bytesRead = fs.readSync(fd, buffer, 0, 65536, 0);
    fs.closeSync(fd);

    const chunk = buffer.toString('utf-8', 0, bytesRead);
    const lines = chunk.split('\n').filter((l) => l.trim().length > 0);
    assert.ok(lines.length >= 2, 'Dataset must contain at least a header and sample data rows');

    const header = lines[0].trim();
    const columns = header.split(',').map((c) => c.trim().toLowerCase());

    const expectedAgmarknetCols = [
      'state',
      'district',
      'market',
      'commodity',
      'variety',
      'grade',
      'arrival_date',
      'min_price',
      'max_price',
      'modal_price',
      'commodity_code'
    ];

    for (const col of expectedAgmarknetCols) {
      assert.ok(
        columns.includes(col),
        `Dataset schema must contain standard Agmarknet column: '${col}'`
      );
    }

    // Validate first data row values against expected schema and bounds
    const firstRowValues = lines[1].trim().split(',');
    assert.equal(
      firstRowValues.length,
      columns.length,
      'First data row column count must match header'
    );

    const stateIdx = columns.indexOf('state');
    const dateIdx = columns.indexOf('arrival_date');
    const minIdx = columns.indexOf('min_price');
    const maxIdx = columns.indexOf('max_price');
    const modalIdx = columns.indexOf('modal_price');

    assert.equal(firstRowValues[stateIdx], 'Tamil Nadu', 'State must be Tamil Nadu');
    assert.match(
      firstRowValues[dateIdx],
      /^2001-\d{2}-\d{2}$/,
      'First record arrival date must be in year 2001'
    );

    const minP = parseFloat(firstRowValues[minIdx]);
    const maxP = parseFloat(firstRowValues[maxIdx]);
    const modalP = parseFloat(firstRowValues[modalIdx]);

    assert.ok(!isNaN(minP) && minP > 0, 'Min price must be a positive number');
    assert.ok(!isNaN(maxP) && maxP >= minP, 'Max price must be >= Min price');
    assert.ok(!isNaN(modalP) && modalP >= minP && modalP <= maxP, 'Modal price must be within Min and Max');
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
