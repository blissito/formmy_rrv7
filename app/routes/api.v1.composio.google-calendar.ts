/**
 * Composio Google Calendar Integration Endpoint
 * Maneja el flujo OAuth y conexión de Google Calendar vía Composio
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
 * GET /api/v1/composio/google-calendar?intent=connect
 * Inicia el flujo de OAuth para conectar Google Calendar
 */
export async function loader({ request }: any) {
  try {
    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");
    const chatbotId = url.searchParams.get("chatbotId"); // ✅ Recibir chatbotId

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
    // Cada CHATBOT conecta una cuenta de Google Calendar diferente
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
    console.error("Error en Composio Google Calendar endpoint:", error);
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
 * Conectar Google Calendar vía Composio
 * Genera URL de autorización OAuth
 */
async function handleConnect(entityId: string, chatbotId: string, request: Request) {
  try {
    console.log(`\n${'📅'.repeat(40)}`);
    console.log(`📅 [Composio] Iniciando conexión Google Calendar`);
    console.log(`   entityId: ${entityId}`);
    console.log(`   chatbotId: ${chatbotId}`);
    console.log(`${'📅'.repeat(40)}\n`);

    // Verificar que existe el Auth Config ID
    const authConfigId = process.env.COMPOSIO_GOOGLE_CALENDAR_AUTH_CONFIG_ID;
    if (!authConfigId) {
      throw new Error(
        'COMPOSIO_GOOGLE_CALENDAR_AUTH_CONFIG_ID no está configurado. ' +
        'Ve a https://platform.composio.dev/marketplace/googlecalendar y crea un Auth Config.'
      );
    }

    console.log(`   Using authConfigId: ${authConfigId}`);

    // Obtener base URL desde el request (funciona en dev y prod)
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    console.log(`   Base URL: ${baseUrl}`);

    // Iniciar conexión a Google Calendar
    // https://docs.composio.dev/api-reference/connected-accounts/initiate-connection
    const connection = await composio.connectedAccounts.initiate(
      entityId,
      authConfigId, // Auth Config ID creado en Composio dashboard
      {
        // Callback URL después de OAuth (Composio redirige aquí después de completar el intercambio)
        // Incluir chatbotId en el callback para guardar en BD
        callbackUrl: `${baseUrl}/api/v1/composio/google-calendar/callback?chatbotId=${chatbotId}`,
      }
    );

    console.log(`📝 Conexión iniciada:`, connection);

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
    console.error("❌ Error conectando Google Calendar:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error conectando Google Calendar",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Verificar estado de conexión de Google Calendar
 */
async function handleStatus(entityId: string) {
  try {
    console.log(`\n${'🔍'.repeat(40)}`);
    console.log(`🔍 [Composio] Verificando estado de conexión`);
    console.log(`   entityId: ${entityId}`);
    console.log(`${'🔍'.repeat(40)}\n`);

    // Obtener cuentas conectadas del usuario (USAR toolkitSlugs, NO app)
    const connectedAccounts = await composio.connectedAccounts.list({
      entityId,
      toolkitSlugs: ['googlecalendar'], // ✅ Filtro correcto para Google Calendar
    });

    console.log(`📊 Cuentas de Google Calendar encontradas:`, connectedAccounts.items?.length || 0);

    const isConnected = connectedAccounts.items && connectedAccounts.items.length > 0;
    const account = connectedAccounts.items?.[0];

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
 * Desconectar Google Calendar
 */
async function handleDisconnect(entityId: string, chatbotId: string) {
  try {
    console.log(`\n${'🔌'.repeat(40)}`);
    console.log(`🔌 [Composio] Desconectando Google Calendar`);
    console.log(`   entityId: ${entityId}`);
    console.log(`   chatbotId: ${chatbotId}`);
    console.log(`${'🔌'.repeat(40)}\n`);

    // Obtener cuenta conectada (USAR toolkitSlugs, NO app)
    const connectedAccounts = await composio.connectedAccounts.list({
      entityId,
      toolkitSlugs: ['googlecalendar'], // ✅ Filtro correcto
    });

    if (!connectedAccounts.items || connectedAccounts.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No hay cuenta de Google Calendar conectada",
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

    console.log(`✅ Cuenta desconectada de Composio: ${accountId}`);

    // ✅ Desactivar integración en BD
    await db.integration.updateMany({
      where: {
        chatbotId,
        platform: 'GOOGLE_CALENDAR',
      },
      data: {
        isActive: false,
        lastActivity: new Date(),
        errorMessage: 'Desconectado por el usuario',
      },
    });

    console.log(`✅ Integración desactivada en BD para chatbot: ${chatbotId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Google Calendar desconectado exitosamente",
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
