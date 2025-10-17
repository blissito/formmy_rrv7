import type { ActionFunctionArgs } from "react-router";
import { db } from "~/utils/db.server";
import { getSession } from "~/sessions";

// Mock encryptText para desarrollo
const encryptText = (text: string) => `encrypted_${text}`;

interface EmbeddedSignupRequest {
  chatbotId: string;
  code: string;
  accessToken: string;
  userID: string;
}

interface MetaTokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

interface MetaBusinessAccountResponse {
  data: Array<{
    id: string;
    name: string;
    phone_numbers?: Array<{
      id: string;
      display_phone_number: string;
      verified_name: string;
    }>;
  }>;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json() as EmbeddedSignupRequest;

    // Modo mock para desarrollo
    if (body.code === 'mock_code_12345') {
      console.log('🧪 MOCK: Procesando embedded signup mock');

      return Response.json({
        success: true,
        integration: {
          id: 'mock_integration_id',
          phoneNumber: '+1234567890',
          verifiedName: 'Mock Business',
          businessAccountId: 'mock_business_id',
          embeddedSignup: true,
        },
        message: "Integración mock configurada exitosamente",
      });
    }

    // Autenticar usuario usando getSession() (consistente con endpoint de Composio)
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (!userIdOrEmail) {
      console.error("❌ [Embedded Signup] Usuario no autenticado - sesión no contiene userId");
      return Response.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    console.log(`✅ [Embedded Signup] Usuario autenticado: ${userIdOrEmail}`);

    // Validar si es un ObjectID válido o email
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userIdOrEmail);

    const user = await db.user.findFirst({
      where: isValidObjectId
        ? { id: userIdOrEmail }
        : { email: userIdOrEmail }
    });

