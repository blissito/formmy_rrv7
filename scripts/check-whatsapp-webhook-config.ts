/**
 * Script de diagnóstico: Verificar configuración de webhooks de WhatsApp en Meta
 *
 * Uso:
 *   npx tsx scripts/check-whatsapp-webhook-config.ts
 *
 * Verifica:
 * 1. Suscripciones de webhook activas
 * 2. Campos específicos necesarios para sync
 * 3. URL del webhook configurada
 * 4. Estado de la app
 */

import { config } from "dotenv";
config();

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;

if (!META_APP_ID || !META_APP_SECRET) {
  console.error("❌ Error: META_APP_ID y META_APP_SECRET deben estar definidos en .env");
  process.exit(1);
}

async function getAppAccessToken(): Promise<string> {
  const url = `https://graph.facebook.com/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&grant_type=client_credentials`;

  console.log("🔑 Obteniendo App Access Token...");
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get app access token: ${error}`);
  }

  const data = await response.json();
  console.log("✅ App Access Token obtenido\n");
  return data.access_token;
}

async function checkWebhookSubscriptions(accessToken: string) {
  const url = `https://graph.facebook.com/v21.0/${META_APP_ID}/subscriptions`;

  console.log("📡 Verificando suscripciones de webhook...");
  console.log(`URL: ${url}\n`);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get subscriptions: ${error}`);
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    console.log("❌ No hay suscripciones de webhook configuradas");
    return;
  }

  console.log("📋 Suscripciones encontradas:\n");

  for (const subscription of data.data) {
    console.log(`Object: ${subscription.object}`);
    console.log(`Callback URL: ${subscription.callback_url || 'N/A'}`);
    console.log(`Active: ${subscription.active ? '✅' : '❌'}`);
    console.log(`\nCampos suscritos:`);

    const requiredFields = ['messages', 'message_status', 'smb_app_state_sync', 'history'];
    const subscribedFields = subscription.fields?.map((f: any) => f.name) || [];

    for (const field of requiredFields) {
      const isSubscribed = subscribedFields.includes(field);
      const emoji = isSubscribed ? '✅' : '❌';
      const isCritical = field === 'smb_app_state_sync' || field === 'history';
      const label = isCritical ? `${field} (CRÍTICO)` : field;

      console.log(`  ${emoji} ${label}`);
    }

    console.log("\nTodos los campos:");
    for (const field of subscription.fields || []) {
      console.log(`  - ${field.name} (v${field.version})`);
    }

    console.log("\n" + "=".repeat(80) + "\n");
  }

  // Verificar campos críticos
  const whatsappSubscription = data.data.find((s: any) => s.object === 'whatsapp_business_account');

  if (!whatsappSubscription) {
    console.log("⚠️ WARNING: No se encontró suscripción para 'whatsapp_business_account'");
    return;
  }

  const fields = whatsappSubscription.fields?.map((f: any) => f.name) || [];
  const hasStateSync = fields.includes('smb_app_state_sync');
  const hasHistory = fields.includes('history');

  console.log("\n🔍 DIAGNÓSTICO:\n");

  if (hasStateSync && hasHistory) {
    console.log("✅ Configuración CORRECTA: Todos los campos críticos están suscritos");
  } else {
    console.log("❌ Configuración INCORRECTA: Faltan campos críticos");

    if (!hasStateSync) {
      console.log("   ⚠️ Falta: smb_app_state_sync (necesario para sincronizar contactos)");
    }

    if (!hasHistory) {
      console.log("   ⚠️ Falta: history (necesario para sincronizar historial de conversaciones)");
    }

    console.log("\nPara agregar los campos faltantes:");
    console.log("1. Ir a: https://developers.facebook.com/apps/" + META_APP_ID + "/webhooks/");
    console.log("2. Seleccionar 'WhatsApp Business Account'");
    console.log("3. Click en 'Edit Subscription'");
    console.log("4. Activar los campos: smb_app_state_sync, history");
    console.log("5. Guardar cambios");
  }
}

async function checkWebhookEndpoint() {
  const webhookUrl = "https://formmy.app/api/v1/integrations/whatsapp/webhook";

  console.log("\n🌐 Verificando accesibilidad del webhook...");
  console.log(`URL: ${webhookUrl}\n`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'WhatsApp-Config-Checker'
      }
    });

    console.log(`Status: ${response.status}`);

    if (response.status === 200) {
      console.log("✅ Webhook endpoint está accesible");
    } else {
      console.log("⚠️ Webhook endpoint respondió con status no-200");
    }
  } catch (error) {
    console.log("❌ No se pudo conectar al webhook endpoint");
    console.error(error);
  }
}

async function main() {
  console.log("🔍 WhatsApp Webhook Configuration Checker\n");
  console.log("=".repeat(80) + "\n");

  try {
    const accessToken = await getAppAccessToken();
    await checkWebhookSubscriptions(accessToken);
    await checkWebhookEndpoint();

    console.log("\n" + "=".repeat(80));
    console.log("✅ Diagnóstico completado");
    console.log("=".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ Error durante el diagnóstico:");
    console.error(error);
    process.exit(1);
  }
}

main();
