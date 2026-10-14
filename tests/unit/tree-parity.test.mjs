import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fast binary search matching np.searchsorted(thresholds, val, side='right')
 */
export function searchSortedRight(arr, val) {
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (arr[mid] <= val) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

/**
 * Pure tree traversal matching Scikit-Learn HistGradientBoostingRegressor.predict()
 */
export function predictDeltaFromTreeEnsemble(horizonModel, featureVector) {
  const { base_prediction, bin_thresholds, is_categorical, trees } = horizonModel;
  const nFeatures = featureVector.length;

  // 1. Map continuous/categorical features to integer bins
  const binnedFeatures = new Int32Array(nFeatures);
  for (let j = 0; j < nFeatures; j++) {
    const val = featureVector[j];
    if (is_categorical[j]) {
      binnedFeatures[j] = val >= 0 ? Math.floor(val) : 0;
    } else {
      if (isNaN(val)) {
        binnedFeatures[j] = bin_thresholds[j] ? bin_thresholds[j].length : 0;
      } else {
        const thArr = bin_thresholds[j] || [];
        binnedFeatures[j] = searchSortedRight(thArr, val);
      }
    }
  }

  // 2. Accumulate leaf predictions across all trees
  let total = base_prediction;
  const nTrees = trees.length;

  for (let t = 0; t < nTrees; t++) {
    const nodes = trees[t].nodes;
    let nodeIdx = 0;

    while (!nodes[nodeIdx].is_leaf) {
      const node = nodes[nodeIdx];
      const featIdx = node.feature_idx;
      const binVal = binnedFeatures[featIdx];

      if (node.is_categorical) {
        const bitset = node.bitset;
        if (bitset && binVal >= 0 && binVal < 256) {
          const word = bitset[binVal >> 5];
          const inSet = ((word >> (binVal & 31)) & 1) === 1;
          nodeIdx = inSet ? node.left : node.right;
        } else {
          nodeIdx = node.right;
        }
      } else {
        if (binVal <= node.bin_threshold) {
          nodeIdx = node.left;
        } else {
          nodeIdx = node.right;
        }
      }
    }

    total += nodes[nodeIdx].value;
  }

  return total;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const treeJsonPath = path.resolve(__dirname, '../../ml/models/crop_price_trees.json');
const fixturesPath = path.resolve(__dirname, '../../tests/unit/tree_parity_fixtures.json');

describe('AgriME Scikit-Learn Tree Ensemble TypeScript Parity Tests', () => {
  test('tree ensemble JSON artifact exists and contains all 3 horizons', () => {
    assert.ok(fs.existsSync(treeJsonPath), `Artifact must exist at ${treeJsonPath}`);
    const artifact = JSON.parse(fs.readFileSync(treeJsonPath, 'utf-8'));
    assert.ok(artifact['7 Days'], 'Must contain 7 Days tree model');
    assert.ok(artifact['15 Days'], 'Must contain 15 Days tree model');
    assert.ok(artifact['30 Days'], 'Must contain 30 Days tree model');
    
    for (const h of ['7 Days', '15 Days', '30 Days']) {
      const model = artifact[h];
      assert.ok(model.num_trees > 0, `${h} must contain trees (found ${model.num_trees})`);
      assert.ok(model.bin_thresholds.length === 15, `${h} must have 15 feature bin thresholds`);
      assert.ok(model.trees.length === model.num_trees, `${h} tree count must match`);
    }
  });

  test('searchSortedRight implements exact np.searchsorted(side="right") semantics', () => {
    const thresholds = [10.0, 20.0, 30.0, 40.0, 50.0];
    assert.equal(searchSortedRight(thresholds, 5.0), 0);
    assert.equal(searchSortedRight(thresholds, 10.0), 1);
    assert.equal(searchSortedRight(thresholds, 15.0), 1);
    assert.equal(searchSortedRight(thresholds, 20.0), 2);
    assert.equal(searchSortedRight(thresholds, 50.0), 5);
    assert.equal(searchSortedRight(thresholds, 60.0), 5);
  });

  test('TypeScript tree ensemble achieves exact numerical parity (< 1e-4) with Python Scikit-Learn on all horizons', () => {
    assert.ok(fs.existsSync(fixturesPath), `Fixtures must exist at ${fixturesPath}`);
    const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
    const treeArtifact = JSON.parse(fs.readFileSync(treeJsonPath, 'utf-8'));

    let totalCasesTested = 0;
    let maxAbsDiff = 0;

    for (const h of ['7 Days', '15 Days', '30 Days']) {
      const hModel = treeArtifact[h];
      const samples = fixtures[h];
      assert.ok(samples && samples.length > 0, `Must have fixtures for ${h}`);

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const tsPredictedDelta = predictDeltaFromTreeEnsemble(hModel, sample.feature_vector);
        const expectedDelta = sample.expected_delta;

        const diff = Math.abs(tsPredictedDelta - expectedDelta);
        if (diff > maxAbsDiff) {
          maxAbsDiff = diff;
        }

        // Must match Python scikit-learn within float precision tolerance
        assert.ok(
          diff < 1e-4,
          `Mismatch in ${h} sample ${i} (${sample.crop}): TS=${tsPredictedDelta}, Sklearn=${expectedDelta}, Diff=${diff}`
        );

        // Price reconstruction must also match
        const tsPredictedPrice = sample.current_price + tsPredictedDelta;
        const priceDiff = Math.abs(tsPredictedPrice - sample.expected_price);
        assert.ok(priceDiff < 1e-4, `Price reconstruction mismatch: Diff=${priceDiff}`);

        totalCasesTested++;
      }
    }

    assert.ok(totalCasesTested >= 60, `Must have tested at least 60 fixtures (tested ${totalCasesTested})`);
    assert.ok(maxAbsDiff < 1e-4, `Max absolute diff must be < 1e-4 (was ${maxAbsDiff.toExponential(4)})`);
  });
});
