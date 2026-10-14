# AgriME Machine Learning Implementation Audit

**Audit Date:** October 2026  
**Auditor:** Senior ML Engineer & Full-Stack Systems Architect  
**Repository:** AgriME Platform (`agrimadeeasy`)  
**Status:** COMPLETE FORENSIC AUDIT  

---

## 1. Executive Summary & Inventory

An exhaustive codebase audit was conducted across the AgriME full-stack web application (`src/`), machine learning directory (`ml/`), native mobile application (`mobile/`), automated test suite (`tests/`), and the historical raw Agmarknet dataset directory (`leancsv/`).

### Key Findings Matrix

| Component | Path / Reference | Implemented Architecture | Forensic Classification |
| :--- | :--- | :--- | :--- |
| **Source Dataset** | `./leancsv/2001.csv` ... `2026.csv` | 26 raw historical CSV files (~6.5 GB, ~72.5M rows) spanning 2001-01-10 to 2026-04-21 across all Indian States. | **Authentic Raw Source Data** |
| **Legacy ML Training Script** | `ml/train_model.py` | Standalone script iterating over 49 JSON records, applying harmonic multipliers and hardcoded drift rates. | **Heuristic / Calibration Script (Not Trained ML)** |
| **Legacy ML Dataset** | `ml/dataset/agmarknet_historical_prices.json` | 49 hand-compiled records from June 2025 – August 2026 across 8 crops. | **Curated Seed Snapshot (Sparse)** |
| **Model Artifact** | `ml/models/crop_price_ml_model.json` | JSON configuration file containing commodity baselines, drift rates, and reported MAE/RMSE/R² metrics. | **Parametric Heuristic Artifact** |
| **Runtime Web Inference** | `src/lib/ml-prediction-service.ts` | TypeScript service executing point projections and 95% confidence intervals from JSON metadata. | **Deterministic Formula Service** |
| **Prediction API Endpoint** | `src/app/api/predictions/predict/route.ts` | Next.js App Router Route Handler supporting GET and POST inference queries. | **Production-Ready API Interface** |
| **Database Data Layer** | `src/lib/supabase/crops.ts` | Async Supabase query with automatic graceful fallback to model inference. | **Robust Resilient Data Layer** |
| **Prediction UI** | `src/components/prediction/PredictionPageClient.tsx` | Interactive filtering, trend analysis, confidence bands, and decision support. | **Production-Ready Frontend** |
| **Mobile Integration** | `mobile/src/screens/` | Expo/React Native screens displaying price trends and forecasting summaries. | **Integrated Mobile UI** |

---

## 2. Forensic Analysis of Existing ML Components

### 2.1 `ml/train_model.py`
The legacy script in `ml/train_model.py` implemented a simplified empirical calibration workflow:
- **Data Input**: Loaded 49 static rows from `ml/dataset/agmarknet_historical_prices.json`.
- **Methodology**: Applied a 70% train / 30% test chronological split on 49 rows (34 train rows, 15 test rows).
- **Forecasting Mechanism**: Computed average commodity baseline, then projected future prices using a fixed drift factor (0.8% for 7 days, 1.6% for 15 days, 2.8% for 30 days), a harmonic sine wave for monthly monsoon cycles ($0.015 \cdot \sin(\text{month}\cdot \pi / 6)$), and hardcoded crop momentum offsets (e.g., Tomato: $-0.045$, Onion: $+0.025$).
- **Verdict**: While transparent about being an empirical projection on seed data, it was **not a machine learning model** (no scikit-learn, LightGBM, XGBoost, or Random Forest estimator).

### 2.2 `src/lib/ml-prediction-service.ts`
- Direct TypeScript implementation of the drift + harmonic seasonal formula.
- Calculates point estimates: `rawPredicted = currentPrice * (1.0 + netRate)` where `netRate = drift + seasonalDrift + cropMomentum`.
- Generates empirical prediction intervals: `marginOfError = 1.96 * horizonConfig.rmse`, yielding `[predictedMin, predictedMax]`.
- Determines trend classification (`up`, `down`, `stable`) based on price difference exceeding $0.4 \times \text{RMSE}$.
- Integrates cleanly with all application components via `predictCropPrice(req)` and `generateAllMLPredictions(prices, crops, markets)`.

---

## 3. Application Data Flow & Integration Points

