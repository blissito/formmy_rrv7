/**
 * Módulo de autenticación para LlamaIndex V2
 * Maneja API keys y usuarios de testing
 */

export interface AuthResult {
  user: {
    id: string;
    email: string;
    plan: string;
    name: string;
  } | null;
  isTestUser: boolean;
}

export async function authenticateRequest(request: Request, formData: FormData): Promise<AuthResult> {
  const { getUserOrNull } = await import("../getUserUtils.server");

  const apiKey = request.headers.get("X-API-Key") || formData.get("apiKey") as string;
  const testApiKey = "formmy-test-2024";

  let user = await getUserOrNull(request);
  let isTestUser = false;

  // Si no hay usuario autenticado, verificar API key
  if (!user && apiKey === testApiKey) {
    console.log('🔑 Using test API key for LlamaIndex V2');
    user = {
      id: 'api-test-user',
      email: 'api-test@formmy.app',
      plan: 'PRO',
      name: 'API Test User'
    };
    isTestUser = true;
  }

  return { user, isTestUser };
}

export function createAuthError() {
  return new Response(
    JSON.stringify({
      error: "Usuario no autenticado",
      hint: "Usa header 'X-API-Key: formmy-test-2024' para testing"
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}