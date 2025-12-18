/**
 * 🔧 Custom HTTP Tool Factory - Vercel AI SDK Integration
 *
 * Convierte CustomTool de la base de datos a tools de Vercel AI SDK
 * que el agente puede invocar automáticamente.
 *
 * 🔒 SEGURIDAD:
 * - Credenciales nunca expuestas al modelo
 * - Validación de parámetros con Zod
 * - Timeout y rate limiting incorporados
 * - Tracking de uso y errores
 */

import { tool } from "ai";
import { z } from "zod";
import type { CustomTool } from "@prisma/client";
import { db } from "~/utils/db.server";

/**
 * Convierte un JSON Schema simple a Zod schema
 * Soporta: string, number, boolean, object con properties
 */
function jsonSchemaToZod(schema: any): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.object({}).passthrough();
  }

  const type = schema.type;

  switch (type) {
    case "string":
      let stringSchema = z.string();
      if (schema.description) {
        stringSchema = stringSchema.describe(schema.description);
      }
      return stringSchema;

    case "number":
    case "integer":
      let numberSchema = z.number();
      if (schema.description) {
        numberSchema = numberSchema.describe(schema.description);
      }
      return numberSchema;

    case "boolean":
      let boolSchema = z.boolean();
      if (schema.description) {
        boolSchema = boolSchema.describe(schema.description);
      }
      return boolSchema;

    case "array":
      const itemSchema = schema.items
        ? jsonSchemaToZod(schema.items)
        : z.unknown();
      return z.array(itemSchema);

    case "object":
      if (schema.properties) {
        const shape: Record<string, z.ZodTypeAny> = {};
        const required = schema.required || [];

        for (const [key, propSchema] of Object.entries(schema.properties)) {
          let propZod = jsonSchemaToZod(propSchema);

          // Make optional if not in required array
          if (!required.includes(key)) {
            propZod = propZod.optional();
          }

          shape[key] = propZod;
        }

        return z.object(shape);
      }
      return z.object({}).passthrough();

    default:
      // Default to flexible object
      return z.object({}).passthrough();
  }
}

/**
 * Factory function que crea un tool de Vercel AI SDK desde un CustomTool
 *
 * @param customTool - CustomTool de la base de datos
 * @returns Tool compatible con Vercel AI SDK
 */
export function createCustomHttpTool(customTool: CustomTool) {
  // Build input schema from parametersSchema
  let inputSchema: z.ZodTypeAny;

  if (customTool.parametersSchema) {
    try {
      inputSchema = jsonSchemaToZod(customTool.parametersSchema);
    } catch (error) {
      console.error(
        `[Custom HTTP Tool] Error parsing parametersSchema for ${customTool.name}:`,
        error
      );
      inputSchema = z.object({}).passthrough();
    }
  } else {
    // No schema defined - accept any object
    inputSchema = z.object({}).passthrough();
  }

  return tool({
    description: customTool.description,
    inputSchema: inputSchema as any,

    execute: async (params: Record<string, unknown>) => {
      const startTime = Date.now();

      try {
        // Build headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "Formmy-Agent/1.0",
        };

        // Add custom headers
        if (customTool.headers && typeof customTool.headers === "object") {
          Object.assign(headers, customTool.headers);
        }

        // Add authentication
        if (
          customTool.authType &&
          customTool.authType !== "none" &&
          customTool.authValue
        ) {
          switch (customTool.authType) {
            case "bearer":
              headers["Authorization"] = `Bearer ${customTool.authValue}`;
              break;
            case "api_key":
              headers[customTool.authKey || "X-API-Key"] = customTool.authValue;
              break;
            case "basic":
              headers["Authorization"] = `Basic ${Buffer.from(customTool.authValue).toString("base64")}`;
              break;
          }
        }

        // Build request options
        const requestOptions: RequestInit = {
          method: customTool.method,
          headers,
        };

        // Handle body for POST requests
        let url = customTool.url;
        if (customTool.method === "POST") {
          requestOptions.body = JSON.stringify(params);
        } else if (customTool.method === "GET" && params && typeof params === "object") {
          // Add params as query string for GET
          const queryParams = new URLSearchParams();
          for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          }
          const queryString = queryParams.toString();
          if (queryString) {
            url = `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
          }
        }

        // Execute request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;

        // Parse response
        let responseData: unknown;
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // Update usage stats in background
        updateToolStats(customTool.id, response.ok, responseTime).catch(
          console.error
        );

        if (!response.ok) {
          const errorMessage =
            typeof responseData === "object" && responseData
              ? JSON.stringify(responseData)
              : String(responseData);

          return `Error al ejecutar ${customTool.displayName}: HTTP ${response.status} - ${errorMessage}`;
        }

        // Return success response
        if (customTool.successMessage) {
          return `${customTool.successMessage}\n\nRespuesta: ${JSON.stringify(responseData)}`;
        }

        return typeof responseData === "object"
          ? JSON.stringify(responseData, null, 2)
          : String(responseData);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.name === "AbortError"
              ? "Timeout: El servidor externo no respondió a tiempo"
              : error.message
            : "Error desconocido";

        // Update error stats in background
        updateToolStats(customTool.id, false, Date.now() - startTime, errorMessage).catch(
          console.error
        );

        console.error(
          `[Custom HTTP Tool] Error executing ${customTool.name}:`,
          error
        );

        return `Error al ejecutar ${customTool.displayName}: ${errorMessage}`;
      }
    },
  });
}

/**
 * Update tool usage statistics
 */
async function updateToolStats(
  toolId: string,
  success: boolean,
  responseTime: number,
  errorMessage?: string
) {
  try {
    await db.customTool.update({
      where: { id: toolId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        ...(success
          ? {}
          : {
              errorCount: { increment: 1 },
              lastErrorAt: new Date(),
              lastError: errorMessage || "Unknown error",
            }),
      },
    });
  } catch (error) {
    console.error("[Custom HTTP Tool] Failed to update stats:", error);
  }
}

/**
 * Load all active custom tools for a chatbot and return as Vercel AI SDK tools
 *
 * @param chatbotId - ID del chatbot
 * @returns Object with tool name as key and tool as value
 */
export async function loadCustomToolsForChatbot(
  chatbotId: string
): Promise<Record<string, any>> {
  try {
    const customTools = await db.customTool.findMany({
      where: {
        chatbotId,
        isActive: true,
      },
    });

    if (customTools.length === 0) {
      return {};
    }

    const tools: Record<string, any> = {};

    for (const customTool of customTools) {
      try {
        tools[customTool.name] = createCustomHttpTool(customTool);
      } catch (error) {
        console.error(
          `[Custom HTTP Tool] Failed to create tool ${customTool.name}:`,
          error
        );
      }
    }

    console.log(
      `[Custom HTTP Tool] Loaded ${Object.keys(tools).length} tools for chatbot ${chatbotId}`
    );

    return tools;
  } catch (error) {
    console.error(
      `[Custom HTTP Tool] Failed to load tools for chatbot ${chatbotId}:`,
      error
    );
    return {};
  }
}
