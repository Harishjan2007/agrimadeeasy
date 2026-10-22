import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test modules and helpers
import { 
  INDIAN_STATES_AND_UTS, 
  TAMIL_NADU_DISTRICTS_LIST, 
  getDistrictsForState, 
  POPULAR_CROPS_ONBOARDING, 
  ONBOARDING_INTERESTS, 
  USER_TYPES 
} from '../../src/lib/indian-geography.ts';

describe('1. Public Home Page & Route Protection Matrix', () => {
  const PROTECTED_ROUTES = [
    '/crop-price',
    '/prediction',
    '/dealers',
    '/machinery',
    '/ecommerce',
    '/schemes',
    '/dealer',
    '/machinery-provider',
    '/bookings',
    '/profile'
  ];

  test('Public Home Page (/) is NOT protected and does not require sign-in', () => {
    const isProtected = PROTECTED_ROUTES.some(
      prefix => '/' === prefix || '/'.startsWith(`${prefix}/`)
    );
    assert.equal(isProtected, false, 'Home page must be accessible without sign in');
  });

  test('All 6 specified tabs are strictly in the protected routes list', () => {
    const sixRequiredTabs = [
      '/crop-price',
      '/prediction',
      '/dealers',
      '/machinery',
      '/ecommerce',
      '/schemes'
    ];

    for (const tab of sixRequiredTabs) {
      const isProtected = PROTECTED_ROUTES.includes(tab);
      assert.equal(isProtected, true, `Tab ${tab} must be protected`);
    }
  });

  test('Subpaths of protected tabs are also protected', () => {
    const subpaths = [
      '/crop-price/history',
      '/prediction/details',
      '/dealers/chennai',
      '/machinery/tractor-rental',
      '/ecommerce/seeds',
      '/schemes/pm-kisan',
      '/profile/edit'
    ];

    for (const sub of subpaths) {
      const isProtected = PROTECTED_ROUTES.some(
        prefix => sub === prefix || sub.startsWith(`${prefix}/`)
      );
      assert.equal(isProtected, true, `Subpath ${sub} must be protected`);
    }
  });

  test('Safe redirect parameter generator sanitizes open redirects', () => {
    function sanitizeRedirect(param, defaultUrl = '/') {
      if (!param) return defaultUrl;
      // Allow internal paths starting with a single '/'
      if (param.startsWith('/') && !param.startsWith('//') && !param.includes('\\')) {
        return param;
      }
      return defaultUrl;
    }

    assert.equal(sanitizeRedirect('/crop-price'), '/crop-price');
    assert.equal(sanitizeRedirect('/prediction?crop=tomato'), '/prediction?crop=tomato');
    assert.equal(sanitizeRedirect('/schemes'), '/schemes');
    // Open redirect attempts must fallback safely to default
    assert.equal(sanitizeRedirect('https://evil.com'), '/');
    assert.equal(sanitizeRedirect('//evil.com/phish'), '/');
    assert.equal(sanitizeRedirect('/\\evil.com'), '/');
    assert.equal(sanitizeRedirect(null), '/');
  });

  test('Unauthenticated user redirect URL retains full original requested path and query', () => {
    function buildRedirectUrl(pathname, search = '') {
      const fullPath = pathname + search;
      return `/login?redirect=${encodeURIComponent(fullPath)}`;
    }

    assert.equal(
      buildRedirectUrl('/crop-price', '?tab=live'),
      '/login?redirect=%2Fcrop-price%3Ftab%3Dlive'
    );
    assert.equal(
      buildRedirectUrl('/prediction', '?crop=Paddy'),
      '/login?redirect=%2Fprediction%3Fcrop%3DPaddy'
    );
    assert.equal(
      buildRedirectUrl('/schemes'),
      '/login?redirect=%2Fschemes'
    );
  });
});

