import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Chatbot, User } from "@prisma/client";

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs;
  export type ActionArgs = ActionFunctionArgs;
}

export interface ChatbotConfigLoaderData {
  chatbot: Chatbot;
  user: User;
}

export interface ChatbotConfigActionResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
