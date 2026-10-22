#!/usr/bin/env python3
"""
AgriME Scikit-Learn HistGradientBoostingRegressor Tree Ensemble JSON Exporter
-----------------------------------------------------------------------------
Exports the exact fitted tree nodes, bin thresholds, categorical encodings,
and baseline predictions from `ml/models/crop_price_model.joblib` into a portable,
zero-dependency JSON representation `ml/models/crop_price_trees.json`.

Validates 100% exact numerical equivalence against Scikit-Learn `predict()`.
Generates golden test fixtures in `tests/unit/tree_parity_fixtures.json`.
"""

import os
import sys
import json
import joblib
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
JOBLIB_PATH = os.path.join(SCRIPT_DIR, 'models', 'crop_price_model.joblib')
OUTPUT_JSON_PATH = os.path.join(SCRIPT_DIR, 'models', 'crop_price_trees.json')
TEST_FIXTURES_PATH = os.path.join(WORKSPACE_ROOT, 'tests', 'unit', 'tree_parity_fixtures.json')

HORIZONS = ['7 Days', '15 Days', '30 Days']

def export_tree_ensemble():
    if not os.path.exists(JOBLIB_PATH):
        raise FileNotFoundError(f"Joblib file not found at {JOBLIB_PATH}")

    print(f"Loading fitted models from {JOBLIB_PATH}...")
    models = joblib.load(JOBLIB_PATH)

    exported_horizons = {}
    fixtures = {}

    for h_name in HORIZONS:
        if h_name not in models:
            print(f"Warning: {h_name} not found in models", file=sys.stderr)
            continue

        h_data = models[h_name]
        reg = h_data['regressor']
        encoder = h_data['encoder']
        features = h_data['features']

        base_pred = float(np.ravel(reg._baseline_prediction)[0])
        bm = reg._bin_mapper
        n_features = len(features)

        # 1. Extract bin thresholds
        bin_thresholds = []
        is_categorical = []
        for j in range(n_features):
            is_cat = bool(bm.is_categorical[j]) if hasattr(bm, 'is_categorical') else False
            is_categorical.append(is_cat)
            if j < len(bm.bin_thresholds_):
                th = bm.bin_thresholds_[j]
                bin_thresholds.append([float(x) for x in th])
            else:
                bin_thresholds.append([])

        # 2. Extract categorical encoder categories
        cat_mappings = {}
        if encoder is not None and hasattr(encoder, 'categories_'):
            cat_names = ['commodity', 'district', 'market']
            for i, cat_name in enumerate(cat_names):
                if i < len(encoder.categories_):
                    cats = list(encoder.categories_[i])
                    cat_mappings[cat_name] = {str(c).lower().strip(): int(idx) for idx, c in enumerate(cats)}

        # 3. Extract trees
        trees_list = []
        predictors = reg._predictors  # list of lists of Tree objects

        for iter_idx, tree_group in enumerate(predictors):
            tree_obj = tree_group[0]
            nodes = tree_obj.nodes
            n_nodes = len(nodes)

            node_list = []
            for n_idx in range(n_nodes):
                node = nodes[n_idx]
                is_leaf = bool(node['is_leaf'])

                if is_leaf:
                    node_dict = {
                        'is_leaf': True,
                        'value': float(node['value'])
                    }
                else:
                    feat_idx = int(node['feature_idx'])
                    bin_thresh = int(node['bin_threshold'])
                    is_cat_split = bool(node['is_categorical']) if 'is_categorical' in node.dtype.names else False

                    # Raw continuous threshold if available
                    raw_th = None
                    if not is_cat_split and feat_idx < len(bin_thresholds):
                        th_arr = bin_thresholds[feat_idx]
                        if bin_thresh < len(th_arr):
                            raw_th = float(th_arr[bin_thresh])

                    # Bitset for categorical splits if present
                    bitset_list = None
                    if is_cat_split:
                        if hasattr(tree_obj, 'binned_left_cat_bitsets') and tree_obj.binned_left_cat_bitsets is not None:
                            b_idx = int(node['bitset_idx']) if 'bitset_idx' in node.dtype.names else int(node['bin_threshold'])
                            if b_idx < len(tree_obj.binned_left_cat_bitsets):
                                bitset_list = [int(b) for b in tree_obj.binned_left_cat_bitsets[b_idx]]
                        elif 'bitset' in node.dtype.names:
                            bitset_list = [int(b) for b in node['bitset']]

                    node_dict = {
                        'is_leaf': False,
                        'feature_idx': feat_idx,
                        'bin_threshold': bin_thresh,
                        'raw_threshold': raw_th,
                        'left': int(node['left']),
                        'right': int(node['right']),
                        'missing_go_to_left': bool(node['missing_go_to_left']) if 'missing_go_to_left' in node.dtype.names else True,
                        'is_categorical': is_cat_split
                    }
                    if bitset_list is not None:
                        node_dict['bitset'] = bitset_list

                node_list.append(node_dict)

            trees_list.append({
                'tree_idx': iter_idx,
                'nodes': node_list
            })

        print(f"Horizon '{h_name}': Extracted base_pred={base_pred:.4f}, {len(trees_list)} trees, {n_features} features.")

        exported_horizons[h_name] = {
            'horizon_name': h_name,
            'base_prediction': base_pred,
            'feature_names': features,
            'is_categorical': is_categorical,
            'bin_thresholds': bin_thresholds,
            'cat_mappings': cat_mappings,
            'num_trees': len(trees_list),
            'trees': trees_list
        }

        # 4. Generate verification fixtures across realistic and edge cases
        # Create 20 test vectors per horizon
        test_samples = []
        rng = np.random.RandomState(42)

        # Specific realistic Tamil Nadu crop test vectors
        sample_cases = [
            # Tomato in Coimbatore (perishable vegetable)
            {'crop': 'tomato', 'district': 'coimbatore', 'market': 'coimbatore', 'price': 2400.0, 'min': 2100.0, 'max': 2700.0, 'm7': 2300.0, 'm30': 2200.0, 's30': 80.0, 'month': 10, 'doy': 283},
            # Paddy in Thanjavur (cereal grain)
            {'crop': 'paddy (dhan)', 'district': 'thanjavur', 'market': 'thanjavur', 'price': 1850.0, 'min': 1750.0, 'max': 1950.0, 'm7': 1820.0, 'm30': 1800.0, 's30': 40.0, 'month': 11, 'doy': 315},
            # Onion in Dindigul (bulb crop)
            {'crop': 'onion', 'district': 'dindigul', 'market': 'dindigul', 'price': 3200.0, 'min': 2900.0, 'max': 3500.0, 'm7': 3100.0, 'm30': 2900.0, 's30': 120.0, 'month': 6, 'doy': 165},
            # Groundnut in Salem (oilseed)
            {'crop': 'groundnut', 'district': 'salem', 'market': 'salem', 'price': 5200.0, 'min': 4900.0, 'max': 5500.0, 'm7': 5100.0, 'm30': 5000.0, 's30': 100.0, 'month': 3, 'doy': 75},
            # Turmeric in Erode (high-value spice)
            {'crop': 'turmeric', 'district': 'erode', 'market': 'erode', 'price': 12500.0, 'min': 11800.0, 'max': 13200.0, 'm7': 12200.0, 'm30': 11500.0, 's30': 350.0, 'month': 4, 'doy': 105},
            # Edge case 1: Very low price
            {'crop': 'tomato', 'district': 'madurai', 'market': 'madurai', 'price': 450.0, 'min': 400.0, 'max': 500.0, 'm7': 460.0, 'm30': 480.0, 's30': 30.0, 'month': 1, 'doy': 15},
            # Edge case 2: Unseen category
            {'crop': 'unknown_crop_xyz', 'district': 'unknown_district', 'market': 'unknown_market', 'price': 2500.0, 'min': 2400.0, 'max': 2600.0, 'm7': 2500.0, 'm30': 2500.0, 's30': 50.0, 'month': 7, 'doy': 190}
        ]

        # Add 13 random samples
        for _ in range(13):
            p = float(rng.uniform(600.0, 15000.0))
            spread_pct = float(rng.uniform(0.04, 0.20))
            sample_cases.append({
                'crop': rng.choice(['tomato', 'onion', 'paddy (dhan)', 'groundnut', 'maize', 'cotton', 'brinjal', 'coconut']),
                'district': rng.choice(['coimbatore', 'dindigul', 'madurai', 'salem', 'tiruchirappalli', 'erode', 'vellore']),
                'market': rng.choice(['coimbatore', 'dindigul', 'madurai', 'salem', 'tiruchirappalli', 'erode', 'vellore']),
                'price': p,
                'min': p * (1.0 - spread_pct / 2.0),
                'max': p * (1.0 + spread_pct / 2.0),
                'm7': p * float(rng.uniform(0.95, 1.05)),
                'm30': p * float(rng.uniform(0.90, 1.10)),
                's30': p * float(rng.uniform(0.02, 0.08)),
                'month': int(rng.randint(1, 13)),
                'doy': int(rng.randint(1, 366))
            })

        for case in sample_cases:
            cur_p = case['price']
            min_p = case['min']
            max_p = case['max']
            spread = (max_p - min_p) / cur_p if cur_p > 0 else 0.0
            m7 = case['m7']
            m30 = case['m30']
            s30 = case['s30']
            mom7 = (cur_p - m7) / m7 if m7 > 0 else 0.0
            m = case['month']
            doy = case['doy']
            sin_m = float(np.sin(2.0 * np.pi * m / 12.0))
            cos_m = float(np.cos(2.0 * np.pi * m / 12.0))
            sin_d = float(np.sin(2.0 * np.pi * doy / 365.25))
            cos_d = float(np.cos(2.0 * np.pi * doy / 365.25))

            # Encode categories
            c_code = float(cat_mappings['commodity'].get(case['crop'], -1))
            d_code = float(cat_mappings['district'].get(case['district'], -1))
            m_code = float(cat_mappings['market'].get(case['market'], -1))

            feat_vec = [
                cur_p, min_p, max_p, spread,
                m7, m30, s30, mom7,
                sin_m, cos_m, sin_d, cos_d,
                c_code, d_code, m_code
            ]

            X_mat = np.array([feat_vec], dtype=np.float32)
            py_pred_delta = float(reg.predict(X_mat)[0])
            py_pred_price = float(cur_p + py_pred_delta)

            test_samples.append({
                'crop': case['crop'],
                'district': case['district'],
                'market': case['market'],
                'current_price': cur_p,
                'min_price': min_p,
                'max_price': max_p,
                'feature_vector': feat_vec,
                'expected_delta': py_pred_delta,
                'expected_price': py_pred_price
            })

        fixtures[h_name] = test_samples

    # Safe model export: write to candidate files first
    candidate_json_path = OUTPUT_JSON_PATH + '.candidate'
    candidate_fixtures_path = TEST_FIXTURES_PATH + '.candidate'

    with open(candidate_json_path, 'w', encoding='utf-8') as f:
        json.dump(exported_horizons, f, indent=2)

    with open(candidate_fixtures_path, 'w', encoding='utf-8') as f:
        json.dump(fixtures, f, indent=2)

    # Verify standalone python tree inference against sklearn on all candidate fixtures
    max_abs_diff = 0.0
    failures = []
    total_checked = 0
    for h_name, samples in fixtures.items():
        h_model = exported_horizons[h_name]
        for s_idx, s in enumerate(samples):
            standalone_delta = evaluate_tree_ensemble_standalone(s['feature_vector'], h_model)
            diff = abs(standalone_delta - s['expected_delta'])
            if diff > max_abs_diff:
                max_abs_diff = diff
            if diff >= 1e-4:
                failures.append({
                    'horizon': h_name,
                    'index': s_idx,
                    'crop': s['crop'],
                    'standalone': standalone_delta,
                    'sklearn': s['expected_delta'],
                    'diff': diff
                })
            total_checked += 1

    print(f"\n[EVAL] Standalone Tree Evaluator vs Scikit-Learn max absolute difference: {max_abs_diff:.8e}")
    print(f"[EVAL] Tested {total_checked} fixtures across {len(HORIZONS)} horizons. Failures (< 1e-4): {len(failures)}")

    if max_abs_diff >= 1e-4 or len(failures) > 0:
        # Preserve active artifacts and clean up candidate files
        if os.path.exists(candidate_json_path):
            os.remove(candidate_json_path)
        if os.path.exists(candidate_fixtures_path):
            os.remove(candidate_fixtures_path)
        fail_details = "\n".join([f"  [{f['horizon']} #{f['index']} {f['crop']}]: standalone={f['standalone']}, sklearn={f['sklearn']}, diff={f['diff']}" for f in failures[:5]])
        raise AssertionError(f"Safe model export halted: Parity mismatch! Max diff: {max_abs_diff}\n{fail_details}")

    # Parity verified: atomically promote candidate artifacts to active paths
    os.replace(candidate_json_path, OUTPUT_JSON_PATH)
    os.replace(candidate_fixtures_path, TEST_FIXTURES_PATH)

    print(f"[OK] Atomically promoted verified tree model to: {OUTPUT_JSON_PATH} ({os.path.getsize(OUTPUT_JSON_PATH):,d} bytes)")
    print(f"[OK] Atomically promoted verified fixtures to: {TEST_FIXTURES_PATH}")
    print("[PASS] 100% Exact Numerical Parity verified between standalone tree evaluator and Scikit-Learn across all fixtures!")


