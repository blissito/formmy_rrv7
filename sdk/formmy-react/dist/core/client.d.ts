/**
 * @formmy.app/react - Backend Client
 *
 * Usage:
 * ```typescript
 * import { Formmy } from '@formmy.app/react/client';
 *
 * const formmy = new Formmy({ secretKey: 'sk_live_xxx' });
 *
 * // Create agent
 * const agent = await formmy.agents.create({ name: 'Mi Asistente' });
 *
 * // List agents
 * const { agents } = await formmy.agents.list();
 * ```
 */
import type { FormmyConfig, CreateAgentInput, UpdateAgentInput, AgentsListResponse, AgentResponse } from "./types";
export declare class FormmyError extends Error {
    code: string;
    status: number;
    constructor(message: string, code: string, status: number);
}
export declare class Formmy {
    private secretKey;
    private baseUrl;
    constructor(config: FormmyConfig);
    get agents(): {
        /**
         * List all agents for the authenticated user
         */
        list: () => Promise<AgentsListResponse>;
        /**
         * Get a specific agent by ID
         */
        get: (agentId: string) => Promise<AgentResponse>;
        /**
         * Create a new agent
         */
        create: (data: CreateAgentInput) => Promise<AgentResponse>;
        /**
         * Update an existing agent
         */
        update: (agentId: string, data: UpdateAgentInput) => Promise<AgentResponse>;
        /**
         * Delete an agent (soft delete)
         */
        delete: (agentId: string) => Promise<{
            success: boolean;
        }>;
    };
    get chat(): {
        /**
         * Stream a chat response - returns Response for proxying
         * Use this when you need to forward the stream to your frontend
         *
         * @example
         * ```typescript
         * // Elysia/Express/Hono backend
         * app.post("/chat", async ({ body }) => {
         *   const response = await formmy.chat.stream({
         *     agentId: body.agentId,
         *     message: body.message,
         *   });
         *   return response; // Proxy the stream directly
         * });
         * ```
         */
        stream: (options: {
            agentId: string;
            message: string;
            conversationId?: string;
        }) => Promise<Response>;
        /**
         * Send a message and get complete response (non-streaming)
         * Use this for server-to-server communication where you don't need streaming
         */
        send: (options: {
            agentId: string;
            message: string;
            conversationId?: string;
        }) => Promise<{
            content: string;
            conversationId: string;
        }>;
    };
    private request;
}
//# sourceMappingURL=client.d.ts.map