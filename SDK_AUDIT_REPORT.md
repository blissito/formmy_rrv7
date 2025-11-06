# Formmy SDK - Auditoría y Recomendaciones

**Fecha**: 2025-10-23
**Versión analizada**: 1.0.1

## 🚨 Problemas Críticos

### 0. SDK No Explica QUÉ es Formmy (CRÍTICO)

**Problema más grave**: El SDK no deja claro que Formmy es para:
1. **Document Parsing** - Parsear PDFs, DOCX, etc. con AI
2. **RAG Knowledge Base** - Búsqueda semántica en documentos

**Evidencia del problema**:
Otro Claude inventó completamente esto:
```typescript
// ❌ INVENTADO - NO EXISTE EN EL SDK
const formmyAgent = createAgent(); // ¿Qué es esto?
const tools = [
  create_form,      // ❌ No existe
  update_form,      // ❌ No existe
  delete_form,      // ❌ No existe
  list_forms,       // ❌ No existe
  get_form_responses // ❌ No existe
];
```

**Por qué pasó**:
- El nombre "formmy-sdk" sugiere "forms" (formularios)
- El README no tiene una sección "What is Formmy?"
- No hay descripción clara del propósito en los primeros 3 párrafos

**Solución recomendada**:

```markdown
# formmy-sdk

> **Official TypeScript/JavaScript SDK for Formmy - AI-Powered Document Intelligence**

## What is Formmy?

Formmy is a **Document Parsing + RAG Knowledge Base** platform. This SDK provides:

1. **Document Parsing API**
   - Parse PDFs, DOCX, XLSX, TXT with advanced AI extraction
   - 4 quality modes: FREE basic text → Advanced structured tables with OCR
   - Async job processing with progress tracking

2. **RAG Knowledge Base API**
   - Semantic search across your parsed documents
   - Upload text content directly
   - Query with AI-generated answers + citations

**What Formmy is NOT**:
- ❌ Not a form builder (despite the name)
- ❌ Not a chatbot UI framework
- ❌ Not a full agent framework (it's a tool/API client)

## Use Cases

- 📄 Parse invoices, contracts, resumes automatically
- 🔍 Build AI assistants with document knowledge
- 📚 Create searchable knowledge bases from PDFs
- 🤖 Add document intelligence to your LLM agents

## Quick Example

\`\`\`typescript
import { FormmyParser } from 'formmy-sdk';

const client = new FormmyParser('sk_live_xxx');

// 1. Parse a PDF
const job = await client.parse('./contract.pdf', 'AGENTIC');
const result = await client.waitFor(job.id);
console.log(result.markdown); // Extracted content

// 2. Search in knowledge base
const answer = await client.query(
  '¿Cuál es la fecha de vencimiento?',
  'chatbot_123',
  { mode: 'accurate' }
);
console.log(answer.answer); // AI-generated response with citations
\`\`\`
```

Agregar esto **en los primeros 50 líneas del README**.

---

### 1. Export por Defecto No Funciona Como Esperado

**Problema actual**:
```typescript
// Lo que otro Claude está intentando (NO FUNCIONA):
import FormmySDK from "formmy-sdk";
const client = new FormmySDK({ apiKey: "..." });
```

**Causa**:
- `index.ts` exporta `export default FormmyParser`
- Pero el constructor se llama `FormmyParser`, no `FormmySDK`
- Confunde a los usuarios y LLMs sobre el nombre correcto

**Solución recomendada**:
```typescript
// index.ts - Agregar alias
export { FormmyParser } from './client';
export { FormmyParser as Formmy } from './client'; // Alias más corto
export { FormmyParser as FormmyClient } from './client'; // Alias descriptivo

// Default export que funciona con destructuring
import { FormmyParser as default } from './client';
export default { FormmyParser, Formmy: FormmyParser, FormmyClient: FormmyParser };
```

---

### 2. Falta Funcionalidad RAG API v1 Completa

**Según CLAUDE.md, existen estos endpoints**:
- ✅ `GET /api/v1/rag?intent=list` - Listar contextos
- ✅ `POST /api/v1/rag?intent=upload` - Subir contenido manualmente
- ⚠️ `POST /api/v1/rag?intent=query` - Query (existe pero está mal la ruta)

**Problema actual**:
El cliente solo tiene `query()` y apunta a `/api/rag/v1` (incorrecto).

**Solución recomendada**:

