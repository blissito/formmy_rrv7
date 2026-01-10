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
import type { UseFormmyChatOptions } from "../core/types";
/**
 * Extract text content from a message's parts
 */
export declare function getMessageText(message: {
    parts?: Array<{
        type: string;
        text?: string;
    }>;
}): string;
/**
 * Headless chat hook - provides all chat functionality without UI
 */
export declare function useFormmyChat(options: UseFormmyChatOptions): {
    messages: import("ai").UIMessage<unknown, import("ai").UIDataTypes, import("ai").UITools>[];
    status: import("ai").ChatStatus;
    error: Error | undefined;
    sessionId: string;
    agentId: string;
    sendMessage: (text: string) => Promise<void>;
    reset: () => void;
    stop: () => Promise<void>;
    setMessages: (messages: import("ai").UIMessage<unknown, import("ai").UIDataTypes, import("ai").UITools>[] | ((messages: import("ai").UIMessage<unknown, import("ai").UIDataTypes, import("ai").UITools>[]) => import("ai").UIMessage<unknown, import("ai").UIDataTypes, import("ai").UITools>[])) => void;
    getMessageText: typeof getMessageText;
    _chat: import("@ai-sdk/react").UseChatHelpers<import("ai").UIMessage<unknown, import("ai").UIDataTypes, import("ai").UITools>>;
};
//# sourceMappingURL=use-formmy-chat.d.ts.map