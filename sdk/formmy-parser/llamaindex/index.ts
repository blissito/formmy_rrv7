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
export function createFormmyTool(config: FormmyToolConfig) {
  // Lazy import to avoid bundling llamaindex if not used
  let tool: any;
  let z: any;

  return {
    get definition() {
      // Import on first access
      if (!tool || !z) {
        try {
          const llamaindex = require('llamaindex');
          tool = llamaindex.tool;
          z = require('zod').z;
        } catch (error) {
          throw new Error(
            'LlamaIndex integration requires "llamaindex" and "zod" packages. ' +
            'Install them with: npm install llamaindex zod'
          );
        }
      }

      return tool({
        name: config.name || 'formmy_search',
        description: config.description ||
          'Search the Formmy knowledge base for information. ' +
          'Returns AI-generated answers with source citations from uploaded documents.',
        parameters: z.object({
          query: z.string().describe(
            'The search query or question to find information about'
          ),
        }),
        handler: async ({ query }: { query: string }) => {
          try {
            const result = await config.client.query(
              query,
              config.chatbotId,
              {
                mode: config.mode || 'accurate',
              }
            );

            const maxSources = config.maxSources || 3;
            const maxContentLength = config.maxContentLength || 400;

            // Format response optimized for LLM consumption
            return {
              success: true,
              answer: result.answer || 'No direct answer found',
              sources: result.sources?.slice(0, maxSources).map((source, idx) => ({
                index: idx + 1,
                content: source.content.substring(0, maxContentLength),
                relevance: Math.round(source.score * 100) + '%',
                fileName: source.metadata.fileName || 'Unknown',
                page: source.metadata.page,
              })),
              creditsUsed: result.creditsUsed,
              totalSources: result.sources?.length || 0,
            };
          } catch (error: any) {
            return {
              success: false,
              error: error.message,
              errorType: error.name || 'Error',
            };
          }
        },
      });
    }
  };
}

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
export function createMultipleFormmyTools(
  client: Formmy,
  configs: Array<Omit<FormmyToolConfig, 'client'>>
) {
  return configs.map(config => createFormmyTool({ ...config, client }));
}
