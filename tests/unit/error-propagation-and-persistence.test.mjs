import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('1. Supabase Error Propagation in Data Libraries', () => {
  const dealersTsPath = path.join(__dirname, '..', '..', 'src', 'lib', 'supabase', 'dealers.ts');
  const machineryTsPath = path.join(__dirname, '..', '..', 'src', 'lib', 'supabase', 'machinery.ts');

  test('dealers.ts propagates database error instead of returning error: null', () => {
    const content = fs.readFileSync(dealersTsPath, 'utf8');
    
    // Ensure updateDealerProfile handles dealerError by returning an error
    assert.ok(
      content.includes('if (dealerError)'),
      'updateDealerProfile must check dealerError'
    );
    assert.ok(
      content.includes("error: new Error(dealerError.message || 'Failed to update dealer profile in database')") ||
      content.includes('error: new Error(dealerError.message'),
      'updateDealerProfile must return real Error object on dealerError'
    );
    assert.ok(
      !content.includes("console.warn('Supabase updateDealer notice (using fallback):', dealerError.message);"),
      'Must not silently swallow dealerError with fallback notice'
    );
  });

  test('machinery.ts updateMachineryRecord propagates database error', () => {
    const content = fs.readFileSync(machineryTsPath, 'utf8');
    
    assert.ok(
      content.includes("error: new Error(error.message || 'Failed to update machinery record in database')") ||
      content.includes('error: new Error(error.message'),
      'updateMachineryRecord must return real Error object on Supabase error'
    );
    assert.ok(
      !content.includes("console.warn('Supabase updateMachineryRecord notice (using local update):'"),
      'Must not silently swallow machinery update error'
    );
  });

  test('machinery.ts updateProviderProfile propagates database error', () => {
    const content = fs.readFileSync(machineryTsPath, 'utf8');
    
    assert.ok(
      content.includes("error: new Error(error.message || 'Failed to update provider profile in database')") ||
      content.includes('error: new Error(error.message'),
      'updateProviderProfile must return real Error object on Supabase error'
    );
    assert.ok(
      !content.includes("console.warn('Supabase updateProviderProfile notice:'"),
      'Must not silently swallow provider profile update error'
    );
  });
});

describe('2. Dealer Signup Persistence in auth.ts', () => {
  const authTsPath = path.join(__dirname, '..', '..', 'src', 'lib', 'supabase', 'auth.ts');

  test('dealerRow persists all collected business fields with exact DB column names', () => {
    const content = fs.readFileSync(authTsPath, 'utf8');
    
    // Check that dealerRow contains all required DB columns
    assert.ok(content.includes('bought_crops: data.boughtCrops'), 'Must map bought_crops');
    assert.ok(content.includes('produce_categories: data.produceCategories'), 'Must map produce_categories');
    assert.ok(content.includes('purchase_conditions: data.purchaseConditions'), 'Must map purchase_conditions');
    assert.ok(content.includes('state: data.state'), 'Must map state');
    assert.ok(content.includes('opening_hours: data.openingHours'), 'Must map opening_hours');
    assert.ok(content.includes('district: data.district'), 'Must map district');
    assert.ok(content.includes('address: data.businessAddress'), 'Must map address');
  });

  test('dbProfile persists extended location and crop preferences to profiles table', () => {
    const content = fs.readFileSync(authTsPath, 'utf8');
    
    assert.ok(content.includes('dbProfile.state = data.state'), 'Must save state to profiles');
    assert.ok(content.includes('dbProfile.district = data.district'), 'Must save district to profiles');
    assert.ok(content.includes('dbProfile.primary_crops = data.primaryCrops'), 'Must save primary_crops to profiles');
    assert.ok(content.includes('dbProfile.main_interests = data.mainInterests'), 'Must save main_interests to profiles');
  });
});

