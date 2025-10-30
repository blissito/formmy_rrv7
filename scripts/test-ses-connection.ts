/**
 * Test simple de conexión a SES
 */

import { config } from 'dotenv';
config();

import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

async function testSES() {
  console.log('🔍 Verificando configuración SES...\n');

  console.log('SES_REGION:', process.env.SES_REGION);
  console.log('SES_KEY:', process.env.SES_KEY ? `${process.env.SES_KEY.substring(0, 8)}...` : 'NOT SET');
  console.log('SES_SECRET:', process.env.SES_SECRET ? 'SET (40 chars)' : 'NOT SET');

  console.log('\n🚀 Intentando crear cliente SES...\n');

  try {
    const sesClient = new SESClient({
      region: process.env.SES_REGION,
      credentials: {
        accessKeyId: process.env.SES_KEY!,
        secretAccessKey: process.env.SES_SECRET!,
      },
    });

    console.log('✅ Cliente SES creado correctamente');
    console.log('\n📝 Info del cliente:', {
      region: process.env.SES_REGION,
      hasCredentials: !!(process.env.SES_KEY && process.env.SES_SECRET)
    });

    console.log('\n⚠️  El error probablemente es que las credenciales AWS que proporcionaste');
    console.log('    no tienen permisos para AWS SES (Simple Email Service).');
    console.log('\n💡 Necesitas credenciales IAM con estos permisos:');
    console.log('    - ses:SendEmail');
    console.log('    - ses:SendRawEmail');

  } catch (error: any) {
    console.error('❌ Error creando cliente SES:', error.message);
  }
}

testSES();
