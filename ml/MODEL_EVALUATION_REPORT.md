# AgriME Tamil Nadu Crop-Price Machine Learning Model Evaluation Report

**Report Date:** 2026-10-10  
**Evaluator:** AgriME Automated ML Engineering Pipeline  
**Model Architecture:** Scikit-Learn `HistGradientBoostingRegressor` (Residual Boosting over Persistence)  
**Artifact Version:** `3.2.0` (`ml/models/crop_price_ml_model.json` & `crop_price_model.joblib`)  
**Data Provenance:** Government of India Agmarknet APMC Historical Bulletins (2001–2026)  
**Total Records Analyzed:** 4,538,308  
**Target Geography:** State of Tamil Nadu Regulated Mandis & Uzhavar Sandhais  

---

## 1. Chronological Split & Leakage Prevention

To ensure genuine, unvarnished real-world evaluation, observations were partitioned chronologically with zero target leakage:

```
+------------------------------------+---------------------+-----------------------------+
|          TRAINING PERIOD           |  VALIDATION PERIOD  |   HELD-OUT TEST BENCHMARK   |
|       2001-11-20 to 2023-12-02     |     2024-01-01 to 2024-12-04 |       2025-01-01 to 2026-03-24 |
+------------------------------------+---------------------+-----------------------------+
```

### Zero Lookahead Bias Guarantees:
1. **Past-Only Featurization:** 7-day and 30-day moving averages, 30-day price standard deviation, and 7-day momentum are calculated strictly over preceding observations where past_date < current_forecast_date.
2. **Zero Horizon Overlap:** Training targets are strictly <= 2023-12-31, validation targets <= 2024-12-31, and test forecasts >= 2025-01-01.
3. **Untouched Test Benchmark:** The test split was completely held out and never seen during categorical encoding, early stopping, or parameter fitting.
4. **Training-Only Baselines:** Seasonal lookup tables were derived solely from the training partition.

---

## 2. Measured Test Set Performance Benchmarks

All models and baselines were evaluated on the identical held-out test transactions from Tamil Nadu mandis:

| Evaluation Metric | 7-Day Horizon | 15-Day Horizon | 30-Day Horizon | Benchmark Definition |
| :--- | :--- | :--- | :--- | :--- |
| **Test Sample Count (N)** | 1,941,026 observations | 1,949,973 observations | 1,865,451 observations | Unseen test observations |
| **Test Date Range** | `2025-01-01 to 2026-04-14` | `2025-01-01 to 2026-04-07` | `2025-01-01 to 2026-03-24` | Held-out test period |
| **Model MAE (INR/Quintal)** | **₹563.44 / Q** | **₹771.75 / Q** | **₹976.54 / Q** | Mean Absolute Error |
| **Model RMSE (INR/Quintal)** | **₹1605.11 / Q** | **₹1909.85 / Q** | **₹2182.89 / Q** | Root Mean Squared Error |
| **Model MAPE (%)** | **10.36%** | **14.33%** | **18.52%** | Mean Absolute % Error |
| **Model R² Score** | **0.8858** | **0.8356** | **0.7849** | Coefficient of Determination |
| **Naive Baseline MAE (INR/Q)** | ₹515.72 / Q | ₹706.19 / Q | ₹931.93 / Q | Persistence Baseline (P_t) |
| **Naive Baseline RMSE (INR/Q)** | ₹1636.99 / Q | ₹1922.55 / Q | ₹2218.37 / Q | Standard persistence error |
| **Seasonal Baseline MAE (INR/Q)** | ₹3367.79 / Q | ₹3337.89 / Q | ₹3238.34 / Q | Training monthly mean |
| **Relative Improvement vs Naive** | **-9.25%** | **-9.28%** | **-4.79%** | Reduction in test MAE |
| **Measured Empirical Coverage** | **98.8%** | **98.7%** | **98.3%** | Empirical test coverage |

---

## 3. Features & Engineered Inputs

The model utilizes 15 features:
- **Price Features:** `current_price`, `min_price`, `max_price`, `spread`
- **Past-Only Lookbacks:** `roll_mean_7d`, `roll_mean_30d`, `roll_std_30d`, `momentum_7d`
- **Seasonal Harmonics:** `sin_month`, `cos_month`, `sin_doy`, `cos_doy`
- **Categorical Encodings:** `commodity_enc`, `district_enc`, `market_enc` (Ordinal encoded with native support in HistGradientBoostingRegressor)

---

## 4. Empirical Prediction Intervals (Confidence Bands)

Prediction intervals are calibrated using the validation set standard error:

- **7-Day Horizon Margin:** ±₹4410.55/Q (Empirical coverage: 98.8%)
- **15-Day Horizon Margin:** ±₹5463.46/Q (Empirical coverage: 98.7%)
- **30-Day Horizon Margin:** ±₹5847.32/Q (Empirical coverage: 98.3%)
