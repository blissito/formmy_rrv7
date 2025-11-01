/**
 * Tool Testing Utilities - Sistema de testing y validación para handlers
 * Permite probar tools antes de usarlas en producción
 */

import { db } from "~/utils/db.server";
import type { ToolContext } from './index';

// Mock context para testing
const createMockContext = (overrides: Partial<ToolContext> = {}): ToolContext => ({
  userId: '687d43b46e2021a1de9d6ed3', // Usuario real de testing
  userPlan: 'TRIAL',
  chatbotId: null,
  message: 'test query',
  integrations: {},
  ...overrides
});

/**
 * Test individual de un tool handler
 */
export const testToolHandler = async (
  handlerName: string,
  params: any = {},
  context?: ToolContext
) => {

  const testContext = context || createMockContext();

  try {
    let handler;

    // Dynamic import del handler
    switch (handlerName) {
      case 'query_chatbots':
        const { queryChatbotsHandler } = await import('./handlers/chatbot-query');
        handler = queryChatbotsHandler;
        break;
      case 'get_chatbot_stats':
        const { getChatbotStatsHandler } = await import('./handlers/chatbot-stats');
        handler = getChatbotStatsHandler;
        break;
      case 'schedule_reminder':
        const { scheduleReminderHandler } = await import('./handlers/denik');
        handler = scheduleReminderHandler;
        break;
      case 'create_payment_link':
        const { createPaymentLinkHandler } = await import('./handlers/stripe');
        handler = createPaymentLinkHandler;
        break;
      case 'save_contact_info':
        const { saveContactInfoHandler } = await import('./handlers/contact');
        handler = saveContactInfoHandler;
        break;
      default:
        throw new Error(`Handler ${handlerName} not found`);
    }

    const startTime = Date.now();
    const result = await handler(params, testContext);
    const duration = Date.now() - startTime;


    return {
      success: true,
      handlerName,
      params,
      result,
      duration,
      context: testContext
    };

  } catch (error) {

    return {
      success: false,
      handlerName,
      params,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      context: testContext
    };
  }
};

/**
 * Test de schema validation - verifica que los campos existen en la BD
 */
export const validateSchemaFields = async () => {

  try {
    // Test Chatbot model
    const chatbot = await db.chatbot.findFirst({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        isActive: true,
        conversationCount: true
      }
    });

    // Test Integration model
    const integration = await db.integration.findFirst({
      select: {
        platform: true, // Verificar que sea 'platform' y no 'type'
        isActive: true
      }
    });

    // Test Message model
    const message = await db.message.findFirst({
      select: {
        id: true,
        role: true,
        createdAt: true,
        tokens: true // Verificar que sea 'tokens' y no 'tokenCount'
      }
    });

    // Test Conversation model
    const conversation = await db.conversation.findFirst({
      select: {
        id: true,
        chatbotId: true,
        startedAt: true,
        endedAt: true,
        status: true,
        messageCount: true
      }
    });

    return { success: true, message: 'All schema fields validated successfully' };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Test suite completo para todos los handlers
 */
export const runCompleteToolsTest = async () => {

  const results = [];

  // 1. Schema validation first
  const schemaResult = await validateSchemaFields();
  results.push({ type: 'schema', ...schemaResult });

  if (!schemaResult.success) {
    return results;
  }

  // 2. Test chatbot tools
  const chatbotQuery = await testToolHandler('query_chatbots', {
    status: 'all',
    limit: 5,
    includeStats: true
  });
  results.push({ type: 'tool', ...chatbotQuery });

  const chatbotStats = await testToolHandler('get_chatbot_stats', {
    period: 'week',
    compareWithPrevious: true
  });
  results.push({ type: 'tool', ...chatbotStats });

  // 3. Test contact tool
  const contactTest = await testToolHandler('save_contact_info', {
    name: 'Test Contact',
    email: 'test@example.com',
    company: 'Test Company'
  });
  results.push({ type: 'tool', ...contactTest });

  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;


  return results;
};

/**
 * Quick health check - solo verificar que tools se pueden importar
 */
export const quickHealthCheck = async () => {
  const tools = [
    'query_chatbots',
    'get_chatbot_stats',
    'schedule_reminder',
    'create_payment_link',
    'save_contact_info'
  ];


  for (const tool of tools) {
    try {
      await testToolHandler(tool, {}, createMockContext());
    } catch (error) {
    }
  }
};