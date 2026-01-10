/**
 * @formmy.app/chat - Official SDK for Formmy Chat
 *
 * This is the core client for backend usage (no React dependency).
 *
 * @example Backend Usage
 * ```typescript
 * import { Formmy } from '@formmy.app/chat';
 *
 * const formmy = new Formmy({ secretKey: 'sk_live_xxx' });
 *
 * // Create agent
 * const agent = await formmy.agents.create({ name: 'My Agent' });
 *
 * // List agents
 * const { agents } = await formmy.agents.list();
 * ```
 *
 * For React components and hooks, use:
 * ```tsx
 * import { FormmyProvider, ChatBubble, useFormmyChat } from '@formmy.app/chat/react';
 * ```
 */
export * from "./core/client";
export * from "./core/types";
//# sourceMappingURL=index.d.ts.map