import { vectorSearch } from "@/server/context/vercel_embeddings";
import { tool } from "ai";
import z from "zod";

export const getContextTool = tool({
  description:
    "Retrieve text chunks related to the chatbotId training, via vector embeddings search by similarity",
  inputSchema: z.object({
    chatbotId: z.string().describe("The coresponding chatbotId"),
    value: z.string().describe("The user or agent question"),
  }),
  execute: async ({ chatbotId, value }) => {
    // @todo move the function itself here?
    const res = await vectorSearch({
      chatbotId,
      value,
    });
    // @todo if err
    const text = res.results?.reduce((acc, result) => acc + result.content, ``);
    return text;
    // console.log("TESXT:\n", text);
    // return JSON.stringify({
    //   type: "CONTEXT_RETRIEVED",
    //   chunks_found: res.results?.length || 0,
    //   information: text,
    //   instruction: `You must now answer the user's
    //   question using this information. Generate a response
    //   in Spanish.`,
    // });
  },
});
