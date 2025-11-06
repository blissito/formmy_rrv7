/**
 * FORMMY SDK - EJEMPLO DE USO CORRECTO
 *
 * Este ejemplo muestra cómo usar el SDK ACTUAL de Formmy correctamente
 * con LlamaIndex para crear herramientas de agente.
 */

import { tool } from "llamaindex";
import { z } from "zod";
import { FormmyParser } from "formmy-sdk"; // ✅ Import correcto

// ============================================================
// SETUP: Inicializar cliente (UNA SOLA VEZ)
// ============================================================

const formmyClient = new FormmyParser({
  apiKey: process.env.FORMMY_API_KEY!,
  baseUrl: process.env.FORMMY_BASE_URL || "https://formmy.app",
  debug: true, // Para ver logs
  timeout: 60000, // 60s timeout
  retries: 3, // Reintentos automáticos
});

// ============================================================
// TOOL 1: Búsqueda en Knowledge Base (RAG)
// ============================================================

/**
 * Busca información en la base de conocimientos de Formmy
 * usando búsqueda semántica (RAG).
 */
const searchKnowledgeBase = tool({
  name: "search_formmy_knowledge",
  description: `Search the Formmy knowledge base for information.
                Returns relevant passages from documents with AI-generated answers.
                Use this when you need to find information from uploaded documents.`,
  parameters: z.object({
    query: z.string().describe("The search query or question"),
    chatbotId: z.string().describe("The chatbot ID to search in"),
    mode: z.enum(["fast", "accurate"]).default("accurate").describe(
      "Search mode: 'fast' returns raw results, 'accurate' generates an AI answer"
    ),
  }),
  handler: async ({ query, chatbotId, mode }) => {
    try {
      const result = await formmyClient.query(query, chatbotId, { mode });

      // Formato optimizado para LLM
      return {
        success: true,
        answer: result.answer || "No answer generated",
        sources: result.sources?.slice(0, 5).map((source, idx) => ({
          index: idx + 1,
          content: source.content.substring(0, 400), // Truncar para tokens
          relevance: Math.round(source.score * 100) + "%",
          fileName: source.metadata.fileName || "Unknown",
          page: source.metadata.page,
        })),
        creditsUsed: result.creditsUsed,
        processingTime: result.processingTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        errorType: error.name,
      };
    }
  },
});

// ============================================================
// TOOL 2: Parsear Documento
// ============================================================

/**
 * Parsea un documento (PDF, DOCX, XLSX, etc.) y extrae
 * contenido estructurado en formato markdown.
 */
