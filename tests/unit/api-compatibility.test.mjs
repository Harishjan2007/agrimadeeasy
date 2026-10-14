import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enTsPath = path.resolve(__dirname, '../../src/i18n/en.ts');
const taTsPath = path.resolve(__dirname, '../../src/i18n/ta.ts');

describe('API Compatibility & Localization Completeness Tests', () => {
  test('en.ts and ta.ts contain all essential prediction translation keys', () => {
    assert.ok(fs.existsSync(enTsPath), 'en.ts must exist');
    assert.ok(fs.existsSync(taTsPath), 'ta.ts must exist');

    const enContent = fs.readFileSync(enTsPath, 'utf-8');
    const taContent = fs.readFileSync(taTsPath, 'utf-8');

    const requiredKeys = [
      'currentPrice',
      'predictedPrice',
      'predictedRange',
      'predictedMin',
      'predictedMax',
      'trend',
      'predictionDate',
      'predictionPeriod',
      'expectedChange',
      'increasing',
      'decreasing',
      'stable'
    ];

    for (const key of requiredKeys) {
      assert.ok(enContent.includes(`${key}:`), `Missing ${key} in en.ts`);
      assert.ok(taContent.includes(`${key}:`), `Missing ${key} in ta.ts`);
    }
  });

  test('prediction service exports adhere to MLPredictionResult contract', () => {
    const servicePath = path.resolve(__dirname, '../../src/lib/ml-prediction-service.ts');
    assert.ok(fs.existsSync(servicePath), 'ml-prediction-service.ts must exist');
    const content = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(content.includes('export function predictCropPrice'), 'Must export predictCropPrice');
    assert.ok(content.includes('export function generateAllMLPredictions'), 'Must export generateAllMLPredictions');
    assert.ok(content.includes('export interface MLPredictionRequest'), 'Must export MLPredictionRequest');
    assert.ok(content.includes('export interface MLPredictionResult'), 'Must export MLPredictionResult');
  });

  test('prediction endpoint route handler exists and imports prediction service', () => {
    const routePath = path.resolve(__dirname, '../../src/app/api/predictions/predict/route.ts');
    assert.ok(fs.existsSync(routePath), 'API route must exist');
    const content = fs.readFileSync(routePath, 'utf-8');

    assert.ok(content.includes('predictCropPrice'), 'Route must invoke predictCropPrice');
    assert.ok(content.includes('GET'), 'Route must support GET');
    assert.ok(content.includes('POST'), 'Route must support POST');
  });

  test('supabase client and dealers helper support resilient error formatting and fallback', () => {
    const clientPath = path.resolve(__dirname, '../../src/lib/supabase/client.ts');
    assert.ok(fs.existsSync(clientPath), 'client.ts must exist');
    const clientContent = fs.readFileSync(clientPath, 'utf-8');
    assert.ok(clientContent.includes('export function formatSupabaseError'), 'Must export formatSupabaseError');

    const dealersPath = path.resolve(__dirname, '../../src/lib/supabase/dealers.ts');
    assert.ok(fs.existsSync(dealersPath), 'dealers.ts must exist');
    const dealersContent = fs.readFileSync(dealersPath, 'utf-8');
    assert.ok(dealersContent.includes('export async function getDealers'), 'Must export getDealers');
    assert.ok(dealersContent.includes('export async function getDealerById'), 'Must export getDealerById');
    assert.ok(dealersContent.includes('formatSupabaseError'), 'dealers.ts must use formatSupabaseError');
    assert.ok(!dealersContent.includes("console.error('Supabase getDealers error"), 'Must not trigger console.error modal in getDealers');
  });
});

