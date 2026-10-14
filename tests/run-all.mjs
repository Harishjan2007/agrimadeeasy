#!/usr/bin/env node

/**
 * AgriME Unified Automated Test Suite Runner
 * ------------------------------------------
 * Runs all native node:test suites across telemetry, ingestion, state machines, and forecasting.
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testFiles = [
  path.join(__dirname, 'unit', 'location.test.mjs'),
  path.join(__dirname, 'unit', 'crop-ingestion.test.mjs'),
  path.join(__dirname, 'unit', 'booking-state-machine.test.mjs'),
  path.join(__dirname, 'unit', 'prediction.test.mjs'),
  path.join(__dirname, 'unit', 'ml-pipeline.test.mjs'),
  path.join(__dirname, 'unit', 'ml-model-pipeline.test.mjs'),
  path.join(__dirname, 'unit', 'api-compatibility.test.mjs'),
  path.join(__dirname, 'unit', 'market-prices-api.test.mjs'),
  path.join(__dirname, 'unit', 'market-prices-live.test.mjs'),
  path.join(__dirname, 'unit', 'historical-data.test.mjs')
];

console.log('====================================================');
console.log('🌾 AgriME Automated Test Runner');
console.log('Running test suites:');
testFiles.forEach((f) => console.log('  • ' + path.basename(f)));
console.log('====================================================\n');

export async function executeAllTests() {
  const results = {
    started_at: new Date().toISOString(),
    suites_count: testFiles.length,
    passed_tests: 0,
    failed_tests: 0,
    failures: [],
    completed: false
  };

  const stream = run({
    files: testFiles,
    concurrency: 1
  });

  stream.compose(new spec()).pipe(process.stdout);

  stream.on('test:pass', (t) => {
    results.passed_tests++;
  });

  stream.on('test:fail', (t) => {
    results.failed_tests++;
    results.failures.push({
      name: t.name,
      file: t.file,
      error: t.details?.error?.message || 'Failed'
    });
    process.exitCode = 1;
  });

  return new Promise((resolve) => {
    stream.on('end', () => {
      results.completed = true;
      results.completed_at = new Date().toISOString();
      const resultsPath = path.join(__dirname, 'test_run_results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`\n✅ Test execution completed. Passed: ${results.passed_tests}, Failed: ${results.failed_tests}`);
      resolve(results);
    });
  });
}

// Auto run if executed directly
if (process.argv[1] && process.argv[1].endsWith('run-all.mjs')) {
  executeAllTests().catch(console.error);
}
