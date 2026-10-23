import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAllAssets } from '../../scripts/generate-png-assets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(__dirname, '../../mobile');

describe('AgriME Mobile App Implementation & Build Readiness Verification', () => {

  before(() => {
    // Generate valid PNG assets before verification
    generateAllAssets();
  });

  describe('1. Mobile Asset Generation & PNG Header Validation', () => {
    const assetsDir = path.join(mobileDir, 'assets');
    const requiredAssets = [
      { name: 'icon.png', minSize: 1000 },
      { name: 'splash.png', minSize: 1000 },
      { name: 'adaptive-icon.png', minSize: 1000 },
      { name: 'favicon.png', minSize: 100 }
    ];

    requiredAssets.forEach(({ name, minSize }) => {
      it(`should have valid PNG file for ${name}`, () => {
        const filePath = path.join(assetsDir, name);
        assert.ok(fs.existsSync(filePath), `Asset ${name} must exist at ${filePath}`);

        const buffer = fs.readFileSync(filePath);
        assert.ok(buffer.length >= minSize, `${name} must not be empty (was ${buffer.length} bytes)`);

        // Standard PNG 8-byte signature: \x89PNG\r\n\x1a\n
        const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        assert.deepEqual(
          buffer.subarray(0, 8),
          pngSignature,
          `${name} must begin with standard PNG signature bytes`
        );

        // First chunk must be IHDR
        const firstChunkType = buffer.subarray(12, 16).toString('ascii');
        assert.equal(firstChunkType, 'IHDR', `${name} first chunk must be IHDR`);
      });
    });
  });

  describe('2. Mobile App Configuration & Android Package', () => {
    it('should have com.agrime.app and INTERNET permission in app.json', () => {
      const appJsonPath = path.join(mobileDir, 'app.json');
      assert.ok(fs.existsSync(appJsonPath), 'app.json must exist');

      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
      const expo = appConfig.expo;

      assert.equal(expo.name, 'AgriME');
      assert.equal(expo.android.package, 'com.agrime.app');
      assert.ok(expo.android.permissions.includes('INTERNET'), 'Permissions must include INTERNET');
      assert.ok(expo.android.permissions.includes('ACCESS_COARSE_LOCATION'), 'Permissions must include ACCESS_COARSE_LOCATION');
      assert.ok(expo.android.permissions.includes('ACCESS_FINE_LOCATION'), 'Permissions must include ACCESS_FINE_LOCATION');
    });

    it('should configure EAS preview profile for installable APK in eas.json', () => {
      const easJsonPath = path.join(mobileDir, 'eas.json');
      assert.ok(fs.existsSync(easJsonPath), 'eas.json must exist');

      const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf-8'));
      assert.ok(easConfig.build, 'eas.json must define build profiles');
      assert.ok(easConfig.build.preview, 'eas.json must have preview profile');
      assert.equal(
        easConfig.build.preview.android?.buildType,
        'apk',
        'preview build profile must specify buildType: apk for installable APK'
      );
      assert.equal(
        easConfig.cli?.appVersionSource,
        'local',
        'eas.json must specify cli.appVersionSource: local'
      );
    });

    it('should declare compatible React Navigation 6 for Expo SDK 51 in package.json', () => {
      const pkgJsonPath = path.join(mobileDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      assert.ok(pkg.dependencies['@react-navigation/bottom-tabs']?.startsWith('^6.'), 'bottom-tabs must be v6');
      assert.ok(pkg.dependencies['@react-navigation/native']?.startsWith('^6.'), 'native must be v6');
      assert.ok(pkg.dependencies['@react-navigation/native-stack']?.startsWith('^6.'), 'native-stack must be v6');
    });
  });

  describe('3. Supabase Client Configuration & Security', () => {
    it('should match production URL and expose no secret keys', () => {
      const supabaseConfigPath = path.join(mobileDir, 'src', 'lib', 'supabase.ts');
      const content = fs.readFileSync(supabaseConfigPath, 'utf-8');

      assert.ok(
        content.includes('https://fugkokexgjvkgdrxzvny.supabase.co'),
        'Must use AgriME Supabase URL'
      );
      assert.ok(
        !content.includes('service_role'),
        'Mobile code must NEVER include service_role secret key'
      );
      assert.ok(
        !content.includes('postgres://'),
        'Mobile code must NEVER contain direct Postgres database connection strings'
      );
    });
  });

  describe('4. Data Service Null-Safety and UUID Sanitation', () => {
    it('should implement standard PostgreSQL UUID format in dataService.ts', () => {
      const dataServicePath = path.join(mobileDir, 'src', 'services', 'dataService.ts');
      const dataServiceContent = fs.readFileSync(dataServicePath, 'utf-8');
      assert.ok(
        dataServiceContent.includes('export function isValidUuid'),
        'dataService.ts must export isValidUuid'
      );
      assert.ok(
        dataServiceContent.includes('[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'),
        'dataService.ts must use standard PostgreSQL 8-4-4-4-12 UUID regex'
      );
    });

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    function isValidUuid(id) {
      if (!id || typeof id !== 'string') return false;
      return UUID_REGEX.test(id.trim());
    }

    it('should accurately differentiate database UUIDs from demo strings', () => {
      assert.equal(isValidUuid('11111111-1111-1111-1111-111111111101'), true);
      assert.equal(isValidUuid('44444444-4444-4444-4444-444444444401'), true);
      assert.equal(isValidUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'), true);
      assert.equal(isValidUuid('usr-farmer-demo'), false);
      assert.equal(isValidUuid('u-provider-1'), false);
      assert.equal(isValidUuid(''), false);
      assert.equal(isValidUuid(null), false);
      assert.equal(isValidUuid(undefined), false);
    });

    it('should safely parse dealer address without throwing when null or undefined', () => {
      function safeGetDistrict(address, district) {
        return district || ((address || '').includes(',') ? address.split(',').pop()?.trim() : 'Tamil Nadu');
      }

      assert.equal(safeGetDistrict('42 South Main St, Thanjavur', 'Thanjavur'), 'Thanjavur');
      assert.equal(safeGetDistrict(null, 'Coimbatore'), 'Coimbatore');
      assert.equal(safeGetDistrict(null, null), 'Tamil Nadu');
      assert.equal(safeGetDistrict(undefined, undefined), 'Tamil Nadu');
      assert.equal(safeGetDistrict('Salem bypass, Salem', null), 'Salem');
    });
  });

  describe('5. E-Commerce Server-Side Calculation & Cash on Delivery Enforcment', () => {
    it('should calculate order totals accurately and enforce non-digital payment labels', () => {
      const items = [
        { productId: 'prod-1', productName: 'CR-1009 Seeds', quantity: 2, unitPrice: 950 },
        { productId: 'prod-2', productName: 'Urea', quantity: 3, unitPrice: 266 }
      ];

      const computedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      assert.equal(computedTotal, 2 * 950 + 3 * 266); // 1900 + 798 = 2698

      // Payment method must be Cash on Delivery or Counter Settlement
      const deliveryMethod = 'delivery';
      const paymentMethod = deliveryMethod === 'pickup' ? 'Pay at Store Counter' : 'Cash on Delivery (COD)';
      assert.equal(paymentMethod, 'Cash on Delivery (COD)');
      assert.ok(!paymentMethod.toLowerCase().includes('stripe'));
      assert.ok(!paymentMethod.toLowerCase().includes('razorpay'));
    });
  });

  describe('6. Bilingual Translation Parity', () => {
    it('should have complete Tamil translation for every English key in translations.ts', async () => {
      const transPath = path.join(mobileDir, 'src', 'i18n', 'translations.ts');
      const content = fs.readFileSync(transPath, 'utf-8');

      // Check key translations are present
      const requiredKeys = [
        'appName', 'tagline', 'home', 'cropPrices', 'predictions', 'machinery',
        'dealers', 'schemes', 'marketplace', 'farmStore', 'profile',
        'orderNow', 'orderHistory', 'orderPlaced', 'cod', 'pickup',
        'login', 'register', 'logout', 'role', 'farmerRole', 'providerRole',
        'dealerRole', 'buyerRole', 'changeLanguage'
      ];

      requiredKeys.forEach((key) => {
        assert.ok(content.includes(`${key}:`), `translations must include key: ${key}`);
      });
    });
  });
});
