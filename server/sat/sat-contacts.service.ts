/**
 * SAT Contacts Service
 *
 * Gestión de contactos fiscales con:
 * - Auto-extracción desde facturas parseadas
 * - Validación con SAT Web Service
 * - Detección de lista negra EFOS/EDOS
 * - Actualización automática de estadísticas
 */

import { db } from "~/utils/db.server";
import type { SatContact, SatInvoice } from "@prisma/client";
import type { ParsedInvoice } from "./sat-parser.service";

// ========================================
// Types
// ========================================

export type ContactType = "PROVEEDOR" | "CLIENTE" | "AMBOS";
export type SatContactStatus = "ACTIVO" | "SUSPENDIDO" | "CANCELADO";

export interface CreateContactData {
  rfc: string;
  name: string;
  type: ContactType;
  chatbotId: string;
  userId: string;
}

export interface SATValidationResult {
  satStatus: SatContactStatus;
  regimenFiscal?: string;
  fiscalAddress?: string;
  economicActivity?: string;
  isEFOS: boolean;
  isEDOS: boolean;
}

// ========================================
// Auto-Extracción desde Facturas
// ========================================

/**
 * Crea o actualiza un contacto automáticamente al parsear una factura.
 * Si el contacto ya existe, solo actualiza estadísticas.
 * Si es nuevo, lo valida automáticamente con SAT.
 */
export async function createOrUpdateContact(
  invoice: ParsedInvoice,
  chatbotId: string,
  userId: string
): Promise<SatContact> {
  console.log(`👤 [SAT Contacts] Procesando contacto: ${invoice.rfcEmisor}`);

  // Buscar contacto existente por RFC
  let contact = await db.satContact.findFirst({
    where: {
      rfc: invoice.rfcEmisor,
      userId,
    },
  });

  if (!contact) {
    // Crear nuevo contacto
    console.log(`✨ [SAT Contacts] Creando nuevo contacto: ${invoice.nombreEmisor}`);

    contact = await db.satContact.create({
      data: {
        rfc: invoice.rfcEmisor,
        name: invoice.nombreEmisor,
        type: "PROVEEDOR", // Por defecto, porque es emisor
        chatbotId,
        userId,
        firstSeen: new Date(),
        lastSeen: new Date(),
        totalInvoices: 1,
        totalAmount: invoice.total,
        tags: [],
      },
    });

    // ⭐ Validar automáticamente con SAT
    console.log(`🔍 [SAT Contacts] Validando nuevo contacto con SAT...`);
    await validateContactWithSAT(contact.id);
  } else {
    // Actualizar estadísticas existentes
    console.log(`📊 [SAT Contacts] Actualizando estadísticas de: ${contact.name}`);

    contact = await db.satContact.update({
      where: { id: contact.id },
      data: {
        lastSeen: new Date(),
        totalInvoices: { increment: 1 },
        totalAmount: { increment: invoice.total },
      },
    });

    // Re-validar si han pasado más de 7 días desde última validación
    if (shouldRevalidate(contact.lastSATCheck)) {
      console.log(`🔄 [SAT Contacts] Re-validando contacto (>7 días)...`);
      await validateContactWithSAT(contact.id);
    }
  }

  return contact;
}

/**
 * Determina si un contacto necesita re-validación.
 * Criterio: >7 días desde última validación.
 */
