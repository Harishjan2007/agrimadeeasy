import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Binary search matching Scikit-Learn's HistGradientBoostingRegressor _map_num_col:
 * A value belongs to bin k if bin_thresholds[k-1] < val <= bin_thresholds[k].
 * Floating-point single precision (Math.fround) ensures bit-for-bit parity with float32 trained thresholds.
 */
export function searchSortedLeft(arr, val) {
  let low = 0;
  let high = arr.length;
  const fVal = Math.fround(val);
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (fVal <= arr[mid]) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}

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

export const MODEL_FEATURE_NAMES = [
  'commodity_enc',
  'district_enc',
  'market_enc',
  'current_price',
  'min_price',
  'max_price',
  'spread',
  'roll_mean_7d',
  'roll_mean_30d',
  'roll_std_30d',
  'momentum_7d',
  'sin_month',
  'cos_month',
  'sin_doy',
  'cos_doy'
];

/**
 * Pure tree traversal matching Scikit-Learn HistGradientBoostingRegressor.predict()
 */
export function predictDeltaFromTreeEnsemble(horizonModel, featureVector) {
  const { base_prediction, bin_thresholds, is_categorical, trees, feature_names } = horizonModel;
  const nFeatures = bin_thresholds ? bin_thresholds.length : 15;

  // Build name-to-index lookup for input featureVector
  const nameToIndex = new Map();
  if (feature_names && Array.isArray(feature_names)) {
    for (let i = 0; i < feature_names.length; i++) {
      nameToIndex.set(feature_names[i], i);
    }
  }

  // 1. Map input features to integer bins according to the tree model's internal layout
  const binnedFeatures = new Int32Array(nFeatures);
  for (let j = 0; j < nFeatures; j++) {
    let val;
    const featName = MODEL_FEATURE_NAMES[j];
    if (featName && nameToIndex.has(featName)) {
      val = featureVector[nameToIndex.get(featName)];
    } else if (featureVector.length === 15 && is_categorical && is_categorical[0] && !is_categorical[12]) {
      // Reorder from [continuous(12), categorical(3)] to [categorical(3), continuous(12)]
      val = j < 3 ? featureVector[12 + j] : featureVector[j - 3];
    } else {
      val = featureVector[j];
    }

    if (is_categorical && is_categorical[j]) {
      const thArr = bin_thresholds[j] || [];
      if (val === undefined || isNaN(val) || val === null || val < 0) {
        binnedFeatures[j] = 255; // missing / unknown category bin in scikit-learn
      } else {
        const intVal = Math.floor(val);
        if (intVal < thArr.length && thArr[intVal] === val) {
          binnedFeatures[j] = intVal;
        } else {
          let low = 0;
          let high = thArr.length - 1;
          let foundBin = 255;
          while (low <= high) {
            const mid = (low + high) >>> 1;
            if (thArr[mid] === val) {
              foundBin = mid;
              break;
            } else if (thArr[mid] < val) {
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          binnedFeatures[j] = foundBin;
        }
      }
    } else {
      if (val === undefined || isNaN(val)) {
        binnedFeatures[j] = 255; // missing continuous value bin in scikit-learn
      } else {
        const thArr = bin_thresholds[j] || [];
        binnedFeatures[j] = searchSortedLeft(thArr, val);
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

      if (binVal === 255) {
        // Scikit-learn routes missing/unknown categorical and continuous values via missing_go_to_left
        nodeIdx = node.missing_go_to_left ? node.left : node.right;
      } else if (node.is_categorical) {
        const bitset = node.bitset;
        if (bitset && binVal >= 0 && binVal < 256) {
          const word = bitset[binVal >> 5];
          const inSet = ((word >>> (binVal & 31)) & 1) === 1;
          nodeIdx = inSet ? node.left : node.right;
        } else {
          nodeIdx = (binVal <= node.bin_threshold) ? node.left : node.right;
        }
      } else {
        nodeIdx = (binVal <= node.bin_threshold) ? node.left : node.right;
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

  test('searchSortedLeft implements exact np.searchsorted(side="left") semantics', () => {
    const thresholds = [10.0, 20.0, 30.0, 40.0, 50.0];
    assert.equal(searchSortedLeft(thresholds, 5.0), 0);
    assert.equal(searchSortedLeft(thresholds, 10.0), 0);
    assert.equal(searchSortedLeft(thresholds, 15.0), 1);
    assert.equal(searchSortedLeft(thresholds, 20.0), 1);
    assert.equal(searchSortedLeft(thresholds, 50.0), 4);
    assert.equal(searchSortedLeft(thresholds, 60.0), 5);
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
    const failures = [];

    // Diagnostic on Sample 0
    const s0 = fixtures['7 Days'][0];
    const m0 = treeArtifact['7 Days'];
    const tsDelta0 = predictDeltaFromTreeEnsemble(m0, s0.feature_vector);
    console.log(`\n--- DIAGNOSTIC: 7 Days Sample 0 (${s0.crop}) ---`);
    console.log(`TS Delta: ${tsDelta0}`);
    console.log(`Sklearn Delta: ${s0.expected_delta}`);
    console.log(`Diff: ${Math.abs(tsDelta0 - s0.expected_delta)}`);

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

        const tsPredictedPrice = sample.current_price + tsPredictedDelta;
        const priceDiff = Math.abs(tsPredictedPrice - sample.expected_price);

        if (diff >= 1e-4 || priceDiff >= 1e-4) {
          failures.push({
            horizon: h,
            index: i,
            crop: sample.crop,
            tsPredictedDelta,
            expectedDelta,
            diff,
            priceDiff
          });
        }

        totalCasesTested++;
      }
    }

    console.log(`\n--- PARITY SUMMARY ---`);
    console.log(`Total fixtures tested: ${totalCasesTested}`);
    console.log(`Max absolute difference: ${maxAbsDiff.toExponential(6)}`);
    console.log(`Failures count: ${failures.length}`);
    if (failures.length > 0) {
      console.log('Failed fixtures:');
      for (const f of failures) {
        console.log(`  [${f.horizon} #${f.index} ${f.crop}]: TS=${f.tsPredictedDelta}, Sklearn=${f.expectedDelta}, Diff=${f.diff}`);
      }
    }

    assert.equal(failures.length, 0, `${failures.length} fixtures failed parity (< 1e-4):\n` +
      failures.map(f => `  [${f.horizon} #${f.index} ${f.crop}]: Diff=${f.diff}`).join('\n')
    );
    assert.ok(totalCasesTested >= 60, `Must have tested at least 60 fixtures (tested ${totalCasesTested})`);
    assert.ok(maxAbsDiff < 1e-4, `Max absolute diff must be < 1e-4 (was ${maxAbsDiff.toExponential(4)})`);
  });
});
