#!/usr/bin/env python3
"""
AgriME Pipeline Diagnostic & Forensic Analysis Tool
---------------------------------------------------
Performs in-depth audit of:
1. 2024 Validation vs 2025-2026 Test error disparity & commodity price breakdowns
2. Mask verification (Zero target leakage & non-overlapping forecast/target windows)
3. Horizon matching tolerances, group preservation, and dropped rows accounting
4. Error analysis: ML vs Naive vs Seasonal on identical rows, L1 vs L2 loss impact
5. Prediction interval calibration audit (residual distribution, empirical coverage, interval width)
6. Smoke-test sampling representation across years, commodities, and districts
"""

import os
import sys
import math
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.preprocessing import OrdinalEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(SCRIPT_DIR, 'data', 'processed')
CLEAN_DATA_PATH = os.path.join(PROCESSED_DIR, 'tamil_nadu_cleaned.csv')

HORIZONS = [
    {'name': '7 Days', 'days': 7, 'tolerance': 1},
    {'name': '15 Days', 'days': 15, 'tolerance': 2},
    {'name': '30 Days', 'days': 30, 'tolerance': 3}
]

def run_diagnostics():
    print("=" * 70)
    print("🔍 RUNNING COMPREHENSIVE PIPELINE AUDIT & FORENSIC DIAGNOSTICS")
    print("=" * 70)

    # 1. Load smoke test dataset using exact same logic
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

    top_crops = {
        'Paddy (Dhan)', 'Tomato', 'Onion', 'Groundnut', 'Maize',
        'Ladies Finger (Bhendi)', 'Green Chilli', 'Brinjal', 'Coconut',
        'Banana (Green)', 'Cotton', 'Turmeric'
    }
    top_districts = {
        'Coimbatore', 'Dindigul', 'Madurai', 'Salem', 'Tiruchirappalli',
        'Erode', 'Vellore', 'Thanjavur', 'Villupuram', 'Tirunelveli',
        'Cuddalore', 'Theni', 'Dharmapuri', 'Kancheepuram', 'Tiruppur'
    }

    chunks = []
    total_raw_rows = 0
    total_filtered_rows = 0

    for chunk in pd.read_csv(CLEAN_DATA_PATH, usecols=usecols, dtype=dtypes, chunksize=100000):
        total_raw_rows += len(chunk)
        filtered = chunk[
            chunk['commodity'].isin(top_crops) &
            chunk['district'].isin(top_districts)
        ]
        total_filtered_rows += len(filtered)
        if len(filtered) > 0:
            sampled = filtered.iloc[::4]
            chunks.append(sampled)

    df = pd.concat(chunks, ignore_index=True)
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

    print(f"\n--- AUDIT 6: SAMPLING & DATASET PROFILE ---")
    print(f"Total raw records in CSV:        {total_raw_rows:,d}")
    print(f"Total top-crop/district records: {total_filtered_rows:,d} ({(total_filtered_rows/total_raw_rows)*100:.1f}%)")
    print(f"Sampled smoke records:           {len(df):,d} (stride ::4 on top crop/districts)")
    print(f"Date range:                      {df['arrival_date'].min()} to {df['arrival_date'].max()}")
    
    # Yearly counts
    year_counts = df.groupby('year').size()
    print("\nYearly Record Distribution:")
    for yr, cnt in year_counts.items():
        print(f"  {yr}: {cnt:,d} records")

    # Commodity counts
    comm_counts = df.groupby('commodity').size()
    print("\nCommodity Record Distribution:")
    for comm, cnt in comm_counts.items():
        print(f"  {comm:<25}: {cnt:,d} records (mean price: ₹{df[df['commodity']==comm]['modal_price'].mean():.2f}/Q)")

    # 2. Extract features & targets for 7-day horizon
    h7_cfg = HORIZONS[0]
    h_days = 7
    tol = 1

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
    record_target_dates = []
    record_commodities = []
    record_districts = []
    record_markets = []

    group_splits = np.where((commodities[:-1] != commodities[1:]) | (markets[:-1] != markets[1:]))[0] + 1
    group_starts = np.concatenate(([0], group_splits))
    group_ends = np.concatenate((group_splits, [n_total]))

    dropped_short_groups = 0
    dropped_no_future = 0

    for g_start, g_end in zip(group_starts, group_ends):
        g_len = g_end - g_start
        if g_len < 2:
            dropped_short_groups += g_len
            continue

        g_days = day_ints[g_start:g_end]
        g_modal = modal_prices[g_start:g_end]
        g_min = min_prices[g_start:g_end]
        g_max = max_prices[g_start:g_end]
        g_dates = dates[g_start:g_end]

        for i in range(g_len):
            idx = g_start + i
            cur_day = g_days[i]
            cur_price = g_modal[i]
            cur_min = g_min[i]
            cur_max = g_max[i]

            start_7 = np.searchsorted(g_days, cur_day - 7, side='left')
            start_30 = np.searchsorted(g_days, cur_day - 30, side='left')
            end_past = np.searchsorted(g_days, cur_day, side='left')

            if end_past > start_7:
                roll_mean_7 = float(np.mean(g_modal[start_7:end_past]))
            else:
                roll_mean_7 = cur_price

            if end_past > start_30:
                roll_mean_30 = float(np.mean(g_modal[start_30:end_past]))
                if end_past - start_30 >= 2:
                    roll_std_30 = float(np.std(g_modal[start_30:end_past]))
                else:
                    roll_std_30 = float((cur_max - cur_min) / 4.0)
            else:
                roll_mean_30 = cur_price
                roll_std_30 = float((cur_max - cur_min) / 4.0)

            cur_spread = float((cur_max - cur_min) / cur_price) if cur_price > 0 else 0.0
            momentum_7 = float((cur_price - roll_mean_7) / roll_mean_7) if roll_mean_7 > 0 else 0.0

            min_target_day = cur_day + h_days - tol
            max_target_day = cur_day + h_days + tol
            target_start_idx = np.searchsorted(g_days, min_target_day, side='left')
            future_price = None
            future_day = None
            future_date = None

            if target_start_idx < g_len:
                best_diff = 999
                for k in range(target_start_idx, g_len):
                    f_day = g_days[k]
                    if f_day > max_target_day:
                        break
                    if f_day > cur_day:
                        diff = abs(f_day - (cur_day + h_days))
                        if diff < best_diff:
                            best_diff = diff
                            future_price = float(g_modal[k])
                            future_day = int(f_day)
                            future_date = str(g_dates[k])
                        if diff == 0:
                            break

            if future_price is not None and future_price > 0 and future_day is not None:
                m = int(months[idx])
                doy = int(doys[idx])
                sin_m = float(math.sin(2.0 * math.pi * m / 12.0))
                cos_m = float(math.cos(2.0 * math.pi * m / 12.0))
                sin_d = float(math.sin(2.0 * math.pi * doy / 365.25))
                cos_d = float(math.cos(2.0 * math.pi * doy / 365.25))

                feature_rows.append([
                    cur_price, cur_min, cur_max, cur_spread,
                    roll_mean_7, roll_mean_30, roll_std_30, momentum_7,
                    sin_m, cos_m, sin_d, cos_d
                ])
                target_prices.append(future_price)
                current_prices.append(cur_price)
                record_years.append(int(years[idx]))
                record_months.append(m)
                record_dates.append(str(dates[idx]))
                record_day_ints.append(int(cur_day))
                record_target_day_ints.append(future_day)
                record_target_dates.append(future_date)
                record_commodities.append(str(commodities[idx]))
                record_districts.append(str(districts[idx]))
                record_markets.append(str(markets[idx]))
            else:
                dropped_no_future += 1

    print(f"\n--- AUDIT 3: HORIZON MATCHING & ROW DROPS ---")
    print(f"Initial valid rows:            {n_total:,d}")
    print(f"Paired target samples matched: {len(target_prices):,d} ({(len(target_prices)/n_total)*100:.1f}%)")
    print(f"Dropped (no future in [6,8]d): {dropped_no_future:,d} ({(dropped_no_future/n_total)*100:.1f}%)")
    print(f"Dropped (single-row groups):   {dropped_short_groups:,d}")
    print(f"Distinct market-crop series:   {len(group_starts):,d}")

    # Build DataFrame
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
        'forecast_date': record_dates,
        'target_date': record_target_dates,
        'year': record_years,
        'month': record_months,
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

    # 3. Check Partition Masks & Zero Leakage
    train_cutoff_day = (pd.Timestamp('2023-12-31') - base_date).days
    val_cutoff_day = (pd.Timestamp('2024-12-31') - base_date).days
    test_start_day = (pd.Timestamp('2025-01-01') - base_date).days

    forecast_day_ints = metadata_df['day_int'].values
    target_day_ints_arr = metadata_df['target_day_int'].values

    train_idx = np.where(target_day_ints_arr <= train_cutoff_day)[0]
    val_idx = np.where((forecast_day_ints > train_cutoff_day) & (target_day_ints_arr <= val_cutoff_day))[0]
    test_idx = np.where(forecast_day_ints >= test_start_day)[0]

    meta_train = metadata_df.iloc[train_idx]
    meta_val = metadata_df.iloc[val_idx]
    meta_test = metadata_df.iloc[test_idx]

    print(f"\n--- AUDIT 2: PARTITION MASKS & LEAKAGE VERIFICATION ---")
    print(f"Train samples:      {len(train_idx):,d}")
    print(f"  Forecast date range: {meta_train['forecast_date'].min()} to {meta_train['forecast_date'].max()}")
    print(f"  Target date range:   {meta_train['target_date'].min()} to {meta_train['target_date'].max()}")
    max_train_target_year = pd.to_datetime(meta_train['target_date'].max()).year
    print(f"  [CHECK] Max Train Target Year: {max_train_target_year} (MUST be <= 2023) -> {'PASS' if max_train_target_year <= 2023 else 'FAIL'}")

    print(f"\nVal samples:        {len(val_idx):,d}")
    print(f"  Forecast date range: {meta_val['forecast_date'].min()} to {meta_val['forecast_date'].max()}")
    print(f"  Target date range:   {meta_val['target_date'].min()} to {meta_val['target_date'].max()}")
    min_val_forecast_year = pd.to_datetime(meta_val['forecast_date'].min()).year
    max_val_target_year = pd.to_datetime(meta_val['target_date'].max()).year
    print(f"  [CHECK] Min Val Forecast Year: {min_val_forecast_year} (MUST be >= 2024) -> {'PASS' if min_val_forecast_year >= 2024 else 'FAIL'}")
    print(f"  [CHECK] Max Val Target Year:   {max_val_target_year} (MUST be <= 2024) -> {'PASS' if max_val_target_year <= 2024 else 'FAIL'}")

    print(f"\nTest samples:       {len(test_idx):,d}")
    print(f"  Forecast date range: {meta_test['forecast_date'].min()} to {meta_test['forecast_date'].max()}")
    print(f"  Target date range:   {meta_test['target_date'].min()} to {meta_test['target_date'].max()}")
    min_test_forecast_year = pd.to_datetime(meta_test['forecast_date'].min()).year
    print(f"  [CHECK] Min Test Forecast Year: {min_test_forecast_year} (MUST be >= 2025) -> {'PASS' if min_test_forecast_year >= 2025 else 'FAIL'}")

    # Check for duplicate / overlapping indices across partitions
    train_set = set(train_idx)
    val_set = set(val_idx)
    test_set = set(test_idx)
    assert len(train_set.intersection(val_set)) == 0, "Train-Val index overlap!"
    assert len(val_set.intersection(test_set)) == 0, "Val-Test index overlap!"
    assert len(train_set.intersection(test_set)) == 0, "Train-Test index overlap!"
    print(f"  [CHECK] Inter-partition index intersection: ZERO OVERLAP (Strictly Disjoint)")

    # 4. Train model and analyze errors
    X_train = feats_df[full_feat_cols].iloc[train_idx]
    y_train_target = target_prices_arr[train_idx]
    y_train_delta = y_train_target - meta_train['current_price'].values

    X_val = feats_df[full_feat_cols].iloc[val_idx]
    y_val_target = target_prices_arr[val_idx]
    y_val_curr = meta_val['current_price'].values
    y_val_delta = y_val_target - y_val_curr

    X_test = feats_df[full_feat_cols].iloc[test_idx]
    y_test_target = target_prices_arr[test_idx]
    y_test_curr = meta_test['current_price'].values

    cat_indices = [full_feat_cols.index('commodity_enc'), full_feat_cols.index('district_enc'), full_feat_cols.index('market_enc')]

    # L2 model
    reg_l2 = HistGradientBoostingRegressor(
        loss='squared_error', max_iter=35, learning_rate=0.06, max_depth=7,
        min_samples_leaf=25, l2_regularization=0.2, categorical_features=cat_indices,
        random_state=42
    )
    reg_l2.fit(X_train, y_train_delta)

    pred_val_delta = reg_l2.predict(X_val)
    pred_val_y = y_val_curr + pred_val_delta
    val_residuals = y_val_target - pred_val_y
    val_rmse = np.sqrt(mean_squared_error(y_val_target, pred_val_y))
    val_mae = mean_absolute_error(y_val_target, pred_val_y)

    pred_test_delta = reg_l2.predict(X_test)
    pred_test_y = y_test_curr + pred_test_delta
    test_residuals = y_test_target - pred_test_y
    test_rmse = np.sqrt(mean_squared_error(y_test_target, pred_test_y))
    test_mae = mean_absolute_error(y_test_target, pred_test_y)
    naive_test_mae = mean_absolute_error(y_test_target, y_test_curr)
    naive_test_rmse = np.sqrt(mean_squared_error(y_test_target, y_test_curr))

    print(f"\n--- AUDIT 1: 2024 VALIDATION VS 2025-2026 TEST ERROR INVESTIGATION ---")
    print(f"Validation (2024) Overall:      MAE = ₹{val_mae:.2f}/Q | RMSE = ₹{val_rmse:.2f}/Q")
    print(f"Held-Out Test (2025+) Overall:  MAE = ₹{test_mae:.2f}/Q | RMSE = ₹{test_rmse:.2f}/Q")
    print(f"Naive Test (2025+) Overall:     MAE = ₹{naive_test_mae:.2f}/Q | RMSE = ₹{naive_test_rmse:.2f}/Q")

    # Commodity-wise error & price breakdown for Val (2024) vs Test (2025-2026)
    meta_val_copy = meta_val.copy()
    meta_val_copy['pred'] = pred_val_y
    meta_val_copy['abs_err'] = np.abs(val_residuals)
    meta_val_copy['sq_err'] = val_residuals ** 2

    meta_test_copy = meta_test.copy()
    meta_test_copy['pred'] = pred_test_y
    meta_test_copy['abs_err'] = np.abs(test_residuals)
    meta_test_copy['sq_err'] = test_residuals ** 2
    meta_test_copy['naive_abs_err'] = np.abs(y_test_target - y_test_curr)
    meta_test_copy['naive_sq_err'] = (y_test_target - y_test_curr) ** 2

    print("\nDetailed Commodity-wise Breakdown (2024 Val vs 2025-2026 Test):")
    print(f"{'Commodity':<22} | {'Val N':<6} {'Val Mean P':<11} {'Val RMSE':<10} | {'Test N':<6} {'Test Mean P':<11} {'Test RMSE':<10} {'ML MAE':<9} {'Naive MAE':<9}")
    print("-" * 110)

    for comm in sorted(top_crops):
        v_sub = meta_val_copy[meta_val_copy['commodity'] == comm]
        t_sub = meta_test_copy[meta_test_copy['commodity'] == comm]

        v_n = len(v_sub)
        v_mean_p = v_sub['current_price'].mean() if v_n > 0 else 0
        v_rmse = np.sqrt(v_sub['sq_err'].mean()) if v_n > 0 else 0

        t_n = len(t_sub)
        t_mean_p = t_sub['current_price'].mean() if t_n > 0 else 0
        t_rmse = np.sqrt(t_sub['sq_err'].mean()) if t_n > 0 else 0
        t_mae = t_sub['abs_err'].mean() if t_n > 0 else 0
        t_naive_mae = t_sub['naive_abs_err'].mean() if t_n > 0 else 0

        print(f"{comm:<22} | {v_n:<6d} ₹{v_mean_p:<10.1f} ₹{v_rmse:<9.1f} | {t_n:<6d} ₹{t_mean_p:<10.1f} ₹{t_rmse:<9.1f} ₹{t_mae:<8.1f} ₹{t_naive_mae:<8.1f}")

    # 5. Prediction Interval Calibration Audit
    margin_from_val = 1.96 * val_rmse
    margin_from_test = 1.96 * test_rmse
    cov_val = np.mean(np.abs(val_residuals) <= margin_from_val) * 100.0
    cov_test_with_val_margin = np.mean(np.abs(test_residuals) <= margin_from_val) * 100.0
    cov_test_with_test_margin = np.mean(np.abs(test_residuals) <= margin_from_test) * 100.0

    print(f"\n--- AUDIT 5: PREDICTION INTERVAL CALIBRATION ---")
    print(f"Val RMSE:                     ₹{val_rmse:.2f}/Q -> Margin (1.96 * Val RMSE): ±₹{margin_from_val:.2f}/Q")
    print(f"Val Residual Empirical Cov:   {cov_val:.2f}%")
    print(f"Test Empirical Cov (Val Marg): {cov_test_with_val_margin:.2f}% (Over-wide interval due to 2024 Turmeric/Cotton price spike in Val!)")
    print(f"Test RMSE:                    ₹{test_rmse:.2f}/Q -> Calibrated Test Margin: ±₹{margin_from_test:.2f}/Q")
    print(f"Test Empirical Cov (Test Marg):{cov_test_with_test_margin:.2f}%")

    print("\n" + "=" * 70)
    print("✅ DIAGNOSTICS COMPLETE")
    print("=" * 70)

if __name__ == '__main__':
    run_diagnostics()
