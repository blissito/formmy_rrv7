/**
 * Callback de OAuth para Facebook Messenger
 *
 * Facebook redirige aquí después de que el usuario autoriza la app.
 * Recibimos un código que intercambiamos por tokens de acceso.
 */

import type { Route } from "./+types/api.v1.integrations.messenger.callback";
import { MessengerOAuthService } from "server/integrations/messenger/MessengerOAuthService";
import { getUserOrRedirect } from "server/getUserUtils.server";

export async function loader({ request }: Route.LoaderArgs) {
  // Verificar que el usuario esté autenticado
  await getUserOrRedirect(request);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // chatbotId
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Si el usuario canceló la autorización
  if (error) {
    console.error("Error de OAuth Messenger:", error, errorDescription);
    const errorScript = `
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'MESSENGER_AUTH_ERROR',
            error: '${errorDescription || "Error al conectar con Facebook Messenger"}'
          }, window.location.origin);
          window.close();
        } else {
          window.location.href = '/dashboard/chat?error=${encodeURIComponent(
            errorDescription || "Error al conectar con Facebook Messenger"
          )}';
        }
      </script>
    `;
    return new Response(errorScript, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  if (!code || !state) {
    throw new Response("Parámetros faltantes", { status: 400 });
  }

  const chatbotId = state;

  try {
    // Completar el flujo OAuth
    const result = await MessengerOAuthService.completeOAuthFlow(code, chatbotId);

    if (!result.success) {
      const errorScript = `
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'MESSENGER_AUTH_ERROR',
              error: '${result.error || "Error al conectar con Messenger"}'
            }, window.location.origin);
            window.close();
          } else {
            window.location.href = '/dashboard/chat?error=${encodeURIComponent(
              result.error || "Error al conectar con Messenger"
            )}';
          }
        </script>
      `;
      return new Response(errorScript, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Si hay múltiples páginas, mostrar selector
    if (result.pages && result.pages.length > 1) {
      // Redirigir a una página de selección de página
      const pagesParam = encodeURIComponent(JSON.stringify(result.pages));
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/dashboard/integrations/messenger/select-page?chatbotId=${chatbotId}&pages=${pagesParam}&code=${code}`,
        },
      });
    }

    // Si solo hay una página, guardarla automáticamente
    if (result.pages && result.pages.length === 1) {
      await MessengerOAuthService.completeOAuthFlow(
        code,
        chatbotId,
        result.pages[0].id
      );
    }

    // Enviar mensaje al parent window (si está en popup) y redirigir
    const successScript = `
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'MESSENGER_AUTH_SUCCESS' }, window.location.origin);
          window.close();
        } else {
          window.location.href = '/dashboard/chat?messenger=connected';
        }
      </script>
    `;

    return new Response(successScript, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error("Error en callback de Messenger:", error);
    const errorScript = `
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'MESSENGER_AUTH_ERROR',
            error: 'Error al procesar autorización de Messenger'
          }, window.location.origin);
          window.close();
        } else {
          window.location.href = '/dashboard/chat?error=${encodeURIComponent(
            "Error al procesar autorización de Messenger"
          )}';
        }
      </script>
    `;
    return new Response(errorScript, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
