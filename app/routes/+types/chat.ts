import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { ChatbotStatus, Chatbot, Plans } from "@prisma/client";

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs;
  export type ActionArgs = ActionFunctionArgs;
}

export interface ChatbotListItem extends Chatbot {
  conversationCount: number;
  monthlyUsage: number;
}

export interface ChatListLoaderData {
  chatbots: ChatbotListItem[];
  plan: Plans;
  limits: {
    maxChatbots: number;
    currentCount: number;
    canCreateMore: boolean;
    availableModels: string[];
    showBranding: boolean;
  };
  canCreateMore: boolean;
}

export interface ChatActionResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  redirectTo?: string;
  upgradeRequired?: boolean;
}

export interface PlanLimits {
  maxChatbots: number;
  maxContextSizeKB: number;
  maxConversationsPerMonth: number;
  availableModels: string[];
  showBranding: boolean;
}

export interface UserWithPlan {
  id: string;
  email: string;
  plan: Plans;
}
