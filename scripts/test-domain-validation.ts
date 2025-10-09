/**
 * Test Domain Validation
 *
 * Script para verificar que la normalización y validación de dominios funciona correctamente.
 *
 * Usage:
 *   npx tsx scripts/test-domain-validation.ts
 */

import {
  normalizeDomain,
  domainsMatch,
  validateDomainAccess,
  normalizeDomainsForStorage
} from '../server/utils/domain-validator.server';

console.log('🧪 Testing Domain Validation\n');

// Test 1: normalizeDomain
console.log('📋 Test 1: normalizeDomain');
console.log('━'.repeat(50));

const testDomains = [
  'www.ejemplo.com',
  'ejemplo.com',
  'https://ejemplo.com',
  'http://www.ejemplo.com/',
  'ejemplo.com:3000',
  'https://ejemplo.com/path/to/page',
  'EJEMPLO.COM',
  'https://WWW.EJEMPLO.COM',
];

testDomains.forEach(domain => {
  const normalized = normalizeDomain(domain);
  console.log(`  "${domain}" → "${normalized}"`);
});

console.log('');

// Test 2: domainsMatch
console.log('📋 Test 2: domainsMatch (flexible comparison)');
console.log('━'.repeat(50));

const matchTests = [
  { origin: 'www.ejemplo.com', allowed: 'ejemplo.com', expected: true },
  { origin: 'ejemplo.com', allowed: 'www.ejemplo.com', expected: true },
  { origin: 'sub.ejemplo.com', allowed: 'ejemplo.com', expected: false },
  { origin: 'ejemplo.com', allowed: 'ejemplo.com', expected: true },
  { origin: 'https://ejemplo.com', allowed: 'http://www.ejemplo.com', expected: true },
  { origin: 'ejemplo.mx', allowed: 'ejemplo.com', expected: false },
];

matchTests.forEach(({ origin, allowed, expected }) => {
  const result = domainsMatch(origin, allowed);
  const status = result === expected ? '✅' : '❌';
  console.log(`  ${status} "${origin}" vs "${allowed}": ${result} (expected: ${expected})`);
});

console.log('');

// Test 3: validateDomainAccess
console.log('📋 Test 3: validateDomainAccess');
console.log('━'.repeat(50));

const accessTests = [
  {
    origin: 'https://www.ejemplo.com',
    allowedDomains: ['ejemplo.com', 'app.ejemplo.com'],
    expectedAllowed: true
  },
  {
    origin: 'https://ejemplo.com',
    allowedDomains: ['www.ejemplo.com'],
    expectedAllowed: true
  },
  {
    origin: 'https://malicious.com',
    allowedDomains: ['ejemplo.com'],
    expectedAllowed: false
  },
  {
    origin: null,
    allowedDomains: ['ejemplo.com'],
    expectedAllowed: true // Sin origin header, permitir
  },
  {
    origin: 'https://ejemplo.com',
    allowedDomains: [],
    expectedAllowed: true // Sin restricciones, permitir
  },
];

accessTests.forEach(({ origin, allowedDomains, expectedAllowed }) => {
  const validation = validateDomainAccess(origin, allowedDomains);
  const status = validation.allowed === expectedAllowed ? '✅' : '❌';
  console.log(`  ${status} Origin: ${origin || 'null'}`);
  console.log(`     Allowed domains: [${allowedDomains.join(', ')}]`);
  console.log(`     Result: ${validation.allowed} (expected: ${expectedAllowed})`);
  console.log(`     Reason: ${validation.reason}`);
  console.log('');
});

// Test 4: normalizeDomainsForStorage
console.log('📋 Test 4: normalizeDomainsForStorage (deduplication)');
console.log('━'.repeat(50));

const storageTests = [
  ['www.ejemplo.com', 'https://ejemplo.com', 'http://www.ejemplo.com/'],
  ['ejemplo.com', 'app.ejemplo.com', 'blog.ejemplo.com'],
  ['https://ejemplo.com:3000', 'ejemplo.com', 'EJEMPLO.COM'],
];

storageTests.forEach(domains => {
  const normalized = normalizeDomainsForStorage(domains);
  console.log(`  Input:  [${domains.join(', ')}]`);
  console.log(`  Output: [${normalized.join(', ')}]`);
  console.log('');
});

console.log('━'.repeat(50));
console.log('✅ All tests completed!');