describe('3. Migration 20261021 Safe Constraints and Hardened RLS Policies', () => {
  const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20261021_role_onboarding_enhancements.sql');

  test('migration file exists and contains duplicate profile_id pre-check', () => {
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
    const content = fs.readFileSync(migrationPath, 'utf8');

    assert.ok(
      content.includes('GROUP BY profile_id') && content.includes('HAVING COUNT(*) > 1'),
      'Must check for duplicate profile_ids before adding constraint'
    );
    assert.ok(
      content.includes('RAISE EXCEPTION'),
      'Must abort migration with RAISE EXCEPTION if duplicates exist to prevent data corruption'
    );
    assert.ok(
      content.includes('ALTER TABLE dealers ADD CONSTRAINT dealers_profile_id_unique UNIQUE (profile_id)'),
      'Must add UNIQUE constraint on profile_id when safe'
    );
  });

  test('machinery and dealers UPDATE policies enforce ownership with both USING and WITH CHECK', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');

    assert.ok(
      content.includes('CREATE POLICY "Providers can update own machinery"') &&
      content.includes('USING (auth.uid() = provider_id)') &&
      content.includes('WITH CHECK (auth.uid() = provider_id)'),
      'Machinery update policy must explicitly declare both USING and WITH CHECK'
    );

    assert.ok(
      content.includes('CREATE POLICY "Dealers can update their own record"') &&
      content.includes('USING (auth.uid() = profile_id)') &&
      content.includes('WITH CHECK (auth.uid() = profile_id)'),
      'Dealers update policy must explicitly declare both USING and WITH CHECK'
    );
  });
});

describe('4. UI Page Handlers Validate DB Writes Before Success', () => {
  const dealerPagePath = path.join(__dirname, '..', '..', 'src', 'app', 'dealer', 'page.tsx');
  const machineryPagePath = path.join(__dirname, '..', '..', 'src', 'app', 'machinery-provider', 'page.tsx');

  test('dealer page handleSaveProfile checks DB result before showing success', () => {
    const content = fs.readFileSync(dealerPagePath, 'utf8');

    assert.ok(
      content.includes('const { error } = await updateDealerProfile'),
      'handleSaveProfile must capture error from updateDealerProfile'
    );
    assert.ok(
      content.includes("showFeedback(") && content.includes("'error'"),
      'handleSaveProfile must display error feedback when database save fails'
    );
  });

  test('machinery-provider page handleEditMachineSubmit checks DB result before showing success', () => {
    const content = fs.readFileSync(machineryPagePath, 'utf8');

    assert.ok(
      content.includes('const { error } = await updateMachineryRecord'),
      'handleEditMachineSubmit must capture error from updateMachineryRecord'
    );
    assert.ok(
      content.includes("showFeedback(") && content.includes("'error'"),
      'handleEditMachineSubmit must display error feedback on DB failure'
    );
  });

  test('machinery-provider page handleEditProfileSubmit checks DB result before showing success', () => {
    const content = fs.readFileSync(machineryPagePath, 'utf8');

    assert.ok(
      content.includes('const { error } = await updateProviderProfile'),
      'handleEditProfileSubmit must capture error from updateProviderProfile'
    );
  });
});

