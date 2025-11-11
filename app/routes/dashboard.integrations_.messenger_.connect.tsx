/**
 * Ruta de inicio de OAuth para Facebook Messenger
 *
 * Esta ruta redirige al usuario a Facebook para autorizar la app
 * y permitir que acceda a sus páginas de Facebook.
 */

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

  // Generar URL de autorización OAuth
  const authUrl = MessengerOAuthService.getAuthorizationUrl(chatbotId);

  // Redirigir a Facebook para autorización
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
    },
  });
}
