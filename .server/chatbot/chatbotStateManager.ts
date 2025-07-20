import { ChatbotStatus } from "@prisma/client";
import type { Chatbot } from "@prisma/client";
import { db } from "~/utils/db.server";

/**
 * Interface for state transition errors
 */
export interface StateTransitionError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Validates if a state transition is allowed
 * @param currentState Current state of the chatbot
 * @param newState New state to transition to
 * @returns Object with validation result and error if any
 */
export function validateStateTransition(
  currentState: ChatbotStatus,
  newState: ChatbotStatus
): { isValid: boolean; error?: StateTransitionError } {
  // Allow transition to the same state
  if (currentState === newState) {
    return { isValid: true };
  }

  // Define allowed transitions
  const allowedTransitions: Record<ChatbotStatus, ChatbotStatus[]> = {
    [ChatbotStatus.DRAFT]: [
      ChatbotStatus.ACTIVE,
      ChatbotStatus.INACTIVE,
      ChatbotStatus.DELETED,
    ],
    [ChatbotStatus.ACTIVE]: [
      ChatbotStatus.INACTIVE,
      ChatbotStatus.DRAFT,
      ChatbotStatus.DELETED,
    ],
    [ChatbotStatus.INACTIVE]: [
      ChatbotStatus.ACTIVE,
      ChatbotStatus.DRAFT,
      ChatbotStatus.DELETED,
    ],
    [ChatbotStatus.DELETED]: [], // Cannot transition from DELETED state
  };

  // Check if transition is allowed
  if (!allowedTransitions[currentState].includes(newState)) {
    return {
      isValid: false,
      error: {
        code: "INVALID_STATE_TRANSITION",
        message: `Cannot transition from ${currentState} to ${newState}`,
        details: {
          currentState,
          newState,
          allowedTransitions: allowedTransitions[currentState],
        },
      },
    };
  }

  return { isValid: true };
}

/**
 * Changes the state of a chatbot with validation
 * @param id Chatbot ID
 * @param newState New state to set
 * @returns Updated chatbot or throws error if transition is invalid
 */
export async function changeChatbotState(
  id: string,
  newState: ChatbotStatus
): Promise<Chatbot> {
  // Get current chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${id} not found`);
  }

  // Validate state transition
  const validation = validateStateTransition(chatbot.status, newState);
  if (!validation.isValid) {
    throw new Error(validation.error?.message || "Invalid state transition");
  }

  // Determine if chatbot should be active based on new state
  const isActive = newState === ChatbotStatus.ACTIVE;

  // Update chatbot state
  return db.chatbot.update({
    where: { id },
    data: {
      status: newState,
      isActive,
    },
  });
}

/**
 * Activates a chatbot (sets status to ACTIVE and isActive to true)
 * @param id Chatbot ID
 * @returns Updated chatbot
 */
export async function activateChatbot(id: string): Promise<Chatbot> {
  return changeChatbotState(id, ChatbotStatus.ACTIVE);
}

/**
 * Deactivates a chatbot (sets status to INACTIVE and isActive to false)
 * @param id Chatbot ID
 * @returns Updated chatbot
 */
export async function deactivateChatbot(id: string): Promise<Chatbot> {
  return changeChatbotState(id, ChatbotStatus.INACTIVE);
}

/**
 * Sets a chatbot to draft mode (sets status to DRAFT and isActive to false)
 * @param id Chatbot ID
 * @returns Updated chatbot
 */
export async function setToDraftMode(id: string): Promise<Chatbot> {
  return changeChatbotState(id, ChatbotStatus.DRAFT);
}

/**
 * Marks a chatbot as deleted (sets status to DELETED and isActive to false)
 * This is a soft delete that preserves the data
 * @param id Chatbot ID
 * @returns Updated chatbot
 */
export async function markChatbotAsDeleted(id: string): Promise<Chatbot> {
  return changeChatbotState(id, ChatbotStatus.DELETED);
}

/**
 * Gets the current state of a chatbot
 * @param id Chatbot ID
 * @returns Current state and active status
 */
export async function getChatbotState(
  id: string
): Promise<{ status: ChatbotStatus; isActive: boolean }> {
  const chatbot = await db.chatbot.findUnique({
    where: { id },
    select: { status: true, isActive: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${id} not found`);
  }

  return {
    status: chatbot.status,
    isActive: chatbot.isActive,
  };
}

/**
 * Checks if a chatbot is in a specific state
 * @param id Chatbot ID
 * @param state State to check
 * @returns Boolean indicating if chatbot is in the specified state
 */
export async function isChatbotInState(
  id: string,
  state: ChatbotStatus
): Promise<boolean> {
  const chatbotState = await getChatbotState(id);
  return chatbotState.status === state;
}

/**
 * Checks if a chatbot is active (status is ACTIVE and isActive is true)
 * @param id Chatbot ID
 * @returns Boolean indicating if chatbot is active
 */
export async function isChatbotActive(id: string): Promise<boolean> {
  const chatbotState = await getChatbotState(id);
  return chatbotState.status === ChatbotStatus.ACTIVE && chatbotState.isActive;
}
