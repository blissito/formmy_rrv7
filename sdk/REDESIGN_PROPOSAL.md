# Formmy SDK - Propuesta de Rediseño

**Concepto**: RAG as a Service - Developers suben docs y hacen queries. Formmy se encarga de TODO.

---

## 🎯 Visión Correcta

```typescript
// Developer NO piensa en:
// ❌ Parsing
// ❌ Chunking
// ❌ Embeddings
// ❌ Vector DB
// ❌ Búsqueda semántica

// Developer solo hace:
import { upload, query } from 'formmy-sdk';

// ✅ Subir documento (Formmy hace: parse → chunk → embed → store en MongoDB)
await upload('./manual.pdf', { chatbotId: 'xxx' });

// ✅ Query RAG (Formmy hace: embed query → search → generate answer)
const answer = await query('¿Horarios?', { chatbotId: 'xxx' });
```

---

## 📦 Nueva API Funcional

### Configuración Global

```typescript
import { configure } from 'formmy-sdk';

configure({
  apiKey: 'sk_live_xxxxx',
  baseUrl: 'https://formmy-v2.fly.dev', // Opcional
});

// O por env variable
// FORMMY_API_KEY=sk_live_xxxxx
```

### Upload Document

```typescript
import { upload } from 'formmy-sdk';

const result = await upload('./invoice.pdf', {
  chatbotId: 'chatbot_abc123',
  mode: 'AGENTIC', // Opcional: COST_EFFECTIVE | AGENTIC | AGENTIC_PLUS
  metadata: {
    title: 'Factura Enero 2025',
    type: 'invoice',
  },
});

console.log(result.contextId); // "ctx_xyz789"
console.log(result.pages); // 5
console.log(result.creditsUsed); // 15 (5 páginas × 3)
```

### Upload Text

```typescript
import { uploadText } from 'formmy-sdk';

await uploadText('Horarios: Lun-Vie 9am-6pm', {
  chatbotId: 'chatbot_abc123',
  metadata: { title: 'Horarios de atención' },
});
```

### Query RAG

```typescript
import { query } from 'formmy-sdk';

const result = await query('¿Cuál es el horario?', {
  chatbotId: 'chatbot_abc123',
  mode: 'accurate', // 'fast' | 'accurate'
});

console.log(result.answer);
// "El horario de atención es de Lunes a Viernes de 9am a 6pm."

console.log(result.sources);
// [{ content: "...", score: 0.95, metadata: {...} }]
```

### List Contexts

```typescript
import { listContexts } from 'formmy-sdk';

const contexts = await listContexts('chatbot_abc123');

console.log(contexts.totalContexts); // 15
console.log(contexts.totalEmbeddings); // 456
console.log(contexts.contexts); // Array de documentos
```

### Delete Context

```typescript
import { deleteContext } from 'formmy-sdk';

await deleteContext('ctx_xyz789', {
  chatbotId: 'chatbot_abc123',
});
```

---

## 🤖 Tool Nativo para LlamaIndex

```typescript
import { createFormmyTool } from 'formmy-sdk/llamaindex';

const tool = createFormmyTool({
  apiKey: 'sk_live_xxxxx',
  chatbotId: 'chatbot_abc123',
  name: 'search_knowledge', // Opcional
  description: 'Search company knowledge base', // Opcional
});

// Usar directamente en agente
import { agent } from '@llamaindex/workflow';

const myAgent = agent({
  tools: [tool],
  systemPrompt: 'You can search documents with search_knowledge',
});
```

**Implementación del tool**:

```typescript
// sdk/llamaindex/tool.ts
import { tool } from 'llamaindex';
import { z } from 'zod';
import { query } from '../index';

export interface FormmyToolConfig {
  apiKey: string;
  chatbotId: string;
  name?: string;
  description?: string;
  mode?: 'fast' | 'accurate';
}

export function createFormmyTool(config: FormmyToolConfig) {
  return tool({
    name: config.name || 'formmy_search',
    description: config.description ||
      'Search the knowledge base for information. Returns AI-generated answers with source citations.',
    parameters: z.object({
      query: z.string().describe('The search query or question to find information about'),
    }),
    handler: async ({ query: searchQuery }) => {
      const result = await query(searchQuery, {
        chatbotId: config.chatbotId,
        mode: config.mode || 'accurate',
      });

      return {
        answer: result.answer,
        sources: result.sources?.slice(0, 3).map((s, idx) => ({
          index: idx + 1,
          content: s.content.substring(0, 400),
          relevance: Math.round(s.score * 100) + '%',
          file: s.metadata.fileName,
        })),
      };
    },
  });
}
```

