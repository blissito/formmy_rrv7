/**
 * Composio Gmail Integration Endpoint
 * Maneja el flujo OAuth y conexión de Gmail vía Composio
 */

import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';
import { getSession } from '~/sessions';
import { db } from '~/utils/db.server';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LlamaindexProvider(),
});

/**
 * GET /api/v1/composio/gmail?intent=connect|status|disconnect&chatbotId=xxx
 * Maneja todos los intents de Gmail integration
 */
export async function loader({ request }: any) {
  try {
    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");
    const chatbotId = url.searchParams.get("chatbotId");

    // Validar que se recibió chatbotId
    if (!chatbotId) {
      return new Response(JSON.stringify({ error: "chatbotId es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Autenticar usuario
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (!userIdOrEmail) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validar si es un ObjectID válido (24 caracteres hexadecimales) o email
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);

    const user = await db.user.findFirst({
      where: isValidObjectId
        ? { id: userIdOrEmail } // Es un ObjectID válido
        : { email: userIdOrEmail } // Es un email (legacy)
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ Validar que el chatbot pertenece al usuario
    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        userId: user.id,
      },
    });

    if (!chatbot) {
      return new Response(
        JSON.stringify({ error: "Chatbot no encontrado o no pertenece al usuario" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ CRÍTICO: entityId debe ser chatbot_${chatbotId}
    // Cada CHATBOT conecta una cuenta de Gmail diferente
    const entityId = `chatbot_${chatbotId}`;

    switch (intent) {
      case "connect":
        return handleConnect(entityId, chatbotId, request);
      case "status":
        return handleStatus(entityId);
      case "disconnect":
        return handleDisconnect(entityId, chatbotId);
      default:
        return new Response(
          JSON.stringify({ error: "Intent inválido. Usa: connect, status, o disconnect" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error en Composio Gmail endpoint:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Conectar Gmail vía Composio
 * Genera URL de autorización OAuth - Frontend abre esta URL en popup
 */
async function handleConnect(entityId: string, chatbotId: string, request: Request) {
  try {

    // Verificar que existe el Auth Config ID
    const authConfigId = process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID;
    if (!authConfigId) {
      throw new Error(
        'COMPOSIO_GMAIL_AUTH_CONFIG_ID no está configurado. ' +
        'Ve a https://platform.composio.dev/marketplace/gmail y crea un Auth Config OAuth2.'
      );
    }


    // Obtener base URL desde el request (funciona en dev y prod)
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;


    // Iniciar conexión a Gmail
    const connection = await composio.connectedAccounts.initiate(
      entityId,
      authConfigId, // Auth Config ID creado en Composio dashboard
      {
        // Callback URL después de OAuth (Composio redirige aquí después de completar el intercambio)
        // Incluir chatbotId en el callback para guardar en BD
        callbackUrl: `${baseUrl}/api/v1/composio/gmail/callback?chatbotId=${chatbotId}`,
      }
    );


    // ✅ Retornar JSON con authUrl (no redirect directo)
    // Frontend abrirá esta URL en popup
    return new Response(
      JSON.stringify({
        success: true,
        authUrl: connection.redirectUrl,
        entityId,
        chatbotId,
        message: "Redirige al usuario a authUrl para completar OAuth",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error conectando Gmail:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error conectando Gmail",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Verificar estado de conexión de Gmail
 * ✅ DUAL CHECK: Composio + BD para evitar eventual consistency issues
 */
async function handleStatus(entityId: string) {
  try {

    // Extraer chatbotId del entityId
    const chatbotId = entityId.replace('chatbot_', '');

    // ✅ PASO 1: Verificar en BD primero (source of truth)
    const integration = await db.integration.findFirst({
      where: {
        chatbotId,
        platform: 'GMAIL',
      },
    });


    // Si no hay integración en BD o está desactivada, retornar desconectado
    if (!integration || !integration.isActive) {
      return new Response(
        JSON.stringify({
          isConnected: false,
          account: null,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ PASO 2: Verificar en Composio (solo si BD dice que está activo)
    const connectedAccounts = await composio.connectedAccounts.list({
      entityId,
      toolkitSlugs: ['gmail'], // ✅ Filtro correcto para Gmail
    });


    const hasComposioConnection = connectedAccounts.items && connectedAccounts.items.length > 0;
    const account = connectedAccounts.items?.[0];

    // ✅ DUAL CHECK: BD dice activo Y Composio tiene conexión
    const isConnected = hasComposioConnection;

    // Si BD dice activo pero Composio no tiene conexión, desincronización detectada
    if (!hasComposioConnection) {
      // Marcar como inactivo en BD para próxima consulta
      await db.integration.updateMany({
        where: { chatbotId, platform: 'GMAIL' },
        data: { isActive: false, errorMessage: 'Conexión perdida en Composio' },
      });
    }

    return new Response(
      JSON.stringify({
        isConnected,
        account: account
          ? {
              id: account.id,
              appName: account.appName,
              status: account.status,
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            }
          : null,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error verificando estado:", error);
    return new Response(
      JSON.stringify({
        isConnected: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Desconectar Gmail
 */
async function handleDisconnect(entityId: string, chatbotId: string) {
  try {

    // Obtener cuenta conectada (USAR toolkitSlugs, NO app)
    const connectedAccounts = await composio.connectedAccounts.list({
      entityId,
      toolkitSlugs: ['gmail'], // ✅ Filtro correcto
    });

    if (!connectedAccounts.items || connectedAccounts.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No hay cuenta de Gmail conectada",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Eliminar conexión de Composio
    const accountId = connectedAccounts.items[0].id;
    await composio.connectedAccounts.delete(accountId);


    // ✅ Desactivar integración en BD
    await db.integration.updateMany({
      where: {
        chatbotId,
        platform: 'GMAIL',
      },
      data: {
        isActive: false,
        lastActivity: new Date(),
        errorMessage: 'Desconectado por el usuario',
      },
    });


    return new Response(
      JSON.stringify({
        success: true,
        message: "Gmail desconectado exitosamente",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error desconectando:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
