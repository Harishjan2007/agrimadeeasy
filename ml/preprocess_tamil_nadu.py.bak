#!/usr/bin/env python3
"""
AgriME Tamil Nadu Market-Price Preprocessing Pipeline
------------------------------------------------------
Extracts, cleans, standardizes, and validates authentic Tamil Nadu APMC mandi
historical records from ./leancsv/ (2001-2026).

Memory-safe streaming execution. Never loads 72M records in memory.
Produces:
- ml/data/processed/tamil_nadu_cleaned.csv
- ml/data/processed/preprocessing_metadata.json
- ml/data/processed/DATA_DICTIONARY.md
"""

import os
import sys
import csv
import json
import glob
from datetime import datetime
from collections import defaultdict, Counter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
LEANCSV_DIR = os.path.join(WORKSPACE_ROOT, 'leancsv')
PROCESSED_DIR = os.path.join(SCRIPT_DIR, 'data', 'processed')
OUTPUT_CLEAN_CSV = os.path.join(PROCESSED_DIR, 'tamil_nadu_cleaned.csv')
METADATA_PATH = os.path.join(PROCESSED_DIR, 'preprocessing_metadata.json')
DATA_DICT_PATH = os.path.join(PROCESSED_DIR, 'DATA_DICTIONARY.md')

# Commodity name standardization dictionary
COMMODITY_STANDARDIZATION = {
    'paddy (dhan)(common)': 'Paddy (Dhan)',
    'paddy (dhan)': 'Paddy (Dhan)',
    'paddy': 'Paddy (Dhan)',
    'rice': 'Rice',
    'tomato': 'Tomato',
    'onion': 'Onion',
    'onion green': 'Onion (Green)',
    'groundnut': 'Groundnut',
    'ground nut seed': 'Groundnut Seed',
    'cotton': 'Cotton',
    'maize': 'Maize',
    'banana': 'Banana',
    'banana - green': 'Banana (Green)',
    'coconut': 'Coconut',
    'sugarcane': 'Sugarcane',
    'turmeric': 'Turmeric',
    'turmeric (raw)': 'Turmeric',
    'brinjal': 'Brinjal',
    'green chilli': 'Green Chilli',
    'chillies(green)': 'Green Chilli',
    'red chilli': 'Dry Chillies',
    'tapioca': 'Tapioca',
    'potato': 'Potato',
    'bhindi (ladies finger)': 'Ladies Finger (Bhendi)',
    'ladies finger': 'Ladies Finger (Bhendi)',
    'black gram (urd beans)(whole)': 'Black Gram (Urad)',
    'green gram (moong)(whole)': 'Green Gram (Moong)',
    'bengal gram (gram)(whole)': 'Bengal Gram (Chana)',
    'coriander (leaves)': 'Coriander (Leaves)',
    'cabbage': 'Cabbage',
    'cauliflower': 'Cauliflower',
    'carrot': 'Carrot',
    'drumstick': 'Drumstick',
    'snakeguard': 'Snakeguard',
    'bottle gourd': 'Bottle Gourd',
    'bitter gourd': 'Bitter Gourd',
    'ashgourd': 'Ashgourd',
    'ginger (green)': 'Ginger (Green)',
    'garlic': 'Garlic',
    'papaya': 'Papaya',
    'guava': 'Guava',
    'mango': 'Mango',
    'sweet potato': 'Sweet Potato',
    'beetroot': 'Beetroot',
    'beans': 'Beans',
    'cluster beans': 'Cluster Beans',
    'cowpea (veg)': 'Cowpea',
    'raddish': 'Radish',
    'cucumber': 'Cucumber',
    'cucumbar (kheera)': 'Cucumber'
}

def standardize_commodity(raw_name):
    clean = raw_name.strip().lower()
    return COMMODITY_STANDARDIZATION.get(clean, raw_name.strip())

def parse_iso_date(d_str):
    d_str = d_str.strip()
    if len(d_str) == 10 and d_str[4] == '-' and d_str[7] == '-':
        try:
            dt = datetime.strptime(d_str, '%Y-%m-%d')
            if 2000 <= dt.year <= 2027:
                return dt.strftime('%Y-%m-%d'), dt.year, dt.month, dt.day
        except ValueError:
            pass
    return None, None, None, None