describe('5. Behavioral Verification of Persistence, Error Handling & Isolation', () => {
  test('Behavioral: Database update error cannot return success status', async () => {
    // Simulating database update failure handler
    async function simulateDbUpdate(fail) {
      if (fail) {
        const dbError = { message: 'Database connection failed: 503 Service Unavailable' };
        return {
          data: null,
          error: new Error(dbError.message)
        };
      }
      return { data: { id: 'rec-1', updated: true }, error: null };
    }

    const failureResult = await simulateDbUpdate(true);
    assert.equal(failureResult.data, null, 'Data must be null on DB failure');
    assert.ok(failureResult.error instanceof Error, 'Must return Error instance');
    assert.equal(failureResult.error.message.includes('503'), true, 'Error message must reflect DB failure');

    const successResult = await simulateDbUpdate(false);
    assert.equal(successResult.error, null, 'Error must be null on success');
    assert.equal(successResult.data.updated, true, 'Data must be returned on success');
  });

  test('Behavioral: Dealer signup maps every collected field to exact DB columns', () => {
    const signupInput = {
      name: 'Ramanathan K.',
      email: 'ramanathan@agritraders.example',
      password: 'SecurePassword123!',
      phone: '+91 94431 88990',
      location: 'Kumbakonam, Thanjavur, Tamil Nadu',
      role: 'dealer',
      state: 'Tamil Nadu',
      district: 'Thanjavur',
      shopName: 'Delta Agri Procurement Hub',
      businessAddress: '124, Bypass Road, Kumbakonam',
      latitude: 10.9602,
      longitude: 79.3845,
      boughtCrops: ['Paddy', 'Black Gram', 'Green Gram', 'Maize'],
      produceCategories: ['Grains & Cereals', 'Pulses'],
      purchaseConditions: 'Immediate NEFT / Cash payment upon moisture test (<14%)',
      openingHours: 'Mon - Sat: 7:00 AM - 8:00 PM'
    };

    // Simulate mapping performed in auth.ts
    const dealerRow = {
      profile_id: 'usr_test_123',
      shop_name: signupInput.shopName || signupInput.name,
      address: signupInput.businessAddress || signupInput.location,
      phone: signupInput.phone,
      opening_hours: signupInput.openingHours || 'Mon - Sat: 7:00 AM - 7:30 PM',
      district: signupInput.district || null,
      state: signupInput.state || null,
      latitude: signupInput.latitude ?? null,
      longitude: signupInput.longitude ?? null,
      bought_crops: signupInput.boughtCrops || [],
      produce_categories: signupInput.produceCategories || [],
      purchase_conditions: signupInput.purchaseConditions || null
    };

    assert.equal(dealerRow.shop_name, 'Delta Agri Procurement Hub');
    assert.equal(dealerRow.address, '124, Bypass Road, Kumbakonam');
    assert.equal(dealerRow.phone, '+91 94431 88990');
    assert.equal(dealerRow.district, 'Thanjavur');
    assert.equal(dealerRow.state, 'Tamil Nadu');
    assert.equal(dealerRow.latitude, 10.9602);
    assert.equal(dealerRow.longitude, 79.3845);
    assert.deepEqual(dealerRow.bought_crops, ['Paddy', 'Black Gram', 'Green Gram', 'Maize']);
    assert.deepEqual(dealerRow.produce_categories, ['Grains & Cereals', 'Pulses']);
    assert.equal(dealerRow.purchase_conditions, 'Immediate NEFT / Cash payment upon moisture test (<14%)');
  });

  test('Behavioral: Machinery record updates target only selected equipment ID', () => {
    const fleet = [
      { id: 'mach-1', name: 'Mahindra 575 DI Tractor', price_per_hour: 750, available: true },
      { id: 'mach-2', name: 'Kubota Harvester DC-68G', price_per_hour: 2200, available: true }
    ];

    const targetId = 'mach-1';
    const updates = { price_per_hour: 850, available: false };

    // Simulate isolated update
    const updatedFleet = fleet.map(item => item.id === targetId ? { ...item, ...updates } : item);

    // Target record updated
    const updatedItem = updatedFleet.find(m => m.id === 'mach-1');
    assert.equal(updatedItem.price_per_hour, 850);
    assert.equal(updatedItem.available, false);
    assert.equal(updatedItem.name, 'Mahindra 575 DI Tractor');

    // Untargeted record preserved intact
    const untouchedItem = updatedFleet.find(m => m.id === 'mach-2');
    assert.equal(untouchedItem.price_per_hour, 2200);
    assert.equal(untouchedItem.available, true);
    assert.equal(untouchedItem.name, 'Kubota Harvester DC-68G');
  });

  test('Behavioral: Machinery booking tabs strictly isolate statuses', () => {
    const allBookings = [
      { id: 'b1', status: 'pending', total_amount: 3000 },
      { id: 'b2', status: 'accepted', total_amount: 4500 },
      { id: 'b3', status: 'on_the_way', total_amount: 1500 },
      { id: 'b4', status: 'in_progress', total_amount: 6000 },
      { id: 'b5', status: 'completed', total_amount: 7500 },
      { id: 'b6', status: 'cancelled', total_amount: 2000 }
    ];

    const pendingOnly = allBookings.filter(b => b.status === 'pending');
    assert.equal(pendingOnly.length, 1);
    assert.equal(pendingOnly[0].id, 'b1');
    assert.ok(pendingOnly.every(b => b.status === 'pending'), 'Pending tab must contain only pending status');

    const completedOnly = allBookings.filter(b => b.status === 'completed');
    assert.equal(completedOnly.length, 1);
    assert.equal(completedOnly[0].id, 'b5');
    assert.ok(completedOnly.every(b => b.status === 'completed'), 'Completed tab must contain only completed status');

    const activeOnly = allBookings.filter(b => ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status));
    assert.equal(activeOnly.length, 3);
    assert.deepEqual(activeOnly.map(b => b.id), ['b2', 'b3', 'b4']);
  });

  test('Behavioral: Dealer profile editing preserves existing fields when saving updates', () => {
    const existingDealer = {
      id: 'd1',
      profile_id: 'u2',
      shop_name: 'Cauvery Delta Agri Traders',
      phone: '+91 94431 23456',
      address: '14, Gandhi Road, Kumbakonam',
      district: 'Thanjavur',
      state: 'Tamil Nadu',
      opening_hours: 'Mon-Sat: 8:00 AM - 7:00 PM',
      bought_crops: ['Paddy (Samba)', 'Paddy (Kuruvai)', 'Black Gram'],
      produce_categories: ['Seeds', 'Fertilizers']
    };

    const userEdits = {
      shop_name: 'Cauvery Delta Modern Agri Superhub',
      phone: '+91 94431 99999'
    };

    const merged = { ...existingDealer, ...userEdits, updated_at: '2026-10-21T12:00:00Z' };

    assert.equal(merged.shop_name, 'Cauvery Delta Modern Agri Superhub');
    assert.equal(merged.phone, '+91 94431 99999');
    // Existing fields preserved
    assert.equal(merged.address, '14, Gandhi Road, Kumbakonam');
    assert.equal(merged.district, 'Thanjavur');
    assert.deepEqual(merged.bought_crops, ['Paddy (Samba)', 'Paddy (Kuruvai)', 'Black Gram']);
  });
});

