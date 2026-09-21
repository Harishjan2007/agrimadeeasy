# AgriME Master Implementation Plan: Agricultural Decision-Support Platform Upgrade

## Project Objective
Upgrade the existing AgriME project into a more functional agricultural decision-support platform while strictly preserving all existing functionality, routes, roles, Supabase integrations, and English/Tamil localization.

---

## Phase 1 Inspection Report & Findings

### 1. Existing Architecture & Flow
- **Framework**: Next.js 16 (App Router) + React 18 + TypeScript + Tailwind CSS.
- **Entrypoints**: Routes in `src/app/` (`/`, `/crop-price`, `/prediction`, `/dealers`, `/machinery`, `/bookings`, `/ecommerce`, `/schemes`, `/login`, `/signup`, `/profile`, `/dealer`, `/machinery-provider`) render client-side page components.
- **State Management**: `AgriContext.tsx` handles demo state, active role switching, shopping cart state, and localStorage backup.
- **Supabase Integration**: Singleton client in `src/lib/supabase/client.ts` configured via `.env.local`. Modular database clients in `src/lib/supabase/` (`crops.ts`, `schemes.ts`, `dealers.ts`, `farmer-produce.ts`, `auth.ts`, `useAuth.ts`).
- **Localization**: Dual-language architecture in `LanguageContext.tsx` supporting English (`en.ts`) and Tamil (`ta.ts`) with translation helpers.

### 2. Existing Database Tables
The 13 application tables defined in `supabase/schema.sql` are already active in the user's Supabase project:
1. `profiles`
2. `crops`
3. `markets`
4. `crop_prices`
5. `crop_predictions`
6. `schemes`
7. `dealers`
8. `dealer_crop_prices`
9. `products`
10. `machinery`
11. `machinery_bookings`
12. `farmer_produce_listings`
13. `produce_requests`

> [!NOTE]
> **No database schema changes or migrations are needed.** The existing 13 tables support every single functional requirement in this master prompt.

### 3. Module Gaps & Improvement Strategy
| Module | Current State | Improvement Needed |
| :--- | :--- | :--- |
| **Government Schemes** | Directory with search and level/category filters | Add "Find Schemes for Me" matching calculator using real scheme criteria (land size, crop, purpose, state) with honest qualification language. |
| **Crop Prices** | Browse prices with single-crop calculator | Add actionable Multi-Market & Dealer Price Comparison view side-by-side for the same crop. |
| **Price Predictions** | Browse predictions with trend filters | Add Decision-Support tool (Crop + Market + Horizon) with forecast trend, price range, and selling guidance without fake AI claims. |
| **Dealers** | Merchant directory with basic text search | Add Crop & Location dropdown filters with Mandi benchmark comparison to show buying premium/discount. |
| **Machinery & Bookings** | Mock catalog & dummy form; bookings in mock array | Create `src/lib/supabase/machinery.ts`, save real bookings to `machinery_bookings`, persist across refresh into `/bookings`. |
| **Farm Store (Inputs)** | Store catalog with simulated cart checkout | Implement authentic Order Confirmation (Cash on Delivery / Dealer Pickup) with reference IDs and no fake payment gateway. |
| **Produce Marketplace** | Listings and buyer requests implemented | Preserve all functionality; verify Supabase persistence and refresh retention. |
| **Home Page** | Hero, ticker, services, previews | Re-align with core decision journey: Crop -> Price Info -> Price Forecast -> Selling Decision. Remove "AI Forecast" label. |
| **Localization** | Comprehensive English & Tamil trees | Add missing keys for all new filters, buttons, forms, and guidance in `en.ts` and `ta.ts`. |

---

## Phased Implementation Sequence

### Phase 2: Government Schemes — Personalized Finder ("Find Schemes for Me")
- Add "Find Schemes for Me" tab/modal in `src/components/schemes/SchemesPageClient.tsx`.
- Farmer inputs:
  - Land Size: Marginal (< 1 ha / 2.5 acres), Small (1-2 ha), Medium/Large (> 2 ha).
  - Crop Category: Cereals/Paddy, Horticulture, Oilseeds/Commercial, Any.
  - Farmer Category / Special Status: General, Small & Marginal Farmer (SMF), Women Farmer.
  - Primary Need: Machinery Subsidy, Crop Insurance, Irrigation, Direct Income, Credit/KCC, Organic Farming.
  - State: Tamil Nadu / All India.
- Matching logic evaluated against `category`, `eligibility`, `description`, `government_level`.
- Output displays: Scheme name, why it matches, benefits summary, official application notes, and verified official government URL.
- Language: "Potentially relevant", "Matches your selected criteria", "Please verify official guidelines".
- English & Tamil translations.

