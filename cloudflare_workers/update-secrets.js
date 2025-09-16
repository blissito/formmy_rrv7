/**
 * Script para actualizar secrets de Cloudflare desde .env
 * Útil cuando solo quieres actualizar secrets sin hacer deploy completo
 */

import { readFileSync } from 'fs';
import { spawn } from 'child_process';

const ENV_TARGET = process.argv[2] || 'production';

console.log(`🔑 Updating Cloudflare secrets for ${ENV_TARGET}...`);

// Leer y parsear .env
let envVars = {};
try {
  const envContent = readFileSync('.env', 'utf8');

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      envVars[key] = values.join('=');
    }
  });
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  process.exit(1);
}

// Secrets que necesitamos actualizar
const secrets = [
  { key: 'WHATSAPP_TOKEN', required: true },
  { key: 'PHONE_NUMBER_ID', required: true },
  { key: 'VERIFY_TOKEN', required: true },
  { key: 'FLOWISE_API_KEY', required: false }
];

// Función helper para ejecutar comando wrangler
function updateSecret(key, value, env) {
  return new Promise((resolve, reject) => {
    const child = spawn('wrangler', ['secret', 'put', key, '--env', env], {
      stdio: ['pipe', 'inherit', 'inherit']
    });

    child.stdin.write(value);
    child.stdin.end();

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Updated ${key}`);
        resolve();
      } else {
        console.error(`❌ Failed to update ${key}`);
        reject(new Error(`wrangler exited with code ${code}`));
      }
    });
  });
}

// Actualizar secrets secuencialmente
async function updateAllSecrets() {
  for (const secret of secrets) {
    const value = envVars[secret.key];

    if (!value) {
      if (secret.required) {
        console.error(`❌ Required secret ${secret.key} not found in .env`);
        process.exit(1);
      } else {
        console.log(`⏭️  Skipping optional secret ${secret.key} (not in .env)`);
        continue;
      }
    }

    try {
      await updateSecret(secret.key, value, ENV_TARGET);
    } catch (error) {
      console.error(`💥 Failed to update ${secret.key}:`, error.message);
      process.exit(1);
    }
  }

  console.log('🎉 All secrets updated successfully!');
  console.log('💡 Run `npm run deploy:quick` to deploy without updating secrets again');
}

updateAllSecrets().catch(console.error);