```
+-------------------------------------------------------------------------+
|                              DATA SOURCES                               |
|  1. ./leancsv/*.csv (72.5M Raw Agmarknet Records, 2001-2026)            |
|  2. Supabase `crop_prices` / `crop_predictions` tables                  |
|  3. Live Agmarknet API (api.data.gov.in) with API key fallback           |
|  4. Static reference baselines (MOCK_CROPS, MOCK_MARKETS, MOCK_PRICES)  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                          PREDICTION SERVICE                             |
|  - `src/lib/ml-prediction-service.ts`                                   |
|  - Reads: `ml/models/crop_price_ml_model.json`                          |
|  - Exposes: `predictCropPrice()`, `generateAllMLPredictions()`          |
+-------------------------------------------------------------------------+
                    |                                 |
                    v                                 v
+------------------------------------+  +--------------------------------+
|       API ROUTE HANDLER            |  |      SUPABASE CLIENT HELPER    |
| `src/app/api/predictions/predict`  |  | `src/lib/supabase/crops.ts`    |
| - GET: Query params inference      |  | - getCropPredictions()         |
| - POST: JSON body inference        |  | - Safe fallback on DB error    |
+------------------------------------+  +--------------------------------+
                    |                                 |
                    +----------------+----------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                             USER INTERFACES                             |
|  - Web: `src/components/prediction/PredictionPageClient.tsx`            |
|  - Web: `src/components/prediction/PredictionCard.tsx`                  |
|  - Web: `src/components/home/PredictionPreview.tsx`                     |
|  - Mobile: `mobile/src/screens/HomeScreen.tsx` & `PriceTrendsScreen`    |
+-------------------------------------------------------------------------+
```

---

## 4. API Routes, Environment Variables, and Dependencies

### API Routes
1. `GET /api/predictions/predict?crop_id=...&market_id=...&current_price=...&horizon=15%20Days`
   - Returns `{ success: true, data: MLPredictionResult }`
2. `POST /api/predictions/predict`
   - Request Body: `{ cropId: string, marketId: string, currentPrice: number, horizon: string }`
   - Returns `{ success: true, data: MLPredictionResult }`
3. `POST /api/crop-prices/ingest`
   - Authenticated ingestion endpoint for daily market bulletin updates.
4. `GET /api/crop-prices/live`
   - Live price proxy connecting to Agmarknet open data portal.

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project endpoint.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase client anonymous API key.
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for database migrations and secure ingestion.
- `DATA_GOV_IN_API_KEY` / `NEXT_PUBLIC_AGMARKNET_API_KEY`: Optional government open data API key.

### Dependencies
- **Frontend / Runtime**: Next.js 16 (App Router), React 18, Tailwind CSS, Lucide React, Supabase JS.
- **Testing**: Node.js native test runner (`node:test`, `node:assert/strict`).
- **Python ML Pipeline Requirements**: Python 3.9+, `numpy`, `pandas` / `polars`, `scikit-learn`, `joblib`.

---

## 5. Preservation Guidelines for Unrelated Features

The following features are working, verified, and must remain completely untouched during the ML overhaul:
1. **Bilingual English/Tamil Internationalization** (`src/i18n/`, `src/context/LanguageContext.tsx`).
2. **Machinery Rental Marketplace & Live GPS Tracking** (`src/app/machinery/`, `src/lib/location.ts`, `machinery_tracking` table).
3. **Farmer Direct Produce Marketplace & Booking State Machine** (`src/app/marketplace/`, `tests/unit/booking-state-machine.test.mjs`).
4. **Government Schemes Discovery Engine** (`src/app/schemes/`).
5. **Soil Health & Weather Advisory Cards** (`src/app/soil-testing/`, `src/app/weather/`).
6. **Supabase Row-Level Security Policies & Migrations** (`supabase/migrations/`).
7. **Mobile Application Codebase** (`mobile/`).

---

## 6. Target ML Architecture & Upgrade Plan

To replace the legacy heuristic with a genuine, verifiable Machine Learning pipeline:
1. **Dataset Source**: Stream and parse all 26 CSV files from `./leancsv/` (2001–2026).
2. **Tamil Nadu Extraction & Cleaning**: Filter strictly for `State == 'Tamil Nadu'`, standardize commodity and market nomenclature, validate prices ($₹100 \le \text{Modal Price} \le ₹100,000/\text{Q}$), eliminate duplicate records, and produce clean partitioned datasets.
3. **Feature Engineering Without Leakage**:
   - Categorical encodings (Commodity, District, Market, Variety).
   - Strict past-only rolling price metrics (7-day, 14-day, 30-day rolling averages and price momentum).
   - Calendar & cyclical seasonal components (day of year, month harmonic sine/cosine).
4. **Model Training**: Train scikit-learn `HistGradientBoostingRegressor` / `RandomForestRegressor` across chronological train/validation/test splits (pre-2023 train, 2023-2024 validation, 2025-2026 untouched held-out test).
5. **Artifact Export & Fast Inference**: Export tree structures, quantile regression boundaries, and baseline metrics into `ml/models/` for sub-millisecond local inference in both Python and TypeScript runtimes.
