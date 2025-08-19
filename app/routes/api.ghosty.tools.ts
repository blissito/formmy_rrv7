import type { Route } from "./+types/api.ghosty.tools";
import { getGhostyToolsService } from "~/tools/ghostyToolsService.server";
import type { ToolRequest } from "~/tools/ghostyToolsService.server";

export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    const body: ToolRequest = await request.json();
    const { intent, data } = body;

    const toolsService = getGhostyToolsService();
    const result = await toolsService.executeIntent(intent, data);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Ghosty tools error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const statusCode = errorMessage.includes("required") || errorMessage.includes("Unknown intent") ? 400 : 500;

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { 
        status: statusCode, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
};

export const loader = async () => {
  return new Response(
    JSON.stringify({ 
      error: "This endpoint only supports POST requests",
      availableIntents: ['search', 'analyze-url', 'get-metrics', 'get-seo-insights', 'generate-payment-link']
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};