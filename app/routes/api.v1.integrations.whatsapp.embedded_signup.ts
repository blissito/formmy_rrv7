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
  redirectUri?: string; // Optional: redirect_uri usado en frontend
  authResponse?: {
    code?: string;
    userID?: string;
  };
  status?: string;
  embeddedSignupData?: {
    phone_number_id?: string;
    waba_id?: string;
    business_id?: string;
    ad_account_ids?: string[];
    page_ids?: string[];
    dataset_ids?: string[];
    sessionInfoVerified?: boolean;
  };
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


    // Extraer parámetros - soportar tanto formato antiguo como nuevo
    const chatbotId = body.chatbotId;
    const code = body.authResponse?.code || body.code;
    const accessToken = body.accessToken;
    const userID = body.authResponse?.userID || body.userID;


    // Validar que el código fue recibido
    if (!code) {
      console.error("❌ [Embedded Signup] ERROR: No se recibió código de autorización");
      console.error("   authResponse:", JSON.stringify(body.authResponse, null, 2));
      return Response.json(
        {
          error: "No se recibió código de autorización",
          hint: "Verifica que el flujo de Embedded Signup se completó correctamente"
        },
        { status: 400 }
      );
    }

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


    // Extraer datos del message event si están disponibles
    const messageEventData = body.embeddedSignupData;
    if (messageEventData) {
      if (messageEventData.ad_account_ids && messageEventData.ad_account_ids.length > 0) {
      }
      if (messageEventData.page_ids && messageEventData.page_ids.length > 0) {
      }
      if (messageEventData.dataset_ids && messageEventData.dataset_ids.length > 0) {
      }
    } else {
      console.warn(`⚠️ [Message Event] No se recibieron datos del message event (puede ser normal si el evento aún no llegó)`);
    }

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


    // Intercambiar el código por un access token de larga duración
    // NOTA: El redirect_uri DEBE coincidir EXACTAMENTE con el usado en FB.login()
    // Facebook IGNORA el redirect_uri que pasamos y usa window.location.origin (SIN barra final)
    const redirectUri = body.redirectUri || (() => {
      // Fallback: calcular desde request headers si el frontend no lo envió
      let origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://www.formmy.app';

      // Normalizar a www.formmy.app para que coincida con OAuth Redirect URIs de Facebook
      if (origin.includes('formmy.app') && !origin.includes('www.')) {
        origin = origin.replace('formmy.app', 'www.formmy.app');
      }

      // SIN barra final - Facebook usa window.location.origin
      return origin;
    })();

    console.log(`🔄 [Token Exchange] redirect_uri recibido del frontend: ${body.redirectUri}`);
    console.log(`🔄 [Token Exchange] redirect_uri final a usar: ${redirectUri}`);

    const tokenExchangeUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenExchangeUrl.searchParams.append('client_id', FACEBOOK_APP_ID);
    tokenExchangeUrl.searchParams.append('client_secret', FACEBOOK_APP_SECRET);
    tokenExchangeUrl.searchParams.append('code', code);
    tokenExchangeUrl.searchParams.append('redirect_uri', redirectUri);


    const tokenResponse = await fetch(tokenExchangeUrl.toString());

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error(`\n${'❌'.repeat(40)}`);
      console.error(`❌ [Embedded Signup] Token exchange FAILED`);
      console.error(`   HTTP Status: ${tokenResponse.status} ${tokenResponse.statusText}`);
      console.error(`   Client ID usado: ${FACEBOOK_APP_ID}`);
      console.error(`   Code usado: ${code?.substring(0, 20)}...`);
      console.error(`   Response de Meta:`);

      try {
        const errorJson = JSON.parse(errorData);
        console.error(`   Error Type: ${errorJson.error?.type || 'N/A'}`);
        console.error(`   Error Code: ${errorJson.error?.code || 'N/A'}`);
        console.error(`   Error Message: ${errorJson.error?.message || errorData}`);
        console.error(`   Error Subcode: ${errorJson.error?.error_subcode || 'N/A'}`);
        console.error(`   Fbtrace ID: ${errorJson.error?.fbtrace_id || 'N/A'}`);
      } catch {
        console.error(`   Raw Error: ${errorData}`);
      }

      console.error(`${'❌'.repeat(40)}\n`);

      return Response.json(
        {
          error: "Error al intercambiar el código por token",
          details: errorData,
          hint: "Verifica que FACEBOOK_APP_ID y VITE_FACEBOOK_APP_ID sean iguales en .env"
        },
        { status: 400 }
      );
    }

    const tokenData: MetaTokenExchangeResponse = await tokenResponse.json();
    const longLivedToken = tokenData.access_token;


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

    // 3.5. Validación cruzada con datos del message event
    if (messageEventData) {

      // Validar phone_number_id
      if (messageEventData.phone_number_id && messageEventData.phone_number_id !== phoneNumber.id) {
        console.warn(`⚠️ [Validación] ADVERTENCIA: phone_number_id no coincide!`);
        console.warn(`   Message Event: ${messageEventData.phone_number_id}`);
        console.warn(`   Meta API: ${phoneNumber.id}`);
        console.warn(`   → Usando valor de Meta API (más confiable)`);
      } else if (messageEventData.phone_number_id === phoneNumber.id) {
      }

      // Validar waba_id (business account)
      if (messageEventData.waba_id && messageEventData.waba_id !== businessAccount.id) {
        console.warn(`⚠️ [Validación] ADVERTENCIA: waba_id no coincide!`);
        console.warn(`   Message Event: ${messageEventData.waba_id}`);
        console.warn(`   Meta API: ${businessAccount.id}`);
        console.warn(`   → Usando valor de Meta API (más confiable)`);
      } else if (messageEventData.waba_id === businessAccount.id) {
      }

      // Informar sobre business_id (es adicional, no lo obtenemos de la API)
      if (messageEventData.business_id) {
      }

    }

    // 4. Generar un webhook verify token único
    const webhookVerifyToken = `formmy_${chatbotId}_${Date.now()}`;

    // 5. Configurar el webhook automáticamente en Meta con retry logic
    const webhookUrl = `https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook`;
    const webhookConfigUrl = `https://graph.facebook.com/v21.0/${FACEBOOK_APP_ID}/subscriptions`;

    let webhookConfigured = false;
    let lastError: string | null = null;

    // Intentar suscripción con 3 reintentos (exponential backoff)
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 [Webhook] Intento ${attempt}/3 - Configurando webhook...`);

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

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        webhookConfigured = webhookData.success === true;

        if (webhookConfigured) {
          console.log(`✅ [Webhook] Suscripción exitosa en intento ${attempt}`);
          break;
        }
      } else {
        lastError = await webhookResponse.text();
        console.error(`⚠️ [Webhook] Intento ${attempt}/3 falló:`, lastError);

        // Esperar antes de reintentar (exponential backoff: 1s, 2s, 3s)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // Verificar suscripción llamando a Graph API
    if (webhookConfigured) {
      try {
        console.log(`🔍 [Webhook] Verificando suscripción...`);
        const verifyUrl = `https://graph.facebook.com/v21.0/${businessAccount.id}/subscribed_apps`;
        const verifyResponse = await fetch(verifyUrl, {
          headers: { 'Authorization': `Bearer ${longLivedToken}` }
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          webhookConfigured = verifyData.data?.some((app: any) =>
            app.subscribed_fields?.includes('messages')
          );

          if (webhookConfigured) {
            console.log(`✅ [Webhook] Verificación exitosa - webhook activo`);
          } else {
            console.warn(`⚠️ [Webhook] Verificación falló - webhook no encontrado en subscribed_apps`);
          }
        } else {
          console.warn(`⚠️ [Webhook] No se pudo verificar suscripción:`, await verifyResponse.text());
        }
      } catch (verifyError) {
        console.error(`❌ [Webhook] Error al verificar suscripción:`, verifyError);
        // No marcar como fallido si la verificación falla (la suscripción puede estar ok)
      }
    }

    // 6. Crear o actualizar la integración en la base de datos

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
      integration = await db.integration.update({
        where: { id: existingIntegration.id },
        data: {
          token: encryptedToken,
          phoneNumberId: phoneNumber.id,
          businessAccountId: businessAccount.id,
          webhookVerifyToken: webhookVerifyToken,
          isActive: true,
          metadata: {
            coexistence: true,
            featureType: "whatsapp_business_app_onboarding",
            sessionInfoVerified: messageEventData?.sessionInfoVerified || false,
            webhookConfigured,
            webhookError: webhookConfigured ? null : lastError,
            subscriptionTimestamp: new Date().toISOString(),
          },
        },
      });
    } else {
      // Crear nueva integración
      integration = await db.integration.create({
        data: {
          chatbotId: chatbotId,
          platform: "WHATSAPP",
          token: encryptedToken,
          phoneNumberId: phoneNumber.id,
          businessAccountId: businessAccount.id,
          webhookVerifyToken: webhookVerifyToken,
          isActive: true,
          metadata: {
            coexistence: true,
            featureType: "whatsapp_business_app_onboarding",
            sessionInfoVerified: messageEventData?.sessionInfoVerified || false,
            webhookConfigured,
            webhookError: webhookConfigured ? null : lastError,
            subscriptionTimestamp: new Date().toISOString(),
          },
        },
      });
    }


    // 7. Sincronizar historial de conversaciones (opcional, en background)
    // Esto se puede hacer con un job en background para no bloquear la respuesta
    // Por ahora solo marcamos que necesita sincronización


    // Información adicional del message event (si está disponible)
    if (messageEventData) {
      if (messageEventData.business_id) {
      }
      if (messageEventData.ad_account_ids && messageEventData.ad_account_ids.length > 0) {
      }
      if (messageEventData.page_ids && messageEventData.page_ids.length > 0) {
      }
      if (messageEventData.dataset_ids && messageEventData.dataset_ids.length > 0) {
      }
    }

    // Verificar si webhook falló y retornar warning
    if (!webhookConfigured) {
      console.warn(`⚠️ [Embedded Signup] WhatsApp conectado pero webhook falló`);
      return Response.json({
        error: "WhatsApp conectado pero webhook falló. Verifica configuración en Meta.",
        integration: {
          id: integration.id,
          phoneNumber: phoneNumber.display_phone_number,
          verifiedName: phoneNumber.verified_name,
          businessAccountId: businessAccount.id,
          phoneNumberId: phoneNumber.id,
          coexistenceMode: true,
          embeddedSignup: true,
          token: longLivedToken,
          ...(messageEventData && {
            messageEventData: {
              businessPortfolioId: messageEventData.business_id,
              adAccountIds: messageEventData.ad_account_ids,
              pageIds: messageEventData.page_ids,
              datasetIds: messageEventData.dataset_ids,
            }
          })
        },
        webhookWarning: true,
        details: lastError,
        message: "Integración creada con advertencias. El webhook debe configurarse manualmente.",
      }, { status: 207 }); // 207 Multi-Status
    }

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
        token: longLivedToken,
        // Datos adicionales del message event (si están disponibles)
        ...(messageEventData && {
          messageEventData: {
            businessPortfolioId: messageEventData.business_id,
            adAccountIds: messageEventData.ad_account_ids,
            pageIds: messageEventData.page_ids,
            datasetIds: messageEventData.dataset_ids,
          }
        })
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