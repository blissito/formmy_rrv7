# Formmy SDK - Guía de Integración para Agentes AI

## Uso con LlamaIndex (TypeScript)

### Setup Básico

```typescript
import { tool } from "llamaindex";
import { z } from "zod";
import { FormmyParser } from "formmy-sdk";

// Inicializar cliente (una sola vez)
const formmyClient = new FormmyParser({
  apiKey: process.env.FORMMY_API_KEY!,
  baseUrl: "https://formmy.app",
  debug: true, // Para debugging
});
```

---

### Tool 1: Búsqueda en Base de Conocimientos

```typescript
const searchKnowledgeBase = tool({
  name: "search_knowledge_base",
  description: `Search the Formmy knowledge base for information about products, services,
                policies, or any other company information stored in the system.
                Returns relevant passages with confidence scores.`,
  parameters: z.object({
    query: z.string().describe("The search query or question to find information about"),
    chatbotId: z.string().describe("The chatbot ID to search in (provided by system)"),
    mode: z.enum(["fast", "accurate"]).default("accurate").describe(
      "Search mode: 'fast' for quick results, 'accurate' for detailed answers with citations"
    ),
  }),
  handler: async ({ query, chatbotId, mode }) => {
    try {
      const result = await formmyClient.query(query, chatbotId, { mode });

      // Formato optimizado para LLM context
      return {
        answer: result.answer || "No direct answer found",
        sources: result.sources?.slice(0, 3).map((source, idx) => ({
          index: idx + 1,
          content: source.content.substring(0, 500), // Truncar para tokens
          relevance: Math.round(source.score * 100) + "%",
          file: source.metadata.fileName || "Unknown",
          page: source.metadata.page,
        })),
        creditsUsed: result.creditsUsed,
        totalSourcesFound: result.sources?.length || 0,
      };
    } catch (error: any) {
      return {
        error: true,
        message: error.message,
        type: error.name,
      };
    }
  },
});
```

**Ejemplo de respuesta**:
```json
{
  "answer": "El horario de atención es de Lunes a Viernes de 9:00 a 18:00 horas.",
  "sources": [
    {
      "index": 1,
      "content": "Horario de Atención: Lunes a Viernes de 9:00 a 18:00...",
      "relevance": "92%",
      "file": "politicas.pdf",
      "page": 5
    }
  ],
  "creditsUsed": 2,
  "totalSourcesFound": 8
}
```

---

### Tool 2: Parsear Documentos

