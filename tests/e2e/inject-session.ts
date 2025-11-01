#!/usr/bin/env tsx

/**
 * Inyectar cookie __session de Formmy en Playwright
 *
 * USO:
 *   npm run test:e2e:inject-session
 *
 * El script te mostrará cómo copiar la cookie __session de tu navegador
 * y la guardará en el formato correcto para Playwright
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
  console.log('║  🍪 Inyectar Sesión de Formmy en Playwright             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Formmy usa una cookie llamada: __session\n');

  console.log('📋 PASOS:\n');
  console.log('1. Abre Chrome y ve a http://localhost:3000');
  console.log('2. Loguéate con Google');
  console.log('3. Una vez en el dashboard, presiona F12');
  console.log('4. Ve a: Application → Cookies → http://localhost:3000');
  console.log('5. Busca la cookie "__session"');
  console.log('6. Haz doble-click en el "Value" y cópialo (Ctrl+C)\n');

  const ready = await question('¿Ya copiaste el valor de __session? (s/n): ');

  if (ready.toLowerCase() !== 's') {
    console.log('\n❌ Canceling...');
    rl.close();
    return;
  }

  console.log('\nPega el valor de la cookie __session aquí:');
  const sessionValue = await question('Valor: ');

  if (!sessionValue || sessionValue.trim().length < 10) {
    console.log('\n❌ El valor parece incorrecto o muy corto.');
    console.log('   Asegúrate de copiar el valor completo de la cookie.\n');
    rl.close();
    return;
  }

  // Crear estructura de storageState de Playwright
  // con la configuración exacta de Formmy (de sessions.ts)
  const storageState = {
    cookies: [
      {
        name: '__session',
        value: sessionValue.trim(),
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 días como en la app
        httpOnly: true,
        secure: false, // false en desarrollo
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

  console.log('\n✅ Sesión guardada correctamente!\n');
  console.log('📁 Archivo:', authFile);
  console.log('\n🎉 Ahora puedes ejecutar los tests con autenticación:\n');
  console.log('  npm run test:e2e:auth       # Tests de dashboard');
  console.log('  npm run test:e2e:chatbot    # Tests de chatbot');
  console.log('  npm run test:e2e:rag        # Tests de RAG');
  console.log('  npm run test:e2e            # Todos los tests\n');
  console.log('💡 Los tests usarán automáticamente esta sesión.\n');

  rl.close();
}

main().catch(console.error);
