/**
 * Autenticación simple para Chatbot V0
 */

export async function authenticateRequest(request: Request, formData: FormData) {
  try {
    // 🛠️ Development Token Authentication (highest priority)
    const devToken = request.headers.get('x-dev-token') || request.headers.get('x-dev-authorization');

    if (devToken && process.env.DEVELOPMENT_TOKEN && devToken === process.env.DEVELOPMENT_TOKEN) {
      console.log('🛠️ Development token authenticated - using mock PRO user');
      return {
        user: {
          id: 'dev-user-mock-pro',
          plan: 'PRO'
        },
        isTestUser: true
      };
    }

    // 🔑 API Key authentication
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (apiKey) {
      console.log('🔑 Authenticating with API Key');
      const user = await authenticateWithApiKey(apiKey);
      if (user) {
        return {
          user: {
            id: user.id,
            plan: user.plan || 'FREE'
          },
          isTestUser: false
        };
      }
    }

    // 🍪 Fallback to cookie authentication
    const { getUserOrRedirect } = await import("../getUserUtils.server");
    const user = await getUserOrRedirect(request);

    return {
      user: {
        id: user.id,
        plan: user.plan || 'FREE'
      },
      isTestUser: false
    };
  } catch (error) {
    console.error('❌ Auth error:', error);
    return { user: null, isTestUser: false };
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
      console.log('❌ Invalid API key');
      return null;
    }

    console.log('✅ API Key authentication successful:', {
      userId: apiKeyRecord.user.id,
      plan: apiKeyRecord.user.plan
    });

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