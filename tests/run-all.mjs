#!/usr/bin/env node

/**
 * AgriME Unified Automated Test Suite Runner
 * ------------------------------------------
 * Runs all native node:test suites across telemetry, ingestion, state machines, and forecasting.
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testFiles = [
  path.join(__dirname, 'unit', 'location.test.mjs'),
  path.join(__dirname, 'unit', 'crop-ingestion.test.mjs'),
  path.join(__dirname, 'unit', 'booking-state-machine.test.mjs'),
  path.join(__dirname, 'unit', 'prediction.test.mjs')
];

console.log('====================================================');
console.log('🌾 AgriME Automated Test Runner');
console.log('Running test suites:');
testFiles.forEach((f) => console.log('  • ' + path.basename(f)));
console.log('====================================================\n');

const stream = run({
  files: testFiles,
  concurrency: 1
});

stream.compose(new spec()).pipe(process.stdout);

stream.on('test:fail', () => {
  process.exitCode = 1;
});
