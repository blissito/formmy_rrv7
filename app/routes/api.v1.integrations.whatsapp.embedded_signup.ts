import type { ActionFunctionArgs } from "react-router";
import { db } from "~/utils/db.server";
import { getSession } from "~/sessions";

// Mock encryptText para desarrollo
const encryptText = (text: string) => `encrypted_${text}`;

interface EmbeddedSignupRequest {
  chatbotId: string;
  code?: string; // Opcional ahora
  // ✅ Datos del message event (llegan del frontend)
  wabaId?: string;
  phoneNumberId?: string;
  // Legacy fields (mantener por compatibilidad)
  accessToken?: string;
  userID?: string;
  redirectUri?: string;
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


    // Validar que se recibió accessToken O code
    if (!body.accessToken && !code) {
      console.error("❌ [Embedded Signup] ERROR: No se recibió accessToken ni código de autorización");
      console.error("   authResponse:", JSON.stringify(body.authResponse, null, 2));
      return Response.json(
        {
          error: "No se recibió accessToken ni código de autorización",
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


    // ✅ Obtener access token (puede venir directo o necesitar exchange)
    let accessToken: string;

    if (body.accessToken) {
      // ✅ Token directo desde FB.login() sin response_type: 'code'
      console.log(`✅ [Direct Token] Access Token recibido directamente: ${body.accessToken.substring(0, 20)}...`);
      console.log(`🔄 [Direct Token] wabaId: ${body.wabaId || 'N/A'}`);
      console.log(`🔄 [Direct Token] phoneNumberId: ${body.phoneNumberId || 'N/A'}`);
      accessToken = body.accessToken;
    } else if (code) {
      // ✅ Intercambiar código por token (legacy flow)
      console.log(`🔄 [Token Exchange] Code: ${code?.substring(0, 20)}...`);
      console.log(`🔄 [Token Exchange] wabaId: ${body.wabaId || 'N/A'}`);
      console.log(`🔄 [Token Exchange] phoneNumberId: ${body.phoneNumberId || 'N/A'}`);
      console.log(`🔄 [Token Exchange] redirectUri: ${body.redirectUri || 'N/A'}`);

      const tokenExchangeUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
      tokenExchangeUrl.searchParams.append('client_id', FACEBOOK_APP_ID);
      tokenExchangeUrl.searchParams.append('client_secret', FACEBOOK_APP_SECRET);
      tokenExchangeUrl.searchParams.append('code', code);

      if (body.redirectUri) {
        tokenExchangeUrl.searchParams.append('redirect_uri', body.redirectUri);
      }

      console.log(`🔄 [Token Exchange] Intercambiando código con Meta...`);

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
      accessToken = tokenData.access_token;

      console.log(`✅ [Token Exchange] Token obtenido exitosamente`);
    } else {
      console.error(`❌ [Embedded Signup] No se recibió accessToken ni code`);
      return Response.json(
        { error: "Se requiere accessToken o code" },
        { status: 400 }
      );
    }

    // Aquí accessToken ya está definido (directo o desde exchange)
    const longLivedToken = accessToken;

    // 2. ✅ USAR wabaId y phoneNumberId del message event (si están disponibles)
    let wabaId = body.wabaId;
    let phoneNumberId = body.phoneNumberId;
    let phoneNumber: any = null;

    if (wabaId && phoneNumberId) {
      console.log(`✅ [Message Event] Usando datos del frontend:`);
      console.log(`   WABA ID: ${wabaId}`);
      console.log(`   Phone Number ID: ${phoneNumberId}`);

      // Obtener información del phone number para display_phone_number y verified_name
      const phoneInfoUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`;
      const phoneInfoResponse = await fetch(phoneInfoUrl, {
        headers: { 'Authorization': `Bearer ${longLivedToken}` }
      });

      if (phoneInfoResponse.ok) {
        phoneNumber = await phoneInfoResponse.json();
        console.log(`✅ [Phone Info] Número: ${phoneNumber.display_phone_number}`);
        console.log(`✅ [Phone Info] Nombre verificado: ${phoneNumber.verified_name}`);
      } else {
        console.warn(`⚠️ [Phone Info] No se pudo obtener info del número`);
        // Crear objeto mínimo
        phoneNumber = { id: phoneNumberId };
      }

    } else {
      // ✅ FALLBACK: Consultar directamente con el System User Token
      // Este método siempre funciona sin requerir Business Verification
      console.warn(`⚠️ [Message Event] No se recibió wabaId/phoneNumberId del frontend`);
      console.warn(`✅ [Fallback] Usando System User Token para obtener WABA...`);

      // Estrategia 1: Intentar /me/whatsapp_business_accounts primero
      let wabasData: any = null;
      let strategyUsed = '';

      try {
        const wabasUrl = `https://graph.facebook.com/v21.0/me/whatsapp_business_accounts`;
        const wabasResponse = await fetch(wabasUrl, {
          headers: { 'Authorization': `Bearer ${longLivedToken}` },
        });

        if (wabasResponse.ok) {
          wabasData = await wabasResponse.json();
          strategyUsed = '/me/whatsapp_business_accounts';
          console.log("✅ [Strategy 1] /me/whatsapp_business_accounts funcionó:", JSON.stringify(wabasData, null, 2));
        } else {
          console.warn("⚠️ [Strategy 1] /me/whatsapp_business_accounts falló, intentando estrategia 2...");
        }
      } catch (e) {
        console.warn("⚠️ [Strategy 1] Error:", e);
      }

      // Estrategia 2: Si la primera falla, usar debug_token + POST al endpoint de system user
      if (!wabasData || !wabasData.data || wabasData.data.length === 0) {
        console.log("🔄 [Strategy 2] Intentando obtener WABA via business discovery...");

        // Primero obtener el business manager ID del token
        const debugTokenUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${longLivedToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
        const debugResponse = await fetch(debugTokenUrl);

        if (!debugResponse.ok) {
          const errorData = await debugResponse.text();
          console.error("❌ [Strategy 2] Failed to debug token:", errorData);
          return Response.json(
            { error: "Error al obtener WhatsApp Business Account" },
            { status: 400 }
          );
        }

        const debugData = await debugResponse.json();
        console.log("🔍 [Strategy 2] Debug token data:", JSON.stringify(debugData, null, 2));

        // Buscar granular_scopes con whatsapp_business_messaging o whatsapp_business_management
        const granularScopes = debugData.data?.granular_scopes || [];

        // Intentar en whatsapp_business_messaging primero
        let whatsappScope = granularScopes.find((scope: any) =>
          scope.scope === 'whatsapp_business_messaging' && scope.target_ids && scope.target_ids.length > 0
        );

        // Si no se encuentra, intentar en whatsapp_business_management
        if (!whatsappScope) {
          whatsappScope = granularScopes.find((scope: any) =>
            scope.scope === 'whatsapp_business_management' && scope.target_ids && scope.target_ids.length > 0
          );
        }

        if (whatsappScope && whatsappScope.target_ids && whatsappScope.target_ids.length > 0) {
          // ✅ Encontramos WABA IDs en granular_scopes
          wabaId = whatsappScope.target_ids[0];
          strategyUsed = `debug_token granular_scopes (${whatsappScope.scope})`;
          console.log(`✅ [Strategy 2] WABA ID encontrado en ${whatsappScope.scope}: ${wabaId}`);
        } else {
          console.error("❌ [Strategy 2] No se encontró WABA en granular_scopes");
          console.error("   Scopes disponibles:", JSON.stringify(granularScopes, null, 2));
          return Response.json(
            { error: "No se pudo obtener el WhatsApp Business Account. El flujo de Embedded Signup puede no haberse completado correctamente." },
            { status: 404 }
          );
        }
      } else {
        wabaId = wabasData.data[0].id;
      }

      // Ya tenemos wabaId, ahora obtener phone numbers
      console.log(`✅ [${strategyUsed}] WABA ID: ${wabaId}`);

      const phoneNumbersUrl = `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers`;
      const phoneResponse = await fetch(phoneNumbersUrl, {
        headers: { 'Authorization': `Bearer ${longLivedToken}` },
      });

      if (!phoneResponse.ok) {
        const errorData = await phoneResponse.text();
        console.error("❌ [Graph API] Failed to get phone numbers:", errorData);
        return Response.json(
          { error: "Error al obtener números de teléfono del WABA" },
          { status: 400 }
        );
      }

      const phoneData = await phoneResponse.json();
      console.log("✅ [Graph API] Phone numbers response:", JSON.stringify(phoneData, null, 2));

      if (!phoneData.data || phoneData.data.length === 0) {
        console.error(`❌ [Graph API] El WABA ${wabaId} no tiene números de teléfono configurados`);
        return Response.json(
          {
            error: "WhatsApp Business Account conectado pero sin números de teléfono",
            details: "Completa la configuración en Meta Business Suite",
            wabaId: wabaId,
            instructions: [
              "1. Ve a https://business.facebook.com/latest/whatsapp_manager",
              "2. Selecciona tu WhatsApp Business Account",
              "3. Agrega y verifica un número de teléfono",
              "4. Vuelve a intentar la conexión en Formmy"
            ]
          },
          { status: 424 } // 424 Failed Dependency
        );
      }

      phoneNumber = phoneData.data[0];
      phoneNumberId = phoneNumber.id;

      console.log(`✅ [Fallback Complete] Datos obtenidos exitosamente:`);
      console.log(`   Strategy: ${strategyUsed}`);
      console.log(`   WABA ID: ${wabaId}`);
      console.log(`   Phone Number ID: ${phoneNumberId}`);
      console.log(`   Display Phone Number: ${phoneNumber.display_phone_number || 'N/A'}`);
      console.log(`   Verified Name: ${phoneNumber.verified_name || 'N/A'}`);
    }

    // 3. Obtener businessAccountId (si no lo tenemos)
    let businessAccountId = body.embeddedSignupData?.business_id;

    if (!businessAccountId) {
      // Obtener desde el WABA
      const wabaInfoUrl = `https://graph.facebook.com/v21.0/${wabaId}?fields=id,owner_business_info`;
      const wabaInfoResponse = await fetch(wabaInfoUrl, {
        headers: { 'Authorization': `Bearer ${longLivedToken}` }
      });

      if (wabaInfoResponse.ok) {
        const wabaInfo = await wabaInfoResponse.json();
        businessAccountId = wabaInfo.owner_business_info?.id || 'unknown';
        console.log(`✅ [WABA Info] Business Account ID: ${businessAccountId}`);
      } else {
        console.warn(`⚠️ [WABA Info] No se pudo obtener business account ID`);
        businessAccountId = 'unknown';
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

    // Verificar suscripción llamando a Graph API (si tenemos businessAccountId)
    if (webhookConfigured && businessAccountId && businessAccountId !== 'unknown') {
      try {
        console.log(`🔍 [Webhook] Verificando suscripción...`);
        const verifyUrl = `https://graph.facebook.com/v21.0/${businessAccountId}/subscribed_apps`;
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
          phoneNumberId: phoneNumberId,
          businessAccountId: businessAccountId,
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
          phoneNumberId: phoneNumberId,
          businessAccountId: businessAccountId,
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
          phoneNumber: phoneNumber?.display_phone_number || 'N/A',
          verifiedName: phoneNumber?.verified_name || 'N/A',
          businessAccountId: businessAccountId,
          phoneNumberId: phoneNumberId,
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
        phoneNumber: phoneNumber?.display_phone_number || 'N/A',
        verifiedName: phoneNumber?.verified_name || 'N/A',
        businessAccountId: businessAccountId,
        phoneNumberId: phoneNumberId,
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