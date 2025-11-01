# 📚 Ejemplos de Tests - Cómo Extender

Guía práctica con ejemplos de patrones y técnicas para crear nuevos tests.

## Estructura Básica de un Test

```typescript
import { test, expect } from '@playwright/test';
import { isLoggedIn } from './helpers/auth.helper';

test.describe('Mi Feature', () => {
  // Ejecutar antes de cada test
  test.beforeEach(async ({ page }) => {
    const loggedIn = await isLoggedIn(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('puede hacer X', async ({ page }) => {
    // Tu test aquí
  });
});
```

## Patterns Comunes

### 1. Navegar y Esperar

```typescript
test('navegar a una página', async ({ page }) => {
  // Ir a URL
  await page.goto('/dashboard/chat');

  // Esperar a que cargue completamente
  await page.waitForLoadState('networkidle');

  // Verificar URL
  expect(page.url()).toContain('/dashboard/chat');
});
```

### 2. Buscar Elementos Flexibles

```typescript
test('buscar botón por texto', async ({ page }) => {
  // Buscar por texto (case insensitive regex)
  const button = page.locator('text=/crear|new|nuevo/i').first();

  // Verificar si existe
  if (await button.isVisible()) {
    await button.click();
  }
});
```

### 3. Llenar Formularios

```typescript
test('llenar formulario', async ({ page }) => {
  // Por name attribute
  await page.fill('input[name="email"]', 'test@example.com');

  // Por placeholder
  await page.fill('input[placeholder*="nombre"]', 'Test User');

  // Selects
  await page.selectOption('select[name="country"]', 'MX');

  // Checkboxes
  await page.check('input[type="checkbox"]');

  // Submit
  await page.click('button[type="submit"]');
});
```

### 4. Esperar Elementos

```typescript
test('esperar elemento dinámico', async ({ page }) => {
  // Esperar que sea visible
  await page.locator('.dynamic-content').waitFor({ state: 'visible' });

  // Esperar timeout específico
  await page.waitForTimeout(2000);

  // Esperar respuesta de API
  const response = await page.waitForResponse(resp =>
    resp.url().includes('/api/chatbot') && resp.status() === 200
  );
});
```

### 5. Tomar Screenshots

```typescript
test('capturar estados', async ({ page }) => {
  // Screenshot de elemento específico
  await page.locator('.chatbot-preview').screenshot({
    path: 'tests/e2e/screenshots/chatbot-element.png'
  });

  // Screenshot de página completa
  await page.screenshot({
    path: 'tests/e2e/screenshots/full-page.png',
    fullPage: true
  });

  // Screenshot solo del viewport
  await page.screenshot({
    path: 'tests/e2e/screenshots/viewport.png'
  });
});
```

### 6. Trabajar con Múltiples Páginas/Tabs

```typescript
test('abrir nueva pestaña', async ({ context, page }) => {
  // Abrir nueva página
  const newPage = await context.newPage();
  await newPage.goto('/chat/embed?slug=test');

  // Trabajar con ambas páginas
  await page.goto('/dashboard');

  // Cerrar la nueva página
  await newPage.close();
});
```

### 7. Interceptar Requests

```typescript
test('mockear API response', async ({ page }) => {
  // Interceptar y modificar respuesta
  await page.route('**/api/chatbot', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto('/dashboard/chat');
});
```

### 8. Verificar Errores

```typescript
test('no debe haber errores de consola', async ({ page }) => {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/');

  expect(errors.length).toBe(0);
});
```

### 9. Upload de Archivos

```typescript
test('subir archivo', async ({ page }) => {
  // Upload directo
  await page.setInputFiles('input[type="file"]', './tests/e2e/fixtures/test.pdf');

  // Upload con click en botón
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('button:has-text("Upload")');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('./tests/e2e/fixtures/test.pdf');
});
```

### 10. Trabajar con Iframes

```typescript
test('interactuar con iframe', async ({ page }) => {
  await page.goto('/preview/chatbot-123');

  // Obtener iframe
  const iframe = page.frameLocator('iframe[title="Chatbot"]');

  // Interactuar dentro del iframe
  await iframe.locator('input[type="text"]').fill('Hola');
  await iframe.locator('button:has-text("Enviar")').click();
});
```

## Test Helpers Útiles

### Helper para Retry