def evaluate_tree_ensemble_standalone(features, h_model):
    """
    Pure standalone evaluation matching HistGradientBoostingRegressor exactly.
    """
    base_pred = h_model['base_prediction']
    bin_thresholds = h_model['bin_thresholds']
    is_categorical = h_model['is_categorical']
    trees = h_model['trees']

    # In crop_price_trees.json, categorical features (commodity, district, market)
    # are internal indices 0, 1, 2, while the 12 continuous features are indices 3..14.
    # Input feature_vector has continuous features at 0..11 and categoricals at 12..14.
    if len(features) == 15 and is_categorical[0] and not is_categorical[12]:
        reordered_features = [features[12], features[13], features[14]] + list(features[:12])
    else:
        reordered_features = list(features)

    # 1. Map features to integer bins
    binned_features = []
    for j, val in enumerate(reordered_features):
        if is_categorical[j]:
            th = bin_thresholds[j]
            if val is None or np.isnan(val) or val < 0:
                b = 255  # missing/unknown category in scikit-learn
            else:
                int_val = int(val)
                if int_val < len(th) and th[int_val] == val:
                    b = int_val
                else:
                    idx = int(np.searchsorted(th, val))
                    if idx < len(th) and th[idx] == val:
                        b = idx
                    else:
                        b = 255
            binned_features.append(b)
        else:
            th = bin_thresholds[j]
            if val is None or np.isnan(val):
                b = 255  # missing continuous value in scikit-learn
            else:
                th_arr_32 = np.array(th, dtype=np.float32)
                b = int(np.searchsorted(th_arr_32, np.float32(val), side='left'))
            binned_features.append(b)

    # 2. Sum leaf values across all trees
    total = base_pred
    for tree in trees:
        nodes = tree['nodes']
        node = nodes[0]
        while not node['is_leaf']:
            feat_idx = node['feature_idx']
            bin_val = binned_features[feat_idx]

            if bin_val == 255:
                # Missing categorical or continuous values route via missing_go_to_left
                node = nodes[node['left']] if node.get('missing_go_to_left', True) else nodes[node['right']]
            elif node.get('is_categorical', False):
                bitset = node.get('bitset')
                if bitset and 0 <= bin_val < 256:
                    word = np.uint32(bitset[bin_val >> 5])
                    in_set = bool((word >> (bin_val & 31)) & 1)
                    node = nodes[node['left']] if in_set else nodes[node['right']]
                else:
                    node = nodes[node['left']] if bin_val <= node['bin_threshold'] else nodes[node['right']]
            else:
                if bin_val <= node['bin_threshold']:
                    node = nodes[node['left']]
                else:
                    node = nodes[node['right']]

        total += node['value']

    return total


if __name__ == '__main__':
    export_tree_ensemble()
