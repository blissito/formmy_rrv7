/**
 * Diagnóstico específico de localhost
 *
 * Usage: npx tsx scripts/diagnose-localhost.ts
 */

import { validateDomainAccess, domainsMatch, normalizeDomain } from '../server/utils/domain-validator.server';

console.log('🔍 Diagnóstico específico de localhost\n');

// Escenarios reales de desarrollo
const scenarios = [
  // 1. Usuario tiene "localhost" en allowedDomains
  {
    name: 'Widget desde localhost:5173 (vite dev)',
    origin: 'http://localhost:5173',
    allowedDomains: ['localhost'],
  },
  {
    name: 'Widget desde localhost:3000 (otro puerto)',
    origin: 'http://localhost:3000',
    allowedDomains: ['localhost'],
  },
  {
    name: 'Widget desde 127.0.0.1:5173',
    origin: 'http://127.0.0.1:5173',
    allowedDomains: ['localhost'],
  },
  {
    name: 'Widget desde 127.0.0.1 (sin puerto)',
    origin: 'http://127.0.0.1',
    allowedDomains: ['localhost'],
  },

  // 2. Usuario tiene "127.0.0.1" en allowedDomains
  {
    name: 'Widget desde localhost con allowed 127.0.0.1',
    origin: 'http://localhost:5173',
    allowedDomains: ['127.0.0.1'],
  },

  // 3. Usuario tiene ambos
  {
    name: 'Widget desde localhost con ambos permitidos',
    origin: 'http://localhost:5173',
    allowedDomains: ['localhost', '127.0.0.1'],
  },
  {
    name: 'Widget desde 127.0.0.1 con ambos permitidos',
    origin: 'http://127.0.0.1:5173',
    allowedDomains: ['localhost', '127.0.0.1'],
  },

  // 4. Sin origin header (iframe edge case)
  {
    name: 'Sin Origin header y allowedDomains configurado',
    origin: null as string | null,
    allowedDomains: ['localhost'],
  },

  // 5. Sin restricciones
  {
    name: 'Sin Origin header y SIN allowedDomains',
    origin: null as string | null,
    allowedDomains: [] as string[],
  },

  // 6. Origin con puerto específico en allowedDomains
  {
    name: 'localhost:5173 vs "localhost:5173" en allowed',
    origin: 'http://localhost:5173',
    allowedDomains: ['localhost:5173'],
  },
  {
    name: 'localhost:3000 vs "localhost:5173" en allowed',
    origin: 'http://localhost:3000',
    allowedDomains: ['localhost:5173'],
  },
];

scenarios.forEach(({ name, origin, allowedDomains }) => {
  const result = validateDomainAccess(origin, allowedDomains);
  const icon = result.allowed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  console.log(`   Origin: ${origin || 'null'}`);
  console.log(`   Allowed: [${allowedDomains.join(', ')}]`);
  console.log(`   Result: ${result.allowed ? 'PERMITIDO' : 'BLOQUEADO'}`);
  console.log(`   Reason: ${result.reason}`);
  console.log('');
});

console.log('━'.repeat(60));
console.log('\n📋 Resumen de normalización:\n');

const hostsToNormalize = [
  'localhost',
  'localhost:5173',
  '127.0.0.1',
  '127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

hostsToNormalize.forEach(h => {
  console.log(`  "${h}" → "${normalizeDomain(h)}"`);
});

console.log('\n━'.repeat(60));
console.log('\n📋 Test domainsMatch para localhost:\n');

const matchTests = [
  { a: 'localhost', b: '127.0.0.1' },
  { a: '127.0.0.1', b: 'localhost' },
  { a: 'localhost', b: 'localhost' },
  { a: '127.0.0.1', b: '127.0.0.1' },
];

matchTests.forEach(({ a, b }) => {
  const match = domainsMatch(a, b);
  console.log(`  domainsMatch("${a}", "${b}") = ${match}`);
});
