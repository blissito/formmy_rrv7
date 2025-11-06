# Formmy SDK - Quick Reference Card

## 🎯 ¿Qué es Formmy?

**Document Intelligence Platform** = Document Parsing + RAG Knowledge Base

```
Formmy = LlamaParse + Pinecone/ChromaDB (como servicio)
```

### ✅ Formmy ES:
- Parser AI de PDFs/DOCX/XLSX → Markdown
- RAG knowledge base con semantic search
- API pay-as-you-go con créditos

### ❌ Formmy NO ES:
- Form builder (a pesar del nombre)
- Chatbot UI/framework
- Agent framework completo

---

## 📦 Instalación

```bash
npm install formmy-sdk
```

---

## 🚀 Setup Básico

```typescript
import { FormmyParser } from "formmy-sdk"; // ✅ Correcto

const client = new FormmyParser({
  apiKey: "sk_live_xxxxx",
  baseUrl: "https://formmy.app", // Opcional
  debug: false, // Opcional
  timeout: 30000, // Opcional (ms)
  retries: 3, // Opcional
});
```

**Shorthand**:
```typescript
const client = new FormmyParser("sk_live_xxxxx");
```

---

## 📄 Parser API

### 1. Parse Document

```typescript
const job = await client.parse(
  "./document.pdf", // File path (Node.js) o Blob (Browser)
  "AGENTIC" // Mode: COST_EFFECTIVE | AGENTIC | AGENTIC_PLUS
);

console.log(job.id); // "job_abc123"
console.log(job.creditsUsed); // 15 (5 páginas × 3 créditos)
```

### 2. Get Status

```typescript
const status = await client.getStatus("job_abc123");

console.log(status.status); // PENDING | PROCESSING | COMPLETED | FAILED
console.log(status.pages); // 5
console.log(status.markdown); // Solo si COMPLETED
```

### 3. Wait for Completion

```typescript
const result = await client.waitFor("job_abc123", {
  pollInterval: 2000, // Check cada 2s
  timeout: 300000, // Timeout 5 min
  onProgress: (job) => console.log(job.status),
});

console.log(result.markdown); // Contenido parseado
```

---

## 🔍 RAG API

### Query Knowledge Base

```typescript
const result = await client.query(
  "¿Cuál es el horario de atención?", // Query
  "chatbot_abc123", // Chatbot ID
  {
    mode: "accurate", // "fast" | "accurate"
    contextId: "ctx_xyz", // Opcional: buscar en un solo documento
  }
);

console.log(result.answer); // Respuesta AI
console.log(result.sources); // Array de fuentes con scores
console.log(result.creditsUsed); // 2
```

---

## 🛠️ Métodos Disponibles

| Método | Descripción | Créditos |
|--------|-------------|----------|
| `parse(file, mode)` | Parsear documento | 1-6 por página |
| `getStatus(jobId)` | Status de parsing job | 0 |
| `waitFor(jobId, opts)` | Esperar job completo | 0 |
| `query(query, chatbotId, opts)` | RAG search | 2 |

### ⚠️ Métodos Faltantes (según CLAUDE.md)

Estos **deberían** existir pero faltan:

```typescript
// ⚠️ NO IMPLEMENTADO AÚN
await client.listContexts(chatbotId); // Listar documentos
await client.uploadContext(chatbotId, content, metadata); // Subir texto
```

---

## 💰 Pricing (Créditos)

### Parser

| Mode | Créditos/Página | Use Case |
|------|-----------------|----------|
| `DEFAULT` | 0 (FREE) | Texto básico |
| `COST_EFFECTIVE` | 1 | Rápido y económico |
| `AGENTIC` | 3 | Tablas estructuradas |
| `AGENTIC_PLUS` | 6 | OCR avanzado + imágenes |

**Ejemplo**: PDF de 9 páginas con `AGENTIC` = 9 × 3 = **27 créditos**

### RAG

| Operación | Créditos |
|-----------|----------|
| `query()` | 2 |
| `listContexts()` | 0 (gratis) |
| `uploadContext()` | 3 |

---

## 🤖 Uso con LlamaIndex

```typescript
import { tool } from "llamaindex";
import { z } from "zod";
import { FormmyParser } from "formmy-sdk";

const client = new FormmyParser("sk_live_xxx");

const searchTool = tool({
  name: "search_formmy",
  description: "Search Formmy knowledge base",
  parameters: z.object({
    query: z.string(),
    chatbotId: z.string(),
  }),
  handler: async ({ query, chatbotId }) => {
    const result = await client.query(query, chatbotId, {
      mode: "accurate",
    });
    return {
      answer: result.answer,
      sources: result.sources?.slice(0, 3),
    };
  },
});
```

