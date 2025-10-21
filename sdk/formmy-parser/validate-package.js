#!/usr/bin/env node
/**
 * Pre-publish validation script
 * Ensures SDK is ready for npm publish
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let errors = [];
let warnings = [];

console.log('🔍 Validating formmy-sdk package...\n');

// 1. Check package.json
console.log('📦 Checking package.json...');
const pkgPath = resolve(__dirname, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

if (pkg.name !== 'formmy-sdk') {
  errors.push(`❌ Package name must be "formmy-sdk", got "${pkg.name}"`);
}

if (!pkg.version || !pkg.version.match(/^\d+\.\d+\.\d+/)) {
  errors.push('❌ Invalid version format in package.json');
}

if (!pkg.description) {
  warnings.push('⚠️  Missing description in package.json');
}

if (!pkg.keywords || pkg.keywords.length === 0) {
  warnings.push('⚠️  No keywords in package.json');
}

console.log(`   Name: ${pkg.name}`);
console.log(`   Version: ${pkg.version}`);
console.log(`   License: ${pkg.license}`);

// 2. Check dist/ exists
console.log('\n📁 Checking build output...');
const distPath = resolve(__dirname, 'dist');
if (!existsSync(distPath)) {
  errors.push('❌ dist/ folder not found. Run `npm run build` first');
} else {
  const requiredFiles = [
    'index.js',
    'index.d.ts',
    'client.js',
    'client.d.ts',
    'types.js',
    'types.d.ts',
    'errors.js',
    'errors.d.ts'
  ];

  for (const file of requiredFiles) {
    const filePath = resolve(distPath, file);
    if (!existsSync(filePath)) {
      errors.push(`❌ Missing compiled file: dist/${file}`);
    }
  }

  console.log(`   ✅ All compiled files present`);
}

// 3. Check README
console.log('\n📖 Checking README...');
const readmePath = resolve(__dirname, 'README.md');
if (!existsSync(readmePath)) {
  errors.push('❌ README.md not found');
} else {
  const readme = readFileSync(readmePath, 'utf-8');

  if (readme.includes('@formmy/parser')) {
    errors.push('❌ README contains old package name "@formmy/parser"');
  }

  if (!readme.includes('formmy-sdk')) {
    warnings.push('⚠️  README should mention "formmy-sdk"');
  }

  if (readme.length < 1000) {
    warnings.push('⚠️  README seems too short (< 1000 chars)');
  }

  console.log(`   ✅ README.md exists (${readme.length} bytes)`);
}

// 4. Check exports
console.log('\n📤 Checking package exports...');
if (!pkg.exports || !pkg.exports['.']) {
  errors.push('❌ Missing exports field in package.json');
} else {
  console.log('   ✅ Exports configured correctly');
}

// 5. Validate TypeScript declarations
console.log('\n🔷 Checking TypeScript declarations...');
const indexDtsPath = resolve(distPath, 'index.d.ts');
if (existsSync(indexDtsPath)) {
  const indexDts = readFileSync(indexDtsPath, 'utf-8');

  const requiredExports = [
    'FormmyParser',
    'ParserConfig',
    'ParsingJob',
    'AuthenticationError',
    'InsufficientCreditsError'
  ];

  for (const exp of requiredExports) {
    if (!indexDts.includes(exp)) {
      errors.push(`❌ Missing export in index.d.ts: ${exp}`);
    }
  }

  console.log('   ✅ All expected exports present');
}

// 6. Check .npmignore
console.log('\n🚫 Checking .npmignore...');
const npmignorePath = resolve(__dirname, '.npmignore');
if (!existsSync(npmignorePath)) {
  warnings.push('⚠️  .npmignore not found (will use .gitignore)');
} else {
  console.log('   ✅ .npmignore exists');
}

// Results
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION RESULTS\n');

if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach(err => console.log(err));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach(warn => console.log(warn));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Package is ready to publish!\n');
  console.log('Next steps:');
  console.log('  1. npm version patch  (or minor/major)');
  console.log('  2. npm publish --access public');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('\n✅ No blocking errors, but check warnings above.\n');
  process.exit(0);
} else {
  console.log('\n❌ Fix errors before publishing.\n');
  process.exit(1);
}
