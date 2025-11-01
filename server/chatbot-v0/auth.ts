/**
 * Autenticación simple para Chatbot V0
 * Soporta acceso público sin autenticación (patrón Flowise)
 */

export async function authenticateRequest(request: Request, formData: FormData) {
  try {
    // 🛠️ Development Token Authentication (highest priority)
    const devToken = request.headers.get('x-dev-token') || request.headers.get('x-dev-authorization');

    if (devToken && process.env.DEVELOPMENT_TOKEN && devToken === process.env.DEVELOPMENT_TOKEN) {
      return {
        user: {
          id: 'dev-user-mock-pro',
          plan: 'PRO'
        },
        isTestUser: true,
        isAnonymous: false
      };
    }

    // 🔑 API Key authentication
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (apiKey) {
      const user = await authenticateWithApiKey(apiKey);
      if (user) {
        return {
          user: {
            id: user.id,
            plan: user.plan || 'FREE'
          },
          isTestUser: false,
          isAnonymous: false
        };
      }
    }

    // 🍪 Cookie authentication
    try {
      const { getUserOrRedirect } = await import("../getUserUtils.server");
      const user = await getUserOrRedirect(request);

      return {
        user: {
          id: user.id,
          plan: user.plan || 'FREE'
        },
        isTestUser: false,
        isAnonymous: false
      };
    } catch (authError) {
      // Si falla la autenticación por cookie, permitir acceso anónimo

      // Generar visitorId único o usar el existente del cliente
      const visitorId = formData.get('visitorId') as string ||
                        `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      return {
        user: {
          id: visitorId,
          plan: 'ANONYMOUS' // Plan especial para usuarios anónimos
        },
        isTestUser: false,
        isAnonymous: true
      };
    }
  } catch (error) {
    console.error('❌ Auth error:', error);

    // Fallback a usuario anónimo en caso de error crítico
    const visitorId = `anon-error-${Date.now()}`;
    return {
      user: {
        id: visitorId,
        plan: 'ANONYMOUS'
      },
      isTestUser: false,
      isAnonymous: true
    };
  }
}

/**
 * Authenticate user with API Key
 */
async function authenticateWithApiKey(apiKey: string) {
  try {
    const { db } = await import("../../app/utils/db.server");

    // Buscar API key en la base de datos
    const apiKeyRecord = await db.apiKey.findFirst({
      where: {
        key: apiKey,
        isActive: true
      },
      include: {
        user: true
      }
    });

    if (!apiKeyRecord || !apiKeyRecord.user) {
      return null;
    }


    return apiKeyRecord.user;
  } catch (error) {
    console.error('❌ API Key authentication error:', error);
    return null;
  }
}

export function createAuthError() {
  return new Response(
    JSON.stringify({ error: "No authenticated" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}

export function createUnsupportedIntentError() {
  return new Response(
    JSON.stringify({ error: "Unsupported intent" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}