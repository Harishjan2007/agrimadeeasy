import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(__dirname, '../mobile');
const lockPath = path.join(mobileDir, 'package-lock.json');
const pkgPath = path.join(mobileDir, 'package.json');

console.log('====================================================');
console.log('🌾 AgriME Mobile Dependency Fixer & Lockfile Synchronizer');
console.log('====================================================\n');

// 1. Verify mobile/package.json declares React Navigation 6 and Expo SDK 51
const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
const pkg = JSON.parse(pkgContent);

console.log('🔍 Checking mobile/package.json declarations...');
console.log(`   • expo: ${pkg.dependencies['expo']}`);
console.log(`   • react: ${pkg.dependencies['react']}`);
console.log(`   • react-native: ${pkg.dependencies['react-native']}`);
console.log(`   • @react-navigation/bottom-tabs: ${pkg.dependencies['@react-navigation/bottom-tabs']}`);
console.log(`   • @react-navigation/native: ${pkg.dependencies['@react-navigation/native']}`);
console.log(`   • @react-navigation/native-stack: ${pkg.dependencies['@react-navigation/native-stack']}`);

// Ensure React Navigation 6 constraints are properly declared
let pkgModified = false;
if (pkg.dependencies['@react-navigation/bottom-tabs'] !== '^6.6.1') {
  pkg.dependencies['@react-navigation/bottom-tabs'] = '^6.6.1';
  pkgModified = true;
}
if (pkg.dependencies['@react-navigation/native'] !== '^6.1.18') {
  pkg.dependencies['@react-navigation/native'] = '^6.1.18';
  pkgModified = true;
}
if (pkg.dependencies['@react-navigation/native-stack'] !== '^6.10.1') {
  pkg.dependencies['@react-navigation/native-stack'] = '^6.10.1';
  pkgModified = true;
}
if (pkgModified) {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  console.log('✅ Synchronized mobile/package.json dependencies.');
}

// 2. Check if mobile/package-lock.json has conflicting v7 packages
if (fs.existsSync(lockPath)) {
  const lockContent = fs.readFileSync(lockPath, 'utf-8');
  const hasV7 = lockContent.includes('bottom-tabs-7.') || lockContent.includes('"^7.19.2"') || lockContent.includes('57.0.24');
  
  if (hasV7) {
    console.log('⚠️ Detected conflicting v7/mismatched dependencies in package-lock.json.');
    console.log('🧹 Purging outdated lockfile and conflicting node_modules/@react-navigation...');
    fs.unlinkSync(lockPath);
    
    const rnavDir = path.join(mobileDir, 'node_modules', '@react-navigation');
    if (fs.existsSync(rnavDir)) {
      try {
        fs.rmSync(rnavDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Notice removing @react-navigation cache:', e.message);
      }
    }
  }
}

// 3. Regenerate clean package-lock.json with React Navigation 6
console.log('\n🚀 Running npm install in mobile/ to regenerate consistent package-lock.json...');
try {
  execSync('npm install', { cwd: mobileDir, stdio: 'inherit' });
  console.log('✅ npm install completed successfully.');
} catch (err) {
  console.error('❌ npm install failed:', err.message);
  process.exit(1);
}

// 4. Validate with npm ci --include=dev (Exact command executed by EAS Cloud)
console.log('\n🧪 Running npm ci --include=dev in mobile/ (verifying EAS build readiness)...');
try {
  execSync('npm ci --include=dev', { cwd: mobileDir, stdio: 'inherit' });
  console.log('✅ npm ci --include=dev succeeded with zero conflicts!');
} catch (err) {
  console.error('❌ npm ci --include=dev failed:', err.message);
  process.exit(1);
}

console.log('\n====================================================');
console.log('🎉 Lockfile successfully synchronized!');
console.log('You can now run: npx eas-cli build -p android --profile preview');
console.log('====================================================\n');
