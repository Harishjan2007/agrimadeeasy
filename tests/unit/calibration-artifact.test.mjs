import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const calibrationJsonPath = path.resolve(__dirname, '../../ml/models/crop_interval_calibration.json');
const prodModelJsonPath = path.resolve(__dirname, '../../ml/models/crop_price_ml_model.json');
const prodTreesJsonPath = path.resolve(__dirname, '../../ml/models/crop_price_trees.json');

describe('AgriME Calibration Artifact & Production Isolation Tests', () => {
  test('candidate calibration artifact exists and follows expected structure', () => {
    assert.ok(fs.existsSync(calibrationJsonPath), `Artifact must exist at ${calibrationJsonPath}`);
    const data = JSON.parse(fs.readFileSync(calibrationJsonPath, 'utf-8'));
    
    // Check available horizons
    const availableHorizons = Object.keys(data);
    assert.ok(availableHorizons.length > 0, 'Artifact must contain at least one calibrated horizon');

    for (const h of availableHorizons) {
      const hData = data[h];
      assert.ok(hData.val_sample_size > 0, `${h} must record validation samples`);
      assert.ok(hData.test_sample_size > 0, `${h} must record test samples`);
      assert.ok(hData.global_validation_metrics, `${h} must record global metrics`);
      assert.ok(hData.global_validation_metrics.p90_margin_inr > 0, `${h} global p90 margin must be positive`);
      assert.ok(hData.group_fallbacks, `${h} must record commodity group fallbacks`);
      assert.ok(hData.crop_calibrations, `${h} must record crop calibrations`);
      assert.ok(hData.proposed_conformal_calibration, `${h} must record proposed calibration`);
      assert.ok(hData.proposed_conformal_calibration.target_90.test_coverage_pct > 0, `${h} target 90 coverage must be recorded`);
    }
  });

  test('production runtime artifacts remain intact and separate from candidate calibration', () => {
    assert.ok(fs.existsSync(prodModelJsonPath), 'Production metadata must exist');
    assert.ok(fs.existsSync(prodTreesJsonPath), 'Production tree ensemble must exist');

    const prodMeta = JSON.parse(fs.readFileSync(prodModelJsonPath, 'utf-8'));
    const prodTrees = JSON.parse(fs.readFileSync(prodTreesJsonPath, 'utf-8'));

    // Production model must contain all 3 horizons
    for (const h of ['7 Days', '15 Days', '30 Days']) {
      assert.ok(prodMeta.horizons[h], `Production metadata must contain ${h}`);
      assert.ok(prodTrees[h], `Production trees must contain ${h}`);
    }

    // Verify production inference is uncoupled from candidate artifact
    assert.equal(prodMeta.metadata.version, '3.2.0', 'Production metadata version must be 3.2.0');
    assert.equal(typeof prodMeta.horizons['7 Days'].prediction_interval_margin, 'number', 'Production margin must be numeric');
  });
});