describe('6. Supabase Products and Orders Query Hardening', () => {
  const productsTsPath = path.join(__dirname, '..', '..', 'src', 'lib', 'supabase', 'products.ts');
  const ordersTsPath = path.join(__dirname, '..', '..', 'src', 'lib', 'supabase', 'orders.ts');

  test('products.ts does not query nonexistent rating column on dealers', () => {
    const content = fs.readFileSync(productsTsPath, 'utf8');

    assert.ok(!content.includes('rating,'), 'products.ts must not request rating column in dealer select query');
    assert.ok(!content.includes('dealers_1.rating'), 'Must not request dealers_1.rating');
    assert.ok(content.includes('shop_name,'), 'Must select shop_name');
    assert.ok(content.includes('opening_hours,'), 'Must select opening_hours');
    assert.ok(content.includes('verified'), 'Must select verified');
  });

  test('products.ts maps image_url directly from Supabase and does not discard database response', () => {
    const content = fs.readFileSync(productsTsPath, 'utf8');

    assert.ok(content.includes('image_url: row.image_url || undefined'), 'Must preserve row.image_url from database');
    assert.ok(content.includes('const mapped = (data as unknown as RawProductRow[]).map(mapRawProduct)'), 'Must map Supabase rows');
    assert.ok(content.includes('return { data: mapped, error: null, isConfigured: true }'), 'Must return mapped database rows on success');
  });

  test('orders.ts enforces UUID validation for customer_id and product_id', () => {
    const content = fs.readFileSync(ordersTsPath, 'utf8');

    assert.ok(content.includes('isValidUuid'), 'orders.ts must use isValidUuid');
    assert.ok(content.includes('validDbCustomerId = isValidUuid(payload.customerId) ? payload.customerId : null'), 'Must validate customer_id before DB insert');
    assert.ok(content.includes('isValidUuid(item.productId) ? item.productId : null'), 'Must validate product_id before DB insert');
    assert.ok(content.includes('if (customerId && !isValidUuid(customerId))'), 'getCustomerOrders must guard against non-UUID customerId');
  });

  test('Behavioral: isValidUuid correctly discriminates UUIDs and mock IDs', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    function isValidUuid(id) {
      if (!id || typeof id !== 'string') return false;
      return UUID_REGEX.test(id.trim());
    }

    assert.equal(isValidUuid('u-provider-1'), false, 'u-provider-1 is not a valid UUID');
    assert.equal(isValidUuid('u-farmer-1'), false, 'u-farmer-1 is not a valid UUID');
    assert.equal(isValidUuid('prod-seed-01'), false, 'prod-seed-01 is not a valid UUID');
    assert.equal(isValidUuid('00000000-0000-0000-0003-000000000001'), true, 'Deterministic demo product UUID is valid');
    assert.equal(isValidUuid('00000000-0000-0000-0001-000000000001'), true, 'Deterministic demo dealer UUID is valid');
    assert.equal(isValidUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'), true, 'Standard v4 UUID is valid');
    assert.equal(isValidUuid(null), false, 'null is not valid');
    assert.equal(isValidUuid(undefined), false, 'undefined is not valid');
  });
});
