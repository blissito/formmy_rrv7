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


    // ✅ Validar flujo: Coexistencia (wabaId + phoneNumberId) O OAuth (accessToken/code)
    const isCoexistenceFlow = body.wabaId && body.phoneNumberId;
    const isOAuthFlow = body.accessToken || code;

    if (!isCoexistenceFlow && !isOAuthFlow) {
      console.error("❌ [Embedded Signup] ERROR: Flujo desconocido");
      console.error("   - Coexistencia requiere: wabaId + phoneNumberId");
      console.error("   - OAuth requiere: accessToken O code");
      console.error("   Recibido:", JSON.stringify({
        wabaId: body.wabaId,
        phoneNumberId: body.phoneNumberId,
        hasAccessToken: !!body.accessToken,
        hasCode: !!code
      }, null, 2));
      return Response.json(
        {
          error: "Datos insuficientes para conectar WhatsApp",
          hint: "Se requiere wabaId + phoneNumberId (coexistencia) O accessToken/code (OAuth)"
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


    // ✅ Obtener access token según el flujo
    let accessToken: string;

    if (body.accessToken) {
      accessToken = body.accessToken;
    } else if (code) {
      const tokenParams = new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        code: code,
        grant_type: 'authorization_code'
      });

      if (body.redirectUri) {
        tokenParams.append('redirect_uri', body.redirectUri);
      }

      const tokenResponse = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString()
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error(`❌ [Embedded Signup] Token exchange FAILED`);
        console.error(`   HTTP Status: ${tokenResponse.status} ${tokenResponse.statusText}`);
        console.error(`   Client ID usado: ${FACEBOOK_APP_ID}`);
        console.error(`   Code usado: ${code?.substring(0, 20)}...`);

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
    } else {
      console.error(`❌ [Embedded Signup] No se recibió accessToken ni code`);
      return Response.json(
        { error: "Se requiere accessToken o code" },
        { status: 400 }
      );
    }

    // ✅ Intercambiar short-lived token por long-lived token (60 días)
    let longLivedToken = accessToken;

    // En coexistencia, el token del message event es short-lived → intercambiar
    if (isCoexistenceFlow && body.accessToken) {
      const exchangeUrl = 'https://graph.facebook.com/v21.0/oauth/access_token';
      const exchangeParams = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        fb_exchange_token: accessToken,
      });

      try {
        const exchangeResponse = await fetch(`${exchangeUrl}?${exchangeParams.toString()}`);

        if (exchangeResponse.ok) {
          const exchangeData = await exchangeResponse.json();
          longLivedToken = exchangeData.access_token;
        } else {
          const errorText = await exchangeResponse.text();
          console.error(`❌ [Token Exchange] Failed:`, errorText);
        }
      } catch (err) {
        console.error(`❌ [Token Exchange] Error:`, err);
      }
    }

    // 2. ✅ USAR wabaId y phoneNumberId del message event (si están disponibles)
    let wabaId = body.wabaId;
    let phoneNumberId = body.phoneNumberId;
    let phoneNumber: any = null;

    if (wabaId && phoneNumberId) {
      // Obtener información del phone number para display_phone_number y verified_name
      const phoneInfoUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`;
      const phoneInfoResponse = await fetch(phoneInfoUrl, {
        headers: { 'Authorization': `Bearer ${longLivedToken}` }
      });

      if (phoneInfoResponse.ok) {
        phoneNumber = await phoneInfoResponse.json();
      } else {
        phoneNumber = { id: phoneNumberId };
      }

    } else {
      // ✅ FALLBACK: Consultar WABA con el token del usuario
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
        }
      } catch (e) {
        // Silent fail, intentar estrategia 2
      }

      // Estrategia 2: Si la primera falla, usar debug_token
      if (!wabasData || !wabasData.data || wabasData.data.length === 0) {

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
          wabaId = whatsappScope.target_ids[0];
          strategyUsed = 'debug_token';
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
      } else {
        businessAccountId = 'unknown';
      }
    }

    // 4. Generar un webhook verify token único
    const webhookVerifyToken = `formmy_${chatbotId}_${Date.now()}`;

    // 5. Webhook Configuration
    // ✅ En Embedded Signup, Meta gestiona el webhook centralmente desde el App Dashboard
    //    El webhook global (configurado en App Dashboard) recibe TODOS los mensajes
    //    y el routing se hace con query params: /webhook?chatbotId=xxx
    //
    // ⚠️ NO intentamos override_callback_uri porque:
    //    - Requiere Business Verification completa
    //    - Falla con error 400/403 en modo Coexistencia
    //    - NO es necesario - el webhook global funciona perfectamente
    //
    // Docs: https://developers.facebook.com/docs/whatsapp/embedded-signup/webhooks

    // Detectar URL base dinámicamente desde el request
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    // 6. Crear o actualizar la integración en la base de datos

    // ✅ SIEMPRE guardamos el token del usuario (System User Token deprecado)
    // Tanto en Coexistencia como en OAuth, cada usuario tiene su propio long-lived token
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
          syncStatus: "pending", // Will be updated to "syncing" when sync starts
          metadata: {
            coexistence: true,
            featureType: "whatsapp_business_app_onboarding",
            sessionInfoVerified: messageEventData?.sessionInfoVerified || false,
            webhookMethod: "global_app_dashboard",
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
          syncStatus: "pending", // Will be updated to "syncing" when sync starts
          metadata: {
            coexistence: true,
            featureType: "whatsapp_business_app_onboarding",
            sessionInfoVerified: messageEventData?.sessionInfoVerified || false,
            webhookMethod: "global_app_dashboard",
            subscriptionTimestamp: new Date().toISOString(),
          },
        },
      });
    }


    // 7. ✅ Iniciar sincronización en SEGUNDO PLANO con Agenda.js
    try {
      const { getAgenda } = await import('server/jobs/agenda.server');
      const agenda = await getAgenda();

      // Programar job AHORA (pero en background)
      await agenda.now('whatsapp-sync', {
        integrationId: integration.id,
        phoneNumberId,
        accessToken: longLivedToken,
      });

      console.log(`✅ [Embedded Signup] WhatsApp sync job scheduled for Integration ${integration.id}`);
    } catch (syncError) {
      console.error(`⚠️ [Embedded Signup] Error scheduling sync job:`, syncError);
      // NO fallar el onboarding - solo logear el error
    }

    // 8. Retornar success
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