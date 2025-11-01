#!/usr/bin/env tsx

/**
 * Script para inyectar cookies de tu navegador real a Playwright
 *
 * PASOS:
 * 1. Loguéate en tu navegador normal (Chrome/Safari)
 * 2. Ve a http://localhost:3000 y loguéate con Google
 * 3. Abre DevTools (F12) → Application → Cookies → localhost:3000
 * 4. Ejecuta este script y pega las cookies cuando te lo pida
 *
 * USO:
 *   npm run test:e2e:inject-cookies
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🍪 Inyectar Cookies de tu Navegador a Playwright       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('📋 PASOS PREVIOS (hazlos primero):');
  console.log('  1. Abre Chrome/Safari');
  console.log('  2. Ve a http://localhost:3000');
  console.log('  3. Loguéate con Google normalmente');
  console.log('  4. Verifica que estás en el dashboard\n');

  const ready = await question('¿Ya estás logueado? (s/n): ');

  if (ready.toLowerCase() !== 's') {
    console.log('\n❌ Primero loguéate y vuelve a ejecutar este script.');
    rl.close();
    return;
  }

  console.log('\n📖 AHORA, en tu navegador:\n');
  console.log('  1. Presiona F12 (abre DevTools)');
  console.log('  2. Ve a la pestaña "Application" (o "Aplicación")');
  console.log('  3. En el menú izquierdo → Storage → Cookies → http://localhost:3000');
  console.log('  4. Busca las cookies que empiezan con:');
  console.log('     - __session');
  console.log('     - __Secure-');
  console.log('     - o cualquier cookie relacionada con auth\n');

  console.log('💡 COPIA la cookie principal (nombre y valor)\n');

  const cookieName = await question('Nombre de la cookie (ej: __session): ');
  const cookieValue = await question('Valor de la cookie: ');

  if (!cookieName || !cookieValue) {
    console.log('\n❌ Necesitas proporcionar nombre y valor.');
    rl.close();
    return;
  }

  // Crear estructura de storageState de Playwright
  const storageState = {
    cookies: [
      {
        name: cookieName,
        value: cookieValue,
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 días
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const
      }
    ],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: []
      }
    ]
  };

  // Guardar
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const authFile = path.join(authDir, 'user.json');
  fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));

  console.log('\n✅ Cookie guardada en:', authFile);
  console.log('\n🎉 ¡Listo! Ahora puedes ejecutar los tests:\n');
  console.log('  npm run test:e2e:auth       # Tests con autenticación');
  console.log('  npm run test:e2e:chatbot    # Tests de chatbot');
  console.log('  npm run test:e2e:rag        # Tests de RAG');
  console.log('  npm run test:e2e            # Todos los tests\n');

  rl.close();
}

main().catch(console.error);
