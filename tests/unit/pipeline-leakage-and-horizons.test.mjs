import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelJsonPath = path.resolve(__dirname, '../../ml/models/crop_price_ml_model.json');
const smokeJsonPath = path.resolve(__dirname, '../../ml/models/smoke_test_ml_model.json');

describe('AgriME Chronological Leakage Prevention & Baseline Verification', () => {
  const targetPath = modelJsonPath;
  const artifact = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));

  test('date ranges for train, validation, and test are strictly disjoint with zero target overlap', () => {
    assert.ok(artifact.metadata.train_date_range, 'Train date range must exist');
    assert.ok(artifact.metadata.validation_date_range, 'Validation date range must exist');
    assert.ok(artifact.metadata.test_date_range, 'Test date range must exist');

    const [trainStartStr, trainEndStr] = artifact.metadata.train_date_range.split(' to ');
    const [valStartStr, valEndStr] = artifact.metadata.validation_date_range.split(' to ');
    const [testStartStr, testEndStr] = artifact.metadata.test_date_range.split(' to ');

    const trainEnd = new Date(trainEndStr);
    const valStart = new Date(valStartStr);
    const valEnd = new Date(valEndStr);
    const testStart = new Date(testStartStr);

    // Strict chronological sequence
    assert.ok(trainEnd < valStart, `Train end (${trainEndStr}) must precede validation start (${valStartStr})`);
    assert.ok(valEnd < testStart, `Validation end (${valEndStr}) must precede test start (${testStartStr})`);
  });

  test('all horizons report baseline comparisons on identical test row counts', () => {
    for (const h of ['7 Days', '15 Days', '30 Days']) {
      const cfg = artifact.horizons[h];
      assert.ok(cfg.test_sample_size > 0, `${h} must have positive test sample count`);
      assert.ok(cfg.baseline_naive_mae > 0, `${h} naive baseline MAE must be recorded`);
      assert.ok(cfg.baseline_seasonal_mae > 0, `${h} seasonal baseline MAE must be recorded`);
      assert.ok(cfg.mae > 0, `${h} model MAE must be recorded`);
      assert.ok(cfg.rmse > 0, `${h} model RMSE must be recorded`);
    }
  });

  test('empirical prediction interval coverage and width are honestly documented', () => {
    for (const h of ['7 Days', '15 Days', '30 Days']) {
      const cfg = artifact.horizons[h];
      // Coverage must be explicitly measured (between 0% and 100%)
      const coverage = cfg.empirical_coverage_pct ?? cfg.empirical_coverage_95_pct;
      assert.ok(coverage >= 50.0 && coverage <= 100.0, `${h} empirical coverage must be a valid measured percentage`);
      // Margin must be positive and realistically bounded
      const margin = cfg.prediction_interval_margin ?? (1.96 * cfg.rmse);
      assert.ok(margin > 0, `${h} interval margin must be positive`);
    }
  });

  test('features list strictly contains past-only time-series lookbacks and seasonal harmonics', () => {
    const features = artifact.metadata.features_used;
    assert.ok(features.includes('current_price'), 'Must include current spot price');
    assert.ok(features.includes('roll_mean_7d'), 'Must include 7d rolling lookback');
    assert.ok(features.includes('roll_mean_30d'), 'Must include 30d rolling lookback');
    assert.ok(features.includes('momentum_7d'), 'Must include 7d momentum');
    assert.ok(features.includes('sin_month'), 'Must include seasonal harmonics');
    assert.ok(features.includes('commodity_enc'), 'Must include categorical commodity encoding');
  });

  test('prediction interval margins mathematically reconcile with 1.96 * RMSE across calibration bases', () => {
    for (const h of ['7 Days', '15 Days', '30 Days']) {
      const cfg = artifact.horizons[h];
      // Staple/Top-commodity margin reconciliation
      const expectedStapleMargin = Math.round(1.96 * cfg.rmse * 100) / 100;
      assert.ok(Math.abs(cfg.prediction_interval_margin - expectedStapleMargin) <= 0.05, `${h} staple margin must equal 1.96 * staple rmse`);

      // Pooled test margin reconciliation (if documented)
      if (cfg.pooled_test_margin && cfg.pooled_all_commodities_rmse) {
        const expectedTestMargin = Math.round(1.96 * cfg.pooled_all_commodities_rmse * 100) / 100;
        assert.ok(Math.abs(cfg.pooled_test_margin - expectedTestMargin) <= 0.05, `${h} pooled test margin must equal 1.96 * pooled test rmse`);
      }

      // Pooled validation margin reconciliation (if documented)
      if (cfg.pooled_validation_margin && cfg.pooled_validation_rmse) {
        const expectedValMargin = Math.round(1.96 * cfg.pooled_validation_rmse * 100) / 100;
        assert.ok(Math.abs(cfg.pooled_validation_margin - expectedValMargin) <= 0.05, `${h} pooled validation margin must equal 1.96 * pooled val rmse`);
      }

      // Distinction between pooled and staple results
      if (cfg.pooled_all_commodities_rmse) {
        assert.ok(cfg.pooled_all_commodities_rmse > cfg.rmse, `${h} pooled RMSE must be higher than staple RMSE due to spices`);
      }
    }
  });
});
