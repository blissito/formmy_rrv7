import type { ToolContext, ToolResponse } from "../types";
import { db } from "~/utils/db.server";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";

interface SaveContactInput {
  name?: string;
  email?: string;
  phone?: string;
  productInterest?: string; // Producto o servicio de interés (guardado en campo 'company')
  position?: string;
  website?: string;
  notes?: string;
}

/**
 * Handler para guardar información de LEADS (prospectos calificados)
 */
export async function saveContactInfoHandler(
  input: SaveContactInput,
  context: ToolContext
): Promise<ToolResponse> {
  console.log('🔍 [save_contact_info] Handler llamado con input:', JSON.stringify(input, null, 2));
  console.log('🔍 [save_contact_info] Context chatbotId:', context.chatbotId);

  try {
    // 🚫 Ghosty NO debe usar esta tool (usuario ya autenticado)
    if (!context.chatbotId) {
      console.error('❌ [save_contact_info] Rechazado: chatbotId es null (probablemente Ghosty)');
      return {
        success: false,
        message: "Esta herramienta no está disponible en este contexto. El usuario ya está autenticado.",
      };
    }

    // Buscar conversación actual y detectar el canal de origen
    let conversationId: string | undefined = context.conversationId;
    let source = 'web'; // Default a web

    // Si tenemos el ID de la conversación, buscarla para detectar el canal
    if (conversationId) {
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        select: { sessionId: true },
      });

      // Detectar si es WhatsApp basándose en el sessionId
      if (conversation?.sessionId?.startsWith('whatsapp_')) {
        source = 'whatsapp';
        console.log('🟢 [save_contact_info] Detectado canal: WhatsApp (sessionId:', conversation.sessionId, ')');
      } else {
        console.log('🔵 [save_contact_info] Detectado canal: Web (sessionId:', conversation?.sessionId, ')');
      }
    } else {
      console.log('⚪ [save_contact_info] Sin conversationId, usando source por defecto: web');
    }

    // 📱 PASO 1: Auto-completar datos desde Contact de WhatsApp si es necesario
    if (source === 'whatsapp' && conversationId) {
      console.log('📱 [save_contact_info] Buscando Contact de WhatsApp para auto-completar datos...');
      const whatsappContact = await db.contact.findFirst({
        where: {
          conversationId: conversationId,
          chatbotId: context.chatbotId,
        },
        select: {
          phone: true,
          name: true,
        },
      });

      if (whatsappContact) {
        // Auto-completar phone si no viene en el input
        if (!input.phone && whatsappContact.phone) {
          input.phone = whatsappContact.phone;
          console.log('✅ [save_contact_info] Auto-completado phone desde Contact:', input.phone);
        }
        // Auto-completar name si no viene en el input
        if (!input.name && whatsappContact.name) {
          input.name = whatsappContact.name;
          console.log('✅ [save_contact_info] Auto-completado name desde Contact:', input.name);
        }
      } else {
        console.log('⚠️ [save_contact_info] No se encontró Contact de WhatsApp asociado a la conversación');
      }
    }

    // ✅ PASO 2: Validar que al menos se proporcione email o teléfono (DESPUÉS de auto-completar)
    if (!input.email && !input.phone) {
      console.log('❌ [save_contact_info] Falta email o teléfono (después de auto-completar)');
      return {
        success: false,
        message: "Se requiere al menos un email o teléfono para guardar el lead. Por favor, proporciona una forma de contacto.",
      };
    }

    // Validar formato de email si se proporciona
    if (input.email && !isValidEmail(input.email)) {
      return {
        success: false,
        message: "El formato del email no es válido.",
      };
    }

    // Verificar si ya existe un lead similar
    // Prioridad: 1) Por email, 2) Por phone
    let existingLead = null;

    if (input.email) {
      console.log('🔍 [save_contact_info] Buscando lead por email:', input.email);
      existingLead = await db.lead.findFirst({
        where: {
          chatbotId: context.chatbotId,
          email: input.email,
        },
      });
      console.log('🔍 [save_contact_info] Lead encontrado por email:', existingLead?.id);
    }

    if (!existingLead && input.phone) {
      console.log('🔍 [save_contact_info] Buscando lead por teléfono:', input.phone);
      existingLead = await db.lead.findFirst({
        where: {
          chatbotId: context.chatbotId,
          phone: input.phone,
        },
      });
      console.log('🔍 [save_contact_info] Lead encontrado por teléfono:', existingLead?.id);
    }

    if (existingLead) {
      console.log('✏️ [save_contact_info] Actualizando lead existente:', existingLead.id);
      // Actualizar lead existente
      const updatedLead = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.email && { email: input.email }),
          ...(input.phone && { phone: input.phone }),
          ...(input.productInterest && { productInterest: input.productInterest }),
          ...(input.position && { position: input.position }),
          ...(input.website && { website: input.website }),
          ...(input.notes && { notes: input.notes }),
          ...(conversationId && { conversationId }),
          source, // Actualizar source en caso de que el usuario cambie de canal
          lastUpdated: new Date(),
        },
      });

      // Track usage
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'save_contact_info',
        success: true,
        userMessage: context.message,
        metadata: {
          action: 'updated',
          leadId: updatedLead.id,
          hasName: !!input.name,
          hasEmail: !!input.email,
          hasPhone: !!input.phone,
          hasProductInterest: !!input.productInterest
        }
      }).catch(console.error);

      // 🔄 SINCRONIZAR con Contact de WhatsApp (si aplica)
      console.log('🔄 [save_contact_info] Llamando syncLeadToContact con:', {
        source,
        conversationId,
        chatbotId: context.chatbotId,
        email: input.email,
        name: input.name,
      });
      await syncLeadToContact({
        source,
        conversationId,
        chatbotId: context.chatbotId,
        email: input.email,
        name: input.name,
      });

      return {
        success: true,
        message: `✅ Perfecto, ya tengo tu contacto actualizado. Te daremos seguimiento pronto.`,
        data: {
          leadId: updatedLead.id,
          action: 'updated',
        }
      };
    } else {
      console.log('➕ [save_contact_info] Creando nuevo lead...');
      console.log('📍 [save_contact_info] Source detectado:', source);
      // Crear nuevo lead
      const newLead = await db.lead.create({
        data: {
          name: input.name || null,
          email: input.email || null,
          phone: input.phone || null,
          productInterest: input.productInterest || null,
          position: input.position || null,
          website: input.website || null,
          notes: input.notes || null,
          source,
          chatbotId: context.chatbotId,
          ...(conversationId && { conversationId }),
        },
      });

      console.log('✅ [save_contact_info] Lead creado exitosamente:', newLead.id);

      // Track usage
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'save_contact_info',
        success: true,
        userMessage: context.message,
        metadata: {
          action: 'created',
          leadId: newLead.id,
          hasName: !!input.name,
          hasEmail: !!input.email,
          hasPhone: !!input.phone,
          hasProductInterest: !!input.productInterest
        }
      }).catch(console.error);

      // 🔄 SINCRONIZAR con Contact de WhatsApp (si aplica)
      console.log('🔄 [save_contact_info] Llamando syncLeadToContact con:', {
        source,
        conversationId,
        chatbotId: context.chatbotId,
        email: input.email,
        name: input.name,
      });
      await syncLeadToContact({
        source,
        conversationId,
        chatbotId: context.chatbotId,
        email: input.email,
        name: input.name,
      });

      return {
        success: true,
        message: `✅ Perfecto, ya tengo tu contacto. ${input.name ? `Gracias ${input.name}` : 'Gracias'} por tu interés. Te daremos seguimiento pronto.`,
        data: {
          leadId: newLead.id,
          action: 'created',
        }
      };
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorType = error instanceof Error ? error.constructor.name : 'Unknown';

    console.error('❌ [save_contact_info] Error guardando lead:');
    console.error('   Input:', JSON.stringify(input, null, 2));
    console.error('   ChatbotId:', context.chatbotId);
    console.error('   Error:', errorMessage);

    // Track error
    ToolUsageTracker.trackUsage({
      chatbotId: context.chatbotId,
      toolName: 'save_contact_info',
      success: false,
      errorMessage: errorMessage,
      userMessage: context.message,
      metadata: { ...input, errorType }
    }).catch(console.error);

    return {
      success: false,
      message: `Hubo un error al guardar tu información. Por favor, intenta nuevamente.`,
    };
  }
}

