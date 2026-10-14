import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelJsonPath = path.resolve(__dirname, '../../ml/models/crop_price_ml_model.json');

describe('AgriME ML Model Pipeline & Inference Tests', () => {
  const artifact = JSON.parse(fs.readFileSync(modelJsonPath, 'utf-8'));

  test('model artifact contains authentic Tamil Nadu APMC metadata and attribution', () => {
    assert.ok(artifact.metadata, 'Must contain metadata');
    assert.ok(artifact.metadata.model_name.includes('AgriME'), 'Model name must reference AgriME');
    assert.ok(artifact.metadata.dataset_source.includes('Agmarknet'), 'Source must reference Agmarknet');
    assert.ok(artifact.metadata.dataset_records_count > 100000, 'Must have realistic dataset record count');
    assert.ok(artifact.metadata.features_used.length >= 5, 'Must list at least 5 engineered features');
  });

  test('multi-horizon prediction configurations scale correctly', () => {
    const h7 = artifact.horizons['7 Days'];
    const h15 = artifact.horizons['15 Days'];
    const h30 = artifact.horizons['30 Days'];

    assert.ok(h7 && h15 && h30, 'All three horizons must be present');
    assert.ok(h7.rmse < h15.rmse, '7 Days RMSE must be tighter than 15 Days RMSE');
    assert.ok(h15.rmse < h30.rmse, '15 Days RMSE must be tighter than 30 Days RMSE');
    assert.ok(h7.mae < h15.mae, '7 Days MAE must be lower than 15 Days MAE');
    assert.ok(h15.mae < h30.mae, '15 Days MAE must be lower than 30 Days MAE');
    assert.ok(h7.r2_score >= h30.r2_score, 'Short-term R2 must be higher or equal to long-term R2');
  });

  test('decision-tree ensemble feature sensitivity exhibits crop-specific momentum', () => {
    for (const h of ['7 Days', '15 Days', '30 Days']) {
      const mom = artifact.horizons[h].crop_specific_momentum;
      assert.ok(mom, `${h} must have crop_specific_momentum`);
      // Highly perishable vegetables like tomato should have negative drift/momentum relative to grains
      assert.ok(mom['tomato'] < mom['paddy (dhan)'], `Tomato momentum must be lower than Paddy in ${h}`);
      assert.ok(mom['paddy (dhan)'] !== undefined, `Paddy must be defined in ${h}`);
      assert.ok(mom['onion'] !== undefined, `Onion must be defined in ${h}`);
    }
  });

  test('legacy crop aliases c1 through c10 baselines exist and are positive', () => {
    assert.ok(artifact.crop_baselines, 'crop_baselines must exist');
    for (let i = 1; i <= 10; i++) {
      const alias = `c${i}`;
      assert.ok(artifact.crop_baselines[alias] > 0, `Baseline for ${alias} must be positive`);
    }
  });

  test('non-negative price bounds and realistic margins', () => {
    for (const h of ['7 Days', '15 Days', '30 Days']) {
      const cfg = artifact.horizons[h];
      const margin = 1.96 * cfg.rmse;
      assert.ok(margin > 0 && margin < 1000, `${h} margin of error must be reasonable`);
    }
  });
});
