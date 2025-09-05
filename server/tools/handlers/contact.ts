import type { ToolContext, ToolResponse } from "../registry";
import { db } from "~/utils/db.server";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";

interface SaveContactInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  website?: string;
  notes?: string;
}

/**
 * Handler para guardar información de contacto de leads/prospectos
 */
export async function saveContactInfoHandler(
  input: SaveContactInput,
  context: ToolContext
): Promise<ToolResponse> {
  try {
    console.log(`📋 [Save Contact] Guardando contacto:`, JSON.stringify(input, null, 2));

    // Validar que al menos se proporcione nombre o email
    if (!input.name && !input.email) {
      return {
        success: false,
        message: "Se requiere al menos un nombre o email para guardar el contacto.",
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
      // Intentar encontrar la conversación más reciente del chatbot
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

    // Verificar si ya existe un contacto similar (mismo email o misma combinación nombre+chatbot)
    let existingContact = null;
    if (input.email) {
      existingContact = await db.contact.findFirst({
        where: {
          chatbotId: context.chatbotId,
          email: input.email,
        },
      });
    } else if (input.name) {
      existingContact = await db.contact.findFirst({
        where: {
          chatbotId: context.chatbotId,
          name: input.name,
          email: null, // Solo si no hay email
        },
      });
    }

    if (existingContact) {
      // Actualizar contacto existente con nueva información
      const updatedContact = await db.contact.update({
        where: { id: existingContact.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.email && { email: input.email }),
          ...(input.phone && { phone: input.phone }),
          ...(input.company && { company: input.company }),
          ...(input.position && { position: input.position }),
          ...(input.website && { website: input.website }),
          ...(input.notes && { notes: input.notes }),
          ...(conversationId && { conversationId }),
          lastUpdated: new Date(),
        },
      });

      console.log(`📋 [Save Contact] Contacto actualizado: ${updatedContact.id}`);
      
      // Track usage (sin awaitar)
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'save_contact_info',
        success: true,
        userMessage: context.message,
        metadata: {
          action: 'updated',
          contactId: updatedContact.id,
          hasName: !!input.name,
          hasEmail: !!input.email,
          hasPhone: !!input.phone,
          hasCompany: !!input.company
        }
      }).catch(console.error);
      
      return {
        success: true,
        message: `🤖 **HERRAMIENTA UTILIZADA: Save Contact Info**\n\n✅ **Información de contacto actualizada:**\n👤 ${input.name || input.email}\n\n🔧 *Sistema: Contacto actualizado en base de datos con ID: ${updatedContact.id}*`,
        data: {
          contactId: updatedContact.id,
          action: 'updated',
          toolUsed: 'save_contact_info',
          contact: {
            name: updatedContact.name,
            email: updatedContact.email,
            company: updatedContact.company,
          }
        }
      };
    } else {
      // Crear nuevo contacto
      const newContact = await db.contact.create({
        data: {
          name: input.name || null,
          email: input.email || null,
          phone: input.phone || null,
          company: input.company || null,
          position: input.position || null,
          website: input.website || null,
          notes: input.notes || null,
          source: 'chatbot',
          chatbotId: context.chatbotId,
          ...(conversationId && { conversationId }),
        },
      });

      console.log(`📋 [Save Contact] Nuevo contacto creado: ${newContact.id}`);
      
      // Track usage (sin awaitar)
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        toolName: 'save_contact_info',
        success: true,
        userMessage: context.message,
        metadata: {
          action: 'created',
          contactId: newContact.id,
          hasName: !!input.name,
          hasEmail: !!input.email,
          hasPhone: !!input.phone,
          hasCompany: !!input.company
        }
      }).catch(console.error);
      
      return {
        success: true,
        message: `🤖 **HERRAMIENTA UTILIZADA: Save Contact Info**\n\n✅ **Nuevo contacto guardado:**\n👤 ${input.name || input.email}\n\n${input.name ? `Gracias ${input.name}` : 'Gracias'} por proporcionarnos tus datos. Estaremos en contacto contigo pronto.\n\n🔧 *Sistema: Contacto creado en base de datos con ID: ${newContact.id}*`,
        data: {
          contactId: newContact.id,
          action: 'created',
          toolUsed: 'save_contact_info',
          contact: {
            name: newContact.name,
            email: newContact.email,
            company: newContact.company,
          }
        }
      };
    }

  } catch (error) {
    console.error('❌ Error guardando contacto:', error);
    
    // Track error (sin awaitar)
    ToolUsageTracker.trackUsage({
      chatbotId: context.chatbotId,
      toolName: 'save_contact_info',
      success: false,
      errorMessage: error.message,
      userMessage: context.message,
      metadata: input
    }).catch(console.error);
    
    return {
      success: false,
      message: "Hubo un error al guardar la información. Por favor, intenta nuevamente.",
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