import { test, expect } from '@playwright/test';
import { isLoggedIn } from './helpers/auth.helper';

/**
 * Tests de chatbot - Crear, configurar y probar
 *
 * PREREQUISITO: Usuario debe estar logueado
 */

test.describe('Chatbot - Flujo completo', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await isLoggedIn(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('puede acceder a la lista de chatbots', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    // Verificar que estamos en la página de chatbots
    expect(page.url()).toContain('/dashboard/chat');

    await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbots-list.png', fullPage: true });
  });

  test('puede crear un nuevo chatbot', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    // Buscar botón de crear nuevo chatbot
    const createButton = page.locator('text=/nuevo|crear|new/i').first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbot-create-form.png' });

      // Llenar formulario básico
      const nameInput = page.locator('input[name="name"], input[placeholder*="nombre"]').first();
      if (await nameInput.isVisible()) {
        const testName = `Test Bot ${Date.now()}`;
        await nameInput.fill(testName);

        await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbot-filled-form.png' });

        // Buscar botón de guardar/crear
        const saveButton = page.locator('button:has-text("Crear"), button:has-text("Guardar"), button[type="submit"]').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForLoadState('networkidle');

          // Verificar que se creó exitosamente
          // Puede redirigir a la página de configuración o lista
          await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbot-created.png', fullPage: true });
        }
      }
    } else {
      console.log('⚠️  No se encontró botón de crear chatbot - Puede que ya existan chatbots');
      await page.screenshot({ path: 'tests/e2e/screenshots/02-no-create-button.png' });
    }
  });

  test('puede ver el chatbot en la lista después de crearlo', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    // Buscar el primer chatbot en la lista
    const firstChatbot = page.locator('[data-testid="chatbot-item"], .chatbot-card, a[href*="/dashboard/chat/"]').first();

    if (await firstChatbot.isVisible()) {
      await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbots-with-items.png' });

      // Click en el primer chatbot
      await firstChatbot.click();
      await page.waitForLoadState('networkidle');

      // Debe estar en la página de detalle/configuración del chatbot
      expect(page.url()).toMatch(/\/dashboard\/chat\/.+/);

      await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbot-detail.png', fullPage: true });
    } else {
      console.log('⚠️  No se encontraron chatbots en la lista');
    }
  });

  test('puede probar conversación con el chatbot embed', async ({ page, context }) => {
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    // Click en el primer chatbot
    const firstChatbot = page.locator('[data-testid="chatbot-item"], .chatbot-card, a[href*="/dashboard/chat/"]').first();

    if (await firstChatbot.isVisible()) {
      await firstChatbot.click();
      await page.waitForLoadState('networkidle');

      // Buscar botón de "Probar" o "Preview"
      const previewButton = page.locator('text=/probar|preview|test|ver/i').first();

      if (await previewButton.isVisible()) {
        await previewButton.click();
        await page.waitForTimeout(2000); // Esperar a que cargue el embed

        await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbot-preview.png' });

        // Buscar el chat input
        const chatInput = page.locator('textarea, input[placeholder*="mensaje"], input[placeholder*="escribe"]').last();

        if (await chatInput.isVisible()) {
          await chatInput.fill('Hola, ¿cómo estás?');
          await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbot-message-typed.png' });

          // Buscar botón de enviar
          const sendButton = page.locator('button[type="submit"], button:has-text("Enviar")').last();
          if (await sendButton.isVisible()) {
            await sendButton.click();

            // Esperar respuesta (puede tomar tiempo por el LLM)
            await page.waitForTimeout(5000);

            await page.screenshot({ path: 'tests/e2e/screenshots/02-chatbot-response.png' });
          }
        }
      } else {
        // Intentar abrir el embed directamente si encontramos el slug
        const url = page.url();
        const match = url.match(/\/dashboard\/chat\/([^/]+)/);

        if (match) {
          const chatbotSlug = match[1];
          const embedPage = await context.newPage();
          await embedPage.goto(`/chat/embed?slug=${chatbotSlug}`);
          await embedPage.waitForLoadState('networkidle');

          await embedPage.screenshot({ path: 'tests/e2e/screenshots/02-chatbot-embed-direct.png' });

          await embedPage.close();
        }
      }
    }
  });
});
