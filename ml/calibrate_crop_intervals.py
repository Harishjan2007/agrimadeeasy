#!/usr/bin/env python3
"""
AgriME Crop-Specific Prediction Interval Calibration & Evaluation Pipeline
----------------------------------------------------------------------------
Implements Split-Conformal Empirical Quantile Calibration on genuine Tamil Nadu
mandi historical trading observations (2001-2026).

Principles & Integrity Guarantees:
1. Strict Chronological Split (Zero Leakage):
   - Training Set:   2001-11-20 to 2023-12-02 (targets <= 2023-12-31)
   - Validation Set: 2024-01-01 to 2024-12-04 (used SOLELY for residual calibration)
   - Test Benchmark: 2025-01-01 to 2026-03-24 (strictly held out, used ONLY for final evaluation)
2. No Gaussian Distribution Assumption:
   - Evaluates empirical quantiles of non-conformity scores (absolute & percentage residuals).
   - Accounts for leptokurtosis, heavy tails, and price-scale heteroskedasticity.
3. Hierarchical Fallback Strategy:
   - Tier 1: Crop-specific empirical validation quantile (if N_val >= 100)
   - Tier 2: Commodity-group pooled validation quantile (if 10 <= N_val < 100)
   - Tier 3: Global horizon validation quantile fallback (if N_val < 10 or unknown)
4. Out-of-Sample Test Evaluation:
   - Computes exact covered observations, total evaluated, empirical coverage percentage,
     and mean interval width across 7-day, 15-day, and 30-day forecast horizons.
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(SCRIPT_DIR, 'data', 'processed')
CLEAN_DATA_PATH = os.path.join(PROCESSED_DIR, 'tamil_nadu_cleaned.csv')
CALIBRATION_OUTPUT_JSON = os.path.join(SCRIPT_DIR, 'models', 'crop_interval_calibration.json')

HORIZONS = [
    {'name': '7 Days', 'days': 7, 'tolerance': 1},
    {'name': '15 Days', 'days': 15, 'tolerance': 2},
    {'name': '30 Days', 'days': 30, 'tolerance': 3}
]

COMMODITY_GROUPS = {
    'Cereals & Millets': [
        'paddy (dhan)', 'paddy (common)', 'paddy (basmati)', 'rice', 'maize',
        'bajra (pearl millet/cumbu)', 'ragi (finger millet)', 'jowar (sorghum)', 'wheat',
        'foxtail millet (navane)', 'kodo millet (varagu)', 'thinai (italian millet)',
        'hybrid cumbu', 't.v. cumbu', 'millets', 'beaten rice', 'same/savi'
    ],
    'Vegetables': [
        'tomato', 'onion', 'onion (green)', 'brinjal', 'ladies finger (bhendi)',
        'green chilli', 'bottle gourd', 'bitter gourd', 'snakeguard', 'ridgeguard (tori)',
        'cabbage', 'cauliflower', 'carrot', 'beetroot', 'radish', 'potato', 'beans',
        'capsicum', 'chilly capsicum', 'cluster beans', 'chow chow', 'knool khol',
        'cucumber', 'pumpkin', 'ashgourd', 'sweet pumpkin', 'sweet potato', 'drumstick',
        'coriander (leaves)', 'mint (pudina)', 'amaranthus', 'leafy vegetable',
        'elephant yam (suran)', 'yam', 'tapioca', 'colacasia', 'turnip'
    ],
    'Pulses': [
        'black gram (urad)', 'black gram dal (urd dal)', 'green gram (moong)',
        'green gram dal (moong dal)', 'bengal gram (chana)', 'bengal gram dal (chana dal)',
        'arhar (tur/red gram)(whole)', 'arhar dal (tur dal)', 'red gram', 'cowpea',
        'cowpea (lobia/karamani)', 'karamani', 'kulthi (horse gram)', 'green peas',
        'peas wet', 'avare dal', 'green avare (w)', 'indian beans (seam)', 'big gram', 'other pulses'
    ],
    'Oilseeds': [
        'groundnut', 'groundnut (split)', 'groundnut seed', 'groundnut pods (raw)',
        'sesamum (sesame,gingelly,til)', 'castor seed', 'sunflower', 'sunflower seed',
        'mustard', 'soyabean', 'neem seed', 'ground nut oil', 'gingelly oil'
    ],
    'Commercial Crops': [
        'cotton', 'cotton seed', 'sugarcane', 'coconut', 'tender coconut',
        'coconut seed', 'copra', 'tobacco', 'rubber', 'cane', 'gur (jaggery)'
    ],
    'Spices & Plantation': [
        'turmeric', 'cardamoms', 'black pepper', 'dry chillies', 'chili red',
        'garlic', 'ginger (green)', 'ginger (dry)', 'corriander seed', 'tamarind fruit',
        'tamarind seed', 'betal leaves', 'arecanut (betelnut/supari)', 'cashew kernnel',
        'cashewnuts', 'coffee'
    ],
    'Fruits': [
        'banana', 'banana (green)', 'balekai', 'mango', 'mango (raw-ripe)', 'grapes',
        'papaya', 'guava', 'lemon', 'lime', 'orange', 'mousambi (sweet lime)', 'apple',
        'pomegranate', 'water melon', 'karbuja (musk melon)', 'pineapple',
        'chikoos (sapota)', 'custard apple (sharifa)', 'seetapal', 'jack fruit',
        'jamun (narale hannu)', 'amla (nelli kai)', 'nelli kai', 'pear (marasebu)', 'kinnow'
    ]
}

# Reverse lookup for commodity -> group
COMMODITY_TO_GROUP = {}
for grp, items in COMMODITY_GROUPS.items():
    for it in items:
        COMMODITY_TO_GROUP[it.lower().strip()] = grp


def get_commodity_group(crop_name):
    c = str(crop_name).lower().strip()
    return COMMODITY_TO_GROUP.get(c, 'Other / Unclassified')


def load_data(smoke_test=False):
    if not os.path.exists(CLEAN_DATA_PATH):
        raise FileNotFoundError(f"Missing dataset at {CLEAN_DATA_PATH}")

    usecols = [
        'state', 'district', 'market', 'commodity', 'variety', 'grade',
        'arrival_date', 'year', 'month', 'day', 'min_price', 'max_price', 'modal_price'
    ]
    dtypes = {
        'state': 'category', 'district': 'string', 'market': 'string', 'commodity': 'string',
        'variety': 'string', 'grade': 'string', 'arrival_date': 'string',
        'year': 'int16', 'month': 'int8', 'day': 'int8',
        'min_price': 'float32', 'max_price': 'float32', 'modal_price': 'float32'
    }

    if smoke_test:
        top_crops = {
            'Paddy (Dhan)', 'Tomato', 'Onion', 'Groundnut', 'Maize',
            'Ladies Finger (Bhendi)', 'Green Chilli', 'Brinjal', 'Coconut',
            'Banana (Green)', 'Cotton', 'Turmeric', 'Cardamoms', 'Black Gram (Urad)'
        }
        top_districts = {
            'Coimbatore', 'Dindigul', 'Madurai', 'Salem', 'Tiruchirappalli',
            'Erode', 'Vellore', 'Thanjavur', 'Villupuram', 'Tirunelveli',
            'Cuddalore', 'Theni', 'Dharmapuri', 'Kancheepuram', 'Tiruppur'
        }
        chunks = []
        for chunk in pd.read_csv(CLEAN_DATA_PATH, usecols=usecols, dtype=dtypes, chunksize=100000):
            filtered = chunk[
                chunk['commodity'].isin(top_crops) &
                chunk['district'].isin(top_districts)
            ]
            if len(filtered) > 0:
                chunks.append(filtered.iloc[::3])
        df = pd.concat(chunks, ignore_index=True)
    else:
        df = pd.read_csv(CLEAN_DATA_PATH, usecols=usecols, dtype=dtypes)

    df = df[(df['modal_price'] > 0) & (df['modal_price'] <= 100000.0) &
            (df['min_price'] > 0) & (df['max_price'] > 0)]
    df['commodity'] = df['commodity'].str.strip()
    df['district'] = df['district'].str.strip()
    df['market'] = df['market'].str.strip()
    df['dt'] = pd.to_datetime(df['arrival_date'], format='%Y-%m-%d')
    base_date = pd.Timestamp('2000-01-01')
    df['day_int'] = (df['dt'] - base_date).dt.days.astype('int32')
    df['day_of_year'] = df['dt'].dt.dayofyear.astype('int16')
    df.sort_values(by=['commodity', 'market', 'day_int'], inplace=True, ignore_index=True)
    return df


def extract_features(df, h_cfg):
    h_days = h_cfg['days']
    tol = h_cfg['tolerance']

    commodities = df['commodity'].values
    districts = df['district'].values
    markets = df['market'].values
    day_ints = df['day_int'].values
    modal_prices = df['modal_price'].values
    min_prices = df['min_price'].values
    max_prices = df['max_price'].values
    years = df['year'].values
    months = df['month'].values
    doys = df['day_of_year'].values
    dates = df['arrival_date'].values
    n_total = len(df)

    feature_rows = []
    target_prices = []
    current_prices = []
    record_years = []
    record_months = []
    record_dates = []
    record_day_ints = []
    record_target_day_ints = []
    record_commodities = []
    record_districts = []
    record_markets = []

    group_splits = np.where((commodities[:-1] != commodities[1:]) | (markets[:-1] != markets[1:]))[0] + 1
    group_starts = np.concatenate(([0], group_splits))
    group_ends = np.concatenate((group_splits, [n_total]))

    for g_start, g_end in zip(group_starts, group_ends):
        g_len = g_end - g_start
        if g_len < 2:
            continue

        g_days = day_ints[g_start:g_end]
        g_modal = modal_prices[g_start:g_end]
        g_min = min_prices[g_start:g_end]
        g_max = max_prices[g_start:g_end]

        for i in range(g_len):
            cur_day = g_days[i]
            cur_price = g_modal[i]
            cur_min = g_min[i]
            cur_max = g_max[i]

            # Lookahead search strictly bounded
            target_low = cur_day + h_days - tol
            target_high = cur_day + h_days + tol
            idx_low = np.searchsorted(g_days, target_low, side='left')
            idx_high = np.searchsorted(g_days, target_high, side='right')

            if idx_high <= idx_low:
                continue

            target_idx = idx_low + (idx_high - idx_low) // 2
            target_p = g_modal[target_idx]
            target_d = g_days[target_idx]

            # Past-only lookback
            start_7 = np.searchsorted(g_days, cur_day - 7, side='left')
            start_30 = np.searchsorted(g_days, cur_day - 30, side='left')
            end_past = np.searchsorted(g_days, cur_day, side='left')

            roll_mean_7 = float(np.mean(g_modal[start_7:end_past])) if end_past > start_7 else cur_price
            if end_past > start_30:
                roll_mean_30 = float(np.mean(g_modal[start_30:end_past]))
                roll_std_30 = float(np.std(g_modal[start_30:end_past])) if end_past - start_30 >= 2 else float((cur_max - cur_min) / 4.0)
            else:
                roll_mean_30 = cur_price
                roll_std_30 = float((cur_max - cur_min) / 4.0)

            spread = float((cur_max - cur_min) / cur_price) if cur_price > 0 else 0.0
            momentum_7 = float((cur_price - roll_mean_7) / roll_mean_7) if roll_mean_7 > 0 else 0.0

            m = months[g_start + i]
            doy = doys[g_start + i]
            sin_m = float(np.sin(2.0 * np.pi * m / 12.0))
            cos_m = float(np.cos(2.0 * np.pi * m / 12.0))
            sin_doy = float(np.sin(2.0 * np.pi * doy / 365.25))
            cos_doy = float(np.cos(2.0 * np.pi * doy / 365.25))

            feature_rows.append([
                cur_price, cur_min, cur_max, spread,
                roll_mean_7, roll_mean_30, roll_std_30, momentum_7,
                sin_m, cos_m, sin_doy, cos_doy
            ])
            target_prices.append(target_p)
            current_prices.append(cur_price)
            record_years.append(years[g_start + i])
            record_months.append(m)
            record_dates.append(dates[g_start + i])
            record_day_ints.append(cur_day)
            record_target_day_ints.append(target_d)
            record_commodities.append(commodities[g_start + i])
            record_districts.append(districts[g_start + i])
            record_markets.append(markets[g_start + i])

    feat_cols = [
        'current_price', 'min_price', 'max_price', 'spread',
        'roll_mean_7d', 'roll_mean_30d', 'roll_std_30d', 'momentum_7d',
        'sin_month', 'cos_month', 'sin_doy', 'cos_doy'
    ]
    feats_df = pd.DataFrame(feature_rows, columns=feat_cols, dtype=np.float32)

    cat_df = pd.DataFrame({
        'commodity': record_commodities, 'district': record_districts, 'market': record_markets
    })
    encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
    encoded_cats = encoder.fit_transform(cat_df)
    feats_df['commodity_enc'] = encoded_cats[:, 0].astype(np.float32)
    feats_df['district_enc'] = encoded_cats[:, 1].astype(np.float32)
    feats_df['market_enc'] = encoded_cats[:, 2].astype(np.float32)
    full_feat_cols = feat_cols + ['commodity_enc', 'district_enc', 'market_enc']

    metadata_df = pd.DataFrame({
        'day_int': record_day_ints,
        'target_day_int': record_target_day_ints,
        'date': record_dates,
        'year': record_years,
        'commodity': record_commodities,
        'district': record_districts,
        'market': record_markets,
        'current_price': current_prices,
        'target_price': target_prices
    })

    # Sort strictly chronologically
    sort_idx = np.argsort(metadata_df['day_int'].values)
    feats_df = feats_df.iloc[sort_idx].reset_index(drop=True)
    target_prices_arr = np.array(target_prices, dtype=np.float32)[sort_idx]
    metadata_df = metadata_df.iloc[sort_idx].reset_index(drop=True)

    base_date = pd.Timestamp('2000-01-01')
    train_cutoff_day = (pd.Timestamp('2023-12-31') - base_date).days
    val_cutoff_day = (pd.Timestamp('2024-12-31') - base_date).days
    test_start_day = (pd.Timestamp('2025-01-01') - base_date).days

    f_days = metadata_df['day_int'].values
    t_days = metadata_df['target_day_int'].values

    train_idx = np.where(t_days <= train_cutoff_day)[0]
    val_idx = np.where((f_days > train_cutoff_day) & (t_days <= val_cutoff_day))[0]
    test_idx = np.where(f_days >= test_start_day)[0]

    return feats_df, full_feat_cols, target_prices_arr, metadata_df, train_idx, val_idx, test_idx


def calibrate_and_evaluate(smoke_test=False, horizon_choice='all'):
    print("=" * 75)
    print("🌾 AgriME Empirical Prediction Interval Calibration & Evaluation")
    print(f"Mode: {'Smoke-Test Slice' if smoke_test else 'Full Historical Dataset (4.5M rows)'}")
    print(f"Target Horizon: {horizon_choice}")
    print("[NOTE] Candidate Calibration Pipeline: Evaluates empirical quantiles on validation residuals.")
    print("[LIMITATION] Candidate model differs from production trees (ml/models/crop_price_trees.json).")
    print("             These margins are candidate evaluation metrics, NOT deployed to production.")
    print("=" * 75)

    # Protect current artifact by ensuring backup before any modification
    if os.path.exists(CALIBRATION_OUTPUT_JSON):
        backup_path = CALIBRATION_OUTPUT_JSON + '.bak_20261021_full7d'
        if not os.path.exists(backup_path):
            import shutil
            shutil.copy2(CALIBRATION_OUTPUT_JSON, backup_path)
            print(f"📦 Preserved existing calibration backup: {backup_path}")

    df = load_data(smoke_test=smoke_test)
    full_calibration_results = {}

    horizon_map = {
        '7': '7 Days', '7 Days': '7 Days',
        '15': '15 Days', '15 Days': '15 Days',
        '30': '30 Days', '30 Days': '30 Days'
    }
    target_horizons = HORIZONS
    if horizon_choice and str(horizon_choice).lower() != 'all':
        target_name = horizon_map.get(str(horizon_choice), str(horizon_choice))
        target_horizons = [h for h in HORIZONS if h['name'] == target_name]
        if not target_horizons:
            print(f"[ERROR] Unknown horizon '{horizon_choice}'. Options: 'all', '7 Days', '15 Days', '30 Days'", file=sys.stderr)
            return {}

    for h_cfg in target_horizons:
        h_name = h_cfg['name']
        print(f"\n--- PROCESSING HORIZON: {h_name} ---")

        feats_df, full_feat_cols, target_prices_arr, metadata_df, train_idx, val_idx, test_idx = extract_features(df, h_cfg)

        print(f"Partitions: Train={len(train_idx):,d} | Val={len(val_idx):,d} | Held-Out Test={len(test_idx):,d}")

        if len(train_idx) == 0 or len(val_idx) == 0 or len(test_idx) == 0:
            print(f"Insufficient observations in splits for {h_name}, skipping.")
            continue

        cat_indices = [full_feat_cols.index('commodity_enc'), full_feat_cols.index('district_enc'), full_feat_cols.index('market_enc')]

        # Train model strictly on training data
        X_train = feats_df[full_feat_cols].iloc[train_idx]
        y_train_delta = target_prices_arr[train_idx] - metadata_df['current_price'].iloc[train_idx].values

        reg = HistGradientBoostingRegressor(
            loss='squared_error',
            max_iter=35 if smoke_test else 100,
            learning_rate=0.06,
            max_depth=7,
            min_samples_leaf=25,
            l2_regularization=0.2,
            categorical_features=cat_indices,
            random_state=42
        )
        reg.fit(X_train, y_train_delta)

        # 1. Evaluate strictly on Validation Partition (CALIBRATION ONLY)
        X_val = feats_df[full_feat_cols].iloc[val_idx]
        y_val_target = target_prices_arr[val_idx]
        curr_val = metadata_df['current_price'].iloc[val_idx].values
        val_pred = curr_val + reg.predict(X_val)
        val_residuals = y_val_target - val_pred
        val_abs_err = np.abs(val_residuals)
        val_rel_err = val_abs_err / np.maximum(50.0, curr_val)

        val_df = metadata_df.iloc[val_idx].copy()
        val_df['abs_err'] = val_abs_err
        val_df['rel_err'] = val_rel_err
        val_df['res'] = val_residuals
        val_df['commodity_clean'] = val_df['commodity'].str.lower().str.strip()
        val_df['group'] = val_df['commodity_clean'].apply(get_commodity_group)

        # Global validation quantiles (Tier 3 fallback)
        global_p90_margin = float(np.percentile(val_abs_err, 90))
        global_p95_margin = float(np.percentile(val_abs_err, 95))
        global_val_rmse = float(np.sqrt(np.mean(val_residuals ** 2)))
        global_val_mae = float(np.mean(val_abs_err))

        # Commodity Group validation quantiles (Tier 2 fallback)
        group_calibration = {}
        for grp, grp_rows in val_df.groupby('group'):
            if len(grp_rows) >= 10:
                p90 = float(np.percentile(grp_rows['abs_err'], 90))
                p95 = float(np.percentile(grp_rows['abs_err'], 95))
                g_rmse = float(np.sqrt(np.mean(grp_rows['res'] ** 2)))
                group_calibration[grp] = {
                    'val_samples': int(len(grp_rows)),
                    'val_rmse': round(g_rmse, 2),
                    'val_mae': round(float(grp_rows['abs_err'].mean()), 2),
                    'margin_90_inr': round(p90, 2),
                    'margin_95_inr': round(p95, 2),
                    'margin_90_pct': round(float(np.percentile(grp_rows['rel_err'], 90) * 100), 2)
                }

        # Crop-specific validation quantiles (Tier 1)
        crop_calibration = {}
        for crop, c_rows in val_df.groupby('commodity_clean'):
            c_samples = len(c_rows)
            grp = get_commodity_group(crop)
            if c_samples >= 100:
                p90 = float(np.percentile(c_rows['abs_err'], 90))
                p95 = float(np.percentile(c_rows['abs_err'], 95))
                c_rmse = float(np.sqrt(np.mean(c_rows['res'] ** 2)))
                c_mae = float(c_rows['abs_err'].mean())
                crop_calibration[crop] = {
                    'tier': 'crop_specific',
                    'val_samples': int(c_samples),
                    'group': grp,
                    'val_rmse': round(c_rmse, 2),
                    'val_mae': round(c_mae, 2),
                    'margin_90_inr': round(p90, 2),
                    'margin_95_inr': round(p95, 2),
                    'margin_90_pct': round(float(np.percentile(c_rows['rel_err'], 90) * 100), 2)
                }
            elif c_samples >= 10:
                # Group fallback
                grp_info = group_calibration.get(grp, {})
                crop_calibration[crop] = {
                    'tier': 'commodity_group_fallback',
                    'val_samples': int(c_samples),
                    'group': grp,
                    'val_rmse': grp_info.get('val_rmse', round(global_val_rmse, 2)),
                    'val_mae': grp_info.get('val_mae', round(global_val_mae, 2)),
                    'margin_90_inr': grp_info.get('margin_90_inr', round(global_p90_margin, 2)),
                    'margin_95_inr': grp_info.get('margin_95_inr', round(global_p95_margin, 2)),
                    'margin_90_pct': grp_info.get('margin_90_pct', 20.0)
                }
            else:
                # Global fallback
                crop_calibration[crop] = {
                    'tier': 'global_fallback',
                    'val_samples': int(c_samples),
                    'group': grp,
                    'val_rmse': round(global_val_rmse, 2),
                    'val_mae': round(global_val_mae, 2),
                    'margin_90_inr': round(global_p90_margin, 2),
                    'margin_95_inr': round(global_p95_margin, 2),
                    'margin_90_pct': 25.0
                }

        # 2. Evaluate Out-of-Sample on Untouched Test Partition
        X_test = feats_df[full_feat_cols].iloc[test_idx]
        y_test_target = target_prices_arr[test_idx]
        curr_test = metadata_df['current_price'].iloc[test_idx].values
        test_pred = curr_test + reg.predict(X_test)
        test_abs_err = np.abs(y_test_target - test_pred)

        test_df = metadata_df.iloc[test_idx].copy()
        test_df['abs_err'] = test_abs_err
        test_df['pred'] = test_pred
        test_df['target'] = y_test_target
        test_df['commodity_clean'] = test_df['commodity'].str.lower().str.strip()
        test_df['group'] = test_df['commodity_clean'].apply(get_commodity_group)

        # Compare: Current Global Staple Margin vs Proposed Calibrated Margins
        # Current staple margin from production metadata:
        current_global_margins = {'7 Days': 428.16, '15 Days': 613.09, '30 Days': 866.61}
        cur_margin = current_global_margins.get(h_name, 500.0)

        # Baseline evaluation with current global margin
        covered_cur_global = np.sum(test_abs_err <= cur_margin)
        pct_cur_global = (covered_cur_global / len(test_df)) * 100.0

        # Proposed calibrated evaluation (Vectorized with 3-tier fallback)
        crop_m90 = {c: float(v['margin_90_inr']) for c, v in crop_calibration.items()}
        crop_m95 = {c: float(v['margin_95_inr']) for c, v in crop_calibration.items()}
        grp_m90 = {g: float(v['margin_90_inr']) for g, v in group_calibration.items()}
        grp_m95 = {g: float(v['margin_95_inr']) for g, v in group_calibration.items()}

        m90_tier1 = test_df['commodity_clean'].map(crop_m90)
        m90_tier2 = test_df['group'].map(grp_m90)
        test_df['proposed_m90'] = m90_tier1.fillna(m90_tier2).fillna(global_p90_margin).astype(np.float64)

        m95_tier1 = test_df['commodity_clean'].map(crop_m95)
        m95_tier2 = test_df['group'].map(grp_m95)
        test_df['proposed_m95'] = m95_tier1.fillna(m95_tier2).fillna(global_p95_margin).astype(np.float64)

        test_df['cov_cur'] = test_df['abs_err'] <= cur_margin
        test_df['cov_90'] = test_df['abs_err'] <= test_df['proposed_m90']
        test_df['cov_95'] = test_df['abs_err'] <= test_df['proposed_m95']

        covered_proposed_90 = int(test_df['cov_90'].sum())
        covered_proposed_95 = int(test_df['cov_95'].sum())
        cov_p90_pct = (covered_proposed_90 / len(test_df)) * 100.0
        cov_p95_pct = (covered_proposed_95 / len(test_df)) * 100.0
        mean_p90_margin = float(test_df['proposed_m90'].mean())
        mean_p95_margin = float(test_df['proposed_m95'].mean())

        # Breakdown by Commodity Group on Test Set (Vectorized per group)
        group_eval = {}
        for grp, g_test in test_df.groupby('group'):
            n_g = len(g_test)
            g_cov_cur = int(g_test['cov_cur'].sum())
            g_cov90 = int(g_test['cov_90'].sum())
            g_cov95 = int(g_test['cov_95'].sum())

            group_eval[grp] = {
                'test_sample_count': int(n_g),
                'current_global_coverage_pct': round((g_cov_cur / n_g) * 100.0, 2),
                'proposed_90_coverage_pct': round((g_cov90 / n_g) * 100.0, 2),
                'proposed_95_coverage_pct': round((g_cov95 / n_g) * 100.0, 2),
                'current_margin_inr': cur_margin,
                'proposed_mean_90_margin_inr': round(float(g_test['proposed_m90'].mean()), 2),
                'test_mae_inr': round(float(g_test['abs_err'].mean()), 2)
            }

        print(f"\nResults for {h_name}:")
        print(f"  Current Global Margin (±₹{cur_margin:.2f}/Q): Test Coverage = {pct_cur_global:.2f}% ({covered_cur_global:,d} / {len(test_df):,d})")
        print(f"  Proposed Conformal 90% Margin (Mean ±₹{mean_p90_margin:.2f}/Q): Test Coverage = {cov_p90_pct:.2f}% ({covered_proposed_90:,d} / {len(test_df):,d})")
        print(f"  Proposed Conformal 95% Margin (Mean ±₹{mean_p95_margin:.2f}/Q): Test Coverage = {cov_p95_pct:.2f}% ({covered_proposed_95:,d} / {len(test_df):,d})")

        full_calibration_results[h_name] = {
            'horizon_days': h_cfg['days'],
            'val_sample_size': int(len(val_df)),
            'test_sample_size': int(len(test_df)),
            'test_date_range': f"{test_df['date'].min()} to {test_df['date'].max()}",
            'global_validation_metrics': {
                'rmse': round(global_val_rmse, 2),
                'mae': round(global_val_mae, 2),
                'p90_margin_inr': round(global_p90_margin, 2),
                'p95_margin_inr': round(global_p95_margin, 2)
            },
            'current_production_baseline': {
                'margin_inr': cur_margin,
                'test_covered_count': int(covered_cur_global),
                'test_total_count': int(len(test_df)),
                'test_coverage_pct': round(pct_cur_global, 2)
            },
            'proposed_conformal_calibration': {
                'target_90': {
                    'mean_margin_inr': round(mean_p90_margin, 2),
                    'test_covered_count': int(covered_proposed_90),
                    'test_total_count': int(len(test_df)),
                    'test_coverage_pct': round(cov_p90_pct, 2)
                },
                'target_95': {
                    'mean_margin_inr': round(mean_p95_margin, 2),
                    'test_covered_count': int(covered_proposed_95),
                    'test_total_count': int(len(test_df)),
                    'test_coverage_pct': round(cov_p95_pct, 2)
                }
            },
            'commodity_group_evaluation': group_eval,
            'group_fallbacks': group_calibration,
            'crop_calibrations': crop_calibration
        }

        # Atomically update calibration output JSON after each completed horizon
        os.makedirs(os.path.dirname(CALIBRATION_OUTPUT_JSON), exist_ok=True)
        merged_results = {}
        if os.path.exists(CALIBRATION_OUTPUT_JSON):
            try:
                with open(CALIBRATION_OUTPUT_JSON, 'r', encoding='utf-8') as f_in:
                    merged_results = json.load(f_in)
            except Exception:
                merged_results = {}
        merged_results[h_name] = full_calibration_results[h_name]
        with open(CALIBRATION_OUTPUT_JSON + '.tmp', 'w', encoding='utf-8') as f_out:
            json.dump(merged_results, f_out, indent=2)
        os.replace(CALIBRATION_OUTPUT_JSON + '.tmp', CALIBRATION_OUTPUT_JSON)
        print(f"  [SAVED] Atomically updated '{h_name}' in {CALIBRATION_OUTPUT_JSON}")

    print(f"\n[OK] Calibration pipeline completed. Output preserved at {CALIBRATION_OUTPUT_JSON}")
    return full_calibration_results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Calibrate AgriME Crop-Specific Prediction Intervals")
    parser.add_argument('--smoke-test', action='store_true', default=False, help="Run on bounded representative multi-year slice")
    parser.add_argument('--horizon', type=str, default='all', choices=['all', '7 Days', '15 Days', '30 Days', '7', '15', '30'], help="Select a specific horizon to calibrate, or 'all' for all three")
    args = parser.parse_args()
    calibrate_and_evaluate(smoke_test=args.smoke_test, horizon_choice=args.horizon)

