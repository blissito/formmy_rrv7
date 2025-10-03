import { db } from "~/utils/db.server";

// Endpoint público para obtener info básica del chatbot (para el widget)
export async function loader({ params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    if (!slug) {
      return Response.json({ error: "Slug requerido" }, { status: 400 });
    }

    const chatbot = await db.chatbot.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryColor: true,
        avatarUrl: true,
        welcomeMessage: true,
      },
    });

    if (!chatbot) {
      return Response.json({ error: "Chatbot no encontrado" }, { status: 404 });
    }

    return Response.json({ chatbot }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      }
    });
  } catch (error) {
    console.error("Error al cargar chatbot público:", error);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
