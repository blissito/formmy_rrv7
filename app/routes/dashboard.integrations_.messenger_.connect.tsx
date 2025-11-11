/**
 * Ruta de inicio de OAuth para Facebook Messenger
 *
 * Esta ruta genera la URL de autorización de Facebook y redirige al usuario.
 */

import { redirect } from "react-router";
import type { Route } from "./+types/dashboard.integrations_.messenger_.connect";
import { MessengerOAuthService } from "server/integrations/messenger/MessengerOAuthService";
import { getUserOrRedirect } from "server/getUserUtils.server";

export async function loader({ request }: Route.LoaderArgs) {
  // Verificar que el usuario esté autenticado
  await getUserOrRedirect(request);

  const url = new URL(request.url);
  const chatbotId = url.searchParams.get("chatbotId");

  if (!chatbotId) {
    throw new Response("chatbotId es requerido", { status: 400 });
  }

  try {
    // Generar URL de autorización de Facebook
    const authUrl = MessengerOAuthService.getAuthorizationUrl(chatbotId);

    console.log('🚀 [Messenger OAuth] Redirigiendo a Facebook OAuth...');
    console.log('   chatbotId:', chatbotId);
    console.log('   authUrl:', authUrl);

    // Redirigir al usuario a Facebook
    return redirect(authUrl);
  } catch (error) {
    console.error('❌ [Messenger OAuth] Error al generar URL:', error);
    throw new Response(
      error instanceof Error ? error.message : "Error al iniciar OAuth",
      { status: 500 }
    );
  }
}