### Phase 3: Crop Prices — Actionable Price Comparison
- Upgrade `src/components/crop-price/CropPricePageClient.tsx`:
  - Dedicated "Compare Available Market Rates" interface for a selected crop.
  - Side-by-side comparison across all available mandis and registered dealer quotes.
  - Displays: Mandi/Dealer name, Location, Current price, Recorded date, Price spread (difference between highest and lowest rates), Source.
  - Honest message when only 1 market exists or no comparison data is available.
  - English & Tamil translations.

### Phase 4: Price Predictions — Decision Support Flow
- Upgrade `src/components/prediction/PredictionPageClient.tsx`:
  - Interactive Decision Selector: Select Crop + Market + Horizon (7, 15, 30 days).
  - Output: Current Price, Trend (Increasing / Decreasing / Stable), Estimated Range (Min - Max), Suggested Action Guidance (e.g. "Price expected to rise: consider holding inventory if safe storage is available" or "Price steady/easing: consider selling at current mandi benchmark").
  - Prominent disclaimer: "Predictions are estimates and are not guaranteed."
  - Honest empty state when no forecast exists for the selection.
  - English & Tamil translations.

### Phase 5: Dealers — Actionable Discovery & Filtering
- Upgrade `src/components/dealers/DealersPageClient.tsx`:
  - Add Crop and Location dropdown filters alongside text search.
  - For each dealer, display active buying price for the selected crop compared against APMC Mandi benchmark rate.
  - Full shop address, contact number, opening hours.
  - English & Tamil translations.

### Phase 6: Machinery — Functional Booking Workflow & Supabase Persistence
- Create `src/lib/supabase/machinery.ts`:
  - `getMachinery()`: Fetch machinery from Supabase `machinery` table (with fallback).
  - `getMachineryBookings(farmerId)`: Fetch reservations from `machinery_bookings`.
  - `createMachineryBooking(...)`: Insert booking into Supabase `machinery_bookings`.
  - `cancelMachineryBooking(bookingId)`: Update booking status to `cancelled`.
- Update `src/components/machinery/MachineryPageClient.tsx` and `MachineryBookingForm.tsx`:
  - Connect booking submission to `machinery.ts` and `AgriContext`.
  - Save booking, persist to Supabase, survive refresh.
- Update `src/app/bookings/page.tsx`:
  - Load bookings from Supabase/AgriContext.
  - Enable live cancellation with status reflection.
  - Label future features honestly ("Live provider GPS tracking — planned for future release").
  - English & Tamil translations.

### Phase 7: Farm Store / E-commerce — Authentic Order Flow
- Update `src/components/ecommerce/EcommercePageClient.tsx`:
  - Authentic checkout: Cash on Delivery (COD) or Store Pickup.
  - Generates verifiable Order Confirmation with unique Reference ID (`ORD-...`), contact number, delivery/pickup address, and itemized bill.
  - Zero fake payment gateway or fake card/UPI claims.
  - English & Tamil translations.

### Phase 8: Farmer-to-Buyer Marketplace — Persistence Verification
- Verify and polish `src/components/ecommerce/FarmerMarketplace.tsx`:
  - Ensure listing creation, request creation, and accept/reject flows persist to Supabase `farmer_produce_listings` and `produce_requests`.
  - Ensure refresh retains listings and request status updates.
  - Maintain clean fallback when unauthenticated.
  - English & Tamil translations.

### Phase 9: Home Page Decision-Support Positioning
- Update `src/components/home/Hero.tsx` and `QuickServices.tsx`:
  - Communicate core journey: CROP -> MANDI PRICE -> PRICE FORECAST -> BETTER SELLING DECISION.
  - Replace "AI Forecast" badge with "Trend Forecast".
  - Ensure supporting services (Machinery, Dealers, Schemes, Store, Marketplace) clearly frame the platform's utility.
  - English & Tamil translations.

### Phase 10: Localization Audit
- Audit `src/i18n/en.ts`, `src/i18n/ta.ts`, and `src/i18n/types.ts`.
- Ensure all new strings (Scheme Finder, Price Comparison, Prediction Decision, Machinery Booking, Store Orders) are present in both English and Tamil.

### Phase 11: Responsiveness & Overflow Verification
- Verify layout integrity on Mobile (375px), Tablet (768px), and Desktop (1280px).
- Prevent horizontal overflows and ensure comfortable tap targets.

### Phase 12: Validation & Quality Checks
- Run `npm run lint` and TypeScript compilation checks (`npm run build`).
- Verify zero runtime console errors.