const parseDocument = tool({
  name: "parse_document",
  description: `Parse a document (PDF, DOCX, XLSX, TXT) and extract structured content.
                Returns markdown text with tables, headings, and formatted content.
                Useful for analyzing uploaded files or extracting data.`,
  parameters: z.object({
    filePath: z.string().describe("Absolute path to the document file"),
    mode: z
      .enum(["COST_EFFECTIVE", "AGENTIC", "AGENTIC_PLUS"])
      .default("AGENTIC")
      .describe(
        "Parsing quality: COST_EFFECTIVE (1 credit/page), AGENTIC (3 credits/page), AGENTIC_PLUS (6 credits/page)"
      ),
  }),
  handler: async ({ filePath, mode }) => {
    try {
      // 1. Iniciar parsing job
      const job = await formmyClient.parse(filePath, mode);

      console.log(`[Formmy] Job ${job.id} created. Credits: ${job.creditsUsed}`);

      // 2. Esperar resultado con progress tracking
      const result = await formmyClient.waitFor(job.id, {
        pollInterval: 2000, // Check cada 2s
        timeout: 300000, // Timeout 5 min
        onProgress: (currentJob) => {
          console.log(`[Formmy] Status: ${currentJob.status}`);
        },
      });

      if (result.status === "COMPLETED") {
        return {
          success: true,
          markdown: result.markdown,
          pages: result.pages,
          processingTime: result.processingTime,
          creditsUsed: result.creditsUsed,
          fileName: result.fileName,
          // Summary corto para el LLM
          summary: `Parsed ${result.pages} pages from ${result.fileName} in ${result.processingTime?.toFixed(1)}s`,
        };
      } else {
        return {
          success: false,
          status: result.status,
          error: result.error || "Parsing failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        errorType: error.name,
      };
    }
  },
});

// ============================================================
// TOOL 3: Obtener Status de Job
// ============================================================

/**
 * Obtiene el status actual de un parsing job.
 * Útil para checkear jobs largos sin blocking.
 */
const getParsingStatus = tool({
  name: "get_parsing_status",
  description: `Get the current status of a document parsing job.
                Use this to check on long-running parsing jobs.`,
  parameters: z.object({
    jobId: z.string().describe("The job ID returned from parse_document"),
  }),
  handler: async ({ jobId }) => {
    try {
      const job = await formmyClient.getStatus(jobId);

      return {
        success: true,
        jobId: job.id,
        status: job.status, // PENDING, PROCESSING, COMPLETED, FAILED
        fileName: job.fileName,
        mode: job.mode,
        pages: job.pages,
        processingTime: job.processingTime,
        creditsUsed: job.creditsUsed,
        error: job.error,
        // Incluir markdown solo si está completado
        markdown: job.status === "COMPLETED" ? job.markdown : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// ============================================================
// EJEMPLO: Configurar Agente con Tools
// ============================================================

import { agent } from "@llamaindex/workflow";
import { OpenAI } from "llamaindex";

async function createFormmyAgent(chatbotId: string) {
  const llm = new OpenAI({
    model: "gpt-4o-mini",
    temperature: 0.7,
  });

  const formmyAgent = agent({
    llm,
    tools: [
      searchKnowledgeBase,
      parseDocument,
      getParsingStatus,
    ],
    systemPrompt: `You are a helpful AI assistant with access to Formmy's document intelligence platform.

**Available Tools**:

1. **search_formmy_knowledge** - Search the knowledge base
   - Use when user asks questions about stored information
   - Always cite sources with [1], [2], etc.

2. **parse_document** - Parse PDFs, DOCX, etc.
   - Use when user uploads a document
   - Extract tables, text, and structured data

3. **get_parsing_status** - Check parsing job status
   - Use to check long-running parsing jobs

**Important Notes**:
- The chatbotId is: ${chatbotId}
- Always search knowledge base BEFORE saying "I don't know"
- Cite sources with index numbers [1], [2], etc.
- If parsing fails, explain the error clearly`,
  });

  return formmyAgent;
}

// ============================================================
// EJEMPLO: Usar el Agente
// ============================================================

async function main() {
  const chatbotId = "chatbot_abc123"; // ID del chatbot del usuario

  const agent = await createFormmyAgent(chatbotId);

  // Ejemplo 1: Buscar en knowledge base
  console.log("\n=== Ejemplo 1: Búsqueda ===");
  const stream1 = agent.runStream("¿Cuál es la política de devoluciones?");

  for await (const event of stream1) {
    if (event.type === "tool_call") {
      console.log(`[Tool Called] ${event.toolName}`);
    } else if (event.type === "message") {
      console.log(`[AI] ${event.content}`);
    }
  }

  // Ejemplo 2: Parsear documento
  console.log("\n=== Ejemplo 2: Parse Document ===");
  const stream2 = agent.runStream("Parse the file at /tmp/invoice.pdf");

  for await (const event of stream2) {
    if (event.type === "tool_call") {
      console.log(`[Tool Called] ${event.toolName}`, event.arguments);
    } else if (event.type === "message") {
      console.log(`[AI] ${event.content}`);
    }
  }
}

// Ejecutar si este archivo es el main
if (require.main === module) {
  main().catch(console.error);
}

// ============================================================
// ❌ LO QUE OTRO CLAUDE INVENTÓ (NO EXISTE)
// ============================================================

/*
// ❌ ESTO NO EXISTE EN FORMMY SDK
import FormmySDK from "formmy-sdk"; // ❌ Import incorrecto

const formmyClient = new FormmySDK({ // ❌ No existe FormmySDK
  apiKey: process.env.FORMMY_API_KEY,
  baseUrl: process.env.FORMMY_BASE_URL || "https://api.formmy.app",
});

// ❌ Estas tools NO EXISTEN
const tools = [
  create_form,        // ❌ No existe
  update_form,        // ❌ No existe
  delete_form,        // ❌ No existe
  list_forms,         // ❌ No existe
  get_form_responses, // ❌ No existe
];

// ❌ Estos agentes NO EXISTEN
const formmyAgent = createAgent(); // ❌ No existe
const analyticsAgent = createAnalyticsAgent(); // ❌ No existe
const formmyMultiAgent = createMultiAgent(); // ❌ No existe
*/

// ============================================================
// ✅ LO QUE SÍ EXISTE EN FORMMY SDK
// ============================================================

/*
Métodos disponibles en FormmyParser:

✅ parse(file, mode) - Parsear documento
✅ getStatus(jobId) - Obtener status de job
✅ waitFor(jobId, options) - Esperar a que job complete
✅ query(query, chatbotId, options) - Buscar en RAG knowledge base

⚠️ FALTAN (según CLAUDE.md):
- listContexts(chatbotId) - Listar documentos en knowledge base
- uploadContext(chatbotId, content, metadata) - Subir texto directo

Formmy es:
✅ Document Parsing API (PDF, DOCX, XLSX → Markdown)
✅ RAG Knowledge Base (Semantic search con AI)

Formmy NO es:
❌ Form builder (a pesar del nombre)
❌ Chatbot UI framework
❌ Agent framework completo
*/

export {
  formmyClient,
  searchKnowledgeBase,
  parseDocument,
  getParsingStatus,
  createFormmyAgent,
};
