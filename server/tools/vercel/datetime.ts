import { tool } from "ai";
import z from "zod";
import { getCurrentDateTimeHandler } from "@/server/tools/handlers/datetime";

/**
 * Vercel AI SDK Tool: Get current date and time
 * Reutiliza el handler de LlamaIndex existente
 * @TODO: Move the llamaindex tool to here
 */
export const createGetDateTimeTool = () =>
  tool({
    description:
      "Get current date and time in Mexico timezone (America/Mexico_City, GMT-6)",
    inputSchema: z.object({}),
    execute: async () => {
      const result = await getCurrentDateTimeHandler({}, {} as any);
      return result.message || JSON.stringify(result.data);
    },
  });
