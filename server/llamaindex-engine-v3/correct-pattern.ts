/**
 * LlamaIndex 2025 CORRECT PATTERN
 *
 * ✅ Single AgentWorkflow que maneja STREAMING + TOOLS automáticamente
 * ✅ No manual switching
 * ✅ Tool-first architecture
 * ✅ Native LlamaIndex patterns
 */

import { agent, FunctionTool } from "@llamaindex/workflow";
import { openai } from "@llamaindex/openai";

export class CorrectLlamaIndexEngine {
  private workflow: any;

  constructor(model: string, tools: FunctionTool[]) {
    // ✅ CORRECTO: Single AgentWorkflow maneja todo
    this.workflow = agent({
      name: 'formmy-agent',
      llm: openai({ model }),
      tools,
      systemPrompt: this.buildSystemPrompt(tools),
      // ✅ AgentWorkflow decide streaming vs tools automáticamente
      streaming: true // Native streaming con tool switching automático
    });
  }

  // ✅ CORRECTO: Single entry point
  async chat(message: string, context: any): Promise<AsyncGenerator<string> | any> {
    // ✅ AgentWorkflow maneja automáticamente:
    // - Tool detection por LLM (no keywords)
    // - Streaming cuando no hay tools
    // - Tool execution cuando necesario
    // - Streaming response después de tools

    const result = await this.workflow.run({
      message,
      context,
      // ✅ LlamaIndex decide streaming vs tools internamente
    });

    return result; // ✅ Puede ser stream o response con tools
  }

  private buildSystemPrompt(tools: FunctionTool[]): string {
    // ✅ System prompt incluye tools automáticamente
    const toolDescriptions = tools.map(t =>
      `- ${t.metadata.name}: ${t.metadata.description}`
    ).join('\n');

    return `
Eres un asistente útil con acceso a herramientas.

Herramientas disponibles:
${toolDescriptions}

Usa las herramientas cuando sea apropiado según el contexto del usuario.
    `.trim();
  }
}

/**
 * ✅ FACTORY PATTERN CORRECTO
 */
export async function createCorrectEngine(
  chatbot: any,
  user: any
): Promise<CorrectLlamaIndexEngine> {

  // ✅ Load tools first
  const tools = await loadUserTools(user);

  // ✅ Single engine instance
  return new CorrectLlamaIndexEngine(
    chatbot.aiModel || 'gpt-5-nano',
    tools
  );
}

async function loadUserTools(user: any): Promise<FunctionTool[]> {
  // ✅ Tool loading logic aquí
  const { getAvailableTools } = await import('../tools/registry');
  return getAvailableTools(user.plan, {}, true);
}