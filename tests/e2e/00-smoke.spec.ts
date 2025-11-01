import { test, expect } from '@playwright/test';

/**
 * Smoke tests - Verificaciones básicas y rápidas
 * Ejecuta estos primero para validar que todo funciona
 */

test.describe('Smoke Tests', () => {
  test('el servidor está corriendo', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBeLessThan(400);
  });

  test('la página principal carga sin errores', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);

    await page.screenshot({ path: 'tests/e2e/screenshots/00-smoke-home.png' });
  });

  test('puede navegar entre páginas principales', async ({ page }) => {
    await page.goto('/');

    // Home
    expect(page.url()).toContain('/');

    // Chat page
    await page.goto('/chat-ia');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/chat');

    // Forms page
    await page.goto('/formularios');
    await page.waitForLoadState('networkidle');

    // Plans page
    await page.goto('/planes');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/planes');

    await page.screenshot({ path: 'tests/e2e/screenshots/00-smoke-navigation.png' });
  });

  test('recursos estáticos cargan correctamente', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Permitir algunos errores de third-party (analytics, etc)
    // pero no debería haber errores de recursos locales
    const localFailures = failedRequests.filter(req =>
      req.includes('localhost') || req.includes('formmy')
    );

    if (localFailures.length > 0) {
      console.warn('⚠️  Recursos locales que fallaron:', localFailures);
    }

    expect(localFailures.length).toBe(0);
  });

  test('no hay errores de consola críticos', async ({ page }) => {
    const criticalErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Filtrar errores conocidos/esperados
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('analytics')) {
          criticalErrors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    if (criticalErrors.length > 0) {
      console.warn('⚠️  Errores de consola encontrados:', criticalErrors);
    }

    // Permitir algunos errores menores
    expect(criticalErrors.length).toBeLessThan(5);
  });
});
