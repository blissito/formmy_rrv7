/**
 * @formmy.app/chat/react - useFormmyChat Hook
 *
 * Headless hook for chat functionality, wrapping Vercel AI SDK's useChat.
 *
 * Usage:
 * ```tsx
 * import { useFormmyChat } from '@formmy.app/chat/react';
 *
 * function Chat() {
 *   const { messages, sendMessage, status } = useFormmyChat({
 *     agentId: 'agent_123',
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map(m => <div key={m.id}>{getMessageText(m)}</div>)}
 *       <button onClick={() => sendMessage('Hello!')}>Send</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useCallback, useState, useEffect } from "react";
import { useFormmy } from "../ui/provider";
import type { UseFormmyChatOptions } from "../core/types";

// Session ID storage key prefix
const SESSION_KEY_PREFIX = "formmy_session_";

/**
 * Extract text content from a message's parts
 */
export function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

/**
 * Headless chat hook - provides all chat functionality without UI
 */
export function useFormmyChat(options: UseFormmyChatOptions) {
  const { agentId, onError, onFinish } = options;
  const { publishableKey, baseUrl } = useFormmy();

  // Generate or retrieve session ID (crypto-secure)
  const [sessionId] = useState(() => {
    // SSR safety
    if (typeof window === "undefined") {
      return `sdk_${agentId}_${Date.now()}`;
    }

    try {
      const storageKey = `${SESSION_KEY_PREFIX}${agentId}`;
      const existing = localStorage.getItem(storageKey);

      if (existing) {
        return existing;
      }

      // Use crypto.getRandomValues for secure random ID
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const randomPart = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      const newSessionId = `sdk_${agentId}_${randomPart}`;

      localStorage.setItem(storageKey, newSessionId);
      return newSessionId;
    } catch {
      // Fallback if localStorage is disabled
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const randomPart = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `sdk_${agentId}_${randomPart}`;
    }
  });

  // Create transport with SDK authentication
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `${baseUrl}/api/v2/sdk?intent=chat&agentId=${agentId}`,
      headers: {
        "X-Publishable-Key": publishableKey || "",
      },
      // "Last Message Only" pattern - only send the new message
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id: id || sessionId,
          },
        };
      },
    });
  }, [baseUrl, agentId, publishableKey, sessionId]);

  // Use Vercel AI SDK's useChat with our transport
  const chat = useChat({
    id: sessionId,
    transport,
    onError: (error) => {
      console.error("[useFormmyChat] Error:", error);
      onError?.(error);
    },
    onFinish: () => {
      onFinish?.();
    },
  });

  // Load historical messages on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(
          `${baseUrl}/api/v2/sdk?intent=chat.history&agentId=${agentId}&sessionId=${sessionId}`,
          {
            headers: {
              "X-Publishable-Key": publishableKey || "",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.messages?.length > 0) {
            chat.setMessages(data.messages);
          }
        }
      } catch (error) {
        console.warn("[useFormmyChat] Failed to load history:", error);
      }
    }

    loadHistory();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simplified sendMessage wrapper
  const sendMessage = useCallback(
    async (text: string) => {
      await chat.sendMessage({
        role: "user",
        parts: [{ type: "text", text }],
      });
    },
    [chat]
  );

  // Reset conversation (clear local storage and messages)
  const reset = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${SESSION_KEY_PREFIX}${agentId}`);
    }
    chat.setMessages([]);
  }, [agentId, chat]);

  return {
    // State
    messages: chat.messages,
    status: chat.status,
    error: chat.error,

    // Metadata
    sessionId,
    agentId,

    // Actions
    sendMessage,
    reset,
    stop: chat.stop,
    setMessages: chat.setMessages,

    // Utility
    getMessageText,

    // Raw chat object for advanced use cases
    _chat: chat,
  };
}
