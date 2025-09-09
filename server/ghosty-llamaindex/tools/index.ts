/**
 * Ghosty Tools Registry - LlamaIndex FunctionTool exports with context awareness
 */

import type { BaseTool } from "llamaindex";
import { FunctionTool } from "llamaindex";
import type { GhostyContext } from "../types";

// Import core functions for context-aware wrappers
import { queryChatbotsCore } from "./chatbot-query";
// TODO: Import other core functions when refactored

// Import existing payment tool if needed
let generatePaymentLinkTool: BaseTool<any> | null = null;

try {
  // Dynamically import payment tool if available
  // This will be implemented later or can reuse existing logic
} catch (error) {
  console.log("Payment tool not available");
}

/**
 * Get all available tools for Ghosty with context awareness
 * Creates LlamaIndex-compatible tools that have access to the context
 */
export function getGhostyTools(context: GhostyContext): BaseTool<any>[] {
  console.log('🔧 Creating context-aware tools for user:', {
    userId: context.userId,
    userPlan: context.user?.plan,
    sessionId: context.sessionId
  });

  // Create context-aware wrappers using FunctionTool.from
  const contextAwareQueryChatbots = FunctionTool.from(
    async (params: any) => {
      console.log('🛠️ Executing query_chatbots with captured context');
      // Call core function with context directly
      return await queryChatbotsCore(params, context);
    },
    {
      name: 'query_chatbots', 
      description: 'Query user\'s chatbots with filters and optional stats',
      parameters: {
        type: 'object',
        properties: {
          filters: {
            type: 'object',
            description: 'Optional filters to apply',
            properties: {
              name: { type: 'string', description: 'Filter by chatbot name' },
              active: { type: 'boolean', description: 'Filter by active status' }
            }
          },
          includeStats: {
            type: 'boolean',
            description: 'Include statistics in response',
            default: false
          }
        }
      }
    }
  );

  // Temporarily simplified - just test the main chatbot query tool
  // TODO: Refactor other tools when chatbot query works

  const tools: BaseTool<any>[] = [
    contextAwareQueryChatbots,
    // TODO: Add other tools after testing
  ];

  // Add payment tool if available and user has appropriate plan  
  if (generatePaymentLinkTool && hasPaidPlan(context.user.plan)) {
    tools.push(generatePaymentLinkTool);
  }

  console.log(`✅ Created ${tools.length} context-aware tools for Ghosty (simplified for testing)`);
  return tools;
}

/**
 * Get tools by category
 */
export function getToolsByCategory(context: GhostyContext) {
  return {
    chatbot: [queryChatbotsTool, getChatbotTool],
    stats: [getChatbotStatsTool],
    web: [webSearchTool, webFetchTool],
    payments: generatePaymentLinkTool ? [generatePaymentLinkTool] : [],
  };
}

/**
 * Check if user has paid plan (PRO or ENTERPRISE)
 */
function hasPaidPlan(plan: string): boolean {
  return ['PRO', 'ENTERPRISE'].includes(plan);
}

/**
 * Get tool descriptions for system prompt
 */
export function getToolDescriptions(context: GhostyContext): string {
  const tools = getGhostyTools(context);
  
  return tools.map(tool => {
    const metadata = tool.metadata;
    return `- **${metadata.name}**: ${metadata.description}`;
  }).join('\n');
}

// Export individual tools for direct use
export {
  queryChatbotsTool,
  getChatbotTool,
  getChatbotStatsTool,
  webSearchTool,
  webFetchTool,
};

// Export types
export type { GhostyContext };