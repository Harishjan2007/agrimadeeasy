# AgriME Mobile Application (Expo / React Native)

The official cross-platform mobile application for the **AgriME Agricultural Decision & Service Platform**, built with React Native and Expo, sharing the same live Supabase database, data models, and ML prediction pipelines as the AgriME web platform.

---

## 📱 Mobile Features

1. **Live & Recent Mandi Prices**:
   - Honest provenance badges (`LIVE`, `RECENT`, `REFERENCE`, `DEMO/FALLBACK`).
   - Modal, Min, and Max price breakdown per quintal/unit.
   - 30-Day historical price modal with actual mandi trends.
   - Search by crop or mandi, with category filters (Cereals, Vegetables, Spices, Commercial).

2. **Statistical Crop-Price Prediction**:
   - 7-day, 15-day, and 30-day forecast horizons.
   - Empirical prediction intervals ($\pm 1.96 \times \text{RMSE}$).
   - Transparent evaluation metrics on held-out test split ($R^2 \approx 0.77 - 0.84$).
   - Clear statistical limitations disclosure.

3. **Agricultural Machinery Discovery & Booking**:
   - Search and filter Tractors, Harvesters, and Power Tillers.
   - Hourly and daily shift rates.
   - Booking form with date, time, duration, and farm location.
   - Dynamic role switcher: **Farmer Mode** (book machines) and **Provider Mode** (manage trips and broadcast GPS).

4. **Live GPS Machinery Tracking**:
   - Real-time GPS location via `expo-location`.
   - Haversine distance calculation to farm field.
   - Honest ETA calculation based on rural road travel speeds ($25\text{ km/h}$).
   - Integrated Google Maps navigation and direct one-tap call to operator.
   - Trip progression lifecycle: `confirmed` → `on_the_way` → `arrived` → `in_progress` → `completed`.

5. **Dealers & Agricultural Services**:
   - Search by dealer name, district, or agricultural inputs.
   - Direct call action to store owner.
   - Address and inventory information.

6. **Government Schemes & Subsidies**:
   - Central and State schemes (PM-KISAN, SMAM machinery subsidy, PMKSY micro-irrigation).
   - Clear eligibility criteria and benefits breakdown.
   - Direct link to official government portals.

7. **Farmer-to-Buyer Marketplace**:
   - Direct produce listings without middlemen.
   - Create produce listings with crop name, quantity, and asking price.
   - Direct phone contact to farmer.

8. **Farm Store**:
   - Seeds, bio-inputs, fertilizers, and irrigation equipment.
   - Transparent order settlement: In-store pickup or Cash-on-Delivery (no fake digital payment claims).

9. **Bilingual English & Tamil**:
   - Instant language toggle across all screens with native Tamil agricultural terminology.

---

## 🚀 Running the Mobile App

### Prerequisites
- Node.js 18+ installed.
- Expo CLI (`npx expo`) or Expo Go app on your physical iOS/Android phone.

### Installation
```bash
# Navigate to the mobile directory
cd mobile

# Install dependencies
npm install
```

### Launch Development Server
```bash
# Start Expo development bundler
npx expo start

# Or to target Android specifically
npx expo run:android

# Or to target iOS (macOS required)
npx expo run:ios

# Or run in web preview
npx expo start --web
```

Scan the QR code displayed in your terminal using the **Expo Go** app on your Android or iOS device to test the app live with device GPS!