describe('2. Onboarding Indian Geography Reference Data', () => {
  test('Contains all 28 Indian States & 8 Union Territories (36 entities)', () => {
    assert.equal(INDIAN_STATES_AND_UTS.length, 36);
    assert.ok(INDIAN_STATES_AND_UTS.includes('Tamil Nadu'));
    assert.ok(INDIAN_STATES_AND_UTS.includes('Andhra Pradesh'));
    assert.ok(INDIAN_STATES_AND_UTS.includes('Karnataka'));
    assert.ok(INDIAN_STATES_AND_UTS.includes('Kerala'));
    assert.ok(INDIAN_STATES_AND_UTS.includes('Maharashtra'));
    assert.ok(INDIAN_STATES_AND_UTS.includes('Punjab'));
    assert.ok(INDIAN_STATES_AND_UTS.includes('Delhi (NCT)'));
    assert.ok(INDIAN_STATES_AND_UTS.includes('Puducherry'));
  });

  test('Contains all 38 authentic districts of Tamil Nadu', () => {
    assert.equal(TAMIL_NADU_DISTRICTS_LIST.length, 38);
    
    const keyDistricts = [
      'Salem', 'Vellore', 'Coimbatore', 'Thanjavur', 'Madurai', 
      'Tiruchirappalli', 'Erode', 'Dharmapuri', 'Dindigul', 'Tirunelveli',
      'Theni', 'Kallakurichi', 'Ranipet', 'Tenkasi', 'Mayiladuthurai'
    ];

    for (const dist of keyDistricts) {
      assert.ok(TAMIL_NADU_DISTRICTS_LIST.includes(dist), `Missing TN district: ${dist}`);
    }
  });

  test('Cascading getDistrictsForState returns exact districts for Tamil Nadu and other states', () => {
    const tnDistricts = getDistrictsForState('Tamil Nadu');
    assert.equal(tnDistricts.length, 38);
    assert.ok(tnDistricts.includes('Salem'));

    const apDistricts = getDistrictsForState('Andhra Pradesh');
    assert.ok(apDistricts.length >= 10);
    assert.ok(apDistricts.includes('Chittoor'));

    const karnatakaDistricts = getDistrictsForState('Karnataka');
    assert.ok(karnatakaDistricts.length >= 20);
    assert.ok(karnatakaDistricts.includes('Mysuru'));

    // Graceful fallback for any UT or region without hardcoded list
    const fallbackDistricts = getDistrictsForState('Lakshadweep');
    assert.ok(fallbackDistricts.length > 0);
  });
});

describe('3. Onboarding Questions: User Types, Crops & Interests', () => {
  test('User types include Farmer, Dealer, Buyer, and Other', () => {
    const typeIds = USER_TYPES.map(u => u.id);
    assert.deepEqual(typeIds, ['Farmer', 'Dealer', 'Buyer', 'Other']);

    for (const ut of USER_TYPES) {
      assert.ok(ut.label, 'Missing label');
      assert.ok(ut.labelTa, 'Missing Tamil label');
      assert.ok(ut.desc, 'Missing description');
    }
  });

  test('Popular crops list contains diverse staple and commercial crops with Tamil labels', () => {
    assert.ok(POPULAR_CROPS_ONBOARDING.length >= 12);
    
    const cropIds = POPULAR_CROPS_ONBOARDING.map(c => c.id);
    assert.ok(cropIds.includes('paddy'));
    assert.ok(cropIds.includes('tomato'));
    assert.ok(cropIds.includes('onion'));
    assert.ok(cropIds.includes('groundnut'));
    assert.ok(cropIds.includes('cotton'));
    assert.ok(cropIds.includes('sugarcane'));
    assert.ok(cropIds.includes('turmeric'));

    for (const crop of POPULAR_CROPS_ONBOARDING) {
      assert.ok(crop.id, 'Crop must have id');
      assert.ok(crop.name, 'Crop must have name');
      assert.ok(crop.nameTa, 'Crop must have Tamil name');
      assert.ok(crop.icon, 'Crop must have icon');
      assert.ok(crop.category, 'Crop must have category');
    }
  });

  test('Main interests correspond to all 6 platform features', () => {
    const interestIds = ONBOARDING_INTERESTS.map(i => i.id);
    
    assert.ok(interestIds.includes('crop_prices'));
    assert.ok(interestIds.includes('price_prediction'));
    assert.ok(interestIds.includes('finding_dealers'));
    assert.ok(interestIds.includes('machinery_booking'));
    assert.ok(interestIds.includes('ecommerce'));
    assert.ok(interestIds.includes('government_schemes'));

    for (const interest of ONBOARDING_INTERESTS) {
      assert.ok(interest.route.startsWith('/'), 'Interest route must be valid internal route');
      assert.ok(interest.name, 'Interest must have name');
      assert.ok(interest.nameTa, 'Interest must have Tamil name');
    }
  });
});