---

## 📁 Nueva Estructura del SDK

```
formmy-sdk/
├── src/
│   ├── index.ts              # Exports principales (funcional)
│   ├── config.ts             # configure(), getConfig()
│   ├── upload.ts             # upload(), uploadText()
│   ├── query.ts              # query()
│   ├── contexts.ts           # listContexts(), deleteContext()
│   ├── types.ts              # TypeScript types
│   ├── errors.ts             # Error classes
│   ├── http.ts               # HTTP client interno
│   └── llamaindex/
│       ├── index.ts          # Export tool
│       └── tool.ts           # createFormmyTool()
├── package.json
├── tsconfig.json
└── README.md
```

### package.json exports

```json
{
  "name": "formmy-sdk",
  "version": "2.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./llamaindex": {
      "import": "./dist/llamaindex/index.js",
      "types": "./dist/llamaindex/index.d.ts"
    }
  }
}
```

---

## 🔄 Comparación: Antes vs. Después

### Antes (OOP, Confuso)

```typescript
import { FormmyParser } from 'formmy-sdk';

const parser = new FormmyParser('sk_live_xxx');

// 1. Parse (¿por qué exponer esto?)
const job = await parser.parse('./doc.pdf', 'AGENTIC');

// 2. Wait (¿por qué el developer tiene que esperar?)
const result = await parser.waitFor(job.id);

// 3. Query (separado del parsing)
const answer = await parser.query('test', 'chatbot_123');
```

### Después (Funcional, Simple)

```typescript
import { configure, upload, query } from 'formmy-sdk';

configure({ apiKey: 'sk_live_xxx' });

// 1. Upload (Formmy hace TODO internamente)
await upload('./doc.pdf', { chatbotId: 'chatbot_123' });

// 2. Query (listo!)
const answer = await query('test', { chatbotId: 'chatbot_123' });
```

---

## 🤖 Ejemplo Completo con LlamaIndex

```typescript
import { configure, createFormmyTool } from 'formmy-sdk';
import { agent } from '@llamaindex/workflow';
import { OpenAI } from 'llamaindex';

// Setup
configure({ apiKey: process.env.FORMMY_API_KEY! });

// Crear tool nativo (1 línea!)
const knowledgeTool = createFormmyTool({
  apiKey: process.env.FORMMY_API_KEY!,
  chatbotId: 'chatbot_abc123',
  description: 'Search company policies and documentation',
});

// Crear agente
const myAgent = agent({
  llm: new OpenAI({ model: 'gpt-4o-mini' }),
  tools: [knowledgeTool],
  systemPrompt: `You can search company documentation using formmy_search.
                 Always cite sources with [1], [2], etc.`,
});

// Usar
const stream = myAgent.runStream('¿Cuál es la política de vacaciones?');

for await (const event of stream) {
  console.log(event);
}
```

---

## 📖 README Mejorado

```markdown
# formmy-sdk

> **RAG as a Service** - Upload documents, query knowledge. We handle everything.

Formmy manages the entire RAG pipeline so you don't have to:
- ✅ Document parsing (PDF, DOCX, XLSX)
- ✅ Chunking & embeddings
- ✅ Vector storage (MongoDB)
- ✅ Semantic search
- ✅ AI-generated answers

You just: **upload docs** → **query** → **get answers**

## Quick Start

\`\`\`typescript
import { configure, upload, query } from 'formmy-sdk';

configure({ apiKey: 'sk_live_xxxxx' });

// Upload document (we parse, chunk, embed, store)
await upload('./manual.pdf', { chatbotId: 'chatbot_123' });

// Query knowledge base (we search, generate answer)
const result = await query('¿Horarios?', { chatbotId: 'chatbot_123' });

console.log(result.answer);
// "El horario es Lunes a Viernes de 9am a 6pm."
\`\`\`

## LlamaIndex Integration

\`\`\`typescript
import { createFormmyTool } from 'formmy-sdk/llamaindex';

const tool = createFormmyTool({
  apiKey: 'sk_live_xxxxx',
  chatbotId: 'chatbot_123',
});

// Use in agent
const agent = createAgent({ tools: [tool] });
\`\`\`

## API

- \`configure(options)\` - Setup API key
- \`upload(file, options)\` - Upload document
- \`uploadText(content, options)\` - Upload text
- \`query(query, options)\` - Search knowledge base
- \`listContexts(chatbotId)\` - List uploaded documents
- \`deleteContext(contextId, options)\` - Delete document

## LlamaIndex

- \`createFormmyTool(config)\` - Native LlamaIndex tool

## What Formmy Does For You

When you call \`upload('./doc.pdf')\`:
1. 📄 Parse with AI (tables, structure, OCR)
2. ✂️ Smart chunking (2000 chars, 5% overlap)
3. 🧬 Generate embeddings (text-embedding-3-small)
4. 💾 Store in MongoDB vector index
5. 🔍 Deduplicate (85% threshold)

When you call \`query('question')\`:
1. 🧬 Embed query
2. 🔍 Vector similarity search
3. 🤖 Generate AI answer with citations
4. 📊 Return answer + sources

You think in: **documents** and **questions**
We handle: **everything else**
```