---

## 🚨 Error Handling

```typescript
import {
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  TimeoutError,
  ParsingFailedError,
  NetworkError,
} from "formmy-sdk";

try {
  await client.query("test", "chatbot_123");
} catch (error) {
  if (error instanceof AuthenticationError) {
    // API key inválida
  } else if (error instanceof InsufficientCreditsError) {
    // Sin créditos: error.creditsRequired, error.creditsAvailable
  } else if (error instanceof RateLimitError) {
    // Rate limit: error.retryAfter
  } else if (error instanceof TimeoutError) {
    // Timeout: error.timeoutMs
  } else if (error instanceof ParsingFailedError) {
    // Parsing falló: error.jobId
  } else if (error instanceof NetworkError) {
    // Error de red: error.originalError
  }
}
```

---

## 📋 Tipos TypeScript

### ParsingJob

```typescript
interface ParsingJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  fileName: string;
  mode: "COST_EFFECTIVE" | "AGENTIC" | "AGENTIC_PLUS";
  creditsUsed: number;
  markdown?: string; // Solo si COMPLETED
  pages?: number;
  processingTime?: number; // seconds
  error?: string; // Solo si FAILED
  createdAt: string;
  completedAt?: string;
}
```

### RAGQueryResult

```typescript
interface RAGQueryResult {
  query: string;
  answer?: string; // Solo en mode="accurate"
  sources?: RAGSource[];
  creditsUsed: number;
  processingTime: number; // seconds
}

interface RAGSource {
  content: string;
  score: number; // 0-1 (relevance)
  metadata: {
    fileName?: string;
    page?: number;
    chunkIndex?: number;
  };
}
```

---

## 🔑 Environment Variables

```bash
# .env
FORMMY_API_KEY=sk_live_xxxxxxxxxxxxxxxx
FORMMY_BASE_URL=https://formmy.app # Opcional
```

```typescript
const client = new FormmyParser(process.env.FORMMY_API_KEY!);
```

---

## 🐛 Problemas Comunes

### 1. Import no funciona

```typescript
// ❌ NO funciona
import FormmySDK from "formmy-sdk";
const client = new FormmySDK({ apiKey: "..." });

// ✅ SÍ funciona
import { FormmyParser } from "formmy-sdk";
const client = new FormmyParser({ apiKey: "..." });
```

### 2. Timeout en parsing largo

```typescript
// ✅ Aumentar timeout
const client = new FormmyParser({
  apiKey: "sk_live_xxx",
  timeout: 120000, // 2 minutos
});

const result = await client.waitFor(jobId, {
  timeout: 600000, // 10 minutos
});
```

### 3. Endpoint RAG incorrecto

**Bug conocido** (versión 1.0.1):

```typescript
// ❌ SDK usa (incorrecto)
/api/rag/v1?intent=query

// ✅ Debería ser
/api/v1/rag?intent=query
```

**Fix**: Actualizar a versión 1.0.2+ cuando salga.

---

## 📚 Recursos

- **npm**: https://www.npmjs.com/package/formmy-sdk
- **GitHub**: https://github.com/blissito/formmy_rrv7
- **Docs**: https://formmy.app/docs
- **API Keys**: https://formmy.app/dashboard/api-keys
- **Soporte**: support@formmy.app

---

## 📝 Ejemplos Completos

Ver archivos:
- `CORRECT_USAGE_EXAMPLE.ts` - Ejemplo completo con LlamaIndex
- `INTEGRATION_GUIDE.md` - Guía de integración detallada
- `SDK_AUDIT_REPORT.md` - Reporte técnico completo

---

## ✅ Checklist Rápido

Antes de usar Formmy SDK:

- [ ] Tengo una API key (`sk_live_xxx`)
- [ ] Instalé `npm install formmy-sdk`
- [ ] Entiendo que es para **parsear documentos** y **RAG search**
- [ ] NO es un form builder
- [ ] Import correcto: `import { FormmyParser } from "formmy-sdk"`
- [ ] Manejo errores con try/catch
- [ ] Tengo créditos suficientes

---

**TL;DR**: Formmy = Parser AI + RAG. NO es form builder.

```typescript
import { FormmyParser } from "formmy-sdk";
const client = new FormmyParser("sk_live_xxx");

// Parse doc
const job = await client.parse("./doc.pdf", "AGENTIC");
const result = await client.waitFor(job.id);

// RAG search
const answer = await client.query("¿Horarios?", "chatbot_123");
```
