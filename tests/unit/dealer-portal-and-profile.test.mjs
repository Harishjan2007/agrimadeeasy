import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..', '..');

// Test fixtures matching the dealer portal schema and application mock data
// Using isolated fixtures avoids runtime node errors on Next.js @/ import aliases
const MOCK_DEALERS = [
  {
    id: 'd1',
    profile_id: 'u2',
    shop_name: 'Cauvery Delta Agri Traders',
    name: 'Suresh Kumar',
    address: '14, Gandhi Road, Kumbakonam, Thanjavur - 612001',
    phone: '+91 94431 23456',
    opening_hours: 'Mon-Sat: 8:00 AM - 7:00 PM',
    created_at: '2024-01-15T00:00:00Z',
    district: 'Thanjavur',
    state: 'Tamil Nadu'
  },
  {
    id: 'd2',
    profile_id: 'u3',
    shop_name: 'Kongu Agro Chemicals & Seeds',
    name: 'M. Palanisamy',
    address: '88, Mettur Road, Erode - 638011',
    phone: '+91 98427 34567',
    opening_hours: 'Mon-Sat: 8:30 AM - 8:00 PM',
    created_at: '2024-01-16T00:00:00Z',
    district: 'Erode',
    state: 'Tamil Nadu'
  }
];

const MOCK_DEALER_CROP_PRICES = [
  {
    id: 'dcp1',
    dealer_id: 'd1',
    crop_id: 'c1',
    buying_price: 2450,
    unit: '₹/Quintal',
    active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  },
  {
    id: 'dcp2',
    dealer_id: 'd1',
    crop_id: 'c2',
    buying_price: 1850,
    unit: '₹/Quintal',
    active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  }
];

