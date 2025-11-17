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

export const action = async ({ request }: Route.ActionArgs) => {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const user = await getUserOrRedirect(request);

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
