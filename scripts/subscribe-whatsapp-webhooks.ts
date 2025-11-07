/**
 * Script: Suscribir webhooks de WhatsApp en Meta
 *
 * Uso:
 *   npx tsx scripts/subscribe-whatsapp-webhooks.ts
 *
 * Suscribe la app a todos los webhooks necesarios de WhatsApp Business Account:
 * - messages
 * - message_status
 * - smb_app_state_sync (CRÍTICO para sync de contactos)
 * - history (CRÍTICO para sync de historial)
 */

import { config } from "dotenv";
config();

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const WEBHOOK_URL = "https://formmy.app/api/v1/integrations/whatsapp/webhook";
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "formmy_verify_token";

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

async function subscribeToWebhooks(accessToken: string) {
  const url = `https://graph.facebook.com/v21.0/${META_APP_ID}/subscriptions`;

  const fields = [
    "messages",
    "message_status",
    "smb_app_state_sync",  // CRÍTICO: Sync de contactos
    "history"              // CRÍTICO: Sync de historial
  ];

  console.log("📡 Suscribiendo webhooks...");
  console.log(`URL: ${url}`);
  console.log(`Callback URL: ${WEBHOOK_URL}`);
  console.log(`Verify Token: ${WEBHOOK_VERIFY_TOKEN}`);
  console.log(`\nCampos a suscribir:`);
  fields.forEach(field => console.log(`  - ${field}`));
  console.log();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      object: "whatsapp_business_account",
      callback_url: WEBHOOK_URL,
      verify_token: WEBHOOK_VERIFY_TOKEN,
      fields: fields.join(','),
      include_values: true
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Error al suscribir webhooks:");
    console.error(JSON.stringify(data, null, 2));

    if (data.error?.message) {
      console.error(`\nMensaje: ${data.error.message}`);

      if (data.error.message.includes("verify_token")) {
        console.log("\n💡 SOLUCIÓN:");
        console.log("1. Asegúrate de que el endpoint GET responda correctamente a la verificación:");
        console.log("   curl 'https://formmy.app/api/v1/integrations/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=" + WEBHOOK_VERIFY_TOKEN + "'");
        console.log("   Debe retornar: test");
        console.log("\n2. Revisa que WHATSAPP_WEBHOOK_VERIFY_TOKEN en .env coincida con el valor usado aquí");
      }
    }

    throw new Error("Failed to subscribe to webhooks");
  }

  console.log("✅ Suscripción exitosa!");
  console.log(JSON.stringify(data, null, 2));
}

async function verifySubscription(accessToken: string) {
  const url = `https://graph.facebook.com/v21.0/${META_APP_ID}/subscriptions`;

  console.log("\n🔍 Verificando suscripción...\n");

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to verify subscription: ${error}`);
  }

  const data = await response.json();

  const whatsappSub = data.data?.find((s: any) => s.object === 'whatsapp_business_account');

  if (!whatsappSub) {
    console.log("⚠️ No se encontró suscripción para whatsapp_business_account");
    return;
  }

  console.log("📋 Suscripción actual:");
  console.log(`Callback URL: ${whatsappSub.callback_url}`);
  console.log(`Active: ${whatsappSub.active ? '✅' : '❌'}`);
  console.log(`\nCampos suscritos:`);

  const requiredFields = ['messages', 'message_status', 'smb_app_state_sync', 'history'];
  const subscribedFields = whatsappSub.fields?.map((f: any) => f.name) || [];

  for (const field of requiredFields) {
    const isSubscribed = subscribedFields.includes(field);
    const emoji = isSubscribed ? '✅' : '❌';
    const isCritical = field === 'smb_app_state_sync' || field === 'history';
    const label = isCritical ? `${field} (CRÍTICO)` : field;

    console.log(`  ${emoji} ${label}`);
  }

  // Verificar si faltan campos críticos
  const hasCriticalFields = subscribedFields.includes('smb_app_state_sync') &&
                           subscribedFields.includes('history');

  console.log();
  if (hasCriticalFields) {
    console.log("✅ Todos los campos críticos están suscritos");
  } else {
    console.log("⚠️ ADVERTENCIA: Faltan campos críticos");
    console.log("   Esto causará que el sync de WhatsApp NO funcione correctamente");
  }
}

async function main() {
  console.log("📡 WhatsApp Webhook Subscription Manager\n");
  console.log("=".repeat(80) + "\n");

  try {
    const accessToken = await getAppAccessToken();

    // Suscribir webhooks
    await subscribeToWebhooks(accessToken);

    // Verificar suscripción
    await verifySubscription(accessToken);

    console.log("\n" + "=".repeat(80));
    console.log("✅ Proceso completado");
    console.log("=".repeat(80));
    console.log("\n💡 Próximos pasos:");
    console.log("1. Reconectar WhatsApp en Formmy");
    console.log("2. Monitorear logs: npx tsx scripts/monitor-whatsapp-webhooks.ts");
    console.log("3. Verificar que llegan webhooks de sync\n");

  } catch (error) {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  }
}

main();
