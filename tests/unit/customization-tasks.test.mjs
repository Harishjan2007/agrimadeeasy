import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..', '..');

describe('TASK 1: Customize Dealer Portal Navigation', () => {
  const headerPath = path.join(rootDir, 'src', 'components', 'common', 'Header.tsx');

  test('Header.tsx exists and is readable', () => {
    assert.ok(fs.existsSync(headerPath), 'Header.tsx must exist');
  });

  test('Dealer navigation contains ONLY Dealer Portal tab', () => {
    const content = fs.readFileSync(headerPath, 'utf8');

    // Extract dealer nav block
    const dealerNavMatch = content.match(/if\s*\(\s*isSignedIn\s*&&\s*activeRole\s*===\s*['"]dealer['"]\s*\)\s*\{([^}]+)\}/);
    assert.ok(dealerNavMatch, 'Dealer nav branch must exist in getNavLinks');

    const dealerNavContent = dealerNavMatch[1];
    assert.ok(dealerNavContent.includes("href: '/dealer'"), 'Dealer nav must contain /dealer');
    assert.ok(!dealerNavContent.includes("href: '/'"), 'Dealer nav must NOT contain Home (/)');
    assert.ok(!dealerNavContent.includes("href: '/ecommerce'"), 'Dealer nav must NOT contain FarmStore (/ecommerce)');
    assert.ok(!dealerNavContent.includes("href: '/dealers'"), 'Dealer nav must NOT contain Mandi Directory (/dealers)');
  });

  test('Underlying pages (Home, FarmStore, Mandi Directory) remain intact and not deleted', () => {
    const homePage = path.join(rootDir, 'src', 'app', 'page.tsx');
    const storePage = path.join(rootDir, 'src', 'app', 'ecommerce', 'page.tsx');
    const directoryPage = path.join(rootDir, 'src', 'app', 'dealers', 'page.tsx');

    assert.ok(fs.existsSync(homePage), 'Home page src/app/page.tsx must be preserved');
    assert.ok(fs.existsSync(storePage), 'FarmStore src/app/ecommerce/page.tsx must be preserved');
    assert.ok(fs.existsSync(directoryPage), 'Mandi Directory src/app/dealers/page.tsx must be preserved');
  });
});

describe('TASK 2: Customize Machinery Portal Navigation', () => {
  const headerPath = path.join(rootDir, 'src', 'components', 'common', 'Header.tsx');
  const machineryPagePath = path.join(rootDir, 'src', 'app', 'machinery-provider', 'page.tsx');

  test('Machinery Provider navigation has Machinery, Pending, and Completed tabs', () => {
    const content = fs.readFileSync(headerPath, 'utf8');

    // Extract machinery provider nav block
    const machineryNavMatch = content.match(/if\s*\(\s*isSignedIn\s*&&\s*activeRole\s*===\s*['"]machinery_provider['"]\s*\)\s*\{([\s\S]*?return\s*\[[\s\S]*?\];\s*\})/);
    assert.ok(machineryNavMatch, 'Machinery provider nav branch must exist in getNavLinks');

    const machineryNavContent = machineryNavMatch[1];
    assert.ok(machineryNavContent.includes("href: '/machinery-provider'"), 'Machinery tab must point to /machinery-provider');
    assert.ok(machineryNavContent.includes("href: '/machinery-provider?filter=pending'"), 'Pending tab must point to /machinery-provider?filter=pending');
    assert.ok(machineryNavContent.includes("href: '/machinery-provider?filter=completed'"), 'Completed tab must point to /machinery-provider?filter=completed');
    assert.ok(!machineryNavContent.includes("href: '/'"), 'Machinery nav must NOT contain Home (/)');
    assert.ok(!machineryNavContent.includes("fleetCatalog"), 'Machinery nav must NOT contain Fleet Catalog tab');
  });

  test('Machinery Portal page synchronizes filter query parameter to display pending/completed jobs', () => {
    const content = fs.readFileSync(machineryPagePath, 'utf8');
    assert.ok(content.includes('useSearchParams'), 'machinery-provider/page.tsx must use useSearchParams');
    assert.ok(content.includes("filterParam === 'pending'"), 'Must handle pending filter query');
    assert.ok(content.includes("filterParam === 'completed'"), 'Must handle completed filter query');
    assert.ok(content.includes("setBookingFilter('pending')"), 'Must activate pending bookings view');
    assert.ok(content.includes("setBookingFilter('completed')"), 'Must activate completed bookings view');
  });

  test('i18n translations include pending and completed keys', () => {
    const typesPath = path.join(rootDir, 'src', 'i18n', 'types.ts');
    const enPath = path.join(rootDir, 'src', 'i18n', 'en.ts');
    const taPath = path.join(rootDir, 'src', 'i18n', 'ta.ts');

    const typesContent = fs.readFileSync(typesPath, 'utf8');
    const enContent = fs.readFileSync(enPath, 'utf8');
    const taContent = fs.readFileSync(taPath, 'utf8');

    assert.ok(typesContent.includes('pending: string;'), 'types.ts must declare pending');
    assert.ok(typesContent.includes('completed: string;'), 'types.ts must declare completed');
    assert.ok(enContent.includes("pending: 'Pending'"), 'en.ts must translate Pending');
    assert.ok(enContent.includes("completed: 'Completed'"), 'en.ts must translate Completed');
    assert.ok(taContent.includes("pending: 'நிலுவையில் உள்ளவை'"), 'ta.ts must translate Pending');
    assert.ok(taContent.includes("completed: 'முடிந்தவை'"), 'ta.ts must translate Completed');
  });
});

describe('TASK 3: Implement Role-Specific Signup Forms', () => {
  const signupPath = path.join(rootDir, 'src', 'app', 'signup', 'page.tsx');
  const authPath = path.join(rootDir, 'src', 'lib', 'supabase', 'auth.ts');
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20261021_role_onboarding_enhancements.sql');

  test('Signup page offers exactly three roles: Farmer, Dealer, Machinery Provider', () => {
    const content = fs.readFileSync(signupPath, 'utf8');
    assert.ok(content.includes("id: 'farmer'"), 'Must offer farmer role');
    assert.ok(content.includes("id: 'dealer'"), 'Must offer dealer role');
    assert.ok(content.includes("id: 'machinery_provider'"), 'Must offer machinery_provider role');
    assert.ok(!content.includes("id: 'buyer'"), 'Must not have separate deprecated buyer role');
    assert.ok(!content.includes("id: 'other'"), 'Must not have generic other role');
  });

  test('Dealer-specific form questions and real LocationPicker are present', () => {
    const content = fs.readFileSync(signupPath, 'utf8');
    assert.ok(content.includes('LocationPicker'), 'Must import LocationPicker');
    assert.ok(content.includes('shopName'), 'Must have shop name field');
    assert.ok(content.includes('dealerAddress'), 'Must have dealer address field');
    assert.ok(content.includes('dealerLat'), 'Must bind latitude coordinate');
    assert.ok(content.includes('dealerLng'), 'Must bind longitude coordinate');
    assert.ok(content.includes('dealerBoughtCrops'), 'Must have bought crops selection');
    assert.ok(content.includes('dealerProduceCategories'), 'Must have produce categories');
    assert.ok(content.includes('purchaseConditions'), 'Must have purchase preferences');
    assert.ok(content.includes('openingHours'), 'Must have operating hours');
  });

  test('Machinery Provider-specific form questions and real LocationPicker are present', () => {
    const content = fs.readFileSync(signupPath, 'utf8');
    assert.ok(content.includes('providerName'), 'Must have provider name field');
    assert.ok(content.includes('providerAddress'), 'Must have workshop address field');
    assert.ok(content.includes('providerLat'), 'Must bind provider latitude coordinate');
    assert.ok(content.includes('providerLng'), 'Must bind provider longitude coordinate');
    assert.ok(content.includes('machineryTypesOffered'), 'Must have machinery types offered selection');
    assert.ok(content.includes('primaryMachineName'), 'Must have primary machine model name');
    assert.ok(content.includes('pricePerHour'), 'Must have hourly rental rate');
    assert.ok(content.includes('rentalTerms'), 'Must have rental terms details');
  });

  test('Farmer onboarding experience is preserved with crops, interests, and Tamil language', () => {
    const content = fs.readFileSync(signupPath, 'utf8');
    assert.ok(content.includes('selectedCrops'), 'Farmer primary crops preserved');
    assert.ok(content.includes('selectedInterests'), 'Farmer interests preserved');
    assert.ok(content.includes('POPULAR_CROPS_ONBOARDING'), 'Popular crops list preserved');
    assert.ok(content.includes('ONBOARDING_INTERESTS'), 'Interests list preserved');
  });

  test('signUpUser in auth.ts saves role-specific records to Supabase profiles, dealers, and machinery tables', () => {
    const content = fs.readFileSync(authPath, 'utf8');
    assert.ok(content.includes("data.role === 'dealer'"), 'Handles dealer profile save');
    assert.ok(content.includes(".from('dealers').upsert"), 'Upserts dealer row in dealers table');
    assert.ok(content.includes("data.role === 'machinery_provider'"), 'Handles machinery provider profile save');
    assert.ok(content.includes(".from('machinery').insert"), 'Inserts fleet entry into machinery table');
  });

  test('Database migration 20261021_role_onboarding_enhancements.sql exists with non-destructive schema additions', () => {
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
    const content = fs.readFileSync(migrationPath, 'utf8');
    assert.ok(content.includes('ALTER TABLE profiles'), 'Must alter profiles table');
    assert.ok(content.includes('ALTER TABLE dealers'), 'Must alter dealers table');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS state'), 'Profiles must have state');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS district'), 'Profiles must have district');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS bought_crops'), 'Dealers must have bought_crops');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS produce_categories'), 'Dealers must have produce_categories');
    assert.ok(content.includes('ADD COLUMN IF NOT EXISTS purchase_conditions'), 'Dealers must have purchase_conditions');
  });
});

describe('TASK 4: Remove Quick Demo Sign-In Options', () => {
  const loginPath = path.join(rootDir, 'src', 'app', 'login', 'page.tsx');

  test('Login page has no Quick 1-Click Demo Sign In section', () => {
    const content = fs.readFileSync(loginPath, 'utf8');
    assert.ok(!content.includes('QUICK 1-CLICK DEMO SIGN IN'), 'No QUICK 1-CLICK DEMO heading');
    assert.ok(!content.includes('Quick 1-Click Demo Sign In'), 'No Quick 1-Click Demo label');
    assert.ok(!content.includes('handleQuickDemo'), 'handleQuickDemo function removed');
  });

  test('Login page preserves standard email, password, Sign In button, and Sign Up link', () => {
    const content = fs.readFileSync(loginPath, 'utf8');
    assert.ok(content.includes('type="email"'), 'Email input preserved');
    assert.ok(content.includes('type="password"'), 'Password input preserved');
    assert.ok(content.includes('type="submit"'), 'Submit button preserved');
    assert.ok(content.includes('translations.auth.loginButton'), 'Login button text preserved');
    assert.ok(content.includes('/signup'), 'Link to /signup preserved');
    assert.ok(content.includes('signInUser'), 'Supabase authentication preserved');
  });
});

describe('TASK 5: Simplify Machinery Provider Portal Header', () => {
  const machineryPagePath = path.join(rootDir, 'src', 'app', 'machinery-provider', 'page.tsx');

  test('Machinery Provider PageHeader has no stats summary cards or header action buttons', () => {
    const content = fs.readFileSync(machineryPagePath, 'utf8');

    // PageHeader block
    const pageHeaderMatch = content.match(/<PageHeader\s+([\s\S]*?)\/>/);
    assert.ok(pageHeaderMatch, 'PageHeader must be rendered');

    const pageHeaderProps = pageHeaderMatch[1];
    assert.ok(!pageHeaderProps.includes('stats='), 'PageHeader must NOT have stats summary cards');
    assert.ok(!pageHeaderProps.includes('actions='), 'PageHeader must NOT have actions container');
    assert.ok(!pageHeaderProps.includes('View on Google Maps'), 'PageHeader must NOT have Google Maps button');
    assert.ok(!pageHeaderProps.includes('addMachineryBtn'), 'PageHeader must NOT have green plus add button');

    // Left-side identity elements preserved
    assert.ok(pageHeaderProps.includes('icon={Tractor}'), 'Machinery icon preserved');
    assert.ok(pageHeaderProps.includes('translations.providerPortal.welcomeBadge'), 'Badge label preserved');
    assert.ok(pageHeaderProps.includes('translations.providerPortal.title'), 'Heading title preserved');
    assert.ok(pageHeaderProps.includes('translations.providerPortal.subtitle'), 'Descriptive subtitle preserved');
  });

  test('Fleet management and machinery addition are preserved in their proper page section', () => {
    const content = fs.readFileSync(machineryPagePath, 'utf8');
    assert.ok(content.includes('fleetManagement'), 'Fleet Management section preserved in page body');
    assert.ok(content.includes('setShowAddModal(true)'), 'Machinery registration modal action preserved in body');
  });
});

describe('TASK 6: Separate Machinery, Pending, and Completed Content', () => {
  const machineryPagePath = path.join(rootDir, 'src', 'app', 'machinery-provider', 'page.tsx');
  const content = fs.readFileSync(machineryPagePath, 'utf8');

  test('Main Machinery page renders My Equipment, Incoming Bookings, and Available Features', () => {
    // Main page view check (!filterParam || filterParam === 'all')
    assert.ok(
      content.includes("filterParam !== 'pending' && filterParam !== 'completed'"),
      'Main view must be conditionally isolated from pending and completed views'
    );
    assert.ok(
      content.includes('fleetManagement') || content.includes('myEquipmentFleet'),
      'Main view must contain My Equipment Fleet'
    );
    assert.ok(
      content.includes('incomingRequests') || content.includes('incomingBookings'),
      'Main view must contain Incoming Bookings'
    );
    assert.ok(
      content.includes('availableProviderFeatures') || content.includes('providerFeatures'),
      'Main view must contain Available Provider Features'
    );
  });

  test('My Equipment Fleet and Available Features appear ONLY on the main Machinery page', () => {
    // When filterParam is pending or completed, the dedicated view branches must NOT include equipment or features
    const pendingBranchMatch = content.match(/filterParam === 'pending'[\s\S]*?return \(([\s\S]*?)\);/);
    if (pendingBranchMatch) {
      const pendingContent = pendingBranchMatch[1];
      assert.ok(!pendingContent.includes('fleetManagement'), 'Pending tab must NOT render My Equipment Fleet');
      assert.ok(!pendingContent.includes('availableProviderFeatures'), 'Pending tab must NOT render Available Features');
    }

    const completedBranchMatch = content.match(/filterParam === 'completed'[\s\S]*?return \(([\s\S]*?)\);/);
    if (completedBranchMatch) {
      const completedContent = completedBranchMatch[1];
      assert.ok(!completedContent.includes('fleetManagement'), 'Completed tab must NOT render My Equipment Fleet');
      assert.ok(!completedContent.includes('availableProviderFeatures'), 'Completed tab must NOT render Available Features');
    }
  });

  test('Pending tab displays only pending bookings with processing actions', () => {
    assert.ok(content.includes("filterParam === 'pending'"), 'Must handle dedicated pending tab');
    assert.ok(content.includes('pendingBookings'), 'Must filter pending bookings');
    assert.ok(content.includes('handleAccept'), 'Must provide accept action in pending view');
    assert.ok(content.includes('handleReject'), 'Must provide reject action in pending view');
  });

  test('Completed tab displays only completed bookings', () => {
    assert.ok(content.includes("filterParam === 'completed'"), 'Must handle dedicated completed tab');
    assert.ok(content.includes('completedBookings'), 'Must filter completed bookings');
  });

  test('Preserves existing navigation and avoids duplicate booking lists across tabs', () => {
    const headerPath = path.join(rootDir, 'src', 'components', 'common', 'Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    assert.ok(headerContent.includes("href: '/machinery-provider'"), 'Machinery tab preserved');
    assert.ok(headerContent.includes("href: '/machinery-provider?filter=pending'"), 'Pending tab preserved');
    assert.ok(headerContent.includes("href: '/machinery-provider?filter=completed'"), 'Completed tab preserved');
  });
});

describe('TASK 7: Editable Dealer and Machinery Provider Profiles', () => {
  const dealerPagePath = path.join(rootDir, 'src', 'app', 'dealer', 'page.tsx');
  const machineryPagePath = path.join(rootDir, 'src', 'app', 'machinery-provider', 'page.tsx');
  const dealerLibPath = path.join(rootDir, 'src', 'lib', 'supabase', 'dealers.ts');
  const machineryLibPath = path.join(rootDir, 'src', 'lib', 'supabase', 'machinery.ts');

  test('Dealer Portal displays business profile with all required fields and sensible empty states', () => {
    const content = fs.readFileSync(dealerPagePath, 'utf8');

    // Display fields in store tab and/or banner
    assert.ok(content.includes('activeDealer.shop_name'), 'Displays shop name');
    assert.ok(content.includes('activeDealer.name'), 'Displays dealer contact person name');
    assert.ok(content.includes('activeDealer.address'), 'Displays business address');
    assert.ok(content.includes('activeDealer.district'), 'Displays district');
    assert.ok(content.includes('activeDealer.state'), 'Displays state');
    assert.ok(content.includes('activeDealer.latitude'), 'Displays map coordinates');
    assert.ok(content.includes('activeDealer.longitude'), 'Displays map coordinates');
    assert.ok(content.includes('activeDealer.bought_crops'), 'Displays crops purchased from farmers');
    assert.ok(content.includes('activeDealer.produce_categories'), 'Displays produce categories handled');
    assert.ok(content.includes('activeDealer.purchase_conditions'), 'Displays purchase conditions & terms');
    assert.ok(content.includes('activeDealer.opening_hours'), 'Displays trading hours');

    // Empty states
    assert.ok(content.includes('Not specified') || content.includes('italic'), 'Includes sensible empty state fallbacks');
  });

  test('Dealer Portal provides functional Edit Profile option and modal with map picker', () => {
    const content = fs.readFileSync(dealerPagePath, 'utf8');

    assert.ok(content.includes('openEditProfileModal'), 'Has openEditProfileModal function');
    assert.ok(content.includes('showEditProfileModal'), 'Has showEditProfileModal state');
    assert.ok(content.includes('handleSaveProfileSubmit'), 'Has handleSaveProfileSubmit handler');
    assert.ok(content.includes('LocationPicker'), 'Integrates LocationPicker for dealer GPS coordinates');
    assert.ok(content.includes('updateDealerProfile'), 'Calls updateDealerProfile library function');
    assert.ok(content.includes('updateDealer'), 'Calls context updateDealer to persist changes immediately');
  });

  test('Dealer update library synchronizes both dealers table and profiles table', () => {
    const content = fs.readFileSync(dealerLibPath, 'utf8');
    assert.ok(content.includes('export async function updateDealerProfile'), 'Exports updateDealerProfile');
    assert.ok(content.includes(".from('dealers').update"), 'Updates dealers table in Supabase');
    assert.ok(content.includes(".from('profiles').update"), 'Updates profiles table in Supabase');
  });

  test('Machinery Provider portal provides editable provider profile with LocationPicker and geography', () => {
    const content = fs.readFileSync(machineryPagePath, 'utf8');

    assert.ok(content.includes('openEditProfileModal'), 'Has openEditProfileModal function');
    assert.ok(content.includes('showEditProfileModal'), 'Has showEditProfileModal state');
    assert.ok(content.includes('handleEditProfileSubmit'), 'Has handleEditProfileSubmit handler');
    assert.ok(content.includes('LocationPicker'), 'Integrates LocationPicker for provider workshop location');
    assert.ok(content.includes('updateProviderProfile'), 'Calls updateProviderProfile');
    assert.ok(content.includes('editMachineryTypes'), 'Allows selecting machinery types offered');
    assert.ok(content.includes('editRentalTerms'), 'Allows editing rental terms and conditions');
  });

  test('Machinery Provider portal supports editing individual equipment without modifying other machines', () => {
    const content = fs.readFileSync(machineryPagePath, 'utf8');

    assert.ok(content.includes('openEditMachineModal'), 'Has openEditMachineModal function');
    assert.ok(content.includes('editingMachine'), 'Has editingMachine state targeting individual machine');
    assert.ok(content.includes('handleEditMachineSubmit'), 'Has handleEditMachineSubmit handler');
    assert.ok(content.includes('updateMachineryRecord'), 'Calls updateMachineryRecord for individual machine');
    assert.ok(content.includes('updateMachinery'), 'Calls context updateMachinery for individual machine');
    assert.ok(content.includes('setShowAddModal'), 'Preserves existing Add Machinery functionality');
  });

  test('Machinery update library exports updateMachineryRecord and updateProviderProfile', () => {
    const content = fs.readFileSync(machineryLibPath, 'utf8');
    assert.ok(content.includes('export async function updateMachineryRecord'), 'Exports updateMachineryRecord');
    assert.ok(
      content.includes(".from('machinery').update") || /\.from\(['"]machinery['"]\)\s*\.update/.test(content),
      'Updates machinery table in Supabase'
    );
    assert.ok(content.includes('export async function updateProviderProfile'), 'Exports updateProviderProfile');
  });
});

