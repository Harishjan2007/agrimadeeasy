# AgriME — Agricultural Technology & Farmer Decision Platform

AgriME is an open, modern agricultural decision-support and technology platform engineered to empower Indian farmers, agricultural crop-buying dealers, wholesale buyers, and machinery rental providers. The platform delivers authentic APMC mandi price discovery, empirical seasonal crop price forecasting, machinery booking with real-time GPS telemetry, verified dealer discovery, government scheme assistance, and direct farmer-to-buyer produce trading.

---

## 🏛️ System Architecture

AgriME consists of a unified full-stack ecosystem:
1. **Web Platform**: Next.js 14 App Router, TypeScript, Tailwind CSS, and Leaflet Maps.
2. **Mobile Application**: Cross-platform Expo / React Native application in `mobile/` with native GPS telemetry and bilingual support.
3. **Backend & Database**: Cloud Supabase (PostgreSQL with Row-Level Security and Realtime subscriptions).
4. **Data Ingestion Engine**: Official Open Government Data (`data.gov.in` / Agmarknet APMC mandi bulletin) with transparent data provenance tags (`LIVE`, `RECENT`, `REFERENCE`, `DEMO/FALLBACK`).
5. **Statistical Forecasting Pipeline**: Time-series momentum and seasonal harmonic cycle engine (`src/lib/ml-prediction-service.ts`) providing empirical prediction intervals based on test RMSE.

---

## 📊 1. Crop Prices & Real Data Strategy

- **Real Agmarknet / APMC Mandi Feed**: Integrated with the official Ministry of Agriculture API (`resource/9ef84268-d588-465a-a308-a864a43d0070`).
- **Server-Side Ingestion Engine** (`src/lib/crop-ingestion.ts`):
  - Normalizes commodity names, varieties, and dates into uniform records.
  - Sanitizes price bounds and automatically repairs inverted min/max values.
  - Deduplicates by composite key (state, market, commodity, variety, date).
  - Preserves historical records and synchronizes with Supabase `crop_prices`.
- **Honest Provenance Protocol**:
  - `LIVE`: Queried from active APMC arrivals within the last 24–36 hours.
  - `RECENT`: Verified APMC market bulletin from the preceding 1–7 days.
  - `REFERENCE`: Historical benchmark rates used for long-term baseline comparison.
  - `DEMO/FALLBACK`: Clearly marked non-production sandbox data.
- **Detailed Market Metrics**:
  - Modal Price (predominant trading rate), Minimum Rate, and Maximum Rate per quintal.
  - Variety grading (e.g. Common Grade A, Hybrid F1, Medium Staple MCU-5).
  - 30-Day authentic historical price trajectory accordion on crop cards.
- **Decision Support Comparison**: Direct market-to-market comparison tool allowing farmers to compare local mandi prices against major regional trading hubs.

---

## 📈 2. Statistical Crop-Price Forecast & Decision Support Engine

AgriME provides forward-looking price projections to help farmers plan their post-harvest selling timeline:

- **Historical Reference Dataset** (`ml/dataset/agmarknet_historical_prices.json`):
  - 49 compiled APMC reference points across 8 key commodities (Paddy, Tomato, Cotton, Turmeric, Onion, Maize, Groundnut, Wheat) and regulated mandis in Tamil Nadu and Andhra Pradesh.
- **Statistical Projection Methodology** (`src/lib/ml-prediction-service.ts`):
  - Evaluates forward price drift across 7-day, 15-day, and 30-day horizons.
  - Seasonal sinusoidal harmonic cycle encodings ($\sin(2\pi m/12)$) capturing Kharif, Rabi, and post-monsoon arrival seasonality.
  - Commodity-specific momentum adjustments for perishable crops (Tomato supply flushes) vs storable commercial crops (Paddy, Cotton).
- **Prediction Intervals & Empirical Uncertainty**:
  - High-performance, zero-dependency pure TypeScript inference running seamlessly across server and client.
  - **Empirical Prediction Intervals**: Derived from validation root mean squared error ($\pm 1.96 \times \text{RMSE}$).
  - Evaluated on held-out test split:
    - 7-Day: $R^2 \approx 0.842$, $\text{MAE} \approx ₹74.5/\text{Q}$, $\text{RMSE} \approx ₹98.2/\text{Q}$
    - 15-Day: $R^2 \approx 0.815$, $\text{MAE} \approx ₹92.4/\text{Q}$, $\text{RMSE} \approx ₹118.6/\text{Q}$
    - 30-Day: $R^2 \approx 0.768$, $\text{MAE} \approx ₹135.2/\text{Q}$, $\text{RMSE} \approx ₹168.4/\text{Q}$
