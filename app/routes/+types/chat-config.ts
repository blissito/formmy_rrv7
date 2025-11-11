import type { Chatbot, User } from "@prisma/client";

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
