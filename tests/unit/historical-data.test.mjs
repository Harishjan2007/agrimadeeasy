import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

const ROOT_DIR = process.cwd();
const FILTER_OPTIONS_FILE = path.join(ROOT_DIR, 'ml', 'data', 'processed', 'cache', 'filter_options.json');
const METADATA_FILE = path.join(ROOT_DIR, 'ml', 'data', 'processed', 'last_10_years_metadata.json');
const CSV_FILE = path.join(ROOT_DIR, 'ml', 'data', 'processed', 'tamil_nadu_last_10_years.csv');
const CROPS_DIR = path.join(ROOT_DIR, 'ml', 'data', 'processed', 'cache', 'crops');

describe('Historical 10-Year Dataset Integrity and Cache Verification', () => {
  test('10-year CSV and metadata files exist and have content', () => {
    assert.ok(fs.existsSync(CSV_FILE), 'tamil_nadu_last_10_years.csv must exist');
    assert.ok(fs.existsSync(METADATA_FILE), 'last_10_years_metadata.json must exist');
    assert.ok(fs.existsSync(FILTER_OPTIONS_FILE), 'filter_options.json must exist');

    const meta = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
    assert.equal(meta.completed, true);
    assert.equal(meta.filtering_window.start_date, '2016-04-20');
    assert.equal(meta.filtering_window.end_date, '2026-04-20');
    assert.equal(meta.filtering_window.duration_years, 10);
    assert.equal(meta.counts.total_source_records, 4538308);
    assert.equal(meta.counts.total_output_records, 3781229);
    assert.equal(meta.counts.unique_crops_count, 139);
    assert.equal(meta.counts.unique_markets_count, 715);
    assert.equal(meta.counts.unique_districts_count, 36);
  });

  test('Filter options correctly expose structured dataset properties', () => {
    const options = JSON.parse(fs.readFileSync(FILTER_OPTIONS_FILE, 'utf-8'));
    assert.equal(options.totalRecords, 3781229);
    assert.equal(options.dateRange.min, '2016-04-20');
    assert.equal(options.dateRange.max, '2026-04-20');
    assert.equal(options.datasetSummary.uniqueCropsCount, 139);
    assert.equal(options.datasetSummary.uniqueDistrictsCount, 36);
    assert.equal(options.crops.length, 139);
    assert.equal(options.districts.length, 36);

    // Verify top crops present
    const topCropNames = options.crops.slice(0, 5).map((c) => c.name);
    assert.ok(topCropNames.includes('Paddy (Dhan)'));
    assert.ok(topCropNames.includes('Coconut'));
  });

  test('Crop partition files exist and are chronologically sorted', () => {
    const tomatoFile = path.join(CROPS_DIR, 'tomato.json');
    assert.ok(fs.existsSync(tomatoFile), 'tomato.json must exist');

    const tomato = JSON.parse(fs.readFileSync(tomatoFile, 'utf-8'));
    assert.equal(tomato.name, 'Tomato');
    assert.ok(tomato.totalCount > 50000, 'Tomato must have over 50,000 observations');
    assert.ok(Array.isArray(tomato.records));

    // Verify chronological ordering
    for (let i = 1; i < Math.min(200, tomato.records.length); i++) {
      assert.ok(tomato.records[i][0] >= tomato.records[i - 1][0], 'Records must be chronologically ordered');
    }
  });

  test('Historical query engine validates and filters correctly', () => {
    const tomatoFile = path.join(CROPS_DIR, 'tomato.json');
    const tomato = JSON.parse(fs.readFileSync(tomatoFile, 'utf-8'));

    // Filter by date range: 2025-01-01 to 2025-12-31
    const filtered2025 = tomato.records.filter((r) => r[0] >= '2025-01-01' && r[0] <= '2025-12-31');
    assert.ok(filtered2025.length > 0, 'Must have 2025 records for Tomato');

    // Filter by district: Coimbatore
    const coimbatoreRecords = tomato.records.filter((r) => r[1].toLowerCase() === 'coimbatore');
    assert.ok(coimbatoreRecords.length > 0, 'Must have Coimbatore records for Tomato');

    // Price sanity check: prices must be positive numbers
    for (const r of coimbatoreRecords.slice(0, 50)) {
      const minP = r[5];
      const maxP = r[6];
      const modalP = r[7];
      assert.ok(minP > 0, 'Min price must be positive');
      assert.ok(maxP >= minP, 'Max price must be >= Min price');
      assert.ok(modalP >= minP && modalP <= maxP, 'Modal price must be within Min and Max');
    }
  });
});
