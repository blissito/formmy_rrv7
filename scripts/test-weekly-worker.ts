/**
 * Script de Testing: Weekly Emails Worker
 *
 * Ejecuta manualmente el worker de emails semanales sin esperar al lunes.
 * Útil para testing y debugging.
 *
 * Uso:
 *   npx tsx scripts/test-weekly-worker.ts
 */

import { runWeeklyEmailsNow } from '../server/jobs/workers/weekly-emails-worker';

async function main() {
  console.log('🚀 Iniciando ejecución manual del Weekly Emails Worker...\n');

  try {
    await runWeeklyEmailsNow();

    console.log('\n✅ Worker encolado exitosamente');
    console.log('📊 Revisa los logs para ver los resultados de la ejecución\n');
    console.log('El worker ejecutará:');
    console.log('  1. Chequeo de trial expiry (emails)');
    console.log('  2. Chequeo de no usage (emails)');
    console.log('  3. Chequeo de weekly summaries (emails)');
    console.log('  4. Conversión de trials expirados a FREE (sin email)\n');

    // Esperar 5 segundos para que el worker termine
    console.log('⏳ Esperando 5 segundos para que el worker complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n✅ Worker completado. Revisa los logs arriba para detalles.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando el worker:', error);
    process.exit(1);
  }
}

main();
