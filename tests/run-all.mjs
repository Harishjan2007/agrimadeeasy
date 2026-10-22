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
  path.join(__dirname, 'unit', 'historical-data.test.mjs'),
  path.join(__dirname, 'unit', 'pipeline-leakage-and-horizons.test.mjs'),
  path.join(__dirname, 'unit', 'tree-parity.test.mjs'),
  path.join(__dirname, 'unit', 'auth-onboarding.test.mjs'),
  path.join(__dirname, 'unit', 'dealer-portal-and-profile.test.mjs'),
  path.join(__dirname, 'unit', 'customization-tasks.test.mjs'),
  path.join(__dirname, 'unit', 'error-propagation-and-persistence.test.mjs')
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
    passed_test_cases: 0,
    skipped_tests: 0,
    failed_tests: 0,
    total_test_cases: 0,
    passed_suites: 0,
    failed_suites: 0,
    total_suites: 0,
    stream_pass_events: 0,
    failures: [],
    completed: false
  };

  const stream = run({
    files: testFiles,
    concurrency: 1
  });

  stream.compose(new spec()).pipe(process.stdout);

  // Set to prevent double-counting skipped tests between test:pass and test:skip events
  const skippedTestKeys = new Set();

  stream.on('test:pass', (t) => {
    results.stream_pass_events++;
    const testKey = `${t.file || ''}:${t.name || ''}`;
    const isSkipped = Boolean(t.skip !== undefined && t.skip !== false || t.details?.skip);

    if (isSkipped) {
      if (!skippedTestKeys.has(testKey)) {
        skippedTestKeys.add(testKey);
        results.skipped_tests++;
      }
    } else if (t.type === 'suite') {
      results.passed_suites++;
    } else if (t.type === 'test') {
      results.passed_test_cases++;
    } else if (t.nesting === 0) {
      results.passed_suites++;
    } else {
      results.passed_test_cases++;
    }
  });

  stream.on('test:skip', (t) => {
    const testKey = `${t.file || ''}:${t.name || ''}`;
    if (!skippedTestKeys.has(testKey)) {
      skippedTestKeys.add(testKey);
      results.skipped_tests++;
    }
  });

  stream.on('test:fail', (t) => {
    // Strictly isolate suite failures from individual test case failures
    if (t.type === 'suite') {
      results.failed_suites++;
    } else {
      results.failed_tests++;
      results.failures.push({
        name: t.name,
        file: t.file,
        error: t.details?.error?.message || 'Failed'
      });
    }
    process.exitCode = 1;
  });

  return new Promise((resolve) => {
    stream.on('end', () => {
      results.completed = true;
      results.completed_at = new Date().toISOString();
      results.total_test_cases = results.passed_test_cases + results.skipped_tests + results.failed_tests;
      results.total_suites = results.passed_suites + results.failed_suites;
      results.passed_tests = results.passed_test_cases;
      const resultsPath = path.join(__dirname, 'test_run_results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`\n====================================================`);
      console.log(`📊 AgriME Test Execution Summary:`);
      console.log(`   • Total Test Cases:   ${results.total_test_cases}`);
      console.log(`     - Passed:           ${results.passed_test_cases}`);
      console.log(`     - Skipped:          ${results.skipped_tests}`);
      console.log(`     - Failed:           ${results.failed_tests}`);
      console.log(`   • Total Suites:       ${results.total_suites}`);
      console.log(`     - Passed:           ${results.passed_suites}`);
      console.log(`     - Failed:           ${results.failed_suites}`);
      console.log(`====================================================\n`);
      resolve(results);
    });
  });
}

// Auto run if executed directly
if (process.argv[1] && process.argv[1].endsWith('run-all.mjs')) {
  executeAllTests().catch(console.error);
}

