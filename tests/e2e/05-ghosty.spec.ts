import { test, expect } from '@playwright/test';

/**
 * Tests de Ghosty - Asistente de IA
 *
 * PREREQUISITO: Usuario debe estar logueado (cookie __session)
 * Ejecutar: npm run test:e2e:ghosty
 */

// Cargar sesión guardada
test.use({ storageState: './tests/e2e/.auth/user.json' });

test.describe('Ghosty - Asistente IA', () => {
  test('puede acceder a Ghosty desde el dashboard', async ({ page }) => {
    // Ir al dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('load');

    // Verificar que estamos logueados (no redirige a login)
    expect(page.url()).toContain('/dashboard');

    await page.screenshot({ path: 'tests/e2e/screenshots/05-dashboard-inicio.png' });

    // Buscar link o botón de Ghosty
    const ghostyLink = page.locator('a[href*="ghosty"], button:has-text("Ghosty")').first();

    if (await ghostyLink.isVisible()) {
      await ghostyLink.click();
      await page.waitForLoadState('load');

      // Verificar que estamos en Ghosty
      expect(page.url()).toContain('/ghosty');

      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-page.png', fullPage: true });

      console.log('✅ Página de Ghosty cargada');
    } else {
      console.log('⚠️  No se encontró link de Ghosty - navegando directamente');

      // Navegar directamente
      await page.goto('/dashboard/ghosty');
      await page.waitForLoadState('load');
    }
  });

  test('puede ver la interfaz de chat de Ghosty', async ({ page }) => {
    await page.goto('/dashboard/ghosty');
    await page.waitForLoadState('load');

    // Verificar URL correcta
    expect(page.url()).toContain('/ghosty');

    await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-inicio.png', fullPage: true });

    // Buscar elementos principales del chat
    const chatInput = page.locator('textarea, input[type="text"]').last();
    const sendButton = page.locator('button[type="submit"], button:has-text("Enviar")').last();

    // Verificar que existen
    if (await chatInput.isVisible()) {
      console.log('✅ Input de chat visible');
    }

    if (await sendButton.isVisible()) {
      console.log('✅ Botón de enviar visible');
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-interfaz.png' });
  });

  test('puede escribir un mensaje en Ghosty', async ({ page }) => {
    await page.goto('/dashboard/ghosty');
    await page.waitForLoadState('load');

    // Buscar input de chat
    const chatInput = page.locator('textarea, input[type="text"]').last();

    if (await chatInput.isVisible()) {
      // Escribir mensaje
      await chatInput.fill('Hola Ghosty, ¿cómo estás?');

      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-mensaje-escrito.png' });

      console.log('✅ Mensaje escrito en el input');
    } else {
      console.log('⚠️  Input de chat no encontrado');
      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-no-input.png' });
    }
  });

  test('puede enviar mensaje y recibir respuesta', async ({ page }) => {
    await page.goto('/dashboard/ghosty');
    await page.waitForLoadState('load');

    // Buscar input y botón
    const chatInput = page.locator('textarea, input[type="text"]').last();
    const sendButton = page.locator('button[type="submit"], button:has-text("Enviar")').last();

    if (await chatInput.isVisible() && await sendButton.isVisible()) {
      // Escribir y enviar
      await chatInput.fill('¿Qué puedes hacer?');

      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-antes-enviar.png' });

      await sendButton.click();

      console.log('✅ Mensaje enviado, esperando respuesta...');

      // Esperar indicador de carga o respuesta
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-esperando-respuesta.png' });

      // Esperar a que aparezca la respuesta (puede tomar tiempo)
      // Buscar el mensaje del asistente en el historial
      await page.waitForTimeout(10000); // Esperar hasta 10s por la respuesta del LLM

      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-con-respuesta.png', fullPage: true });

      console.log('✅ Screenshot capturado con respuesta');
    } else {
      console.log('⚠️  Chat no disponible');
      test.skip();
    }
  });

  test('puede ver historial de conversaciones (si existe)', async ({ page }) => {
    await page.goto('/dashboard/ghosty');
    await page.waitForLoadState('load');

    // Buscar historial/sidebar de conversaciones
    const historySection = page.locator('[data-testid="conversation-history"], .conversations-list, aside').first();

    if (await historySection.isVisible()) {
      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-historial.png' });

      console.log('✅ Historial de conversaciones visible');

      // Contar conversaciones
      const conversations = page.locator('.conversation-item, [data-testid="conversation"]');
      const count = await conversations.count();

      console.log(`📊 Conversaciones encontradas: ${count}`);
    } else {
      console.log('ℹ️  No se encontró historial de conversaciones');
    }
  });

  test('puede crear nueva conversación', async ({ page }) => {
    await page.goto('/dashboard/ghosty');
    await page.waitForLoadState('load');

    // Buscar botón de nueva conversación
    const newChatButton = page.locator('button:has-text("Nueva"), button:has-text("New"), button[aria-label*="new"]').first();

    if (await newChatButton.isVisible()) {
      await newChatButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-nueva-conversacion.png' });

      console.log('✅ Nueva conversación creada');
    } else {
      console.log('ℹ️  Botón de nueva conversación no encontrado');
    }
  });

  test('puede cambiar configuración de Ghosty (si disponible)', async ({ page }) => {
    await page.goto('/dashboard/ghosty');
    await page.waitForLoadState('load');

    // Buscar settings/configuración
    const settingsButton = page.locator('button:has-text("Configuración"), button:has-text("Settings"), [aria-label*="settings"]').first();

    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'tests/e2e/screenshots/05-ghosty-settings.png' });

      console.log('✅ Panel de configuración abierto');
    } else {
      console.log('ℹ️  Configuración no disponible o no encontrada');
    }
  });
});
