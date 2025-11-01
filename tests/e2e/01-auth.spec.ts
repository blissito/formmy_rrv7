import { test, expect } from '@playwright/test';
import { isLoggedIn, saveAuthState } from './helpers/auth.helper';
import * as fs from 'fs';

/**
 * Tests de autenticación básica
 *
 * PREREQUISITO: Cookie __session debe estar en tests/e2e/.auth/user.json
 * Ejecutar: npm run test:e2e:inject-session
 */

// Cargar sesión si existe
const authFile = './tests/e2e/.auth/user.json';
if (fs.existsSync(authFile)) {
  test.use({ storageState: authFile });
}

test.describe('Autenticación', () => {
  test('la página principal carga correctamente', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Si el usuario está logueado, puede ser redirigido al dashboard (Ghosty)
    // Si no está logueado, verá la home page pública
    await expect(page).toHaveTitle(/Chatbots|formularios|Formmy|Ghosty|Dashboard/i);

    // Tomar screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/01-home.png', fullPage: true });
  });

  test('puede navegar a la página de chat-ia', async ({ page }) => {
    await page.goto('/');

    // Buscar link de chat o chatbot
    const chatLink = page.locator('a[href*="chat"]').first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

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
    await page.waitForLoadState('load');
    await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard-main.png' });

    // Chatbots
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard-chat.png' });

    // API Keys
    await page.goto('/dashboard/api-keys');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard-apikeys.png' });

    // Formularios
    await page.goto('/dashboard/formmys');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/e2e/screenshots/01-dashboard-forms.png' });
  });
});
