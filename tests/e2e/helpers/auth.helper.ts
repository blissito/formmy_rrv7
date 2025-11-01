import { Page } from '@playwright/test';

/**
 * Helper para autenticación en los tests
 * Formmy usa SOLO Google OAuth (sin passwords)
 */

/**
 * Realiza login con Google OAuth
 *
 * NOTA: Para tests con Google OAuth tienes 3 opciones:
 *
 * OPCIÓN 1 (Recomendada para desarrollo): Usar sesión guardada
 * 1. Loguéate manualmente en http://localhost:5173
 * 2. Ejecuta el test de auth que guarda el estado
 * 3. Los demás tests reutilizarán esa sesión
 *
 * OPCIÓN 2: Login automático con cuenta de Google de prueba
 * - Necesitas credenciales de Google específicas para testing
 * - Configura TEST_GOOGLE_EMAIL y TEST_GOOGLE_PASSWORD en .env
 *
 * OPCIÓN 3: Mockear la autenticación (más complejo)
 * - Interceptar requests y mockear respuestas de OAuth
 */
export async function login(page: Page) {
  await page.goto('/');

  // Click en el botón de login
  const loginButton = page.locator('text=/login|iniciar sesión|sign in/i').first();

  if (await loginButton.isVisible()) {
    await loginButton.click();

    // Esperar a que aparezca el botón de Google
    await page.waitForLoadState('networkidle');

    console.log('⚠️  Para login automático necesitas:');
    console.log('   1. Estar logueado previamente (sesión guardada)');
    console.log('   2. O configurar cuenta de Google de prueba');
    console.log('   3. Ver: tests/e2e/helpers/auth.helper.ts');
  }
}

/**
 * Verifica si el usuario está logueado
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // Si estamos en /dashboard y no redirige a login, estamos logueados
  return page.url().includes('/dashboard');
}

/**
 * Guarda el estado de autenticación para reutilizar
 */
export async function saveAuthState(page: Page, path: string = './tests/e2e/.auth/user.json') {
  await page.context().storageState({ path });
}

/**
 * Logout
 */
export async function logout(page: Page) {
  // Buscar el botón de logout en el dashboard
  await page.goto('/dashboard');

  const logoutButton = page.locator('text=/logout|cerrar sesión|salir/i').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }
}
