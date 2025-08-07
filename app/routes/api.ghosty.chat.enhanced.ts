import type { Route } from "./+types/api.ghosty.chat.enhanced";
import { callGhostyWithTools } from "~/services/ghostyEnhanced.server";

/**
 * Endpoint mejorado que aprovecha capacidades nativas del modelo
 */
export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await callGhostyWithTools(message, true);
    
    return new Response(
      JSON.stringify({
        type: "message",
        content: result.content,
        metadata: {
          toolsUsed: result.toolsUsed,
          enhanced: true,
          model: "gpt-oss-120b"
        }
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Enhanced Ghosty error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
};