---

## 🚀 Migration Guide (1.x → 2.0)

```typescript
// ANTES (1.x)
import { FormmyParser } from 'formmy-sdk';
const parser = new FormmyParser('sk_live_xxx');
const job = await parser.parse('./doc.pdf', 'AGENTIC');
const result = await parser.waitFor(job.id);
const answer = await parser.query('test', 'chatbot_123');

// DESPUÉS (2.0)
import { configure, upload, query } from 'formmy-sdk';
configure({ apiKey: 'sk_live_xxx' });
await upload('./doc.pdf', { chatbotId: 'chatbot_123', mode: 'AGENTIC' });
const answer = await query('test', { chatbotId: 'chatbot_123' });
```

---

## ✅ Ventajas del Rediseño

| Aspecto | Antes (1.x) | Después (2.0) |
|---------|-------------|---------------|
| **Paradigma** | OOP (clase) | Funcional |
| **Concepto** | Parser + RAG separados | RAG as a Service unificado |
| **API** | 4 métodos, 2 pasos | 3 funciones, 1 paso |
| **LlamaIndex** | Manual tool creation | Tool nativo 1 línea |
| **Developer mental model** | "Parsing jobs" | "Upload docs, query" |
| **Lines of code** | ~15 líneas | ~5 líneas |

---

## 🎯 Tareas de Implementación

### 1. Core Funcional
- [ ] `configure()` - Setup global
- [ ] `upload()` - Upload document (parse → embed → store)
- [ ] `uploadText()` - Upload text content
- [ ] `query()` - RAG search
- [ ] `listContexts()` - List documents
- [ ] `deleteContext()` - Delete document

### 2. LlamaIndex Integration
- [ ] `createFormmyTool()` - Native tool
- [ ] Export separado `formmy-sdk/llamaindex`
- [ ] Docs de integración

### 3. HTTP Client
- [ ] Retry logic
- [ ] Error handling
- [ ] Timeout management
- [ ] Header auth

### 4. Documentation
- [ ] README: RAG as a Service concept
- [ ] Quick start: 5 líneas
- [ ] LlamaIndex example
- [ ] API reference
- [ ] Migration guide 1.x → 2.0

### 5. Testing
- [ ] Unit tests (funciones)
- [ ] Integration tests (API real)
- [ ] LlamaIndex tool test

---

## 📊 Impacto

- **DX**: De 15 líneas a 5 líneas
- **Claridad**: "RAG as a Service" vs. "Parser SDK"
- **LlamaIndex**: Tool nativo incluido
- **Paradigma**: Funcional (preferido)
- **Breaking change**: Sí, pero justificado

---

## 🤔 Preguntas para Decidir

1. **¿Mantener compatibilidad con 1.x?**
   - Opción A: Breaking change limpio (2.0.0)
   - Opción B: Deprecation period (1.x → 2.0 gradual)

2. **¿Parsing job status?**
   - Opción A: Ocultar completamente (upload bloqueante)
   - Opción B: Exponer como `uploadAsync()` + `getStatus()`

3. **¿Configuración?**
   - Opción A: Global `configure()` (actual propuesta)
   - Opción B: Pasar config en cada función
   - Opción C: Ambas (config global + override por función)

4. **¿Otros frameworks?**
   - LangChain tool también?
   - LlamaIndex Python?

---

¿Implemento este rediseño?
