/**
 * Composio WhatsApp Integration Endpoint
 * Maneja la autenticación y conexión de WhatsApp vía Composio
 */

import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';
import { AuthScheme } from '@composio/core';
import { getSession } from '~/sessions';
import { db } from '~/utils/db.server';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LlamaindexProvider(),
});

/**
 * GET /api/v1/composio/whatsapp?intent=connect|status|disconnect
 * Maneja WhatsApp integration con API Key (no OAuth)
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

    // Validar si es un ObjectID válido o email
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);

    const user = await db.user.findFirst({
      where: isValidObjectId
        ? { id: userIdOrEmail }
        : { email: userIdOrEmail }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validar que el chatbot pertenece al usuario
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

    // CRÍTICO: entityId debe ser chatbot_${chatbotId}
    const entityId = `chatbot_${chatbotId}`;

    switch (intent) {
      case "connect":
        return handleConnect(entityId, chatbotId);
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
    console.error("Error en Composio WhatsApp endpoint:", error);
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
 * POST /api/v1/composio/whatsapp?intent=connect
 * Conectar WhatsApp usando tokens de Meta Embedded Signup
 */
export async function action({ request }: any) {
  try {
    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");
    const formData = await request.formData();
    const chatbotId = formData.get('chatbotId') as string;
    const accessToken = formData.get('accessToken') as string; // De Meta Embedded Signup
    const phoneNumberId = formData.get('phoneNumberId') as string;
    const whatsappBusinessAccountId = formData.get('whatsappBusinessAccountId') as string;

    if (intent !== 'connect') {
      return new Response(
        JSON.stringify({ error: "Este endpoint solo acepta intent=connect" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validaciones
    if (!chatbotId || !accessToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({
          error: "chatbotId, accessToken y phoneNumberId son requeridos"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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

    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);
    const user = await db.user.findFirst({
      where: isValidObjectId
        ? { id: userIdOrEmail }
        : { email: userIdOrEmail }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validar ownership del chatbot
    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        userId: user.id,
      },
    });

    if (!chatbot) {
      return new Response(
        JSON.stringify({ error: "Chatbot no encontrado o no pertenece al usuario" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const entityId = `chatbot_${chatbotId}`;

    console.log(`\n${'📱'.repeat(40)}`);
    console.log(`📱 [Composio] Conectando WhatsApp con Meta Embedded Signup`);
    console.log(`   entityId: ${entityId}`);
    console.log(`   chatbotId: ${chatbotId}`);
    console.log(`   phoneNumberId: ${phoneNumberId}`);
    console.log(`   whatsappBusinessAccountId: ${whatsappBusinessAccountId}`);
    console.log(`${'📱'.repeat(40)}\n`);

    // Verificar auth config ID
    const authConfigId = process.env.COMPOSIO_WHATSAPP_AUTH_CONFIG_ID;
    if (!authConfigId) {
      throw new Error(
        'COMPOSIO_WHATSAPP_AUTH_CONFIG_ID no está configurado. ' +
        'Ve a https://platform.composio.dev/marketplace/whatsapp y crea un Auth Config.'
      );
    }

    // Conectar usando el accessToken de Meta como API Key
    // Composio maneja WhatsApp Business API internamente
    const connectionRequest = await composio.connectedAccounts.initiate(
      entityId,
      authConfigId,
      {
        config: AuthScheme.APIKey({
          api_key: accessToken
        })
      }
    );

    console.log(`✅ WhatsApp conectado. Connection ID: ${connectionRequest.id}`);

    // Guardar integración en BD
    await db.integration.upsert({
      where: {
        platform_chatbotId: {
          platform: 'WHATSAPP',
          chatbotId: chatbotId,
        },
      },
      create: {
        platform: 'WHATSAPP',
        chatbotId: chatbotId,
        isActive: true,
        lastActivity: new Date(),
        token: connectionRequest.id,
      },
      update: {
        isActive: true,
        lastActivity: new Date(),
        errorMessage: null,
        token: connectionRequest.id,
      },
    });

    // Guardar phone_number_id en whatsappConfig del chatbot
    await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        whatsappConfig: {
          phoneNumberId: phoneNumberId,
          connectedViaComposio: true,
        }
      }
    });

    console.log(`✅ Integración guardada en BD para chatbot: ${chatbotId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "WhatsApp conectado exitosamente vía Composio",
        connectionId: connectionRequest.id,
        entityId,
        chatbotId,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error conectando WhatsApp:", error);

    // ROLLBACK: Desactivar integración en BD si Composio falla
    try {
      console.log(`🔄 [Composio] ROLLBACK: Desactivando integración en BD...`);

      await db.integration.updateMany({
        where: {
          chatbotId,
          platform: 'WHATSAPP',
        },
        data: {
          isActive: false,
          errorMessage: `Error al registrar en Composio: ${error.message || 'Error desconocido'}`,
          lastActivity: new Date(),
        },
      });

      // También limpiar whatsappConfig del chatbot
      await db.chatbot.update({
        where: { id: chatbotId },
        data: {
          whatsappConfig: {
            connectedViaComposio: false,
          }
        }
      });

      console.log(`✅ [Composio] ROLLBACK completado - Integración desactivada en BD`);

    } catch (rollbackError) {
      console.error(`❌ [Composio] Error en ROLLBACK:`, rollbackError);
      // No lanzar error de rollback, solo loguearlo
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error conectando WhatsApp",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Verificar estado de conexión de WhatsApp
 */
async function handleStatus(entityId: string) {
  try {
    console.log(`\n${'🔍'.repeat(40)}`);
    console.log(`🔍 [Composio] Verificando estado de WhatsApp`);
    console.log(`   entityId: ${entityId}`);
    console.log(`${'🔍'.repeat(40)}\n`);

    const connectedAccounts = await composio.connectedAccounts.list({
      entityId,
      toolkitSlugs: ['whatsapp'],
    });

    console.log(`📊 Cuentas de WhatsApp encontradas:`, connectedAccounts.items?.length || 0);

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
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error verificando estado:", error);
    return new Response(
      JSON.stringify({
        isConnected: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Desconectar WhatsApp
 */
async function handleDisconnect(entityId: string, chatbotId: string) {
  try {
    console.log(`\n${'🔌'.repeat(40)}`);
    console.log(`🔌 [Composio] Desconectando WhatsApp`);
    console.log(`   entityId: ${entityId}`);
    console.log(`   chatbotId: ${chatbotId}`);
    console.log(`${'🔌'.repeat(40)}\n`);

    const connectedAccounts = await composio.connectedAccounts.list({
      entityId,
      toolkitSlugs: ['whatsapp'],
    });

    if (!connectedAccounts.items || connectedAccounts.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No hay cuenta de WhatsApp conectada",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Eliminar conexión de Composio
    const accountId = connectedAccounts.items[0].id;
    await composio.connectedAccounts.delete(accountId);

    console.log(`✅ Cuenta desconectada de Composio: ${accountId}`);

    // Desactivar integración en BD
    await db.integration.updateMany({
      where: {
        chatbotId,
        platform: 'WHATSAPP',
      },
      data: {
        isActive: false,
        lastActivity: new Date(),
        errorMessage: 'Desconectado por el usuario',
      },
    });

    // Limpiar whatsappConfig del chatbot
    await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        whatsappConfig: {
          connectedViaComposio: false,
        }
      }
    });

    console.log(`✅ Integración desactivada en BD para chatbot: ${chatbotId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "WhatsApp desconectado exitosamente",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error desconectando:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
