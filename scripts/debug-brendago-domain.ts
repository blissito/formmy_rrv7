/**
 * Script para debuggear el problema con brendago.design
 *
 * Usage: npx tsx scripts/debug-brendago-domain.ts
 */

import {
  normalizeDomain,
  domainsMatch,
  validateDomainAccess,
} from '../server/utils/domain-validator.server';

console.log('🔍 Debuggeando problema con brendago.design\n');
console.log('━'.repeat(60));

// Caso 1: Simular request desde www.brendago.design
console.log('\n📋 CASO 1: Request desde www.brendago.design');
console.log('━'.repeat(60));

const origin1 = 'https://www.brendago.design';
const allowedDomains1 = ['www.brendago.design'];

console.log('Origin:', origin1);
console.log('Allowed domains:', allowedDomains1);
console.log('');

// Paso a paso
const originHost = new URL(origin1).hostname;
console.log('1. originHost extraído:', originHost);

const normalizedOrigin = normalizeDomain(originHost);
console.log('2. Origin normalizado:', normalizedOrigin);

const normalizedAllowed = allowedDomains1.map(d => normalizeDomain(d));
console.log('3. Allowed normalizados:', normalizedAllowed);

const matches = domainsMatch(originHost, allowedDomains1[0]);
console.log('4. domainsMatch result:', matches);

const validation = validateDomainAccess(origin1, allowedDomains1);
console.log('5. validateDomainAccess result:', validation);
console.log('   ✅ Allowed:', validation.allowed);
console.log('   📝 Reason:', validation.reason);

// Caso 2: Usuario guardó el dominio con https://
console.log('\n━'.repeat(60));
console.log('\n📋 CASO 2: Dominio guardado con https://');
console.log('━'.repeat(60));

const origin2 = 'https://www.brendago.design';
const allowedDomains2 = ['https://www.brendago.design']; // Como usuario lo guarda

console.log('Origin:', origin2);
console.log('Allowed domains:', allowedDomains2);
console.log('');

const validation2 = validateDomainAccess(origin2, allowedDomains2);
console.log('validateDomainAccess result:', validation2);
console.log('   ✅ Allowed:', validation2.allowed);
console.log('   📝 Reason:', validation2.reason);

// Caso 3: Mezcla de www
console.log('\n━'.repeat(60));
console.log('\n📋 CASO 3: Origin sin www, allowed con www');
console.log('━'.repeat(60));

const origin3 = 'https://brendago.design';
const allowedDomains3 = ['www.brendago.design'];

console.log('Origin:', origin3);
console.log('Allowed domains:', allowedDomains3);
console.log('');

const validation3 = validateDomainAccess(origin3, allowedDomains3);
console.log('validateDomainAccess result:', validation3);
console.log('   ✅ Allowed:', validation3.allowed);
console.log('   📝 Reason:', validation3.reason);

// Caso 4: Origin con www, allowed sin www
console.log('\n━'.repeat(60));
console.log('\n📋 CASO 4: Origin con www, allowed sin www');
console.log('━'.repeat(60));

const origin4 = 'https://www.brendago.design';
const allowedDomains4 = ['brendago.design'];

console.log('Origin:', origin4);
console.log('Allowed domains:', allowedDomains4);
console.log('');

const validation4 = validateDomainAccess(origin4, allowedDomains4);
console.log('validateDomainAccess result:', validation4);
console.log('   ✅ Allowed:', validation4.allowed);
console.log('   📝 Reason:', validation4.reason);

console.log('\n━'.repeat(60));
console.log('\n🎯 RESUMEN:');
console.log('━'.repeat(60));
console.log('Caso 1 (www → www):', validation.allowed ? '✅ PASS' : '❌ FAIL');
console.log('Caso 2 (con https://):', validation2.allowed ? '✅ PASS' : '❌ FAIL');
console.log('Caso 3 (sin www → www):', validation3.allowed ? '✅ PASS' : '❌ FAIL');
console.log('Caso 4 (www → sin www):', validation4.allowed ? '✅ PASS' : '❌ FAIL');
console.log('');
