import { data as json } from "react-router";
import { type LoaderFunctionArgs } from "react-router";
import { db } from "~/utils/db.server";
import { getAdminUserOrRedirect } from "server/getUserUtils.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminUserOrRedirect(request);

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