/**
 * Validar formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 🔄 Sincronizar datos del Lead con el Contact de WhatsApp (si aplica)
 *
 * ⚠️ IMPORTANTE: Esta función SOLO sincroniza el EMAIL al Contact de WhatsApp.
 * El nombre del Contact se maneja EXCLUSIVAMENTE por el webhook de WhatsApp y NUNCA debe ser modificado aquí.
 *
 * Flujo:
 * - Lead.name: Viene del usuario O se auto-completa desde Contact.name (líneas 78-81)
 * - Contact.name: SOLO se actualiza por el webhook de WhatsApp
 * - Esta función: SOLO agrega/actualiza email en Contact
 */
async function syncLeadToContact(params: {
  source: string;
  conversationId?: string;
  chatbotId: string;
  email?: string;
  name?: string; // Recibido pero NO usado (solo para mantener firma compatible)
}): Promise<void> {
  const { source, conversationId, chatbotId, email } = params;

  // Solo sincronizar para conversaciones de WhatsApp
  if (source !== 'whatsapp' || !conversationId) {
    return;
  }

  // Si no hay email para sincronizar, salir
  if (!email) {
    console.log('ℹ️ [syncLeadToContact] No hay email para sincronizar');
    return;
  }

  try {
    console.log('🔄 [syncLeadToContact] Iniciando sincronización de email...');
    console.log('🔄 [syncLeadToContact] Params:', { source, conversationId, chatbotId, email });

    // Buscar Contact asociado a esta conversación
    const existingContact = await db.contact.findFirst({
      where: {
        conversationId,
        chatbotId,
      },
    });

    if (!existingContact) {
      console.log('⚠️ [syncLeadToContact] No se encontró Contact asociado a la conversación');
      return;
    }

    console.log('🔍 [syncLeadToContact] Contact encontrado:', {
      id: existingContact.id,
      currentEmail: existingContact.email,
      newEmail: email,
    });

    // ✅ Actualizar email si viene uno nuevo (incluso si ya existe uno diferente)
    if (!existingContact.email) {
      await db.contact.update({
        where: { id: existingContact.id },
        data: { email },
      });
      console.log('✅ [syncLeadToContact] Email agregado al Contact:', email);
    } else if (existingContact.email !== email) {
      await db.contact.update({
        where: { id: existingContact.id },
        data: { email },
      });
      console.log('✅ [syncLeadToContact] Email actualizado en Contact:', existingContact.email, '→', email);
    } else {
      console.log('ℹ️ [syncLeadToContact] Email ya está actualizado:', email);
    }
  } catch (error) {
    // No fallar el flujo principal si falla la sincronización
    console.error('❌ [syncLeadToContact] Error sincronizando Contact:', error);
  }
}