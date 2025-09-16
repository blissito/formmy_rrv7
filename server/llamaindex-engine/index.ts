/**
 * LlamaIndex Engine v0.0.1 - Main Export
 *
 * Motor base + Sistema de Agentes para Formmy
 */

// Core Engine
export { LlamaIndexEngine } from './core/engine';
export type * from './core/types';

// Agents
export { ChatbotAgent } from './agents/chatbot-agent';

// Compatibility Adapters
export {
  chatWithNewEngine,
  testNewEngine,
  compareEngines,
  createChatbotAgent
} from './agents/compatibility-adapter';

// Tools
export { createChatbotTools, getAvailableToolsByPlan } from './tools/chatbot-tools';

// Version info
export const ENGINE_VERSION = '0.0.1';
export const ENGINE_DESCRIPTION = 'LlamaIndex Engine - Motor base reutilizable para todos los agentes de Formmy';

/**
 * Quick start function para testing
 */
export async function quickTest(user: any, chatbot: any): Promise<boolean> {
  try {
    const { testNewEngine } = await import('./agents/compatibility-adapter');
    const result = await testNewEngine(chatbot, user, "Test del motor v0.0.1");
    return result.success;
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
}