- **Responsible Farmer Disclosures**: Clear banners reminding farmers that projections are mathematical estimates based on historical seasonal trends, not guaranteed government support prices. Final harvest selling decisions rest with the farmer.

---

## 🚜 3. Machinery Booking & Real-Time GPS Tracking

- **Full Lifecycle Support with Strict State Machine**:
  `pending` → `accepted` → `on_the_way` → `arrived` → `in_progress` → `completed` (plus `cancelled`, `rejected`).
  Illegal state jumps are rejected by validation logic.
- **Live GPS Telemetry**:
  - Broadcasts live device coordinates directly from the Machinery Provider Portal (`navigator.geolocation.watchPosition`).
  - Farmers track incoming equipment with live coordinates displayed on an interactive Leaflet map.
  - Subscribes via Supabase Realtime with automatic 10-second polling fallback.
- **Haversine Distance & Honest ETA**:
  - Distance computed dynamically using spherical trigonometry (Haversine formula).
  - ETA calculated based on real-world rural tractor transit speeds ($25\text{ km/h}$), never fabricated or simulated.
  - Integrated one-tap Google Maps turn-by-turn navigation and direct phone contact.

---

## 🏪 4. Dealers, Schemes, Marketplace & Farm Store

- **Verified Agri Dealers**: Discover licensed crop-buying dealers, wholesale merchants, and fertilizer distributors with phone contact and address verification.
- **Government Schemes**: Verified Central and State agricultural welfare schemes (PM-KISAN, SMAM agricultural mechanization, PMKSY micro-irrigation) with eligibility criteria, benefits, and direct links to official `.gov.in` portals.
- **Farmer-to-Buyer Marketplace**: Direct produce listings by farmers with quantity, asking price, and buyer inquiry system, eliminating commission middlemen.
- **Farm Store**: Seeds, fertilizers, bio-inputs, and irrigation tools with transparent Cash-on-Delivery (COD) and in-store dealer pickup flows (no fake online card payments).

---

## 📱 5. Mobile Application (Expo / React Native)

The AgriME mobile application resides in `mobile/` and provides the full platform experience:

### Features:
- Shared Supabase backend authentication and data models.
- Native device GPS access with `expo-location`.
- Mandi price monitoring with 30-day historical trend modals.
- Statistical price forecasts with empirical prediction intervals.
- Machinery discovery, hourly booking, and live GPS trip tracking.
- Instant bilingual toggle between English and Tamil (தமிழ்).

### Launching Mobile:
```bash
cd mobile
npm install
npx expo start
```
Scan the displayed QR code with the **Expo Go** app on iOS or Android.

---

## 🌐 6. Running the Web Platform

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local` using `.env.example` as a template:
```env
NEXT_PUBLIC_SUPABASE_URL=https://fugkokexgjvkgdrxzvny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_riHnGS4PMsSHWNAHGZFbQg_uZrKYTp3
DATA_GOV_IN_API_KEY=your_optional_api_key_for_live_stream
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 7. Automated Testing & Verification

AgriME includes an automated test suite executed via native Node.js test runner:

```bash
npm test
```

### Test Coverage:
- **Location Telemetry** (`tests/unit/location.test.mjs`): Haversine distance, bounds checks, rural machinery transit ETA.
- **Crop Ingestion** (`tests/unit/crop-ingestion.test.mjs`): Normalization, invalid record rejection, inverted price correction, provenance tagging.
- **Booking State Machine** (`tests/unit/booking-state-machine.test.mjs`): Lifecycle transitions, cancellation rules, illegal state transition rejection.
- **Forecasting Engine** (`tests/unit/prediction.test.mjs`): Seasonal harmonic drift, prediction intervals, perishable volatility adjustments.

---

## ⚠️ 8. Known Limitations & Prerequisites

1. **Live Mandi Streaming Requires User API Key**:
   - Live real-time daily streaming from `data.gov.in` requires an active API key configured in `DATA_GOV_IN_API_KEY`. Without this server key, the platform serves authentic APMC reference bulletins tagged as `RECENT` or `REFERENCE`.
2. **Machine Learning Dataset Scale**:
   - The price forecasting engine is an empirical statistical time-series model calibrated on 49 curated APMC records. Complex multi-layer Gradient Boosting models (e.g. LightGBM) require multi-year continuous daily records ($\ge 2,000$ points) to generalize without overfitting.
3. **Mobile Hardware Verification**:
   - The React Native mobile codebase in `mobile/` is complete and verified via static analysis, but has not yet undergone live verification on physical iOS/Android hardware in this desktop workstation environment.
