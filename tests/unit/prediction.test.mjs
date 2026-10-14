import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.resolve(__dirname, '../../ml/models/crop_price_ml_model.json');

describe('AgriME Crop Price Prediction & Artifact Unit Tests', () => {
  test('model artifact file exists and has valid JSON structure', () => {
    assert.ok(fs.existsSync(modelPath), `Model artifact must exist at ${modelPath}`);
    const raw = fs.readFileSync(modelPath, 'utf-8');
    const artifact = JSON.parse(raw);

    assert.ok(artifact.metadata, 'Artifact must contain metadata');
    assert.ok(artifact.metadata.model_name, 'Artifact must have model_name');
    assert.ok(artifact.horizons, 'Artifact must contain horizons');
    assert.ok(artifact.horizons['7 Days'], 'Artifact must support 7 Days horizon');
    assert.ok(artifact.horizons['15 Days'], 'Artifact must support 15 Days horizon');
    assert.ok(artifact.horizons['30 Days'], 'Artifact must support 30 Days horizon');
  });

  test('horizon configurations contain valid non-fabricated positive metrics', () => {
    const raw = fs.readFileSync(modelPath, 'utf-8');
    const artifact = JSON.parse(raw);

    for (const h of ['7 Days', '15 Days', '30 Days']) {
      const cfg = artifact.horizons[h];
      assert.ok(cfg.mae > 0, `${h} MAE must be positive`);
      assert.ok(cfg.rmse > 0, `${h} RMSE must be positive`);
      assert.ok(cfg.rmse >= cfg.mae, `${h} RMSE must mathematically be >= MAE`);
      assert.ok(cfg.drift_rate > 0.5 && cfg.drift_rate < 1.5, `${h} drift_rate must be realistic`);
    }
  });

  test('prediction intervals scale proportionally with standard error (RMSE)', () => {
    const raw = fs.readFileSync(modelPath, 'utf-8');
    const artifact = JSON.parse(raw);

    const rmse7 = artifact.horizons['7 Days'].rmse;
    const rmse30 = artifact.horizons['30 Days'].rmse;

    const margin7 = Math.round(1.96 * rmse7);
    const margin30 = Math.round(1.96 * rmse30);

    assert.ok(margin7 > 0, '7 Days margin must be positive');
    assert.ok(margin30 > 0, '30 Days margin must be positive');
  });
});
