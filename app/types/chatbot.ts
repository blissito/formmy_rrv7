import type { ApiKey, Chatbot } from "@prisma/client";

export interface ChatbotWithApiKeys extends Omit<Chatbot, 'apiKeys'> {
  apiKeys: ApiKey[];
}
