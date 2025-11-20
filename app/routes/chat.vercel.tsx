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
import { upsert, vectorSearch } from "@/server/context/vercel_embeddings";

export const action = async ({ request }: Route.ActionArgs) => {
  const {
    messages,
    intent,
    content,
    chatbotId,
    title,
    value, // extract inside if @todo
  }: {
    value?: string;
    title: string;
    chatbotId: string;
    messages: UIMessage[];
    intent: string;
    content: string;
  } = await request.json();
  const user = await getUserOrRedirect(request);

  // ******** Chunking and embeddings ********
  if (intent === "upsert") {
    const { success, error } = await upsert({
      chatbotId,
      title,
      content,
    });
    console.log("SUCCESS?", success);
    console.log("chatbotId?", chatbotId);
    console.log("Hay error");
    if (error) {
      console.log("Devolviendo error");
      return { error: error.message };
    }
    return null;
    // todo
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

  const selfUserTool = tool({
    description:
      "Displays user info, cuando se use está tool no debes agregar texto adicional",
    inputSchema: z.object({}),
    execute: async () => {
      return user;
    },
  });

  const result = streamText({
    // model: openai("gpt-5-nano"),
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    tools: { selfUserTool },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
};

//   return new Response(result.toUIMessageStream, {
//     headers: {
//       'Content-Type': 'text/plain; charset=utf-8',
//       'X-Vercel-AI-Data-Stream': 'v1'
//     }
//   });
