import { data as json } from "react-router";
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { db } from "~/utils/db.server";
import { getUserOrNull } from "server/getUserUtils.server";
import { ContactStatus } from "@prisma/client";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUserOrNull(request);

  if (!user) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const chatbotId = url.searchParams.get('chatbotId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Build where clause
    const where = chatbotId ? { chatbotId } : {};

    // Get contacts with pagination and relationships
    const contacts = await db.contact.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        position: true,
        website: true,
        notes: true,
        source: true,
        status: true,
        capturedAt: true,
        lastUpdated: true,
        chatbot: {
          select: {
            name: true,
            slug: true,
            user: {
              select: {
                email: true,
              }
            }
          }
        },
        conversation: {
          select: {
            sessionId: true,
            messageCount: true,
            startedAt: true,
          }
        }
      },
      orderBy: { capturedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await db.contact.count({ where });

    // Get summary stats
    const stats = await Promise.all([
      db.contact.count(),
      db.contact.count({ 
        where: { 
          capturedAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          } 
        } 
      }),
      db.contact.count({ 
        where: { 
          capturedAt: { 
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      }),
      db.contact.groupBy({
        by: ['source'],
        _count: { source: true },
      }),
    ]);

    const [totalContacts, weekContacts, monthContacts, sourceDistribution] = stats;

    return json({
      contacts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      stats: {
        total: totalContacts,
        thisWeek: weekContacts,
        thisMonth: monthContacts,
        bySource: sourceDistribution.map(s => ({ 
          source: s.source, 
          count: s._count.source 
        })),
      }
    });

  } catch (error) {
    console.error('Error loading contacts:', error);
    
    return json(
      {
        error: 'Error cargando contactos. Intenta nuevamente.',
        contacts: [],
        pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
        stats: { total: 0, thisWeek: 0, thisMonth: 0, bySource: [] }
      },
      { status: 500 }
    );
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("📥 API Contact Action - Starting");

  // Verificar autenticación
  const user = await getUserOrNull(request);
  if (!user) {
    console.log("❌ No user found");
    return json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  console.log("✅ User authenticated:", user.email);

  try {
    const body = await request.json();
    const { intent, contactId, status } = body;

    console.log("📥 API Contact Action:", { intent, contactId, status });

    if (intent === "update_status") {
      console.log("🔄 Updating status...", { contactId, status });

      // Validar que el status sea válido
      if (!Object.values(ContactStatus).includes(status)) {
        console.log("❌ Invalid status:", status);
        return json(
          { success: false, error: "Estatus inválido" },
          { status: 400 }
        );
      }

      console.log("✅ Status is valid");

      // Verificar que el contacto existe y pertenece a un chatbot del usuario
      const contact = await db.contact.findUnique({
        where: { id: contactId },
        include: {
          chatbot: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!contact) {
        console.log("❌ Contact not found:", contactId);
        return json(
          { success: false, error: "Contacto no encontrado" },
          { status: 404 }
        );
      }

      if (contact.chatbot.userId !== user.id) {
        console.log("❌ Unauthorized access attempt:", {
          contactId,
          contactOwnerId: contact.chatbot.userId,
          requestUserId: user.id,
        });
        return json(
          { success: false, error: "No tienes permiso para modificar este contacto" },
          { status: 403 }
        );
      }

      // Actualizar el contacto
      console.log("📝 Updating contact in database...");
      const updatedContact = await db.contact.update({
        where: { id: contactId },
        data: { status },
      });

      console.log("✅ Contact updated:", updatedContact);

      return json({ success: true, contact: updatedContact });
    }

    if (intent === "delete_contact") {
      // Verificar que el contacto existe y pertenece a un chatbot del usuario
      const contact = await db.contact.findUnique({
        where: { id: contactId },
        include: {
          chatbot: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!contact) {
        console.log("❌ Contact not found:", contactId);
        return json(
          { success: false, error: "Contacto no encontrado" },
          { status: 404 }
        );
      }

      if (contact.chatbot.userId !== user.id) {
        console.log("❌ Unauthorized delete attempt:", {
          contactId,
          contactOwnerId: contact.chatbot.userId,
          requestUserId: user.id,
        });
        return json(
          { success: false, error: "No tienes permiso para eliminar este contacto" },
          { status: 403 }
        );
      }

      // Eliminar el contacto
      await db.contact.delete({
        where: { id: contactId },
      });

      return json({ success: true, message: "Contacto eliminado exitosamente" });
    }

    return json(
      { success: false, error: "Intent no válido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating contact:", error);
    return json(
      { success: false, error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
};