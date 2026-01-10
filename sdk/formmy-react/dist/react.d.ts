/**
 * @formmy.app/chat/react - React components and hooks
 *
 * @example
 * ```tsx
 * import { FormmyProvider, ChatBubble, useFormmyChat } from '@formmy.app/chat/react';
 *
 * function App() {
 *   return (
 *     <FormmyProvider publishableKey="pk_live_xxx">
 *       <YourApp />
 *       <ChatBubble agentId="agent_123" />
 *     </FormmyProvider>
 *   );
 * }
 * ```
 */
export type { FormmyConfig, FormmyProviderProps, UseFormmyChatOptions, Message, MessagePart, ChatBubbleProps, ChatTheme, } from "./core/types";
export { FormmyProvider, useFormmy, useFormmyOptional } from "./ui/provider";
export { useFormmyChat, getMessageText } from "./hooks/use-formmy-chat";
export { ChatBubble } from "./ui/chat-bubble";
//# sourceMappingURL=react.d.ts.map