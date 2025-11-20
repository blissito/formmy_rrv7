import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import type { Route } from "./+types/chat.vercel";
import z from "zod";
import { getUserOrRedirect } from "@/server/getUserUtils.server";
import {
  upsert,
  updateContext,
  deleteContext,
  vectorSearch,
} from "@/server/context/vercel_embeddings";
import { getContextTool } from "@/server/tools/vercel/vectorSearch";
import { db } from "~/utils/db.server";

export const action = async ({ request }: Route.ActionArgs) => {
  const {
    messages,
    intent,
    content,
    chatbotId,
    title,
    value, // extract inside if @todo
    contextId,
  }: {
    value?: string;
    title: string;
    chatbotId: string;
    messages: UIMessage[];
    intent: string;
    content: string;
    contextId?: string;
  } = await request.json();
  const user = await getUserOrRedirect(request);

  // ******** Chunking and embeddings ********
  if (intent === "upsert") {
    // Check if context with same title already exists
    const existingContext = await db.context.findFirst({
      where: {
        title,
        chatbotId,
      },
    });

    if (existingContext) {
      // Update existing context
      const result = await updateContext({
        contextId: existingContext.id,
        chatbotId,
        title,
        content,
      });

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      return {
        success: true,
        contextId: result.contextId,
        chunksCreated: result.chunksCreated,
        updated: true,
      };
    } else {
      // Create new context
      const result = await upsert({
        chatbotId,
        title,
        content,
      });

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      return { success: true, contextId: result.contextId, updated: false };
    }
  }

  // ******** Delete context ********
  if (intent === "delete") {
    if (!contextId) {
      return { success: false, error: "contextId es requerido para eliminar" };
    }

    const result = await deleteContext({
      contextId,
      chatbotId,
    });

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  }

  // ******** Semantic search ********
  if (intent === "retrieval") {
    console.log("INPUT::", value);
    const { success } = await vectorSearch({
      chatbotId,
      value: value!,
    });
    console.log("SUCCESS?", success);
    return null;
  }

  // @TODO: find chatbot for public/common use else:
  // Ghosty agent default flow
  // USERID: 000000000000000000000001
  // chatbotId: 691e648afcfecb9dedc6b5de

  const selfUserTool = tool({
    description: `Displays user profile information. 
  ONLY use this tool when the user explicitly asks about
   their profile, plan, or account. After calling this 
  tool, display the results without additional 
  commentary.`,
    inputSchema: z.object({}),
    execute: async () => {
      return user;
    },
  });

  const result = streamText({
    // model: openai("gpt-5-nano"),
    // model: openai("gpt-4o-mini"),
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    // @TODO: revisit
    system: `Eres Ghosty, el agente general de la plataforma, tu _id(id) asignado es: 691e648afcfecb9dedc6b5de, úsalo en caso de que las herramientas requieran uno. Si la información solicitada no está en el contexto responde: Disculpa, no lo sé.
    # Agentic RAG:
      Puedes usar la herramienta getContextTool las veces necesarias con las queries (frases o preguntas semánticas) necesarias para construir la mejor respuesta posible.
      `,
    tools: {
      selfUserTool,
      getContextTool,
    },
    stopWhen: stepCountIs(12),
  });

  return result.toUIMessageStreamResponse();
};

//   return new Response(result.toUIMessageStream, {
//     headers: {
//       'Content-Type': 'text/plain; charset=utf-8',
//       'X-Vercel-AI-Data-Stream': 'v1'
//     }
//   });
