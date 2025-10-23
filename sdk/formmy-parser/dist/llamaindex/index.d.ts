/**
 * LlamaIndex Integration for Formmy SDK
 *
 * Create native LlamaIndex tools for querying Formmy knowledge base
 *
 * @example
 * ```typescript
 * import { Formmy } from 'formmy-sdk';
 * import { createFormmyTool } from 'formmy-sdk/llamaindex';
 * import { agent } from '@llamaindex/workflow';
 *
 * const formmy = new Formmy({ apiKey: 'sk_live_xxx' });
 *
 * const tool = createFormmyTool({
 *   client: formmy,
 *   chatbotId: 'chatbot_123',
 * });
 *
 * const myAgent = agent({ tools: [tool] });
 * ```
 */
import type { Formmy } from '../client.js';
/**
 * Configuration for Formmy LlamaIndex tool
 */
export interface FormmyToolConfig {
    /**
     * Formmy client instance
     */
    client: Formmy;
    /**
     * Chatbot ID to query
     */
    chatbotId: string;
    /**
     * Custom tool name (default: "formmy_search")
     */
    name?: string;
    /**
     * Custom tool description
     */
    description?: string;
    /**
     * Query mode: "fast" (raw results) or "accurate" (AI-generated answer)
     * @default "accurate"
     */
    mode?: 'fast' | 'accurate';
    /**
     * Maximum number of sources to return
     * @default 3
     */
    maxSources?: number;
    /**
     * Maximum content length per source (characters)
     * @default 400
     */
    maxContentLength?: number;
}
/**
 * Create a LlamaIndex tool for querying Formmy knowledge base
 *
 * @param config - Tool configuration
 * @returns LlamaIndex tool ready to use in agents
 *
 * @example
 * ```typescript
 * const tool = createFormmyTool({
 *   client: formmy,
 *   chatbotId: 'chatbot_123',
 *   name: 'search_company_docs',
 *   description: 'Search company documentation and policies',
 *   mode: 'accurate',
 *   maxSources: 5,
 * });
 * ```
 */
export declare function createFormmyTool(config: FormmyToolConfig): {
    readonly definition: any;
};
/**
 * Utility: Create multiple Formmy tools for different chatbots
 *
 * @param client - Formmy client instance
 * @param configs - Array of tool configurations
 * @returns Array of LlamaIndex tools
 *
 * @example
 * ```typescript
 * const tools = createMultipleFormmyTools(formmy, [
 *   { chatbotId: 'docs', name: 'search_docs' },
 *   { chatbotId: 'policies', name: 'search_policies' },
 * ]);
 * ```
 */
export declare function createMultipleFormmyTools(client: Formmy, configs: Array<Omit<FormmyToolConfig, 'client'>>): {
    readonly definition: any;
}[];
//# sourceMappingURL=index.d.ts.map