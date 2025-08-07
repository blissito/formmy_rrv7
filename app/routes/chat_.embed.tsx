import { useLoaderData } from "react-router";
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

    // Consultar la base de datos para obtener el chatbot
    const chatbot = await db.chatbot.findFirst({
      where: {
        slug,
        // isActive: true, @TODO: descomentar cuando se implemente
      },
    });

    if (!chatbot) {
      return {
        error: "Chatbot no encontrado o no disponible",
        status: 404,
      };
    }

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

  // Si todo está bien, mostrar el chatbot con fondo transparente
  return (
    <>
      <GlobalStyles />
      <ChatPreview production chatbot={data.chatbot as Chatbot} />
    </>
  );
}
