/**
 * Página de selección de página de Facebook
 *
 * Si el usuario tiene múltiples páginas de Facebook, mostramos esta página
 * para que seleccione cuál quiere conectar al chatbot.
 */

import { useState } from "react";
import type { Route } from "./+types/dashboard.integrations_.messenger_.select-page";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { MessengerOAuthService } from "server/integrations/messenger/MessengerOAuthService";
import { Button } from "~/components/Button";
import { data } from "react-router";

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  await getUserOrRedirect(request);

  const url = new URL(request.url);
  const chatbotId = url.searchParams.get("chatbotId");
  const pagesParam = url.searchParams.get("pages");
  const code = url.searchParams.get("code");

  if (!chatbotId || !pagesParam || !code) {
    throw new Response("Parámetros faltantes", { status: 400 });
  }

  const pages: FacebookPage[] = JSON.parse(decodeURIComponent(pagesParam));

  return { chatbotId, pages, code };
}

export async function action({ request }: Route.ActionArgs) {
  await getUserOrRedirect(request);

  const formData = await request.formData();
  const chatbotId = formData.get("chatbotId") as string;
  const pageId = formData.get("pageId") as string;
  const code = formData.get("code") as string;

  if (!chatbotId || !pageId || !code) {
    return data({ error: "Parámetros faltantes" });
  }

  try {
    const result = await MessengerOAuthService.completeOAuthFlow(
      code,
      chatbotId,
      pageId
    );

    if (!result.success) {
      return data({ error: result.error });
    }

    return data({ success: true });
  } catch (error) {
    return data({
      error:
        error instanceof Error ? error.message : "Error al conectar página",
    });
  }
}

export default function MessengerSelectPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { chatbotId, pages, code } = loaderData;
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedPageId) return;

    setIsConnecting(true);

    const formData = new FormData();
    formData.append("chatbotId", chatbotId);
    formData.append("pageId", selectedPageId);
    formData.append("code", code);

    const response = await fetch(window.location.href, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      window.location.href = `/dashboard/chat?messenger=connected`;
    } else {
      alert(data.error || "Error al conectar página");
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="flex items-center gap-4 mb-6">
          <img
            src="/assets/chat/messenger.svg"
            alt="Messenger"
            className="w-12 h-12"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selecciona tu página de Facebook
            </h1>
            <p className="text-gray-600">
              Elige qué página quieres conectar a tu chatbot
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {pages.map((page) => (
            <label
              key={page.id}
              className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPageId === page.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="page"
                value={page.id}
                checked={selectedPageId === page.id}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-semibold text-gray-900">{page.name}</div>
                <div className="text-sm text-gray-500">ID: {page.id}</div>
              </div>
            </label>
          ))}
        </div>

        {actionData?.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {actionData.error}
          </div>
        )}

        <div className="flex gap-4">
          <Button
            onClick={() => (window.location.href = "/dashboard/chat")}
            variant="secondary"
            disabled={isConnecting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!selectedPageId || isConnecting}
            className="flex-1"
          >
            {isConnecting ? "Conectando..." : "Conectar página"}
          </Button>
        </div>
      </div>
    </div>
  );
}
