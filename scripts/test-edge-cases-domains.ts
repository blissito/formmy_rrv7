/**
 * Test Edge Cases - Domain Validation
 *
 * Prueba casos extremos y potenciales problemas de seguridad
 *
 * Usage:
 *   npx tsx scripts/test-edge-cases-domains.ts
 */

import {
  normalizeDomain,
  domainsMatch,
  validateDomainAccess,
  normalizeDomainsForStorage
} from '../server/utils/domain-validator.server';

console.log('🧪 Testing Edge Cases & Security\n');

// Test 1: Dominios maliciosos
console.log('📋 Test 1: Dominios Maliciosos');
console.log('━'.repeat(50));

const maliciousTests = [
  { origin: 'https://ejemplo.com.malicious.com', allowed: 'ejemplo.com', shouldBlock: true },
  { origin: 'https://malicious-ejemplo.com', allowed: 'ejemplo.com', shouldBlock: true },
  { origin: 'https://ejemplo-com.malicious.net', allowed: 'ejemplo.com', shouldBlock: true },
];

maliciousTests.forEach(({ origin, allowed, shouldBlock }) => {
  const match = domainsMatch(origin, allowed);
  const status = (match === false && shouldBlock) ? '✅ BLOQUEADO' : '❌ FALLO';
  console.log(`  ${status} "${origin}" vs "${allowed}": ${match ? 'PERMITIDO' : 'BLOQUEADO'}`);
});

console.log('');

// Test 2: Dominios vacíos y null
console.log('📋 Test 2: Dominios Vacíos/Null/Undefined');
console.log('━'.repeat(50));

const emptyTests = [
  { domains: ['', '  ', '\t'], expected: [] },
  { domains: ['ejemplo.com', '', 'app.ejemplo.com'], expected: ['ejemplo.com', 'app.ejemplo.com'] },
  { domains: [], expected: [] },
];

emptyTests.forEach(({ domains, expected }) => {
  const result = normalizeDomainsForStorage(domains);
  const status = JSON.stringify(result) === JSON.stringify(expected) ? '✅' : '❌';
  console.log(`  ${status} Input: [${domains.map(d => `"${d}"`).join(', ')}]`);
  console.log(`     Output: [${result.join(', ')}] (expected: [${expected.join(', ')}])`);
});

console.log('');

// Test 3: Caracteres especiales y Unicode
console.log('📋 Test 3: Caracteres Especiales');
console.log('━'.repeat(50));

const specialCharsTests = [
  'ejemplo.com?param=value',
  'ejemplo.com#section',
  'ejemplo.com/path?query=1#hash',
  'user:pass@ejemplo.com',
];

specialCharsTests.forEach(domain => {
  try {
    const normalized = normalizeDomain(domain);
    console.log(`  ✅ "${domain}" → "${normalized}"`);
  } catch (error) {
    console.log(`  ❌ "${domain}" → ERROR: ${error}`);
  }
});

console.log('');

// Test 4: Dominios IDN (Internationalized Domain Names)
console.log('📋 Test 4: Dominios Internacionales (IDN)');
console.log('━'.repeat(50));

const idnTests = [
  'https://español.com',
  'https://中国.cn',
  'https://münchen.de',
];

idnTests.forEach(domain => {
  try {
    const normalized = normalizeDomain(domain);
    console.log(`  ✅ "${domain}" → "${normalized}"`);
  } catch (error) {
    console.log(`  ⚠️  "${domain}" → ERROR: ${error}`);
  }
});

console.log('');

// Test 5: Duplicados con variaciones
console.log('📋 Test 5: Deduplicación con Variaciones');
console.log('━'.repeat(50));

const deduplicationTests = [
  {
    input: [
      'www.ejemplo.com',
      'WWW.EJEMPLO.COM',
      'https://www.ejemplo.com',
      'http://www.ejemplo.com/',
      'www.ejemplo.com:443',
    ],
    expectedCount: 1, // Todos se normalizan a "www.ejemplo.com"
  },
  {
    input: [
      'ejemplo.com',
      'www.ejemplo.com',
      'app.ejemplo.com',
    ],
    expectedCount: 3, // Diferentes subdominios
  },
];

deduplicationTests.forEach(({ input, expectedCount }) => {
  const result = normalizeDomainsForStorage(input);
  const status = result.length === expectedCount ? '✅' : '❌';
  console.log(`  ${status} Input: ${input.length} dominios → Output: ${result.length} (expected: ${expectedCount})`);
  console.log(`     Result: [${result.join(', ')}]`);
});

console.log('');

// Test 6: IP addresses (edge case)
console.log('📋 Test 6: IP Addresses');
console.log('━'.repeat(50));

const ipTests = [
  'http://192.168.1.1',
  'https://127.0.0.1:3000',
  'http://[::1]', // IPv6
];

ipTests.forEach(ip => {
  try {
    const normalized = normalizeDomain(ip);
    console.log(`  ✅ "${ip}" → "${normalized}"`);
  } catch (error) {
    console.log(`  ⚠️  "${ip}" → ERROR`);
  }
});

console.log('');

// Test 7: Localhost variations
console.log('📋 Test 7: Localhost Variations');
console.log('━'.repeat(50));

const localhostTests = [
  { origin: 'http://localhost:3000', allowed: 'localhost', expected: true },
  { origin: 'http://127.0.0.1', allowed: 'localhost', expected: false },
  { origin: 'http://localhost', allowed: 'localhost:3000', expected: true }, // Puerto ignorado
];

localhostTests.forEach(({ origin, allowed, expected }) => {
  const match = domainsMatch(origin, allowed);
  const status = match === expected ? '✅' : '❌';
  console.log(`  ${status} "${origin}" vs "${allowed}": ${match} (expected: ${expected})`);
});

console.log('');

// Test 8: validateDomainAccess con origin null
console.log('📋 Test 8: Origin Null (Server-side requests)');
console.log('━'.repeat(50));

const validation = validateDomainAccess(null, ['ejemplo.com']);
console.log(`  ✅ Origin null: ${validation.allowed ? 'PERMITIDO' : 'BLOQUEADO'}`);
console.log(`     Reason: ${validation.reason}`);

console.log('');

// Test 9: Dominios muy largos
console.log('📋 Test 9: Dominios Extremadamente Largos');
console.log('━'.repeat(50));

const longDomain = 'a'.repeat(50) + '.ejemplo.com';
try {
  const normalized = normalizeDomain(longDomain);
  console.log(`  ✅ Dominio largo (${longDomain.length} chars) → "${normalized}"`);
} catch (error) {
  console.log(`  ❌ Dominio largo falló`);
}

console.log('');

// Test 10: Case sensitivity
console.log('📋 Test 10: Case Sensitivity');
console.log('━'.repeat(50));

const caseTests = [
  { origin: 'EJEMPLO.COM', allowed: 'ejemplo.com', expected: true },
  { origin: 'Ejemplo.Com', allowed: 'EJEMPLO.COM', expected: true },
  { origin: 'WWW.EJEMPLO.COM', allowed: 'ejemplo.com', expected: true },
];

caseTests.forEach(({ origin, allowed, expected }) => {
  const match = domainsMatch(origin, allowed);
  const status = match === expected ? '✅' : '❌';
  console.log(`  ${status} "${origin}" vs "${allowed}": ${match} (expected: ${expected})`);
});

console.log('');
console.log('━'.repeat(50));
console.log('✅ Edge cases testing completed!');
