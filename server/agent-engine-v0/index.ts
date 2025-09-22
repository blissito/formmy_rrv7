/**
 * AgentEngine_v0 - Ultra-Simplified LlamaIndex 2025 Implementation
 *
 * NO classes, NO inheritance, NO dual-mode, NO complexity
 * Just pure functional agents with native streaming + tools
 */

import { agent, agentStreamEvent } from "@llamaindex/workflow";
import { openai } from "@llamaindex/openai";
import { anthropic } from "@llamaindex/anthropic";
import { FunctionTool, Settings, tool } from "llamaindex";
import type { ChatMessage } from "@llamaindex/core/llms";

/**
 * Create agent with tools - that's it.
 */
export async function createAgent(chatbot: any, user: any) {
  // 1. Setup LLM based on model
  const llm = createLLM(chatbot.aiModel, chatbot.temperature);

  // 2. Load tools if user has access
  const tools = await loadUserTools(chatbot, user);

  // 3. Build minimal system prompt
  const systemPrompt = buildSystemPrompt(chatbot, tools);

  // 4. Return configured agent with multi-step configuration
  return agent({
    name: "formmy-agent",
    llm,
    tools,
    systemPrompt,
    verbose: false, // Clean output
    // Multi-step configuration (conservative start)
    maxIterations: 5, // Conservador para evitar costos excesivos
    timeout: 60000, // 60 segundos timeout total
    continueOnFailure: true // Continuar si una tool falla
  });
}

/**
 * Stream responses with automatic tool handling
 */
export async function* streamChat(
  message: string,
  chatbot: any,
  user: any,
  options: any = {}
): AsyncGenerator<string> {
  try {
    // Create agent
    const myAgent = await createAgent(chatbot, user);

    // Build chat history
    const chatHistory = buildChatHistory(options.conversationHistory);

    // Run streaming - agent handles tools automatically
    const events = myAgent.runStream(message, { chatHistory });

    // Stream response tokens
    for await (const event of events) {
      if (agentStreamEvent.include(event)) {
        yield event.data.delta;
      }
    }
  } catch (error) {
    console.error("❌ AgentEngine_v0 error:", error);
    yield `Error: ${error.message}`;
  }
}

// ✅ REMOVED: Non-streaming chat - Streaming Always approach

/**
 * Create LLM instance
 */
function createLLM(model: string, temperature?: number) {
  const config: any = { model };

  // Handle temperature based on model
  if (model === "gpt-5-nano") {
    // GPT-5 nano only supports temperature = 1
    config.temperature = 1;
  } else if (temperature !== undefined) {
    config.temperature = temperature;
  }

  // Token limits
  if (model.startsWith("gpt-5")) {
    config.maxCompletionTokens = 1000;
  } else {
    config.maxTokens = 1000;
  }

  // Return appropriate provider
  if (model.includes("claude")) {
    config.apiKey = process.env.ANTHROPIC_API_KEY;
    return anthropic(config);
  } else {
    config.apiKey = process.env.OPENAI_API_KEY;
    return openai(config);
  }
}

/**
 * Load user tools from registry
 */
async function loadUserTools(chatbot: any, user: any): Promise<FunctionTool[]> {
  const tools: FunctionTool[] = [];

  // Check if user plan has tool access
  if (!["TRIAL", "PRO", "ENTERPRISE"].includes(user.plan)) {
    return tools;
  }

  try {
    const { getToolsForPlan } = await import("../tools");
    // Create mock context for this legacy system
    const mockContext = {
      userId: user.id,
      userPlan: user.plan,
      chatbotId: chatbot.id,
      message: '',
      integrations: chatbot.integrations || {}
    };
    const availableTools = getToolsForPlan(
      user.plan || 'FREE',
      chatbot.integrations || {},
      mockContext
    );

    // Convert to LlamaIndex FunctionTools
    for (const toolDef of availableTools) {
      const llamaTool = FunctionTool.from(
        async (args: any) => {
          const context = {
            chatbotId: chatbot.id,
            userId: user.id,
            userPlan: user.plan,
            integrations: chatbot.integrations || {}
          };

          // TODO: Migrar a LlamaIndex tools nativas
          const result = `Tool ${toolDef.name} executed (migration pending)`;
          // const result = await executeToolCall(toolDef.name, args, context);
          return typeof result === "string" ? result : JSON.stringify(result);
        },
        {
          name: toolDef.name,
          description: toolDef.description,
          parameters: toolDef.input_schema
        }
      );

      tools.push(llamaTool);
    }
  } catch (error) {
    console.error("⚠️ Error loading tools:", error);
  }

  return tools;
}

/**
 * Build minimal system prompt
 */
function buildSystemPrompt(chatbot: any, tools: FunctionTool[]): string {
  let prompt = "";

  // Add chatbot personality if exists
  if (chatbot.personality) {
    prompt += chatbot.personality + "\n\n";
  }

  // Add instructions if exists
  if (chatbot.instructions) {
    prompt += chatbot.instructions + "\n\n";
  }

  // Add multi-step tool instructions if tools available
  if (tools.length > 0) {
    const toolList = tools.map(t => `- ${t.metadata.name}`).join("\n");
    prompt += `Tienes acceso a estas herramientas:\n${toolList}\n\nPuedes usar múltiples herramientas en secuencia para completar tareas complejas. Si necesitas hacer varios pasos, hazlo automáticamente.`;
  }

  return prompt.trim() || "Eres un asistente útil.";
}

/**
 * Build chat history for LlamaIndex
 */
function buildChatHistory(history?: any[]): ChatMessage[] {
  if (!history || history.length === 0) return [];

  return history.slice(-10).map(msg => ({
    role: msg.role as "user" | "assistant",
    content: msg.content
  }));
}

/**
 * Extract tools used from result
 */
function extractToolsUsed(result: any): string[] {
  const tools: string[] = [];

  // Check workflow memory for tool calls
  if (result?.data?.state?.memory?.messages) {
    for (const msg of result.data.state.memory.messages) {
      if (msg.options?.toolCall) {
        for (const call of msg.options.toolCall) {
          if (call.name) tools.push(call.name);
        }
      }
    }
  }

  return [...new Set(tools)];
}

/**
 * Main export - STREAMING ALWAYS (LlamaIndex 2025 pattern)
 */
export async function chatWithAgentEngineV0(
  message: string,
  chatbot: any,
  user: any,
  options: any
) {
  // ✅ STREAMING ALWAYS - No dual-mode complexity
  return streamChat(message, chatbot, user, options);
}

// Exportar también la clase simple para compatibilidad
export { AgentEngine_v0 } from './simple-engine';

export default {
  createAgent,
  streamChat,
  chatWithAgentEngineV0
};