#!/usr/bin/env python3
"""
Inspect Scikit-Learn HistGradientBoostingRegressor internal tree structures in crop_price_model.joblib
"""

import os
import sys
import joblib
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JOBLIB_PATH = os.path.join(SCRIPT_DIR, 'models', 'crop_price_model.joblib')

def inspect_joblib():
    if not os.path.exists(JOBLIB_PATH):
        print(f"Error: {JOBLIB_PATH} not found", file=sys.stderr)
        return

    models = joblib.load(JOBLIB_PATH)
    print(f"Loaded joblib with keys: {list(models.keys())}")

    for h_name, h_data in models.items():
        reg = h_data['regressor']
        encoder = h_data['encoder']
        features = h_data['features']
        print(f"\n=======================================================")
        print(f"Horizon: {h_name}")
        print(f"Estimator type: {type(reg).__name__}")
        print(f"Features ({len(features)}): {features}")
        print(f"Base prediction (intercept): {reg._baseline_prediction}")
        print(f"Number of iterations (trees): {len(reg._predictors)}")

        # Inspect tree 0
        tree0 = reg._predictors[0][0]
        print(f"Tree 0 node dtype: {tree0.nodes.dtype}")
        print(f"Tree 0 node count: {len(tree0.nodes)}")
        print(f"Tree 0 first 3 nodes:\n{tree0.nodes[:3]}")

        # Check bin mapper
        bm = reg._bin_mapper
        print(f"Bin mapper n_bins: {bm.n_bins}")
        print(f"Bin mapper bin_thresholds length: {len(bm.bin_thresholds_)}")
        for i, th in enumerate(bm.bin_thresholds_):
            print(f"  Feature {i} ({features[i]}): {len(th)} bin thresholds, min={th[0] if len(th)>0 else 'N/A'}, max={th[-1] if len(th)>0 else 'N/A'}")

        # Test predict with a dummy vector
        test_X = np.zeros((1, len(features)), dtype=np.float32)
        test_X[0, 0] = 2400.0 # current_price
        test_X[0, 1] = 2200.0 # min_price
        test_X[0, 2] = 2600.0 # max_price
        test_X[0, 3] = 0.1667 # spread
        test_X[0, 4] = 2350.0 # roll_mean_7d
        test_X[0, 5] = 2300.0 # roll_mean_30d
        test_X[0, 6] = 80.0   # roll_std_30d
        test_X[0, 7] = 0.021  # momentum_7d
        test_X[0, 8] = -0.866 # sin_month
        test_X[0, 9] = -0.5   # cos_month
        test_X[0, 10] = 0.33  # sin_doy
        test_X[0, 11] = 0.94  # cos_doy
        test_X[0, 12] = 0.0   # commodity_enc
        test_X[0, 13] = 0.0   # district_enc
        test_X[0, 14] = 0.0   # market_enc

        pred = reg.predict(test_X)
        print(f"Dummy sample predicted delta: {pred[0]}")

if __name__ == '__main__':
    inspect_joblib()
