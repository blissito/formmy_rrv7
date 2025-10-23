/**
 * Script para generar facturas SAT de prueba
 * Uso: npx tsx scripts/seed-sat-invoices.ts
 */

import { db } from "../app/utils/db.server";

async function seedSATInvoices() {
  console.log("🌱 Iniciando seed de facturas SAT...\n");

  // 1. Obtener primer usuario y chatbot
  const user = await db.user.findFirst({
    include: {
      chatbots: {
        where: { status: { not: "DELETED" } },
        take: 1,
      },
    },
  });

  if (!user || !user.chatbots[0]) {
    console.error("❌ No se encontró usuario o chatbot");
    console.log("💡 Crea un chatbot primero en /dashboard");
    return;
  }

  const chatbotId = user.chatbots[0].id;
  console.log(`✅ Usuario: ${user.email}`);
  console.log(`✅ Chatbot: ${user.chatbots[0].name}\n`);

  // 2. Crear contactos de prueba
  const contactos = [
    {
      rfc: "AAA010101AAA",
      nombre: "Acme Corp S.A. de C.V.",
      isEFOS: false,
      isEDOS: false,
    },
    {
      rfc: "BBB020202BBB",
      nombre: "Beta Industries",
      isEFOS: true,
      isEDOS: false,
    },
    {
      rfc: "CCC030303CCC",
      nombre: "Gamma Servicios",
      isEFOS: false,
      isEDOS: true,
    },
  ];

  console.log("📇 Creando contactos...");
  const createdContacts = [];
  for (const c of contactos) {
    const contact = await db.satContact.upsert({
      where: {
        rfc: c.rfc,
      },
      create: {
        userId: user.id,
        chatbotId: chatbotId,
        rfc: c.rfc,
        name: c.nombre,
        isEFOS: c.isEFOS,
        isEDOS: c.isEDOS,
        type: "PROVEEDOR",
        firstSeen: new Date(),
        lastSeen: new Date(),
      },
      update: {},
    });
    createdContacts.push(contact);
    console.log(
      `  ✓ ${c.nombre} ${c.isEFOS ? "⚠️ EFOS" : ""} ${c.isEDOS ? "⚠️ EDOS" : ""}`
    );
  }

  // 3. Generar facturas de prueba
  console.log("\n💰 Creando facturas...");

  const facturas = [
    {
      uuid: "11111111-1111-1111-1111-111111111111",
      fecha: new Date("2025-01-15"),
      total: 5000.0,
      subtotal: 4310.34,
      iva: 689.66,
      nombreEmisor: contactos[0].nombre,
      rfcEmisor: contactos[0].rfc,
      rfcReceptor: "XAXX010101000",
      tipo: "INGRESO",
      concepto: "Servicios de consultoría",
      metodoPago: "PUE",
      parseMethod: "XML_LOCAL",
      confidence: 1.0,
      status: "APPROVED",
      satStatus: "VALID_VIGENTE",
      creditsUsed: 0,
      warnings: [],
      contactId: createdContacts[0].id,
    },
    {
      uuid: "22222222-2222-2222-2222-222222222222",
      fecha: new Date("2025-01-16"),
      total: 12500.0,
      subtotal: 10775.86,
      iva: 1724.14,
      nombreEmisor: contactos[1].nombre,
      rfcEmisor: contactos[1].rfc,
      rfcReceptor: "XAXX010101000",
      tipo: "EGRESO",
      concepto: "Compra de materiales",
      metodoPago: "PPD",
      parseMethod: "PDF_SIMPLE",
      confidence: 0.85,
      status: "NEEDS_REVIEW",
      satStatus: "PENDING_VALIDATION",
      creditsUsed: 0,
      warnings: ["RFC emisor en lista EFOS"],
      contactId: createdContacts[1].id,
    },
    {
      uuid: "33333333-3333-3333-3333-333333333333",
      fecha: new Date("2025-01-17"),
      total: 8200.0,
      subtotal: 7068.97,
      iva: 1131.03,
      nombreEmisor: contactos[2].nombre,
      rfcEmisor: contactos[2].rfc,
      rfcReceptor: "XAXX010101000",
      tipo: "INGRESO",
      concepto: "Venta de productos",
      metodoPago: "PUE",
      parseMethod: "LLAMAPARSE_AG",
      confidence: 0.95,
      status: "APPROVED",
      satStatus: "VALID_VIGENTE",
      creditsUsed: 9,
      warnings: ["RFC emisor en lista EDOS"],
      contactId: createdContacts[2].id,
    },
    {
      uuid: "44444444-4444-4444-4444-444444444444",
      fecha: new Date("2025-01-18"),
      total: 3500.0,
      subtotal: 3017.24,
      iva: 482.76,
      nombreEmisor: contactos[0].nombre,
      rfcEmisor: contactos[0].rfc,
      rfcReceptor: "XAXX010101000",
      tipo: "EGRESO",
      concepto: "Gastos operativos",
      metodoPago: "PUE",
      parseMethod: "PDF_SIMPLE",
      confidence: 0.75,
      status: "NEEDS_REVIEW",
      satStatus: "PENDING_VALIDATION",
      creditsUsed: 0,
      warnings: ["Confianza baja en parseo"],
      contactId: createdContacts[0].id,
    },
    {
      uuid: "55555555-5555-5555-5555-555555555555",
      fecha: new Date("2025-01-19"),
      total: 25000.0,
      subtotal: 21551.72,
      iva: 3448.28,
      nombreEmisor: contactos[1].nombre,
      rfcEmisor: contactos[1].rfc,
      rfcReceptor: "XAXX010101000",
      tipo: "INGRESO",
      concepto: "Servicios profesionales",
      metodoPago: "PPD",
      parseMethod: "XML_LOCAL",
      confidence: 1.0,
      status: "APPROVED",
      satStatus: "VALID_CANCELADA",
      creditsUsed: 0,
      warnings: ["Factura cancelada en SAT"],
      contactId: createdContacts[1].id,
    },
  ];

  for (const f of facturas) {
    await db.satInvoice.create({
      data: {
        ...f,
        userId: user.id,
        chatbotId,
      },
    });
    console.log(
      `  ✓ ${f.concepto} - $${f.total.toLocaleString()} - ${f.status} - ${f.satStatus}`
    );
  }

  console.log("\n✅ Seed completado!");
  console.log(`\n🔗 Ve al dashboard: http://localhost:5173/dashboard/sat`);
}

seedSATInvoices()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