```typescript
// client.ts - Agregar métodos faltantes

/**
 * List all contexts in a chatbot
 */
async listContexts(chatbotId: string): Promise<RAGContextList> {
  validateChatbotId(chatbotId);

  const response = await this.fetch(
    `${this.baseUrl}/api/v1/rag?intent=list&chatbotId=${encodeURIComponent(chatbotId)}`,
    {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    }
  );

  return this.handleResponse(response);
}

/**
 * Upload text content to RAG knowledge base
 */
async uploadContext(
  chatbotId: string,
  content: string,
  metadata?: { title?: string; type?: string }
): Promise<RAGUploadResult> {
  validateChatbotId(chatbotId);

  const response = await this.fetch(
    `${this.baseUrl}/api/v1/rag?intent=upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatbotId,
        content,
        type: metadata?.type || 'TEXT',
        metadata,
      }),
    }
  );

  return this.handleResponse(response);
}
```

**Tipos faltantes**:

```typescript
// types.ts - Agregar

export interface RAGContext {
  id: string;
  type: 'FILE' | 'TEXT' | 'URL' | 'JOB_CONTEXT';
  fileName?: string;
  sizeKB?: number;
  createdAt: string;
  parsingMode?: ParsingMode;
  parsingPages?: number;
  parsingCredits?: number;
}

export interface RAGContextList {
  chatbotId: string;
  chatbotName: string;
  totalContexts: number;
  totalSizeKB: number;
  totalEmbeddings: number;
  contexts: RAGContext[];
}

