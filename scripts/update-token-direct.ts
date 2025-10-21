import { db } from "../app/utils/db.server";

const NEW_TOKEN = "EAAQCKJqSLTMBPg3W4ZAc8SbyZCefffZBxh63CzboPlzRIDbSgUjZBQAdqKdcZCpFExs5SQZAptyJ8JoZBNSEjlFIY87FJqvyTZBZCEMvWabSCUjaSUoxZCedfYGl8YlHvYouCM1dztZAWS67zEknm0RZBm0ZANOz82V6uqi9ZAUYgOeNm1NFLOHIQBH3mCte6I1VE98vJUB4qvCuuzTW7PMnZCxXumZBZCsfSiwDRLaYQNZBSMv2wZCZAeWx4nAZAmti0e5GDLzAZD";

async function updateToken() {
  console.log("🔑 Actualizando token de WhatsApp en BD...\n");

  console.log(`Nuevo token: ${NEW_TOKEN.length} chars (***${NEW_TOKEN.slice(-6)})`);

  // Actualizar en BD
  const result = await db.integration.updateMany({
    where: {
      platform: "WHATSAPP",
      isActive: true
    },
    data: {
      token: NEW_TOKEN
    }
  });

  console.log(`\n✅ Integraciones actualizadas: ${result.count}`);

  // Verificar
  const integration = await db.integration.findFirst({
    where: { platform: "WHATSAPP", isActive: true },
    select: {
      id: true,
      phoneNumberId: true,
      businessAccountId: true,
      token: true
    }
  });

  if (integration) {
    console.log("\n📱 Estado actualizado:");
    console.log(`  Token: ${integration.token?.length} chars (***${integration.token?.slice(-6)})`);
    console.log(`  Phone Number ID: ${integration.phoneNumberId}`);
    console.log(`  Business Account ID: ${integration.businessAccountId}`);
  }

  console.log("\n✅ Listo! Token actualizado en BD");
}

updateToken()
  .catch(console.error)
  .finally(() => process.exit(0));
