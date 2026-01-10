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
         * Send a message and get a response (non-streaming)
         * For streaming, use the useFormmyChat hook on the frontend
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