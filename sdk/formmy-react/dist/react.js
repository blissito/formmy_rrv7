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
// ═══════════════════════════════════════════════════════════════════════════
// Provider & Context
// ═══════════════════════════════════════════════════════════════════════════
export { FormmyProvider, useFormmy, useFormmyOptional } from "./ui/provider";
// ═══════════════════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════════════════
export { useFormmyChat, getMessageText } from "./hooks/use-formmy-chat";
// ═══════════════════════════════════════════════════════════════════════════
// UI Components
// ═══════════════════════════════════════════════════════════════════════════
export { ChatBubble } from "./ui/chat-bubble";
//# sourceMappingURL=react.js.map