```typescript
async function retryAction(action: () => Promise<void>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await action();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Uso
await retryAction(async () => {
  await page.click('button:has-text("Crear")');
});
```

### Helper para Esperar Texto

```typescript
async function waitForText(page: Page, text: string, timeout = 10000) {
  await page.waitForSelector(`text=${text}`, { timeout });
}

// Uso
await waitForText(page, 'Chatbot creado exitosamente');
```

### Helper para Verificar Estado Cargando

```typescript
async function waitForLoading(page: Page) {
  // Esperar que aparezca spinner
  await page.locator('.loading-spinner').waitFor({ state: 'visible' });

  // Esperar que desaparezca
  await page.locator('.loading-spinner').waitFor({ state: 'hidden' });
}
```

## Debugging

### Modo Debug Interactivo

```bash
# Pausar en el primer test
PWDEBUG=1 npm run test:e2e

# Debug test específico
PWDEBUG=1 npx playwright test tests/e2e/02-chatbot.spec.ts
```

### Pausar en el Código

```typescript
test('debug example', async ({ page }) => {
  await page.goto('/dashboard');

  // Pausar aquí - abre inspector
  await page.pause();

  // Continúa después de que cierres el inspector
  await page.click('button');
});
```

### Verbose Logging

```typescript
test('con logs', async ({ page }) => {
  // Log de network requests
  page.on('request', request => {
    console.log('>>', request.method(), request.url());
  });

  page.on('response', response => {
    console.log('<<', response.status(), response.url());
  });

  await page.goto('/dashboard');
});
```

## Assertions Útiles

```typescript
// URL
expect(page.url()).toContain('/dashboard');
expect(page.url()).toBe('http://localhost:5173/');

// Elemento visible
await expect(page.locator('button')).toBeVisible();
await expect(page.locator('button')).toBeHidden();

// Texto
await expect(page.locator('h1')).toHaveText('Formmy');
await expect(page.locator('h1')).toContainText('Form');

// Atributos
await expect(page.locator('input')).toHaveAttribute('type', 'email');
await expect(page.locator('button')).toBeDisabled();

// Count
await expect(page.locator('.chatbot-item')).toHaveCount(3);

// Screenshot comparison
await expect(page).toHaveScreenshot('homepage.png');
```

## Ejemplo Completo: Test de Conversación

```typescript
test('conversación completa con chatbot', async ({ page }) => {
  // 1. Navegar a chatbots
  await page.goto('/dashboard/chat');
  await page.waitForLoadState('networkidle');

  // 2. Seleccionar primer chatbot
  await page.click('a[href*="/dashboard/chat/"]').first();

  // 3. Abrir preview
  await page.click('button:has-text("Preview")');
  await page.waitForTimeout(2000);

  // 4. Enviar mensaje
  const input = page.locator('textarea').last();
  await input.fill('Hola, ¿cómo funciona el RAG?');

  // 5. Click en enviar
  await page.click('button[type="submit"]').last();

  // 6. Esperar respuesta (loading)
  await page.locator('.message-loading').waitFor({ state: 'visible' });
  await page.locator('.message-loading').waitFor({ state: 'hidden', timeout: 30000 });

  // 7. Verificar respuesta
  const messages = page.locator('.message');
  const lastMessage = messages.last();
  await expect(lastMessage).toBeVisible();

  // 8. Screenshot final
  await page.screenshot({
    path: 'tests/e2e/screenshots/conversation-complete.png',
    fullPage: true
  });
});
```

## Tips Avanzados

### 1. Reutilizar Estado entre Tests

```typescript
// En test.beforeAll
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Setup común
  await page.goto('/dashboard');
  // ... hacer setup

  // Guardar estado
  await context.storageState({ path: './tests/e2e/.auth/setup.json' });
});
```

### 2. Tests Condicionales

```typescript
test('solo si hay chatbots', async ({ page }) => {
  await page.goto('/dashboard/chat');

  const chatbotCount = await page.locator('.chatbot-item').count();

  if (chatbotCount === 0) {
    test.skip();
    return;
  }

  // Continuar con el test...
});
```

### 3. Custom Fixtures

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

// Uso
test('mi test', async ({ loggedInPage }) => {
  // loggedInPage ya está en dashboard
});
```

---

¿Más dudas? Revisa la [documentación oficial de Playwright](https://playwright.dev/).