export interface RAGUploadResult {
  success: true;
  contextId: string;
  embeddingsCreated: number;
  embeddingsSkipped: number;
  creditsUsed: number;
}
```

---

### 3. Endpoint RAG Incorrecto

**Problema**:
```typescript
// client.ts:394 - INCORRECTO
const response = await this.fetch(`${this.baseUrl}/api/rag/v1?intent=query`, {
```

**Debería ser**:
```typescript
const response = await this.fetch(`${this.baseUrl}/api/v1/rag?intent=query`, {
```

---

### 4. Documentación para Uso como Tool en Agentes AI

**Falta un README de integración**:

```markdown
## Uso con LlamaIndex

\`\`\`typescript
import { tool } from "llamaindex";
import { z } from "zod";
import { FormmyParser } from "formmy-sdk";

const formmyClient = new FormmyParser({
  apiKey: process.env.FORMMY_API_KEY!,
  baseUrl: "https://formmy.app",
});

// Tool para búsqueda RAG
const searchKnowledgeBase = tool({
  name: "search_knowledge_base",
  description: "Search the Formmy knowledge base for information",
  parameters: z.object({
    query: z.string().describe("The search query"),
    chatbotId: z.string().describe("The chatbot ID to search in"),
  }),
  handler: async ({ query, chatbotId }) => {
    const result = await formmyClient.query(query, chatbotId, { mode: "accurate" });
    return {
      answer: result.answer,
      sources: result.sources?.map(s => ({
        content: s.content.substring(0, 500), // Truncar para tokens
        score: s.score,
        file: s.metadata.fileName,
      })),
    };
  },
});

// Tool para parsear documentos
const parseDocument = tool({
  name: "parse_document",
  description: "Parse a document (PDF, DOCX, etc.) to extract structured content",
  parameters: z.object({
    filePath: z.string().describe("Path to the document to parse"),
    mode: z.enum(["COST_EFFECTIVE", "AGENTIC", "AGENTIC_PLUS"]).default("AGENTIC"),
  }),
  handler: async ({ filePath, mode }) => {
    const job = await formmyClient.parse(filePath, mode);
    const result = await formmyClient.waitFor(job.id);
    return {
      markdown: result.markdown,
      pages: result.pages,
      creditsUsed: result.creditsUsed,
    };
  },
});
\`\`\`

## Uso con LangChain

\`\`\`typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { FormmyParser } from "formmy-sdk";

const formmyClient = new FormmyParser(process.env.FORMMY_API_KEY!);

const searchTool = new DynamicStructuredTool({
  name: "formmy_search",
  description: "Search Formmy knowledge base",
  schema: z.object({
    query: z.string(),
    chatbotId: z.string(),
  }),
  func: async ({ query, chatbotId }) => {
    const result = await formmyClient.query(query, chatbotId);
    return JSON.stringify(result);
  },
});
\`\`\`
```

---

## 🟡 Problemas Menores

### 5. Falta Validación de Base URL

```typescript
// Constructor no valida si baseUrl es válida
constructor(config: ParserConfig | string) {
  // ...
  this.baseUrl = config.baseUrl || 'https://formmy.app';
  // ❌ No valida que sea una URL válida
}
```

**Solución**:
```typescript
// types.ts
export function validateBaseUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new ValidationError(`Invalid base URL: ${url}`);
  }
}
```

---

### 6. Tipos de Metadata Inconsistentes

**Problema en RAG query**:
```typescript
// types.ts:48-56
export interface RAGSource {
  content: string;
  score: number;
  metadata: {
    fileName?: string;
    page?: number;
    chunkIndex?: number;
  };
}
```

**Según CLAUDE.md, hay más campos**:
- `title`, `fileType`, `fileSize`, `contextType`, `url`, `fileUrl`

**Solución**:
```typescript
export interface RAGSourceMetadata {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  contextType?: 'FILE' | 'TEXT' | 'URL' | 'JOB_CONTEXT';
  page?: number;
  chunkIndex?: number;
  title?: string;
  url?: string;
  fileUrl?: string;
}

export interface RAGSource {
  content: string;
  score: number;
  metadata: RAGSourceMetadata;
}
```

---

### 7. ParsingMode 'DEFAULT' No Está Documentado en Pricing

**README.md menciona**:
- `COST_EFFECTIVE` - 1 crédito/página
- `AGENTIC` - 3 créditos/página
- `AGENTIC_PLUS` - 6 créditos/página

**Pero types.ts incluye**:
```typescript
export type ParsingMode = 'DEFAULT' | 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS';
```

**CLAUDE.md no menciona DEFAULT**. ¿Es válido? Si sí, agregar a docs:
```markdown
| Mode | Credits/Page | Features |
|------|--------------|----------|
| DEFAULT | 0 (FREE) | Basic text extraction |
```

---

## ✅ Recomendaciones de Mejora

### 8. Agregar Método `parseAndWait()` (DX Improvement)

Simplificar el flujo más común:

```typescript
/**
 * Parse a document and wait for completion (convenience method)
 */
async parseAndWait(
  file: string | Buffer | Blob,
  mode: ParsingMode = 'AGENTIC',
  waitOptions?: WaitForOptions
): Promise<ParsingJob> {
  const job = await this.parse(file, mode);
  return this.waitFor(job.id, waitOptions);
}
```

**Uso**:
```typescript
// Antes (2 pasos)
const job = await parser.parse('./doc.pdf', 'AGENTIC');
const result = await parser.waitFor(job.id);

// Después (1 paso)
const result = await parser.parseAndWait('./doc.pdf', 'AGENTIC');
```

---

### 9. Agregar Health Check

```typescript
/**
 * Check if API is reachable and credentials are valid
 */
async healthCheck(): Promise<{ status: 'ok' | 'error'; latency: number }> {
  const start = Date.now();
  try {
    // Intenta un endpoint lightweight (ej: GET /api/v1/rag?intent=health)
    await this.fetch(`${this.baseUrl}/api/health`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', latency: Date.now() - start };
  }
}
```

---

### 10. Agregar Tipado para Tool Creation

```typescript
// types.ts - Nuevo tipo helper

/**
 * Schema for creating LlamaIndex/LangChain tools
 */
export interface FormmyToolConfig {
  apiKey: string;
  baseUrl?: string;
  defaultChatbotId?: string; // Para tools sin parámetro chatbotId
}

export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  creditsUsed?: number;
}
```

---

## 📝 Checklist de Implementación

### Prioridad Máxima (Bloqueante)
- [ ] **Reescribir inicio del README** con sección "What is Formmy?"
  - Explicar: Document Parsing + RAG Knowledge Base
  - Aclarar: NO es form builder, NO es chatbot framework
  - Agregar use cases claros
  - Ejemplo completo en primeras 50 líneas

### Prioridad Alta (Crítico)
- [ ] Corregir endpoint RAG: `/api/rag/v1` → `/api/v1/rag`
- [ ] Agregar métodos `listContexts()` y `uploadContext()`
- [ ] Mejorar exports en `index.ts` con alias (`Formmy`, `FormmyClient`)
- [ ] Agregar tipos `RAGContext`, `RAGContextList`, `RAGUploadResult`

### Prioridad Media (Importante)
- [ ] Agregar README de integración con LlamaIndex/LangChain
- [ ] Agregar método `parseAndWait()` (conveniencia)
- [ ] Validar `baseUrl` en constructor
- [ ] Completar tipos de `RAGSourceMetadata`
- [ ] Documentar modo `DEFAULT` si es válido

### Prioridad Baja (Nice to Have)
- [ ] Agregar `healthCheck()` method
- [ ] Agregar tipos helpers para tools (`ToolResponse`, `FormmyToolConfig`)
- [ ] Mejorar error messages con links a docs

---

## 🎯 Ejemplo de Uso Post-Fix

Después de implementar las mejoras:

```typescript
// ✅ TODAS estas formas funcionarán
import { FormmyParser } from 'formmy-sdk';
import { Formmy } from 'formmy-sdk';
import { FormmyClient } from 'formmy-sdk';
import FormmySDK from 'formmy-sdk'; // { FormmyParser, Formmy, FormmyClient }

// Opción 1: Nombre oficial
const parser = new FormmyParser('sk_live_xxx');

// Opción 2: Alias corto
const client = new Formmy('sk_live_xxx');

// Opción 3: Alias descriptivo
const formmy = new FormmyClient('sk_live_xxx');

// Opción 4: Default import (para frameworks que esperan default)
const sdk = FormmySDK.FormmyParser || FormmySDK.Formmy;
const instance = new sdk('sk_live_xxx');
```

**RAG Completo**:
```typescript
// Listar todos los contextos
const contexts = await client.listContexts('chatbot_123');
console.log(`Total contexts: ${contexts.totalContexts}`);

// Subir nuevo contexto
await client.uploadContext('chatbot_123', 'Horarios: Lun-Vie 9am-6pm', {
  title: 'Horarios de Atención',
  type: 'TEXT',
});

// Query RAG
const result = await client.query('¿Horarios?', 'chatbot_123', { mode: 'accurate' });
console.log(result.answer);
```

**Parser one-liner**:
```typescript
// Parse y espera en un solo llamado
const result = await client.parseAndWait('./doc.pdf', 'AGENTIC', {
  onProgress: (job) => console.log(job.status),
});
console.log(result.markdown);
```

---

## 📊 Impacto Estimado

| Problema | Impacto | Dificultad | Tiempo Estimado |
|----------|---------|------------|-----------------|
| #0 README sin contexto | 🔴🔴 CRÍTICO | 🟢 Fácil | 1 hora |
| #1 Exports confusos | 🔴 Alto | 🟢 Fácil | 15 min |
| #2 Métodos RAG faltantes | 🔴 Alto | 🟡 Medio | 2 horas |
| #3 Endpoint incorrecto | 🔴 Alto | 🟢 Fácil | 5 min |
| #4 Docs para tools | 🟡 Medio | 🟢 Fácil | 1 hora |
| #5-7 Validaciones | 🟢 Bajo | 🟢 Fácil | 30 min |
| #8-10 Mejoras DX | 🟢 Bajo | 🟡 Medio | 1 hora |

**Total estimado**: ~6 horas de desarrollo + testing

**Nota**: El problema #0 es BLOQUEANTE. Sin esto, los usuarios (humanos y LLMs) inventarán funcionalidad que no existe.

---

## 🚀 Plan de Implementación Sugerido

1. **Sprint 0 - BLOQUEANTE** (1 hora)
   - ✅ **Reescribir README** con "What is Formmy?"
   - ✅ Aclarar que NO es form builder
   - ✅ Agregar use cases claros
   - ✅ Ejemplo completo en primeras 50 líneas
   - **Resultado**: Los usuarios (humanos y LLMs) entenderán qué hace Formmy

2. **Sprint 1 - Fixes Críticos** (2-3 horas)
   - Corregir endpoint RAG (`/api/rag/v1` → `/api/v1/rag`)
   - Mejorar exports (`Formmy`, `FormmyClient` alias)
   - Agregar métodos RAG faltantes (`listContexts()`, `uploadContext()`)
   - Agregar tipos faltantes

3. **Sprint 2 - Documentación** (1 hora)
   - README de integración con LlamaIndex/LangChain
   - Ejemplos completos de tools
   - Guía de error handling

4. **Sprint 3 - DX Improvements** (1-2 horas)
   - `parseAndWait()` method
   - Validaciones
   - Health check

5. **Release**:
   - Versión **2.0.0** (breaking change: endpoint RAG + nuevos métodos)
   - Publicar en npm
   - Actualizar docs en formmy.app
   - Agregar migration guide en CHANGELOG

---

## 📚 Referencias

- **CLAUDE.md**: Sección "RAG API v1" (líneas relevantes)
- **SDK Actual**: `/sdk/formmy-parser/`
- **API Endpoints**: `/app/routes/api.v1.rag.ts`
