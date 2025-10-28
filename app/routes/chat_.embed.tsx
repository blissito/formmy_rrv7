import { useLoaderData } from "react-router";
import { useState, useEffect } from "react";
import ChatPreview from "~/components/ChatPreview";
import type { Chatbot } from "@prisma/client";
import { db } from "~/utils/db.server";

// Loader para obtener el chatbot basado en el parámetro en la URL
export async function loader({ request }: { request: Request }) {
  try {
    // Extraer el slug del chatbot de la URL si existe
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return {
        error: "Se requiere un slug de chatbot válido",
        status: 400,
      };
    }

    // Consultar la base de datos para obtener el chatbot con integrations
    const chatbot = await db.chatbot.findFirst({
      where: {
        slug,
        // isActive: true, @TODO: descomentar cuando se implemente
      },
      include: {
        integrations: true, // ✅ Incluir integrations (necesario para Voice)
      },
    });

    if (!chatbot) {
      return {
        error: "Chatbot no encontrado o no disponible",
        status: 404,
      };
    }

    console.log(chatbot, 'chatbot');

    // 🔒 SEGURIDAD: CSP frame-ancestors para bloquear embeddings no autorizados
    // Implementado: Oct 16, 2025
    // NOTA: React Router v7 no soporta headers custom en loaders de forma directa
    // La validación real se hace en el backend (api.v0.chatbot.server.ts)
    // CSP se puede implementar a nivel de servidor (Fly.io headers)

    return { chatbot };
  } catch (error) {
    console.error("Error al cargar el chatbot para embebido:", error);
    return {
      error: "Error interno al cargar el chatbot",
      status: 500,
    };
  }
}

// Componente principal para la ruta de embebido
// Estilo global para hacer transparente el fondo
function GlobalStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background-color: transparent !important;
        overflow: hidden !important;
      }
    `}} />
  );
}

export default function ChatEmbedRoute() {
  const data = useLoaderData<{
    chatbot?: Chatbot;
    error?: string;
    status?: number;
  }>();

  // 🔒 SEGURIDAD: Estado para guardar el parent domain (para validación)
  // Implementado: Oct 16, 2025
  const [parentDomain, setParentDomain] = useState<string | null>(null);

  useEffect(() => {
    // Escuchar mensajes del parent window
    const handleMessage = (event: MessageEvent) => {
      // Verificar que el mensaje venga de un origin confiable
      // (formmy-v2.fly.dev, formmy.app, o localhost para dev)
      const trustedOrigins = [
        'https://formmy-v2.fly.dev',
        'https://formmy.app',
        'http://localhost:5173',
        'http://localhost:3000'
      ];

      if (!trustedOrigins.some(origin => event.origin.startsWith(origin))) {
        console.warn('🔒 Mensaje de origen no confiable:', event.origin);
        return;
      }

      // Procesar mensaje de parent domain
      if (event.data.type === 'formmy-parent-domain') {
        const { domain } = event.data;
        console.log('🔒 Parent domain recibido:', domain);
        setParentDomain(domain);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Si hay un error, mostrar un mensaje de error amigable
  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center h-svh w-full bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">
            {data.status === 404 ? "Chatbot no encontrado" : "Error"}
          </h2>
          <p className="text-gray-600 mb-6">{data.error}</p>
          <p className="text-sm text-gray-500">Powered by Formmy.app</p>
        </div>
      </div>
    );
  }

  // Si todo está bien, mostrar el chat directamente (para iframe)
  return (
    <>
      <GlobalStyles />
      <div className="h-screen w-full bg-pink-500">
        <ChatPreview
          production
          chatbot={data.chatbot as Chatbot}
          integrations={data.chatbot?.integrations || []} // ✅ Pasar integrations para Voice
          parentDomain={parentDomain}
        />
      </div>
    </>
  );
}
