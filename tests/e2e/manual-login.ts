#!/usr/bin/env tsx

/**
 * Script para hacer login manual y guardar la sesión
 *
 * Este script usa un navegador REAL persistente (no automatizado)
 * para que Google OAuth no lo rechace.
 *
 * USO:
 *   npm run test:e2e:manual-login
 *
 * o directamente:
 *   npx tsx tests/e2e/manual-login.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function manualLogin() {
  console.log('\n🚀 Iniciando proceso de login manual...\n');

  // Crear directorio para auth si no existe
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Lanzar navegador en modo PERSISTENTE (como un navegador normal)
  const browser = await chromium.launchPersistentContext(
    path.join(__dirname, '.auth/browser-data'),
    {
      headless: false,
      viewport: { width: 1280, height: 720 },
      // Configuración para parecer un navegador real
      channel: 'chrome', // Usa Chrome instalado en tu sistema
    }
  );

  const page = browser.pages()[0] || await browser.newPage();

  console.log('📍 Navegando a Formmy...\n');
  await page.goto('http://localhost:3000');

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  👉 COMPLETA EL LOGIN EN EL NAVEGADOR QUE SE ABRIÓ      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log('Pasos:');
  console.log('  1. Click en "Iniciar sesión"');
  console.log('  2. Click en "Continuar con Google"');
  console.log('  3. Selecciona tu cuenta de Google');
  console.log('  4. Autoriza la aplicación');
  console.log('  5. Espera a ver el DASHBOARD\n');
  console.log('⏸️  El script detectará automáticamente cuando estés logueado...\n');

  // Esperar a que llegue al dashboard
  try {
    await page.waitForURL('**/dashboard**', { timeout: 300000 }); // 5 minutos

    console.log('\n✅ ¡Login detectado!\n');
    console.log('📍 URL actual:', page.url());

    // Guardar el estado de autenticación
    console.log('\n💾 Guardando sesión...');

    await browser.storageState({ path: path.join(authDir, 'user.json') });

    console.log('✅ Sesión guardada en: tests/e2e/.auth/user.json\n');

    // Esperar 2 segundos para que veas el dashboard
    await page.waitForTimeout(2000);

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  🎉 ¡LISTO! Ahora puedes ejecutar los tests E2E          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('Ejecuta:');
    console.log('  npm run test:e2e          # Todos los tests');
    console.log('  npm run test:e2e:ui       # Modo UI interactivo');
    console.log('  npm run test:e2e:chatbot  # Solo chatbots');
    console.log('  npm run test:e2e:rag      # Solo RAG\n');

  } catch (error) {
    console.error('\n❌ Timeout esperando el login');
    console.error('   Verifica que hayas completado el login correctamente\n');
  } finally {
    await browser.close();
  }
}

// Ejecutar
manualLogin().catch(console.error);
