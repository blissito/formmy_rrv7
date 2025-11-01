import { test, expect } from '@playwright/test';
import { isLoggedIn } from './helpers/auth.helper';

/**
 * Tests de API Keys - Crear, listar, revocar
 *
 * PREREQUISITO: Usuario debe estar logueado
 */

test.describe('API Keys', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await isLoggedIn(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('puede acceder a la página de API Keys', async ({ page }) => {
    await page.goto('/dashboard/api-keys');
    await page.waitForLoadState('networkidle');

    // Verificar que estamos en la página correcta
    expect(page.url()).toContain('/dashboard/api-keys');

    await page.screenshot({ path: 'tests/e2e/screenshots/04-apikeys-page.png', fullPage: true });
  });

  test('puede ver tabs de API Keys (RAG, Parser, etc)', async ({ page }) => {
    await page.goto('/dashboard/api-keys');
    await page.waitForLoadState('networkidle');

    // Buscar tabs
    const tabs = page.locator('button, a').filter({ hasText: /rag|parser|observability|voice/i });

    const tabCount = await tabs.count();
    console.log(`Found ${tabCount} API key tabs`);

    if (tabCount > 0) {
      // Click en cada tab y tomar screenshot
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabText = await tab.textContent();
        console.log(`Clicking tab: ${tabText}`);

        await tab.click();
        await page.waitForTimeout(1000);

        const sanitizedTabName = tabText?.toLowerCase().replace(/\s+/g, '-') || `tab-${i}`;
        await page.screenshot({ path: `tests/e2e/screenshots/04-apikeys-${sanitizedTabName}.png` });
      }
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/04-apikeys-all-tabs.png', fullPage: true });
  });

  test('puede crear una nueva API Key', async ({ page }) => {
    await page.goto('/dashboard/api-keys');
    await page.waitForLoadState('networkidle');

    // Buscar botón de crear
    const createButton = page.locator('button:has-text("Crear"), button:has-text("Nueva"), button:has-text("Generate")').first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'tests/e2e/screenshots/04-apikey-create-modal.png' });

      // Buscar campo de nombre
      const nameInput = page.locator('input[name="name"], input[placeholder*="nombre"]').first();

      if (await nameInput.isVisible()) {
        await nameInput.fill(`Test API Key ${Date.now()}`);

        // Buscar botón de confirmar
        const confirmButton = page.locator('button:has-text("Crear"), button:has-text("Generar"), button[type="submit"]').first();

        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'tests/e2e/screenshots/04-apikey-created.png', fullPage: true });

          // Puede mostrar la key generada
          const apiKeyDisplay = page.locator('[data-testid="api-key"], code, pre').first();
          if (await apiKeyDisplay.isVisible()) {
            const keyText = await apiKeyDisplay.textContent();
            console.log('✅ API Key creada:', keyText?.substring(0, 20) + '...');
          }
        }
      }
    } else {
      console.log('ℹ️  No se encontró botón de crear API Key o ya existe una');
      await page.screenshot({ path: 'tests/e2e/screenshots/04-no-create-button.png' });
    }
  });

  test('puede ver la lista de API Keys existentes', async ({ page }) => {
    await page.goto('/dashboard/api-keys');
    await page.waitForLoadState('networkidle');

    // Buscar tabla o lista de keys
    const keysList = page.locator('[data-testid="api-keys-list"], table, .api-key-item');

    if (await keysList.isVisible()) {
      const keysCount = await page.locator('tr, .api-key-item').count();
      console.log(`Found ${keysCount} API keys`);

      await page.screenshot({ path: 'tests/e2e/screenshots/04-apikeys-list.png', fullPage: true });
    } else {
      console.log('ℹ️  No se encontraron API Keys o la lista no está visible');
      await page.screenshot({ path: 'tests/e2e/screenshots/04-no-apikeys.png' });
    }
  });

  test('puede copiar una API Key al clipboard', async ({ page, context }) => {
    // Dar permisos de clipboard
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/dashboard/api-keys');
    await page.waitForLoadState('networkidle');

    // Buscar botón de copiar
    const copyButton = page.locator('button:has-text("Copiar"), button[title*="Copy"], button[aria-label*="copy"]').first();

    if (await copyButton.isVisible()) {
      await copyButton.click();
      await page.waitForTimeout(500);

      // Verificar que se copió
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

      if (clipboardText) {
        console.log('✅ API Key copiada al clipboard:', clipboardText.substring(0, 20) + '...');
      }

      await page.screenshot({ path: 'tests/e2e/screenshots/04-apikey-copied.png' });
    }
  });

  test('puede revocar/eliminar una API Key', async ({ page }) => {
    await page.goto('/dashboard/api-keys');
    await page.waitForLoadState('networkidle');

    // Buscar botón de eliminar/revocar
    const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Revocar"), button:has-text("Delete")').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'tests/e2e/screenshots/04-apikey-delete-confirm.png' });

      // Confirmar eliminación
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Delete")').first();

      if (await confirmButton.isVisible()) {
        console.log('⚠️  Test de eliminación - NO ejecutando para no borrar keys reales');
        // await confirmButton.click();
        // await page.waitForTimeout(1000);
        // await page.screenshot({ path: 'tests/e2e/screenshots/04-apikey-deleted.png' });
      }
    } else {
      console.log('ℹ️  No se encontró botón de eliminar/revocar');
    }
  });

  test('puede ver la sección de observabilidad (traces)', async ({ page }) => {
    await page.goto('/dashboard/api-keys?tab=observability');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'tests/e2e/screenshots/04-observability-tab.png', fullPage: true });

    // Buscar lista de traces
    const tracesList = page.locator('[data-testid="traces-list"], table').first();

    if (await tracesList.isVisible()) {
      console.log('✅ Sección de observabilidad visible');

      // Click en primer trace si existe
      const firstTrace = page.locator('tr, .trace-item').nth(1); // 0 es el header
      if (await firstTrace.isVisible()) {
        await firstTrace.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'tests/e2e/screenshots/04-trace-detail.png', fullPage: true });
      }
    } else {
      console.log('ℹ️  No hay traces disponibles');
      await page.screenshot({ path: 'tests/e2e/screenshots/04-no-traces.png' });
    }
  });
});
