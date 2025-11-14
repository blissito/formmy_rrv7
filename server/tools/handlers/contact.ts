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

    // Validar que al menos se proporcione email o teléfono
    if (!input.email && !input.phone) {
      console.log('❌ [save_contact_info] Falta email o teléfono');
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

    // Buscar conversación activa si está disponible
    let conversationId: string | undefined;
    if (context.message) {
      const recentConversation = await db.conversation.findFirst({
        where: {
          chatbotId: context.chatbotId,
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      conversationId = recentConversation?.id;
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