import { test, expect } from '@playwright/test';
import { isLoggedIn, saveAuthState } from './helpers/auth.helper';

/**
 * Tests de autenticación básica
 *
 * PREREQUISITO: Necesitas estar logueado previamente o configurar variables de entorno:
 * - TEST_USER_EMAIL
 * - TEST_USER_PASSWORD
 */

test.describe('Autenticación', () => {
  test('la página principal carga correctamente', async ({ page }) => {
    await page.goto('/');

    // Verificar que el título o algún elemento principal esté presente
    await expect(page).toHaveTitle(/Formmy/i);

    // Tomar screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/01-home.png', fullPage: true });
  });

  test('puede navegar a la página de chat-ia', async ({ page }) => {
    await page.goto('/');

    // Buscar link de chat o chatbot
    const chatLink = page.locator('a[href*="chat"]').first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await page.waitForLoadState('networkidle');

      // Verificar que estamos en alguna página de chat
      expect(page.url()).toMatch(/chat/);

      await page.screenshot({ path: 'tests/e2e/screenshots/01-chat-page.png', fullPage: true });
    }
  });

  test('puede acceder al dashboard (si está logueado)', async ({ page }) => {
    const loggedIn = await isLoggedIn(page);

    if (loggedIn) {
      console.log('✅ Usuario logueado - Guardando estado de autenticación');

      // Guardar estado para otros tests
      await saveAuthState(page);

      // Verificar que estamos en dashboard
      expect(page.url()).toContain('/dashboard');

      await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard.png', fullPage: true });
    } else {
      console.log('⚠️  Usuario NO logueado - Los siguientes tests pueden fallar');
      console.log('   Para autenticarte:');
      console.log('   1. Abre el navegador manualmente');
      console.log('   2. Loguéate en http://localhost:5173');
      console.log('   3. Corre este test nuevamente');
    }
  });

  test('navegar por las secciones del dashboard', async ({ page }) => {
    const loggedIn = await isLoggedIn(page);

    if (!loggedIn) {
      test.skip();
      return;
    }

    // Dashboard principal
    await page.goto('/dashboard');
    await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard-main.png' });

    // Chatbots
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard-chat.png' });

    // API Keys
    await page.goto('/dashboard/api-keys');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard-apikeys.png' });

    // Formularios
    await page.goto('/dashboard/formmys');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard-forms.png' });
  });
});