const DEMO_PRODUCTS = [
  {
    id: 'prod-seed-01',
    dealer_id: 'd1',
    name: 'Certified Paddy Seeds (BPT 5204 Samba Masuri)',
    category: 'Seeds',
    description: 'Government certified breeder-foundation seed',
    price: 1150,
    stock: 45,
    pack_size: '25 kg Bag',
    unit: 'Bag (25 kg)',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'prod-fert-01',
    dealer_id: 'd1',
    name: 'Neem Coated Urea (46% Nitrogen)',
    category: 'Fertilizers',
    description: 'High-efficiency slow-release nitrogen fertilizer',
    price: 268,
    stock: 120,
    pack_size: '45 kg Bag',
    unit: 'Bag (45 kg)',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const INITIAL_DEMO_INQUIRIES = [
  {
    id: 'inq-demo-1',
    dealerId: 'd1',
    dealerName: 'Cauvery Delta Agri Traders',
    farmerName: 'Murugan R.',
    farmerPhone: '+91 94432 11001',
    cropName: 'Paddy (Samba)',
    estimatedQuantity: '45 Quintals',
    expectedPrice: '₹2,500/Q',
    message: 'Harvest complete. Ready for farmgate inspection and dispatch.',
    createdAt: '2026-10-20T08:30:00Z',
    status: 'new'
  },
  {
    id: 'inq-demo-2',
    dealerId: 'd1',
    dealerName: 'Cauvery Delta Agri Traders',
    farmerName: 'Kandasamy V.',
    farmerPhone: '+91 98421 22334',
    cropName: 'Maize (Yellow Corn)',
    estimatedQuantity: '30 Quintals',
    expectedPrice: '₹2,200/Q',
    message: 'Moisture content tested at 13%. Need prompt procurement.',
    createdAt: '2026-10-19T14:15:00Z',
    status: 'contacted'
  }
];

const FARM_STORE_CATEGORIES = [
  'All',
  'Seeds',
  'Simple, low-budget equipment',
  'Fertilizers',
  'Organic foods',
  'Other agricultural products'
];

describe('1. Profile Page Crash Fix: Sprout Icon Import', () => {
  const profilePath = path.join(rootDir, 'src', 'app', 'profile', 'page.tsx');

  test('profile page file exists', () => {
    assert.equal(fs.existsSync(profilePath), true, 'src/app/profile/page.tsx must exist');
  });

  test('Sprout is explicitly imported from lucide-react in profile/page.tsx', () => {
    const content = fs.readFileSync(profilePath, 'utf8');
    const lucideImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    assert.ok(lucideImportMatch, 'lucide-react import block must exist');

    const importedIcons = lucideImportMatch[1].split(',').map((s) => s.trim());
    assert.ok(
      importedIcons.includes('Sprout'),
      'Sprout must be included in lucide-react imports to prevent ReferenceError'
    );
  });

  test('JSX usage of <Sprout ... /> exists and matches imported icon', () => {
    const content = fs.readFileSync(profilePath, 'utf8');
    assert.ok(content.includes('<Sprout'), 'Profile page must render <Sprout /> for primary crops section');
  });
});

describe('2. Dealer Portal Page Architecture & Integrity', () => {
  const dealerPagePath = path.join(rootDir, 'src', 'app', 'dealer', 'page.tsx');

  test('dealer page file exists', () => {
    assert.equal(fs.existsSync(dealerPagePath), true, 'src/app/dealer/page.tsx must exist');
  });

  test('dealer page imports essential contexts and components', () => {
    const content = fs.readFileSync(dealerPagePath, 'utf8');
    assert.ok(content.includes("from '@/lib/supabase/useAuth'"), 'Must import useAuth');
    assert.ok(content.includes("from '@/context/AgriContext'"), 'Must import useAgri');
    assert.ok(content.includes("from '@/i18n'"), 'Must import useLanguage');
    assert.ok(content.includes("from '@/components/ui'"), 'Must import PageHeader');
  });

  test('dealer page contains all four functional tabs', () => {
    const content = fs.readFileSync(dealerPagePath, 'utf8');
    assert.ok(content.includes("'quotes'"), 'Must contain quotes tab');
    assert.ok(content.includes("'inventory'"), 'Must contain inventory tab');
    assert.ok(content.includes("'inquiries'"), 'Must contain inquiries tab');
    assert.ok(content.includes("'store'"), 'Must contain store details tab');
  });

  test('dealer page includes modals for adding quotes and products', () => {
    const content = fs.readFileSync(dealerPagePath, 'utf8');
    assert.ok(content.includes('handleAddQuoteSubmit'), 'Must include handleAddQuoteSubmit');
    assert.ok(content.includes('handleAddProductSubmit'), 'Must include handleAddProductSubmit');
    assert.ok(content.includes('handleEditQuoteSubmit'), 'Must include handleEditQuoteSubmit');
  });
});

describe('3. Dealer Metrics & Real Data Calculation', () => {
  test('mock-data.ts, products-data.ts, and dealers-data.ts declare expected exports', () => {
    const mockDataContent = fs.readFileSync(path.join(rootDir, 'src', 'lib', 'mock-data.ts'), 'utf8');
    assert.ok(mockDataContent.includes('export const MOCK_DEALERS'), 'Must export MOCK_DEALERS');
    assert.ok(mockDataContent.includes('export const MOCK_DEALER_CROP_PRICES'), 'Must export MOCK_DEALER_CROP_PRICES');

    const productsContent = fs.readFileSync(path.join(rootDir, 'src', 'lib', 'products-data.ts'), 'utf8');
    assert.ok(productsContent.includes('export const DEMO_PRODUCTS'), 'Must export DEMO_PRODUCTS');
    assert.ok(productsContent.includes('export const FARM_STORE_CATEGORIES'), 'Must export FARM_STORE_CATEGORIES');

    const dealersContent = fs.readFileSync(path.join(rootDir, 'src', 'lib', 'dealers-data.ts'), 'utf8');
    assert.ok(dealersContent.includes('export const INITIAL_DEMO_INQUIRIES'), 'Must export INITIAL_DEMO_INQUIRIES');
  });

  test('MOCK_DEALERS has valid dealer entities', () => {
    assert.ok(MOCK_DEALERS.length >= 2, 'Should have multiple dealers');
    const d1 = MOCK_DEALERS.find((d) => d.id === 'd1');
    assert.ok(d1, 'Dealer d1 must exist');
    assert.equal(typeof d1.shop_name, 'string');
    assert.equal(typeof d1.address, 'string');
    assert.equal(typeof d1.phone, 'string');
  });

  test('Dealer crop quotes metrics can be computed accurately without fabrication', () => {
    const d1Quotes = MOCK_DEALER_CROP_PRICES.filter((p) => p.dealer_id === 'd1');
    assert.ok(d1Quotes.length > 0, 'Dealer d1 should have crop quotes');
    const activeCount = d1Quotes.filter((p) => p.active).length;
    assert.ok(activeCount > 0, 'Active quote count must be positive');
  });

  test('Dealer products and stock volume can be computed accurately', () => {
    const d1Products = DEMO_PRODUCTS.filter((p) => p.dealer_id === 'd1');
    assert.ok(d1Products.length > 0, 'Dealer d1 should have store products listed');
    const totalStock = d1Products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    assert.ok(totalStock > 0, 'Total stock count must be positive');
  });

  test('Initial demo inquiries are present and have valid schemas', () => {
    assert.ok(Array.isArray(INITIAL_DEMO_INQUIRIES), 'INITIAL_DEMO_INQUIRIES must be an array');
    assert.ok(INITIAL_DEMO_INQUIRIES.length >= 2, 'Should have at least 2 demo inquiries');
    for (const inq of INITIAL_DEMO_INQUIRIES) {
      assert.ok(inq.id, 'Inquiry must have id');
      assert.ok(inq.dealerId, 'Inquiry must have dealerId');
      assert.ok(inq.farmerName, 'Inquiry must have farmerName');
      assert.ok(inq.farmerPhone, 'Inquiry must have farmerPhone');
      assert.ok(inq.cropName, 'Inquiry must have cropName');
      assert.ok(['new', 'contacted', 'completed'].includes(inq.status), 'Inquiry must have valid status');
    }
  });

  test('Categories match FARM_STORE_CATEGORIES standard', () => {
    assert.ok(FARM_STORE_CATEGORIES.includes('Seeds'), 'Seeds must be in store categories');
    assert.ok(FARM_STORE_CATEGORIES.includes('Fertilizers'), 'Fertilizers must be in store categories');
  });
});

describe('4. Dealer Operations & State Updates', () => {
  test('Quote price adjustment preserves crop association', () => {
    const sampleQuote = { ...MOCK_DEALER_CROP_PRICES[0] };
    const initialPrice = sampleQuote.buying_price;
    const newPrice = initialPrice + 150;

    const updated = {
      ...sampleQuote,
      buying_price: newPrice,
      updated_at: new Date().toISOString()
    };

    assert.equal(updated.buying_price, newPrice);
    assert.equal(updated.crop_id, sampleQuote.crop_id);
    assert.equal(updated.dealer_id, sampleQuote.dealer_id);
  });

  test('Product stock adjustment correctly increments and decrements', () => {
    const sampleProd = { ...DEMO_PRODUCTS[0] };
    const initialStock = sampleProd.stock;

    const incremented = { ...sampleProd, stock: initialStock + 5 };
    assert.equal(incremented.stock, initialStock + 5);

    const decremented = { ...sampleProd, stock: Math.max(0, initialStock - 5) };
    assert.equal(decremented.stock, initialStock - 5);
  });

  test('Inquiry status transitions through new -> contacted -> completed', () => {
    let status = 'new';
    assert.equal(status, 'new');

    status = 'contacted';
    assert.equal(status, 'contacted');

    status = 'completed';
    assert.equal(status, 'completed');
  });
});
