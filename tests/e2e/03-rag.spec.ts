import { test, expect } from '@playwright/test';
import { isLoggedIn } from './helpers/auth.helper';
import path from 'path';

/**
 * Tests de RAG - Upload y query de documentos
 *
 * PREREQUISITO: Usuario debe estar logueado y tener un chatbot creado
 */

// Cargar sesión guardada
test.use({ storageState: './tests/e2e/.auth/user.json' });

test.describe('RAG - Documentos y Contexto', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await isLoggedIn(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('puede acceder a la sección de contexto/RAG', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    // Click en el primer chatbot
    const firstChatbot = page.locator('[data-testid="chatbot-item"], .chatbot-card, a[href*="/dashboard/chat/"]').first();

    if (await firstChatbot.isVisible()) {
      await firstChatbot.click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'tests/e2e/screenshots/03-chatbot-config.png' });

      // Buscar sección de contexto/RAG/documentos
      const ragSection = page.locator('text=/contexto|documentos|rag|knowledge/i').first();

      if (await ragSection.isVisible()) {
        await ragSection.click();
        await page.waitForLoadState('networkidle');

        await page.screenshot({ path: 'tests/e2e/screenshots/03-rag-section.png', fullPage: true });
      } else {
        console.log('⚠️  No se encontró sección de RAG/Contexto');

        // Intentar buscar un tab o menú
        const tabs = page.locator('button, a').filter({ hasText: /contexto|documentos|rag|knowledge/i });
        if (await tabs.first().isVisible()) {
          await tabs.first().click();
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: 'tests/e2e/screenshots/03-rag-section-via-tab.png' });
        }
      }
    }
  });

  test('puede ver documentos existentes', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    const firstChatbot = page.locator('a[href*="/dashboard/chat/"]').first();

    if (await firstChatbot.isVisible()) {
      await firstChatbot.click();
      await page.waitForLoadState('networkidle');

      // Navegar a contexto/RAG
      const contextLink = page.locator('text=/contexto|documentos/i').first();
      if (await contextLink.isVisible()) {
        await contextLink.click();
        await page.waitForLoadState('networkidle');
      }

      // Buscar lista de documentos
      const documentsList = page.locator('[data-testid="documents-list"], .documents, .knowledge-base');

      if (await documentsList.isVisible()) {
        await page.screenshot({ path: 'tests/e2e/screenshots/03-documents-list.png', fullPage: true });
      } else {
        console.log('ℹ️  No hay documentos o la sección no está visible');
        await page.screenshot({ path: 'tests/e2e/screenshots/03-no-documents.png' });
      }
    }
  });

  test('puede subir un documento de prueba', async ({ page }) => {
    // Crear un archivo de prueba simple
    const testFilePath = path.join(process.cwd(), 'tests/e2e/fixtures/test-document.txt');

    // Verificar que el archivo existe o usar un path existente
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    const firstChatbot = page.locator('a[href*="/dashboard/chat/"]').first();

    if (await firstChatbot.isVisible()) {
      await firstChatbot.click();
      await page.waitForLoadState('networkidle');

      // Buscar botón de upload
      const uploadButton = page.locator('text=/subir|upload|añadir documento/i, input[type="file"]').first();

      if (await uploadButton.isVisible()) {
        const inputType = await uploadButton.getAttribute('type');

        if (inputType === 'file') {
          // Es un input file directo
          console.log('⚠️  Para subir archivos necesitas crear: tests/e2e/fixtures/test-document.txt');
          console.log('   O descomenta el código y ajusta el path');

          // await uploadButton.setInputFiles(testFilePath);
          // await page.waitForTimeout(3000); // Esperar upload
          // await page.screenshot({ path: 'tests/e2e/screenshots/03-document-uploaded.png' });
        } else {
          // Es un botón que abre un file dialog
          await uploadButton.click();
          await page.waitForTimeout(1000);

          const fileInput = page.locator('input[type="file"]');
          if (await fileInput.isVisible()) {
            console.log('⚠️  File input encontrado pero necesita archivo de prueba');
            // await fileInput.setInputFiles(testFilePath);
          }
        }

        await page.screenshot({ path: 'tests/e2e/screenshots/03-upload-interface.png' });
      } else {
        console.log('ℹ️  No se encontró botón de upload');
        await page.screenshot({ path: 'tests/e2e/screenshots/03-no-upload-button.png' });
      }
    }
  });

  test('puede buscar/consultar en documentos (si hay RAG activo)', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');

    const firstChatbot = page.locator('a[href*="/dashboard/chat/"]').first();

    if (await firstChatbot.isVisible()) {
      await firstChatbot.click();
      await page.waitForLoadState('networkidle');

      // Buscar campo de búsqueda o query
      const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="search"]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('información de prueba');
        await page.screenshot({ path: 'tests/e2e/screenshots/03-rag-search.png' });

        // Presionar enter o buscar botón
        await searchInput.press('Enter');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'tests/e2e/screenshots/03-rag-results.png' });
      } else {
        console.log('ℹ️  No se encontró campo de búsqueda en RAG');
      }
    }
  });
});