```typescript
const parseDocument = tool({
  name: "parse_document",
  description: `Parse and extract structured content from documents (PDF, DOCX, XLSX, etc.).
                Useful for analyzing uploaded files, extracting tables, or converting
                documents to markdown for further processing.`,
  parameters: z.object({
    filePath: z.string().describe("Absolute path to the document file"),
    mode: z.enum(["COST_EFFECTIVE", "AGENTIC", "AGENTIC_PLUS"]).default("AGENTIC").describe(
      "Parsing quality: COST_EFFECTIVE (fast, 1 credit/page), " +
      "AGENTIC (balanced, 3 credits/page), AGENTIC_PLUS (best quality, 6 credits/page)"
    ),
  }),
  handler: async ({ filePath, mode }) => {
    try {
      // Iniciar parsing
      const job = await formmyClient.parse(filePath, mode);

      // Esperar resultado con progress tracking
      const result = await formmyClient.waitFor(job.id, {
        pollInterval: 2000,
        timeout: 300000, // 5 minutos
        onProgress: (currentJob) => {
          console.log(`[Formmy] Parsing status: ${currentJob.status}`);
        },
      });

      if (result.status === "COMPLETED") {
        return {
          success: true,
          markdown: result.markdown,
          pages: result.pages,
          processingTime: result.processingTime,
          creditsUsed: result.creditsUsed,
          summary: `Parsed ${result.pages} pages in ${result.processingTime?.toFixed(1)}s`,
        };
      } else {
        return {
          success: false,
          error: result.error || "Parsing failed",
          status: result.status,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        type: error.name,
      };
    }
  },
});
```

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "markdown": "# Documento Principal\n\n## Sección 1...",
  "pages": 15,
  "processingTime": 12.4,
  "creditsUsed": 45,
  "summary": "Parsed 15 pages in 12.4s"
}
```

---

### Tool 3: Listar Contextos Disponibles

```typescript
const listKnowledgeContexts = tool({
  name: "list_knowledge_contexts",
  description: `List all documents and content available in the chatbot's knowledge base.
                Shows file names, sizes, types, and when they were added.`,
  parameters: z.object({
    chatbotId: z.string().describe("The chatbot ID to list contexts from"),
  }),
  handler: async ({ chatbotId }) => {
    try {
      const result = await formmyClient.listContexts(chatbotId);

      return {
        totalContexts: result.totalContexts,
        totalSizeKB: result.totalSizeKB,
        totalEmbeddings: result.totalEmbeddings,
        contexts: result.contexts.map(ctx => ({
          id: ctx.id,
          type: ctx.type,
          name: ctx.fileName || "Unnamed",
          sizeKB: ctx.sizeKB,
          addedAt: new Date(ctx.createdAt).toLocaleDateString(),
          parsingMode: ctx.parsingMode,
          pages: ctx.parsingPages,
        })),
      };
    } catch (error: any) {
      return {
        error: true,
        message: error.message,
      };
    }
  },
});
```

---

### Tool 4: Agregar Contenido a Base de Conocimientos

```typescript
const addKnowledgeContent = tool({
  name: "add_knowledge_content",
  description: `Add new text content directly to the chatbot's knowledge base.
                Useful for storing policies, FAQs, or any text information
                that should be searchable later.`,
  parameters: z.object({
    chatbotId: z.string().describe("The chatbot ID to add content to"),
    content: z.string().describe("The text content to add"),
    title: z.string().optional().describe("Optional title for the content"),
  }),
  handler: async ({ chatbotId, content, title }) => {
    try {
      const result = await formmyClient.uploadContext(chatbotId, content, {
        title: title || "User-provided content",
        type: "TEXT",
      });

      return {
        success: true,
        contextId: result.contextId,
        embeddingsCreated: result.embeddingsCreated,
        creditsUsed: result.creditsUsed,
        message: `Added ${result.embeddingsCreated} chunks to knowledge base`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
```

---

## Configurar Agente con Tools

```typescript
import { agent } from "@llamaindex/workflow";
import { OpenAI } from "llamaindex";

// Configurar LLM
const llm = new OpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
});

// Crear agente con todas las tools
const formmyAgent = agent({
  llm,
  tools: [
    searchKnowledgeBase,
    parseDocument,
    listKnowledgeContexts,
    addKnowledgeContent,
  ],
  systemPrompt: `You are a helpful AI assistant with access to the Formmy knowledge base.

When users ask questions:
1. ALWAYS search the knowledge base first using search_knowledge_base
2. Cite your sources with [1], [2], etc.
3. If you can't find information, say so clearly

When users upload documents:
1. Use parse_document to extract content
2. Summarize key points
3. Optionally add important info to knowledge base with add_knowledge_content

Available tools:
- search_knowledge_base: Find information in the knowledge base
- parse_document: Parse PDFs, DOCX, etc.
- list_knowledge_contexts: Show what's in the knowledge base
- add_knowledge_content: Add new text to knowledge base`,
});

// Usar agente
const chatbotId = "chatbot_abc123"; // Del contexto del usuario

const stream = formmyAgent.runStream(
  `¿Cuál es la política de devoluciones?`,
  { chatbotId } // Metadata disponible para tools
);

for await (const event of stream) {
  if (event.type === "tool_call") {
    console.log(`[Tool] ${event.toolName}`, event.arguments);
  } else if (event.type === "message") {
    console.log(`[AI] ${event.content}`);
  }
}
```

---

## Uso con LangChain (JavaScript/TypeScript)

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { z } from "zod";
import { FormmyParser } from "formmy-sdk";

const formmyClient = new FormmyParser(process.env.FORMMY_API_KEY!);

// Tool de búsqueda
const searchTool = new DynamicStructuredTool({
  name: "formmy_search",
  description: "Search Formmy knowledge base for information",
  schema: z.object({
    query: z.string().describe("Search query"),
    chatbotId: z.string().describe("Chatbot ID"),
  }),
  func: async ({ query, chatbotId }) => {
    const result = await formmyClient.query(query, chatbotId, { mode: "accurate" });
    return JSON.stringify({
      answer: result.answer,
      sources: result.sources?.slice(0, 3),
    });
  },
});

// Tool de parsing
const parseTool = new DynamicStructuredTool({
  name: "formmy_parse",
  description: "Parse documents to extract content",
  schema: z.object({
    filePath: z.string(),
    mode: z.enum(["COST_EFFECTIVE", "AGENTIC", "AGENTIC_PLUS"]).default("AGENTIC"),
  }),
  func: async ({ filePath, mode }) => {
    const job = await formmyClient.parse(filePath, mode);
    const result = await formmyClient.waitFor(job.id);
    return JSON.stringify({
      markdown: result.markdown?.substring(0, 5000), // Truncar
      pages: result.pages,
    });
  },
});

// Crear agente
const model = new ChatOpenAI({ modelName: "gpt-4o-mini" });
const tools = [searchTool, parseTool];
const agent = await createOpenAIFunctionsAgent({ llm: model, tools });
const executor = new AgentExecutor({ agent, tools });

// Ejecutar
const result = await executor.invoke({
  input: "¿Cuál es el horario de atención?",
  chatbotId: "chatbot_123",
});
```

---

## Error Handling Best Practices

```typescript
import {
  FormmyParser,
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  TimeoutError,
  ParsingFailedError,
} from "formmy-sdk";

async function safeSearch(query: string, chatbotId: string) {
  try {
    return await formmyClient.query(query, chatbotId);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      // API key inválida o expirada
      console.error("⚠️ Invalid Formmy API key");
      return { error: "Authentication failed. Check API key." };
    } else if (error instanceof InsufficientCreditsError) {
      // Sin créditos
      console.error(`⚠️ Need ${error.creditsRequired} credits, have ${error.creditsAvailable}`);
      return {
        error: `Insufficient credits. Required: ${error.creditsRequired}, Available: ${error.creditsAvailable}`
      };
    } else if (error instanceof RateLimitError) {
      // Rate limit excedido
      console.error(`⚠️ Rate limit exceeded. Retry after ${error.retryAfter}s`);
      return {
        error: `Rate limit exceeded. Please wait ${error.retryAfter || 60} seconds.`
      };
    } else if (error instanceof TimeoutError) {
      // Timeout
      console.error(`⚠️ Request timed out after ${error.timeoutMs}ms`);
      return { error: "Request timed out. Please try again." };
    } else {
      // Error genérico
      console.error("⚠️ Formmy error:", error);
      return { error: "An error occurred while searching knowledge base." };
    }
  }
}
```

---

## Performance Tips

### 1. Reusar Cliente

```typescript
// ❌ NO hacer esto (crea nueva conexión cada vez)
async function search(query: string) {
  const client = new FormmyParser("sk_live_xxx");
  return client.query(query, "chatbot_123");
}

// ✅ Hacer esto (reusar cliente)
const client = new FormmyParser("sk_live_xxx");

async function search(query: string) {
  return client.query(query, "chatbot_123");
}
```

### 2. Usar Modo "fast" para Respuestas Rápidas

```typescript
// Para búsquedas donde no necesitas respuesta generada
const result = await client.query(query, chatbotId, {
  mode: "fast" // Solo devuelve sources, no genera answer
});
```

### 3. Paralelizar Cuando Sea Posible

```typescript
// Iniciar múltiples búsquedas en paralelo
const [policies, pricing, support] = await Promise.all([
  client.query("políticas", chatbotId),
  client.query("precios", chatbotId),
  client.query("soporte", chatbotId),
]);
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { FormmyParser } from "formmy-sdk";

describe("Formmy SDK", () => {
  let client: FormmyParser;

  beforeAll(() => {
    client = new FormmyParser({
      apiKey: process.env.FORMMY_TEST_API_KEY!,
      baseUrl: "https://formmy.app",
    });
  });

  it("should search knowledge base", async () => {
    const result = await client.query(
      "test query",
      process.env.TEST_CHATBOT_ID!,
      { mode: "fast" }
    );

    expect(result.query).toBe("test query");
    expect(result.creditsUsed).toBeGreaterThan(0);
  });

  it("should handle invalid credentials", async () => {
    const badClient = new FormmyParser("sk_live_invalid");

    await expect(
      badClient.query("test", "chatbot_123")
    ).rejects.toThrow("Invalid API key");
  });
});
```

---

## Environment Variables

```bash
# .env
FORMMY_API_KEY=sk_live_xxxxxxxxxxxxxxxx
FORMMY_BASE_URL=https://formmy.app

# Para testing
FORMMY_TEST_API_KEY=sk_test_xxxxxxxxxxxxxxxx
TEST_CHATBOT_ID=chatbot_test_123
```

---

## Recursos

- **Documentación completa**: https://formmy.app/docs
- **API Reference**: https://formmy.app/dashboard/api-keys
- **npm Package**: https://www.npmjs.com/package/formmy-sdk
- **Soporte**: support@formmy.app
