import { test, expect } from '@playwright/test';

/**
 * Test interactivo para hacer login con Google OAuth
 *
 * Este test abre el navegador y PAUSA para que puedas:
 * 1. Seleccionar tu cuenta de Google
 * 2. Autorizar la app
 * 3. Completar el login
 *
 * Una vez logueado, guarda la sesión para que los demás tests la reutilicen.
 *
 * IMPORTANTE: Este test debe ejecutarse con --headed (modo visual)
 *
 * Ejecutar con:
 *   npm run test:e2e:setup-auth
 *
 * o directamente:
 *   npx playwright test tests/e2e/setup-auth.spec.ts --headed
 */

test.describe('Setup Auth - Login Interactivo', () => {
  test('login con Google OAuth (intervención manual)', async ({ page, context }) => {
    console.log('\n🚀 Iniciando proceso de login interactivo...\n');

    // 1. Ir a la home
    await page.goto('/');
    await page.waitForLoadState('load');

    console.log('📍 En home page - Busca el botón de "Iniciar sesión" o "Login"\n');

    // 2. Buscar botón de login
    const loginButton = page.locator('text=/iniciar sesión|login|sign in/i').first();

    if (await loginButton.isVisible()) {
      console.log('✅ Botón de login encontrado!\n');

      // 3. Click en login
      await loginButton.click();
      await page.waitForTimeout(2000);

      console.log('🔐 PAUSANDO PARA QUE COMPLETES EL LOGIN...');
      console.log('');
      console.log('👉 INSTRUCCIONES:');
      console.log('   1. El navegador está abierto y visible');
      console.log('   2. Haz click en "Continuar con Google" o el botón de Google');
      console.log('   3. Selecciona tu cuenta de Google');
      console.log('   4. Autoriza la aplicación si te lo pide');
      console.log('   5. Espera a que te redirija al dashboard');
      console.log('');
      console.log('⏸️  Cuando estés en el dashboard, el test continuará automáticamente...');
      console.log('');

      // 4. PAUSAR para que el usuario haga login manualmente
      // El navegador permanece abierto y el usuario puede interactuar

      // Esperar a que aparezca la URL del dashboard (señal de login exitoso)
      await page.waitForURL('**/dashboard**', { timeout: 120000 }); // 2 minutos de timeout

      console.log('\n✅ Login detectado! Estás en el dashboard');

      // 5. Verificar que estamos logueados
      const currentUrl = page.url();
      expect(currentUrl).toContain('/dashboard');

      console.log('✅ Verificación exitosa - URL del dashboard:', currentUrl);

      // 6. Guardar el estado de autenticación
      console.log('\n💾 Guardando sesión de autenticación...');

      await context.storageState({ path: './tests/e2e/.auth/user.json' });

      console.log('✅ Sesión guardada en: tests/e2e/.auth/user.json');
      console.log('');
      console.log('🎉 ¡Listo! Ahora puedes ejecutar los otros tests y usarán esta sesión.');
      console.log('');
      console.log('Ejecuta:');
      console.log('  npm run test:e2e        # Todos los tests');
      console.log('  npm run test:e2e:chatbot   # Solo chatbots');
      console.log('  npm run test:e2e:rag       # Solo RAG');
      console.log('');

      // Screenshot del dashboard
      await page.screenshot({
        path: 'tests/e2e/screenshots/setup-auth-dashboard.png',
        fullPage: true
      });

    } else {
      console.log('❌ No se encontró el botón de login');
      console.log('   Revisa que la página esté cargada correctamente');
      throw new Error('Botón de login no encontrado');
    }
  });

  test('verificar que la sesión se guardó correctamente', async ({ page, context }) => {
    // Intentar cargar la sesión guardada
    const fs = require('fs');
    const path = './tests/e2e/.auth/user.json';

    if (fs.existsSync(path)) {
      console.log('✅ Archivo de sesión encontrado');

      // Cargar la sesión
      await context.storageState({ path });

      // Ir al dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('load');

      // Verificar que estamos logueados (no redirige a login)
      const url = page.url();
      expect(url).toContain('/dashboard');

      console.log('✅ Sesión válida - Dashboard cargado correctamente');
      console.log('   URL:', url);

    } else {
      console.log('⚠️  No se encontró archivo de sesión');
      console.log('   Ejecuta primero el test de login interactivo');
      test.skip();
    }
  });
});
