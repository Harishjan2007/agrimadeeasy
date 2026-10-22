# AgriME Machine Learning Engine

Welcome to the AgriME Agricultural Market-Price Machine Learning subsystem. This module provides authentic, reproducible, leakage-free price forecasting for agricultural commodities across the State of Tamil Nadu, trained on 25+ years of Government of India Agmarknet / APMC mandi bulletins (2001–2026).

---

## 1. Directory Structure & Artifact Architecture

```
ml/
├── data/
│   └── processed/
│       ├── tamil_nadu_cleaned.csv         <- Processed Tamil Nadu dataset (4.54M rows)
│       ├── preprocessing_metadata.json    <- Data extraction & exclusion metadata
│       └── DATA_DICTIONARY.md             <- Field definitions & data units
├── models/
│   ├── crop_price_model.joblib            <- Fitted Scikit-Learn Estimator Binaries (Joblib)
│   └── crop_price_ml_model.json           <- Runtime Web Artifact (Metrics, momentum, drift)
├── preprocess_tamil_nadu.py               <- Extraction, cleaning, and deduplication pipeline
├── train_model.py                         <- Bounded-memory ML training, splits & evaluation
├── predict.py                             <- Standalone Python CLI & module inference engine
├── requirements.txt                       <- Python dependencies
├── MODEL_EVALUATION_REPORT.md             <- Detailed test error benchmarks vs baselines
├── TAMIL_NADU_ML_REPORT.md                <- Comprehensive forensic ML report
└── README.md                              <- This documentation
```

### Artifact Roles: Estimator vs Metadata
- **`crop_price_model.joblib`**: Contains the authentic Scikit-Learn `HistGradientBoostingRegressor` estimators fitted per horizon with native categorical support (`OrdinalEncoder` for commodity, district, and market) for Python-based batch processing, validation, and microservices.
- **`crop_price_ml_model.json`**: Contains calibrated runtime metrics, feature schemas, training sample sizes, baseline lookup tables, and crop momentum drift for sub-millisecond Next.js edge/client inference.

---

## 2. Quickstart & Pipeline Execution

### Prerequisites
- Python 3.9+ (Tested on Python 3.13, scikit-learn 1.9+, pandas 3.0+, numpy 2.5+)
- Install dependencies:
  ```bash
  pip install -r ml/requirements.txt
  ```

### Step 1: Preprocessed Tamil Nadu Dataset
The complete, cleaned Tamil Nadu APMC dataset spanning 2001–2026 is maintained at `ml/data/processed/tamil_nadu_cleaned.csv` (4.54M records, 720 mandis, 177 commodities). The former raw all-India dataset (`leancsv/`) has been separated and retired:
```bash
# Validates the preprocessed dataset and metadata
python ml/preprocess_tamil_nadu.py
```

### Step 2: Run Non-Destructive Smoke-Test
Validates the entire pipeline (feature generation, target matching, categorical encoding, training, artifact saving, and reload) on a limited slice without overwriting production models:
```bash
python ml/train_model.py --smoke-test
```

### Step 3: Run Full Model Training
Trains Scikit-Learn gradient boosted ensembles across 4.54M Tamil Nadu records using bounded memory (< 1.5 GB RAM), strictly evaluates against 2025–2026 held-out test data, saves `crop_price_model.joblib` and `crop_price_ml_model.json`, and updates `MODEL_EVALUATION_REPORT.md`:
```bash
python ml/train_model.py
```

### Step 4: Run Standalone Python Inference
```bash
# 15-day harvest forecast for Paddy in Vellore
python ml/predict.py --crop "Paddy (Dhan)" --price 2350 --horizon "15 Days" --market "Vellore APMC"

# 7-day spot forecast for Tomato
python ml/predict.py --crop "Tomato" --price 1800 --horizon "7 Days"
```

---

## 3. Web & Mobile Integration

- **TypeScript Inference Service:** `src/lib/ml-prediction-service.ts` loads `ml/models/crop_price_ml_model.json` to perform instant, zero-latency inference directly in the Next.js App Router without Python subprocess overhead.
- **REST API Endpoints:**
  - `GET /api/predictions/predict?crop_id=c1&market_id=m1&current_price=2350&horizon=15%20Days`
  - `POST /api/predictions/predict` with JSON body `{ cropId, marketId, currentPrice, horizon }`
- **Frontend UI:** `src/components/prediction/PredictionPageClient.tsx` renders forecasts, empirical prediction intervals, trend indicators, and decision support metrics.