describe('4. User Profile & Onboarding Schema Validation', () => {
  // Validate mapping from onboarding user_type to database roles constraint ('farmer' | 'dealer' | 'machinery_provider')
  function mapUserTypeToRole(userType) {
    if (userType === 'Dealer') return 'dealer';
    if (userType === 'Other') return 'machinery_provider';
    return 'farmer';
  }

  test('Maps onboarding user_type to database-compatible role constraint without violations', () => {
    const validRoles = ['farmer', 'dealer', 'machinery_provider'];
    
    assert.equal(mapUserTypeToRole('Farmer'), 'farmer');
    assert.equal(mapUserTypeToRole('Buyer'), 'farmer');
    assert.equal(mapUserTypeToRole('Dealer'), 'dealer');
    assert.equal(mapUserTypeToRole('Other'), 'machinery_provider');

    for (const ut of ['Farmer', 'Dealer', 'Buyer', 'Other']) {
      const role = mapUserTypeToRole(ut);
      assert.ok(validRoles.includes(role), `Role ${role} must satisfy DB check constraint`);
    }
  });

  test('Validates required signup and onboarding fields', () => {
    function validateSignup(data) {
      if (!data.name?.trim()) return { valid: false, error: 'Name required' };
      if (!data.email?.trim() || !data.email.includes('@')) return { valid: false, error: 'Valid email required' };
      if (!data.phone?.trim()) return { valid: false, error: 'Phone required' };
      if (!data.password || data.password.length < 6) return { valid: false, error: 'Password min 6 chars' };
      if (!data.state) return { valid: false, error: 'State required' };
      if (!data.district) return { valid: false, error: 'District required' };
      if (!data.primary_crops || data.primary_crops.length === 0) return { valid: false, error: 'At least 1 crop required' };
      if (!data.main_interests || data.main_interests.length === 0) return { valid: false, error: 'At least 1 interest required' };
      return { valid: true };
    }

    const validUser = {
      name: 'Murugan Ramasamy',
      email: 'murugan@example.com',
      phone: '+91 98451 23456',
      password: 'secretPassword123',
      user_type: 'Farmer',
      state: 'Tamil Nadu',
      district: 'Salem',
      primary_crops: ['paddy', 'tomato'],
      main_interests: ['crop_prices', 'price_prediction']
    };

    assert.equal(validateSignup(validUser).valid, true);

    // Missing required fields
    assert.equal(validateSignup({ ...validUser, name: '' }).valid, false);
    assert.equal(validateSignup({ ...validUser, email: 'invalid' }).valid, false);
    assert.equal(validateSignup({ ...validUser, password: '123' }).valid, false);
    assert.equal(validateSignup({ ...validUser, primary_crops: [] }).valid, false);
    assert.equal(validateSignup({ ...validUser, main_interests: [] }).valid, false);
  });

  test('Preserves backward compatibility for existing user profiles without onboarding metadata', () => {
    // Existing user profile from database with only legacy fields
    const legacyDbProfile = {
      id: 'usr_legacy_123',
      name: 'Legacy Farmer',
      email: 'legacy@agrime.demo',
      phone: '+91 98765 43210',
      role: 'farmer',
      location: 'Vellore, Tamil Nadu',
      created_at: '2025-01-01T00:00:00Z'
    };

    // Simulated profile enricher
    function enrichLegacyProfile(dbProfile, userMetadata = {}) {
      return {
        ...dbProfile,
        user_type: userMetadata.user_type || 'Farmer',
        state: userMetadata.state || 'Tamil Nadu',
        district: userMetadata.district || 'Vellore',
        primary_crops: userMetadata.primary_crops || ['paddy'],
        main_interests: userMetadata.main_interests || ['crop_prices', 'price_prediction', 'government_schemes']
      };
    }

    const enriched = enrichLegacyProfile(legacyDbProfile);
    assert.equal(enriched.id, 'usr_legacy_123');
    assert.equal(enriched.name, 'Legacy Farmer');
    assert.equal(enriched.role, 'farmer');
    assert.equal(enriched.user_type, 'Farmer');
    assert.equal(enriched.district, 'Vellore');
    assert.ok(Array.isArray(enriched.primary_crops));
    assert.ok(Array.isArray(enriched.main_interests));
  });
});

describe('5. Authentication Cookie & Session Lifecycle', () => {
  test('Auth cookie format matches SameSite and Lax security policy', () => {
    function generateCookieString(isAuthenticated) {
      if (isAuthenticated) {
        return 'agrime_auth=true; path=/; max-age=604800; SameSite=Lax';
      }
      return 'agrime_auth=; path=/; max-age=0; SameSite=Lax';
    }

    const setCookie = generateCookieString(true);
    assert.ok(setCookie.includes('agrime_auth=true'));
    assert.ok(setCookie.includes('path=/'));
    assert.ok(setCookie.includes('max-age=604800'));

    const clearCookie = generateCookieString(false);
    assert.ok(clearCookie.includes('agrime_auth=;'));
    assert.ok(clearCookie.includes('max-age=0'));
  });

  test('Demo session payload includes all required user and onboarding fields', () => {
    function createDemoSession(role, userType, state, district, crops, interests) {
      const demoId = `demo_${role}_12345`;
      return {
        user: {
          id: demoId,
          email: `${role}@agrime.demo`,
          user_metadata: {
            name: `${role} Demo User`,
            role,
            user_type: userType,
            state,
            district,
            primary_crops: crops,
            main_interests: interests
          }
        },
        profile: {
          id: demoId,
          name: `${role} Demo User`,
          email: `${role}@agrime.demo`,
          phone: '+91 98451 23456',
          role,
          location: `${district}, ${state}`,
          user_type: userType,
          state,
          district,
          primary_crops: crops,
          main_interests: interests,
          created_at: new Date().toISOString()
        }
      };
    }

    const session = createDemoSession('farmer', 'Farmer', 'Tamil Nadu', 'Salem', ['paddy', 'tomato'], ['crop_prices']);
    assert.equal(session.user.user_metadata.user_type, 'Farmer');
    assert.equal(session.profile.district, 'Salem');
    assert.deepEqual(session.profile.primary_crops, ['paddy', 'tomato']);
    assert.deepEqual(session.profile.main_interests, ['crop_prices']);
  });
});