function shouldRevalidate(lastCheck: Date | null): boolean {
  if (!lastCheck) return true;

  const daysSinceLastCheck = Math.floor(
    (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceLastCheck > 7;
}

// ========================================
// Validación SAT + Lista Negra
// ========================================

/**
 * Valida un contacto con el SAT Web Service.
 *
 * ⚠️ NOTA: Por ahora simula la validación.
 * En producción, debe integrarse con:
 * - API del SAT para validar status de RFC
 * - Lista negra EFOS/EDOS actualizada
 *
 * Alternativamente, puede usar Facturama que ofrece validación de RFC.
 */
export async function validateContactWithSAT(contactId: string): Promise<void> {
  const contact = await db.satContact.findUnique({
    where: { id: contactId },
  });

  if (!contact) {
    throw new Error(`Contacto ${contactId} no encontrado`);
  }

  console.log(`🔍 [SAT Contacts] Validando RFC: ${contact.rfc}`);

  try {
    // Consultar SAT Web Service (simulado)
    const satData = await querySATWebService(contact.rfc);

    // Actualizar datos
    await db.satContact.update({
      where: { id: contactId },
      data: {
        satStatus: satData.satStatus,
        regimenFiscal: satData.regimenFiscal,
        fiscalAddress: satData.fiscalAddress,
        economicActivity: satData.economicActivity,
        isEFOS: satData.isEFOS,
        isEDOS: satData.isEDOS,
        lastSATCheck: new Date(),
      },
    });

    // ⚠️ Crear alerta si entró a lista negra
    if (satData.isEFOS && !contact.isEFOS) {
      console.warn(`🚨 [SAT Contacts] ${contact.name} fue agregado a lista EFOS!`);
      await createEFOSAlert(contact);
    }

    if (satData.isEDOS && !contact.isEDOS) {
      console.warn(`🚨 [SAT Contacts] ${contact.name} fue agregado a lista EDOS!`);
      await createEDOSAlert(contact);
    }

    console.log(`✅ [SAT Contacts] Validación completada: ${contact.rfc} - ${satData.satStatus}`);
  } catch (error) {
    console.error(`❌ [SAT Contacts] Error validando ${contact.rfc}:`, error);
    // No fallar el proceso si la validación falla
  }
}

/**
 * Consulta el SAT Web Service para obtener datos de un RFC.
 *
 * ⚠️ IMPLEMENTACIÓN SIMULADA
 *
 * En producción, integrar con:
 * - API oficial del SAT (requiere FIEL/e.firma)
 * - Facturama API (validación de RFC + lista negra)
 * - Servicio de terceros (FacturamaAPI, SAT WS)
 */
async function querySATWebService(rfc: string): Promise<SATValidationResult> {
  // TODO: Integrar con API real del SAT o Facturama

  // Por ahora, simular validación
  console.log(`🔍 [SAT WS] Consultando RFC: ${rfc} (SIMULADO)`);

  // Simulación: 95% de RFCs están ACTIVOS, 5% en lista negra
  const isEFOS = Math.random() < 0.02; // 2% EFOS
  const isEDOS = Math.random() < 0.03; // 3% EDOS

  return {
    satStatus: isEFOS || isEDOS ? "SUSPENDIDO" : "ACTIVO",
    regimenFiscal: "601 - General de Ley Personas Morales",
    fiscalAddress: "Av. Insurgentes Sur 1234, CDMX",
    economicActivity: "Comercio al por menor",
    isEFOS,
    isEDOS,
  };
}

// ========================================
// Alertas de Lista Negra
// ========================================

/**
 * Crea una alerta cuando un contacto es detectado en lista EFOS.
 */
async function createEFOSAlert(contact: SatContact): Promise<void> {
  console.log(`🚨 [SAT Alerts] Creando alerta EFOS para: ${contact.name}`);

  // TODO: Implementar sistema de notificaciones/alertas
  // Por ahora, solo loggear
  console.warn(`
    ⚠️ ALERTA EFOS DETECTADA
    Contacto: ${contact.name}
    RFC: ${contact.rfc}
    Facturas afectadas: ${contact.totalInvoices}
    Total: $${contact.totalAmount.toLocaleString("es-MX")}

    Acción recomendada: Revisar facturas de este proveedor.
    Las deducciones podrían ser rechazadas por el SAT.
  `);
}

/**
 * Crea una alerta cuando un contacto es detectado en lista EDOS.
 */
async function createEDOSAlert(contact: SatContact): Promise<void> {
  console.log(`🚨 [SAT Alerts] Creando alerta EDOS para: ${contact.name}`);

  console.warn(`
    ⚠️ ALERTA EDOS DETECTADA
    Contacto: ${contact.name}
    RFC: ${contact.rfc}
    Facturas afectadas: ${contact.totalInvoices}
    Total: $${contact.totalAmount.toLocaleString("es-MX")}

    Acción recomendada: Verificar operaciones con este proveedor.
    Podrían ser operaciones simuladas.
  `);
}

// ========================================
// Upload Constancia Fiscal
// ========================================

/**
 * Parsea una Constancia de Situación Fiscal (PDF del SAT).
 * Extrae datos fiscales completos del contribuyente.
 *
 * Usa LlamaParse AGENTIC para máxima precisión.
 */
export async function parseConstanciaFiscal(
  pdfBuffer: Buffer,
  userId: string,
  chatbotId: string
): Promise<SatContact> {
  console.log(`📄 [SAT Contacts] Parseando Constancia Fiscal...`);

  // Importar LlamaParse
  const { llamaParse } = await import("~/server/llamaparse/llamaparse.service");

  // Parsear con modo AGENTIC (mejor calidad para documentos oficiales)
  const result = await llamaParse(pdfBuffer, "AGENTIC", userId);

  if (!result.success || !result.markdown) {
    throw new Error(`Error parseando constancia: ${result.error}`);
  }

  const markdown = result.markdown;

  // Extraer datos del markdown
  const rfc = extractRFCFromConstancia(markdown);
  const name = extractNameFromConstancia(markdown);
  const regimenFiscal = extractRegimenFromConstancia(markdown);
  const fiscalAddress = extractAddressFromConstancia(markdown);
  const economicActivity = extractActivityFromConstancia(markdown);

  if (!rfc || !name) {
    throw new Error("No se pudo extraer RFC o nombre de la constancia");
  }

  // Crear o actualizar contacto
  const contact = await db.satContact.upsert({
    where: { rfc },
    create: {
      rfc,
      name,
      type: "PROVEEDOR",
      chatbotId,
      userId,
      regimenFiscal,
      fiscalAddress,
      economicActivity,
      firstSeen: new Date(),
      lastSeen: new Date(),
      totalInvoices: 0,
      totalAmount: 0,
      tags: [],
    },
    update: {
      name,
      regimenFiscal,
      fiscalAddress,
      economicActivity,
      lastSeen: new Date(),
    },
  });

  // Validar con SAT
  await validateContactWithSAT(contact.id);

  return contact;
}

// Funciones auxiliares de extracción (regex básicos)
function extractRFCFromConstancia(text: string): string | null {
  const match = text.match(/RFC[:\s]*([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3})/i);
  return match ? match[1] : null;
}

function extractNameFromConstancia(text: string): string | null {
  const match = text.match(/Nombre[:\s]*([^\n]+)/i);
  return match ? match[1].trim() : null;
}

function extractRegimenFromConstancia(text: string): string | null {
  const match = text.match(/R[eé]gimen Fiscal[:\s]*([^\n]+)/i);
  return match ? match[1].trim() : null;
}

function extractAddressFromConstancia(text: string): string | null {
  const match = text.match(/Domicilio[:\s]*([^\n]+)/i);
  return match ? match[1].trim() : null;
}

function extractActivityFromConstancia(text: string): string | null {
  const match = text.match(/Actividad Econ[oó]mica[:\s]*([^\n]+)/i);
  return match ? match[1].trim() : null;
}

// ========================================
// CRUD Operations
// ========================================

/**
 * Lista contactos del usuario/chatbot con filtros.
 */
export async function listContacts(params: {
  userId: string;
  chatbotId?: string;
  type?: ContactType;
  isEFOS?: boolean;
  isEDOS?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = { userId: params.userId };

  if (params.chatbotId) where.chatbotId = params.chatbotId;
  if (params.type) where.type = params.type;
  if (params.isEFOS !== undefined) where.isEFOS = params.isEFOS;
  if (params.isEDOS !== undefined) where.isEDOS = params.isEDOS;

  const contacts = await db.satContact.findMany({
    where,
    take: params.limit || 50,
    skip: params.offset || 0,
    orderBy: { lastSeen: "desc" },
    include: {
      invoices: {
        select: { id: true, uuid: true, total: true },
        take: 5,
      },
    },
  });

  const totalCount = await db.satContact.count({ where });

  return {
    contacts,
    totalCount,
    hasMore: totalCount > (params.offset || 0) + contacts.length,
  };
}

/**
 * Obtiene un contacto por ID con todas sus facturas.
 */
export async function getContactById(contactId: string, userId: string) {
  return await db.satContact.findFirst({
    where: { id: contactId, userId },
    include: {
      invoices: {
        orderBy: { fecha: "desc" },
      },
    },
  });
}

/**
 * Actualiza un contacto manualmente.
 */
export async function updateContact(
  contactId: string,
  userId: string,
  data: Partial<Pick<SatContact, "name" | "type" | "category" | "tags">>
) {
  return await db.satContact.update({
    where: { id: contactId, userId },
    data,
  });
}

/**
 * Elimina un contacto (soft delete marcando como inactivo).
 */
export async function deleteContact(contactId: string, userId: string) {
  // Por ahora eliminación hard (puede cambiarse a soft delete)
  return await db.satContact.delete({
    where: { id: contactId, userId },
  });
}
