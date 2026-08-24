# AgriME - Agricultural Marketplace & Farmer Support Platform

AgriME is a modern, full-stack agricultural web platform engineered specifically for Indian farmers, agricultural crop-buying dealers, and farm machinery rental providers.

---

## 🌾 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 & TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **Deployment & Tooling**: Node.js & PostCSS

---

## 👥 Primary User Roles

1. **Farmer (`farmer`)**:
   - Track real-time APMC mandi crop prices & forward prediction trends.
   - Search & contact verified crop-buying dealers (who purchase harvested produce for cash).
   - Browse and rent farm machinery (Tractors, Combine Harvesters, Power Tillers) by the hour.
   - Track booking statuses under **My Bookings**.
   - Browse agricultural inputs (seeds, fertilizers, bio-pesticides) in the e-commerce store.
   - Explore and apply for government welfare schemes (PM-Kisan, SMAM, PMFBY).

2. **Agricultural Dealer (`dealer`)**:
   - Manage shop profile, address, and operating hours.
   - Publish live crop buying prices (e.g. Paddy, Groundnut, Cotton) for farmers.
   - Manage agricultural input product listings & inventory.

3. **Machinery Provider (`machinery_provider`)**:
   - Register farm machinery with hourly rates and location.
   - Toggle availability status (`Available` ↔ `Unavailable`).
   - Review incoming farmer booking requests and Accept/Reject them in real time.

---

## 📁 Project Structure

```
agri-antigravity/
├── src/
│   ├── app/
│   │   ├── globals.css              # Custom Tailwind directives & AgriME tokens
│   │   ├── layout.tsx               # Root layout with persistent Header & Footer
│   │   ├── page.tsx                 # Full-featured Home page
│   │   ├── login/                   # Supabase authentication login
│   │   ├── signup/                  # Role-aware signup (Farmer / Dealer / Machinery Provider)
│   │   ├── profile/                 # Profile view & sign-out
│   │   ├── crop-price/              # APMC mandi crop price monitoring & comparison
│   │   ├── prediction/              # Crop price projections & seasonal trends
│   │   ├── dealers/                 # Crop buyer discovery & dealer details
│   │   │   └── [id]/
│   │   ├── ecommerce/               # Agricultural inputs & products marketplace
│   │   ├── machinery/               # Farm equipment rental & booking modal
│   │   ├── bookings/                # Farmer's "My Bookings" tracking
│   │   ├── dealer/                  # Dealer dashboard & price management
│   │   └── machinery-provider/      # Machinery host dashboard & request approval
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx           # Responsive navigation bar with role portal links
│   │   │   └── Footer.tsx           # Agricultural platform footer & transparency notices
│   │   └── home/
│   │       ├── Hero.tsx             # Hero banner with value proposition
│   │       ├── MarketPriceTicker.tsx# Real-time mandi rates strip
│   │       ├── QuickServices.tsx    # 6 Integrated farmer tool cards
│   │       ├── CropPricePreview.tsx # Live crop price cards & APMC sources
│   │       ├── PredictionPreview.tsx# Stored price trend forecast previews
│   │       └── Recommendations.tsx  # Top buyers, machinery, and subsidy highlights
│   ├── lib/
│   │   ├── mock-data.ts             # Realistic seed dataset for crops, mandis, and rentals
│   │   └── supabase/
│   │       └── client.ts            # Browser Supabase client setup
│   └── types/
│       └── index.ts                 # Full TypeScript interfaces for all data models
├── .env.example                     # Supabase environment variables template
├── .gitignore                       # Git ignore configuration
├── next.config.mjs                  # Next.js configuration
├── package.json                     # Project manifest & scripts
├── postcss.config.mjs               # PostCSS configuration
├── tailwind.config.ts               # Custom agricultural color palette & styling
├── tsconfig.json                    # TypeScript compiler options
└── README.md
```

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Key Routes

| Route | Description | Target Role |
|---|---|---|
| `/` | Landing page with live prices, quick tools, and recommendations | All / Public |
| `/crop-price` | Crop price directory with search, filters, and comparisons | Farmers |
| `/prediction` | Seasonal price trend forecasts and stored market outlooks | Farmers |
| `/dealers` | Directory of crop buyers who purchase produce directly | Farmers |
| `/dealers/[id]` | Dealer profile, location, and active crop buying prices | Farmers |
| `/machinery` | Machinery rental catalog with hourly booking workflow | Farmers |
| `/bookings` | Status tracker for farmer machinery bookings | Farmers |
| `/ecommerce` | Agricultural inputs marketplace (seeds, fertilizers) | Farmers |
| `/schemes` | Government subsidies and welfare scheme details | Farmers |
| `/dealer` | Agricultural dealer dashboard & price manager | Dealers |
| `/machinery-provider` | Equipment provider dashboard & booking approval | Machinery Providers |
| `/login` | Account sign-in | All |
| `/signup` | Role-based registration | All |
| `/profile` | Profile details & sign-out | All |

---

## 🔒 Security & Data Integrity

- Row Level Security (RLS) is enabled across all tables.
- Dealers only have update access to their own shop and prices.
- Machinery providers only have update access to their own machinery and booking requests.
- No client-side exposure of service role keys.
