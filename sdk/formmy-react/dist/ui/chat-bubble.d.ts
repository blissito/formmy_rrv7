/**
 * @formmy.app/react - ChatBubble Component
 *
 * Ready-to-use floating chat widget.
 *
 * Usage:
 * ```tsx
 * import { FormmyProvider, ChatBubble } from '@formmy.app/react';
 *
 * function App() {
 *   return (
 *     <FormmyProvider publishableKey="pk_live_xxx">
 *       <YourApp />
 *       <ChatBubble
 *         agentId="agent_123"
 *         position="bottom-right"
 *         theme={{ primaryColor: '#9A99EA' }}
 *       />
 *     </FormmyProvider>
 *   );
 * }
 * ```
 */
import type { ChatBubbleProps } from "../core/types";
export declare function ChatBubble({ agentId, position, theme, defaultOpen, onOpenChange, }: ChatBubbleProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=chat-bubble.d.ts.map