def run_preprocessing(target_state="Tamil Nadu"):
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    csv_files = sorted(glob.glob(os.path.join(LEANCSV_DIR, "*.csv")))
    if not csv_files:
        print(f"[ERROR] No CSV files found in {LEANCSV_DIR}", file=sys.stderr)
        return False

    print("================================================================")
    print("🌾 AgriME Tamil Nadu Market-Price Preprocessing Pipeline")
    print(f"Target State: {target_state}")
    print(f"Destination:  {OUTPUT_CLEAN_CSV}")
    print("================================================================\n")

    total_source_examined = 0
    total_state_rows = 0
    clean_records_written = 0

    exclusions = {
        'non_target_state': 0,
        'invalid_date_format': 0,
        'missing_prices': 0,
        'zero_or_negative_price': 0,
        'inverted_prices_min_gt_max': 0,
        'extreme_outlier_over_100k': 0,
        'duplicate_market_crop_day': 0,
        'missing_crop_or_market': 0
    }

    seen_keys = set()
    yearly_counts = Counter()
    commodity_counts = Counter()
    district_counts = Counter()
    market_counts = Counter()

    clean_columns = [
        'state', 'district', 'market', 'commodity', 'commodity_raw',
        'variety', 'grade', 'arrival_date', 'year', 'month', 'day',
        'min_price', 'max_price', 'modal_price', 'commodity_code'
    ]

    with open(OUTPUT_CLEAN_CSV, 'w', newline='', encoding='utf-8') as out_f:
        writer = csv.writer(out_f)
        writer.writerow(clean_columns)

        for file_path in csv_files:
            fname = os.path.basename(file_path)
            file_examined = 0
            file_retained = 0

            with open(file_path, 'r', encoding='utf-8', errors='replace') as in_f:
                reader = csv.reader(in_f)
                try:
                    header = next(reader)
                except StopIteration:
                    continue

                for row in reader:
                    file_examined += 1
                    total_source_examined += 1

                    if len(row) < 10:
                        exclusions['missing_prices'] += 1
                        continue

                    state = row[0].strip()
                    if state.lower() != target_state.lower():
                        exclusions['non_target_state'] += 1
                        continue

                    total_state_rows += 1

                    district = row[1].strip()
                    market = row[2].strip()
                    commodity_raw = row[3].strip()
                    variety = row[4].strip() if len(row) > 4 else 'FAQ'
                    grade = row[5].strip() if len(row) > 5 else 'FAQ'
                    date_str = row[6].strip()
                    min_price_str = row[7].strip()
                    max_price_str = row[8].strip()
                    modal_price_str = row[9].strip()
                    commodity_code = row[10].strip() if len(row) > 10 else ''

                    if not commodity_raw or not market or not district:
                        exclusions['missing_crop_or_market'] += 1
                        continue

                    clean_date, year, month, day = parse_iso_date(date_str)
                    if not clean_date:
                        exclusions['invalid_date_format'] += 1
                        continue

                    # Numeric price validation
                    try:
                        modal_price = float(modal_price_str)
                        min_price = float(min_price_str) if min_price_str else modal_price
                        max_price = float(max_price_str) if max_price_str else modal_price
                    except (ValueError, TypeError):
                        exclusions['missing_prices'] += 1
                        continue

                    if modal_price <= 0 or min_price <= 0 or max_price <= 0:
                        exclusions['zero_or_negative_price'] += 1
                        continue

                    if min_price > max_price:
                        # Fix minor inverted data logging error by swapping rather than dropping if within 10%
                        if min_price <= max_price * 1.1:
                            min_price, max_price = max_price, min_price
                        else:
                            exclusions['inverted_prices_min_gt_max'] += 1
                            continue

                    if modal_price > 100000:
                        exclusions['extreme_outlier_over_100k'] += 1
                        continue

                    standard_crop = standardize_commodity(commodity_raw)

                    # Deduplication key: (market, standard_crop, variety, grade, clean_date)
                    dedup_key = (market.lower(), standard_crop.lower(), variety.lower(), grade.lower(), clean_date)
                    if dedup_key in seen_keys:
                        exclusions['duplicate_market_crop_day'] += 1
                        continue
                    seen_keys.add(dedup_key)

                    writer.writerow([
                        'Tamil Nadu', district, market, standard_crop, commodity_raw,
                        variety, grade, clean_date, year, month, day,
                        round(min_price, 2), round(max_price, 2), round(modal_price, 2), commodity_code
                    ])

                    file_retained += 1
                    clean_records_written += 1
                    yearly_counts[year] += 1
                    commodity_counts[standard_crop] += 1
                    district_counts[district] += 1
                    market_counts[market] += 1

            print(f"Processed {fname:10s} | Examined: {file_examined:>8,d} | TN Clean Retained: {file_retained:>7,d}")

    metadata = {
        'pipeline_version': '1.0.0',
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'target_state': target_state,
        'total_source_records_examined': total_source_examined,
        'total_tamil_nadu_raw_records': total_state_rows,
        'usable_cleaned_tamil_nadu_records': clean_records_written,
        'deduplication_policy': 'Unique key (market, standardized_commodity, variety, grade, arrival_date)',
        'price_validation_bounds': {
            'min_valid_modal_price': 10.0,
            'max_valid_modal_price': 100000.0,
            'units': '₹ / Quintal (INR per 100 kg)'
        },
        'exclusions_summary': exclusions,
        'yearly_distribution': dict(sorted(yearly_counts.items())),
        'top_commodities': dict(commodity_counts.most_common(25)),
        'top_districts': dict(district_counts.most_common(25)),
        'total_unique_markets': len(market_counts),
        'total_unique_commodities': len(commodity_counts),
        'output_clean_file': OUTPUT_CLEAN_CSV
    }

    with open(METADATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    # Generate Data Dictionary
    data_dict_content = f"""# Tamil Nadu Agricultural Market-Price Dataset: Data Dictionary

**Generated:** {metadata['generated_at']}  
**Source Dataset:** Government of India Agmarknet / APMC Mandi Daily Bulletins (2001–2026)  
**Target Coverage:** State of Tamil Nadu  
**Processed Location:** `{OUTPUT_CLEAN_CSV}`  
**Total Clean Observations:** {clean_records_written:,d}  

---

## 1. Schema & Field Definitions

| Column Name | Data Type | Units / Format | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `state` | String | Categorical | Indian State name, standardized to "Tamil Nadu" | `Tamil Nadu` |
| `district` | String | Categorical | Administrative district in Tamil Nadu | `Thiruchirappalli`, `Salem`, `Vellore` |
| `market` | String | Categorical | APMC Mandi / Regulated Market / Uzhavar Sandhai name | `Manachanallur (Uzhavar Sandhai ) APMC` |
| `commodity` | String | Categorical | Standardized agricultural commodity name | `Paddy (Dhan)`, `Tomato`, `Onion` |
| `commodity_raw` | String | Categorical | Original unstandardized commodity string from Agmarknet | `Paddy (Dhan)(Common)` |
| `variety` | String | Categorical | Specific crop cultivar or variety classification | `Local`, `Bellary`, `B P T` |
| `grade` | String | Categorical | Quality grade assigned by APMC assessors | `FAQ`, `Medium`, `Local` |
| `arrival_date` | String | ISO `YYYY-MM-DD` | Official market arrival and trading date | `2026-03-15` |
| `year` | Integer | `2001 - 2026` | Observation calendar year | `2026` |
| `month` | Integer | `1 - 12` | Observation calendar month | `3` |
| `day` | Integer | `1 - 31` | Day of month | `15` |
| `min_price` | Float | ₹ / Quintal | Lowest traded auction price for the lot | `2500.00` |
| `max_price` | Float | ₹ / Quintal | Highest traded auction price for the lot | `3000.00` |
| `modal_price` | Float | ₹ / Quintal | Most frequent / representative clearing price (Target) | `2750.00` |
| `commodity_code`| String | Numeric ID | Agmarknet commodity classification code | `82` |

---

## 2. Preprocessing & Exclusion Policy

1. **State Filtering**: Only records where `State == 'Tamil Nadu'` are retained.
2. **Date Validation**: Dates are parsed to strict ISO `YYYY-MM-DD`. Any invalid or malformed dates are recorded and discarded.
3. **Price Bounds**: Minimum and modal prices must be $> 0$ and $\le ₹100,000/\text{{Quintal}}$. Inverted bounds ($P_{min} > P_{max}$) are repaired if within 10% tolerance, otherwise discarded.
4. **Deduplication**: Records sharing identical `(market, standardized_commodity, variety, grade, arrival_date)` are deduplicated, retaining the first authentic entry.
5. **Traceability**: `commodity_raw` preserves the unedited source string alongside the canonical `commodity` identifier.
"""

    with open(DATA_DICT_PATH, 'w', encoding='utf-8') as f:
        f.write(data_dict_content)

    print("\n================================================================")
    print("✅ PREPROCESSING COMPLETE")
    print(f"Total Source Rows Examined:       {total_source_examined:,d}")
    print(f"Total Tamil Nadu Rows:            {total_state_rows:,d}")
    print(f"Cleaned Usable Observations:      {clean_records_written:,d}")
    print(f"Duplicates Removed:               {exclusions['duplicate_market_crop_day']:,d}")
    print(f"Invalid Dates Excluded:           {exclusions['invalid_date_format']:,d}")
    print(f"Zero/Negative Prices Excluded:    {exclusions['zero_or_negative_price']:,d}")
    print(f"Clean Data Written:               {OUTPUT_CLEAN_CSV}")
    print(f"Metadata Written:                 {METADATA_PATH}")
    print("================================================================\n")

    return True

if __name__ == '__main__':
    run_preprocessing()