    if (!user) {
      console.error(`❌ [Embedded Signup] Usuario no encontrado en BD: ${userIdOrEmail}`);
      return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    console.log(`✅ [Embedded Signup] Usuario encontrado en BD: ${user.id}`);

    const { chatbotId, code, accessToken, userID } = body;

    // Validar que el chatbot pertenece al usuario
    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        userId: user.id,
      },
    });

    if (!chatbot) {
      console.error(`❌ [Embedded Signup] Chatbot no encontrado: ${chatbotId}`);
      return Response.json({ error: "Chatbot no encontrado" }, { status: 404 });
    }

    console.log(`✅ [Embedded Signup] Chatbot validado: ${chatbot.id}`);

    // 1. Intercambiar el código por un token de larga duración
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error("❌ [Embedded Signup] Missing Facebook app credentials");
      return Response.json(
        { error: "Configuración de Meta no disponible" },
        { status: 500 }
      );
    }

    console.log(`🔄 [Embedded Signup] Iniciando intercambio de código por token de larga duración...`);

    // Intercambiar el código por un access token de larga duración
    const tokenExchangeUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenExchangeUrl.searchParams.append('client_id', FACEBOOK_APP_ID);
    tokenExchangeUrl.searchParams.append('client_secret', FACEBOOK_APP_SECRET);
    tokenExchangeUrl.searchParams.append('code', code);
    tokenExchangeUrl.searchParams.append('redirect_uri', `https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/embedded_signup`);

    const tokenResponse = await fetch(tokenExchangeUrl.toString());

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("❌ [Embedded Signup] Token exchange failed:", errorData);
      return Response.json(
        { error: "Error al intercambiar el código por token" },
        { status: 400 }
      );
    }

    const tokenData: MetaTokenExchangeResponse = await tokenResponse.json();
    const longLivedToken = tokenData.access_token;

    console.log(`✅ [Embedded Signup] Token de larga duración obtenido exitosamente`);

    // 2. Obtener información del Business Account y Phone Number
    const businessAccountUrl = `https://graph.facebook.com/v21.0/${userID}/businesses`;
    const businessResponse = await fetch(businessAccountUrl, {
      headers: {
        'Authorization': `Bearer ${longLivedToken}`,
      },
    });

    if (!businessResponse.ok) {
      const errorData = await businessResponse.text();
      console.error("Failed to get business account:", errorData);
      return Response.json(
        { error: "Error al obtener información de la cuenta de negocio" },
        { status: 400 }
      );
    }

    const businessData: MetaBusinessAccountResponse = await businessResponse.json();

    if (!businessData.data || businessData.data.length === 0) {
      return Response.json(
        { error: "No se encontró una cuenta de negocio asociada" },
        { status: 404 }
      );
    }

    const businessAccount = businessData.data[0];

    // 3. Obtener los números de teléfono asociados
    const phoneNumbersUrl = `https://graph.facebook.com/v21.0/${businessAccount.id}/phone_numbers`;
    const phoneResponse = await fetch(phoneNumbersUrl, {
      headers: {
        'Authorization': `Bearer ${longLivedToken}`,
      },
    });

    if (!phoneResponse.ok) {
      const errorData = await phoneResponse.text();
      console.error("Failed to get phone numbers:", errorData);
      return Response.json(
        { error: "Error al obtener números de teléfono" },
        { status: 400 }
      );
    }

    const phoneData = await phoneResponse.json();

    if (!phoneData.data || phoneData.data.length === 0) {
      return Response.json(
        { error: "No se encontraron números de teléfono configurados" },
        { status: 404 }
      );
    }

    const phoneNumber = phoneData.data[0];

    // 4. Generar un webhook verify token único
    const webhookVerifyToken = `formmy_${chatbotId}_${Date.now()}`;

    // 5. Configurar el webhook automáticamente en Meta
    const webhookUrl = `https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook`;

    const webhookConfigUrl = `https://graph.facebook.com/v21.0/${FACEBOOK_APP_ID}/subscriptions`;
    const webhookResponse = await fetch(webhookConfigUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${longLivedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object: 'whatsapp_business_account',
        callback_url: webhookUrl,
        fields: 'messages,smb_message_echoes,smb_app_state_sync',
        verify_token: webhookVerifyToken,
        include_values: true,
      }),
    });

    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.text();
      console.error("Failed to configure webhook:", errorData);
      // No es crítico, continuamos con la creación
    }

    // 6. Crear o actualizar la integración en la base de datos
    console.log(`💾 [Embedded Signup] Guardando integración en BD...`);

    const encryptedToken = encryptText(longLivedToken);

    const existingIntegration = await db.integration.findFirst({
      where: {
        chatbotId: chatbotId,
        platform: "WHATSAPP",
      },
    });

    let integration;

    if (existingIntegration) {
      // Actualizar integración existente
      console.log(`🔄 [Embedded Signup] Actualizando integración existente: ${existingIntegration.id}`);
      integration = await db.integration.update({
        where: { id: existingIntegration.id },
        data: {
          token: encryptedToken,
          phoneNumberId: phoneNumber.id,
          businessAccountId: businessAccount.id,
          webhookVerifyToken: webhookVerifyToken,
          isActive: true,
        },
      });
    } else {
      // Crear nueva integración
      console.log(`✨ [Embedded Signup] Creando nueva integración para chatbot: ${chatbotId}`);
      integration = await db.integration.create({
        data: {
          chatbotId: chatbotId,
          platform: "WHATSAPP",
          token: encryptedToken,
          phoneNumberId: phoneNumber.id,
          businessAccountId: businessAccount.id,
          webhookVerifyToken: webhookVerifyToken,
          isActive: true,
        },
      });
    }

    console.log(`✅ [Embedded Signup] Integración guardada en BD: ${integration.id}`);
    console.log(`📱 [Embedded Signup] Phone Number ID: ${phoneNumber.id}`);
    console.log(`🏢 [Embedded Signup] Business Account ID: ${businessAccount.id}`);

    // 7. Sincronizar historial de conversaciones (opcional, en background)
    // Esto se puede hacer con un job en background para no bloquear la respuesta
    // Por ahora solo marcamos que necesita sincronización

    console.log(`\n${'✅'.repeat(40)}`);
    console.log(`✅ [Embedded Signup] PROCESO COMPLETADO EXITOSAMENTE`);
    console.log(`✅ Usuario: ${user.email || user.id}`);
    console.log(`✅ Chatbot: ${chatbot.name} (${chatbot.id})`);
    console.log(`✅ Phone: ${phoneNumber.display_phone_number}`);
    console.log(`✅ Integration ID: ${integration.id}`);
    console.log(`${'✅'.repeat(40)}\n`);

    return Response.json({
      success: true,
      integration: {
        id: integration.id,
        phoneNumber: phoneNumber.display_phone_number,
        verifiedName: phoneNumber.verified_name,
        businessAccountId: businessAccount.id,
        phoneNumberId: phoneNumber.id,
        coexistenceMode: true,
        embeddedSignup: true,
        token: longLivedToken, // Agregar token para el siguiente paso (Composio)
      },
      message: "Integración de WhatsApp configurada exitosamente con Embedded Signup",
    });

  } catch (error) {
    console.error("Error in embedded signup:", error);
    return Response.json(
      {
        error: "Error al procesar la integración con WhatsApp",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function loader() {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}