# Formmy SDK - Documentación Completa para Agentes AI

> **IMPORTANTE**: Este SDK YA EXISTE y está publicado en npm. NO inventes funcionalidad que no existe.

**Package**: `formmy-sdk@0.0.2`
**Install**: `npm install formmy-sdk`

---

## 🎯 QUÉ ES FORMMY

Formmy es **RAG as a Service** - Una plataforma que maneja TODO el pipeline de document intelligence:

**Tú haces**:
1. Upload documentos
2. Query con preguntas
3. Get respuestas AI con citas

**Formmy hace** (automáticamente):
1. Parse documentos (PDF, DOCX, XLSX) con AI
2. Chunking inteligente (2000 chars, 5% overlap)
3. Generate embeddings (text-embedding-3-small)
4. Store en MongoDB vector index
5. Semantic search
6. Generate respuestas AI con citations

---

## ✅ LO QUE FORMMY ES

- 📄 Document Parser (PDF, DOCX, XLSX → Markdown)
- 🔍 RAG Knowledge Base (Semantic search con AI)
- 🤖 LLM Integration (Native tools para LlamaIndex)

## ❌ LO QUE FORMMY NO ES

- ❌ Form builder (a pesar del nombre)
- ❌ Chatbot UI framework
- ❌ Solo un parser

---

## 📦 INSTALACIÓN

```bash
npm install formmy-sdk
```

---

## 🚀 USO BÁSICO

### 1. Setup

```typescript
import { Formmy } from 'formmy-sdk';

// Opción 1: Con API key explícito
const formmy = new Formmy({
  apiKey: 'sk_live_xxxxx',
});

// Opción 2: Lee de process.env.FORMMY_API_KEY
const formmy = new Formmy();

// Opción 3: Shorthand
const formmy = new Formmy('sk_live_xxxxx');
```

### 2. Upload y Parse Documento

```typescript
// Upload un documento (PDF, DOCX, etc.)
const job = await formmy.parse('./invoice.pdf', 'AGENTIC');

console.log(job.id);           // "job_abc123"
console.log(job.creditsUsed);  // 15 (5 páginas × 3 créditos)

// Esperar a que termine el parsing
const result = await formmy.waitFor(job.id, {
  onProgress: (job) => console.log(`Status: ${job.status}`),
});

console.log(result.markdown);  // Contenido parseado
console.log(result.pages);     // 5
```

### 3. Query RAG (Búsqueda Semántica)

```typescript
const answer = await formmy.query(
  '¿Cuál es el total de la factura?',
  'chatbot_abc123',
  { mode: 'accurate' }
);

console.log(answer.answer);
// "El total de la factura es $1,234.56 MXN."

console.log(answer.sources);
// [{ content: "...", score: 0.95, metadata: {...} }]

console.log(answer.creditsUsed); // 2
```

### 4. Upload Texto Directamente

```typescript
// No necesitas archivo, puedes subir texto directo
await formmy.uploadText('Horarios: Lunes a Viernes 9am-6pm', {
  chatbotId: 'chatbot_abc123',
  metadata: { title: 'Horarios de atención' },
});

// Query inmediatamente
const result = await formmy.query('¿Cuál es el horario?', 'chatbot_abc123');
```

### 5. Listar Documentos

```typescript
const contexts = await formmy.listContexts('chatbot_abc123');

console.log(contexts.totalContexts);   // 15
console.log(contexts.totalEmbeddings); // 456
console.log(contexts.contexts);        // Array de documentos
```

### 6. Eliminar Contexto

```typescript
await formmy.deleteContext('ctx_xyz789', 'chatbot_abc123');
```

---

## 🤖 INTEGRACIÓN CON LLAMAINDEX (1 LÍNEA!)

### Setup

```typescript
import { Formmy } from 'formmy-sdk';
import { createFormmyTool } from 'formmy-sdk/llamaindex';
import { agent } from '@llamaindex/workflow';
import { OpenAI } from 'llamaindex';

const formmy = new Formmy({ apiKey: 'sk_live_xxx' });

// Crear tool nativo (1 línea!)
const tool = createFormmyTool({
  client: formmy,
  chatbotId: 'chatbot_abc123',
  name: 'search_knowledge',           // Opcional
  description: 'Search company docs', // Opcional
  maxSources: 5,                      // Opcional (default: 3)
  maxContentLength: 400,              // Opcional (default: 400)
});

// Usar en agente
const myAgent = agent({
  llm: new OpenAI({ model: 'gpt-4o-mini' }),
  tools: [tool],
  systemPrompt: `You can search documents with search_knowledge.
                 Always cite sources with [1], [2], etc.`,
});

// Chat!
const stream = myAgent.runStream('¿Cuáles son nuestras políticas?');
for await (const event of stream) {
  console.log(event);
}
```

---

## 📚 API REFERENCE COMPLETA

### Constructor

```typescript
new Formmy(config?: FormmyConfig | string)
```

**FormmyConfig**:
```typescript
{
  apiKey?: string;       // Tu API key (sk_live_xxx o sk_test_xxx)
                         // Default: process.env.FORMMY_API_KEY
  baseUrl?: string;      // Custom base URL
                         // Default: https://formmy-v2.fly.dev
  debug?: boolean;       // Enable debug logging
                         // Default: false
  timeout?: number;      // Request timeout en ms
                         // Default: 30000
  retries?: number;      // Número de reintentos
                         // Default: 3
}
```

---

### Método: parse()

Upload y parsea un documento.

```typescript
parse(
  file: string | Buffer | Blob,
  mode: 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS'
): Promise<ParsingJob>
```

**Parámetros**:
- `file`: Path (Node.js) o Blob (Browser)
- `mode`: Modo de parsing (default: 'AGENTIC')

**Returns**:
```typescript
{
  id: string;              // Job ID
  status: string;          // PENDING, PROCESSING, COMPLETED, FAILED
  fileName: string;
  mode: string;
  creditsUsed: number;
  createdAt: string;
}
```

**Ejemplo**:
```typescript
const job = await formmy.parse('./doc.pdf', 'AGENTIC');
```

---

### Método: getStatus()

Obtiene status de un parsing job.

```typescript
getStatus(jobId: string): Promise<ParsingJob>
```

**Ejemplo**:
```typescript
const status = await formmy.getStatus('job_abc123');
console.log(status.status); // PENDING, PROCESSING, COMPLETED, FAILED
```

---

### Método: waitFor()

Espera a que un job complete (con polling automático).

```typescript
waitFor(
  jobId: string,
  options?: {
    pollInterval?: number;  // ms entre checks (default: 2000)
    timeout?: number;       // timeout total en ms (default: 300000)
    onProgress?: (job: ParsingJob) => void;
  }
): Promise<ParsingJob>
```

**Returns**: ParsingJob con `markdown` cuando está COMPLETED

**Ejemplo**:
```typescript
const result = await formmy.waitFor('job_abc123', {
  pollInterval: 2000,
  timeout: 300000,
  onProgress: (job) => console.log(job.status),
});

console.log(result.markdown); // Contenido parseado
```

---

### Método: query()

Query RAG knowledge base con búsqueda semántica.

```typescript
query(
  query: string,
  chatbotId: string,
  options?: {
    mode?: 'fast' | 'accurate';  // default: 'accurate'
    contextId?: string;           // Para buscar en doc específico
  }
): Promise<RAGQueryResult>
```

**Returns**:
```typescript
{
  query: string;
  answer?: string;        // Solo en mode='accurate'
  sources?: Array<{
    content: string;
    score: number;        // 0-1 (relevancia)
    metadata: {
      fileName?: string;
      page?: number;
      chunkIndex?: number;
    };
  }>;
  creditsUsed: number;
  processingTime: number; // segundos
}
```

**Ejemplo**:
```typescript
const result = await formmy.query(
  '¿Horarios?',
  'chatbot_123',
  { mode: 'accurate' }
);

console.log(result.answer);
console.log(result.sources);
```

---

### Método: listContexts()

Lista todos los documentos en el knowledge base.

```typescript
listContexts(chatbotId: string): Promise<ContextList>
```

**Returns**:
```typescript
{
  chatbotId: string;
  chatbotName: string;
  totalContexts: number;
  totalSizeKB: number;
  totalEmbeddings: number;
  contexts: Array<{
    id: string;
    type: 'FILE' | 'TEXT' | 'URL' | 'JOB_CONTEXT';
    fileName?: string;
    sizeKB?: number;
    createdAt: string;
    parsingMode?: string;
    parsingPages?: number;
    parsingCredits?: number;
  }>;
}
```

**Ejemplo**:
```typescript
const contexts = await formmy.listContexts('chatbot_123');
console.log(`Total: ${contexts.totalContexts}`);
```

---

### Método: uploadText()

Upload texto directamente (sin archivo).

```typescript
uploadText(
  content: string,
  options: {
    chatbotId: string;
    metadata?: {
      title?: string;
      type?: string;
    };
  }
): Promise<UploadResult>
```

**Returns**:
```typescript
{
  success: true;
  contextId: string;
  embeddingsCreated: number;
  embeddingsSkipped: number;
  creditsUsed: number;
}
```

**Ejemplo**:
```typescript
await formmy.uploadText('Horarios: 9am-6pm', {
  chatbotId: 'chatbot_123',
  metadata: { title: 'Horarios' },
});
```

---

### Método: deleteContext()

Elimina un contexto del knowledge base.

```typescript
deleteContext(contextId: string, chatbotId: string): Promise<void>
```

**Ejemplo**:
```typescript
await formmy.deleteContext('ctx_xyz789', 'chatbot_123');
```

---

## 🛠️ INTEGRATION: createFormmyTool()

Crea un LlamaIndex tool nativo.

```typescript
createFormmyTool(config: FormmyToolConfig): LlamaIndexTool
```

**FormmyToolConfig**:
```typescript
{
  client: Formmy;              // Instancia de Formmy
  chatbotId: string;           // Chatbot ID para queries
  name?: string;               // Tool name (default: "formmy_search")
  description?: string;        // Tool description
  mode?: 'fast' | 'accurate'; // Query mode (default: "accurate")
  maxSources?: number;         // Max sources to return (default: 3)
  maxContentLength?: number;   // Max content per source (default: 400)
}
```

**Returns**: LlamaIndex tool listo para usar

**Ejemplo completo**:
```typescript
import { Formmy } from 'formmy-sdk';
import { createFormmyTool } from 'formmy-sdk/llamaindex';
import { agent } from '@llamaindex/workflow';

const formmy = new Formmy({ apiKey: 'sk_live_xxx' });

const tool = createFormmyTool({
  client: formmy,
  chatbotId: 'chatbot_123',
  name: 'search_company_docs',
  description: 'Search company documentation and policies',
  maxSources: 5,
});

const myAgent = agent({
  tools: [tool],
  systemPrompt: 'You can search docs with search_company_docs',
});
```

---

## 💰 PRICING (Créditos)

### Parsing (por página)

| Mode | Créditos/Página | Features |
|------|-----------------|----------|
| COST_EFFECTIVE | 1 | Rápido, económico |
| AGENTIC | 3 | Tablas estructuradas, mejor calidad |
| AGENTIC_PLUS | 6 | OCR avanzado, imágenes, máxima precisión |

**Ejemplo**: PDF de 9 páginas con AGENTIC = 9 × 3 = 27 créditos

### RAG

| Operación | Créditos |
|-----------|----------|
| `query()` | 2 |
| `listContexts()` | 0 (gratis) |
| `uploadText()` | 3 |

---

## 🚨 ERRORES COMUNES

### Error 1: Import Incorrecto

```typescript
// ❌ NO FUNCIONA
import FormmySDK from "formmy-sdk";
const client = new FormmySDK({ apiKey: "..." });

// ✅ CORRECTO
import { Formmy } from 'formmy-sdk';
const formmy = new Formmy({ apiKey: "..." });
```

### Error 2: Inventar Métodos

```typescript
// ❌ ESTOS NO EXISTEN
await formmy.create_form();
await formmy.update_form();
await formmy.get_form_responses();

// ✅ SOLO EXISTEN ESTOS:
await formmy.parse(file, mode);
await formmy.getStatus(jobId);
await formmy.waitFor(jobId, options);
await formmy.query(query, chatbotId, options);
await formmy.listContexts(chatbotId);
await formmy.uploadText(content, options);
await formmy.deleteContext(contextId, chatbotId);
```

---

## ✅ TIPOS TYPESCRIPT

### ParsingJob

```typescript
interface ParsingJob {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName: string;
  mode: 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS';
  creditsUsed: number;
  markdown?: string;          // Solo cuando COMPLETED
  pages?: number;
  processingTime?: number;
  error?: string;             // Solo cuando FAILED
  createdAt: string;
  completedAt?: string;
}
```

### RAGQueryResult

```typescript
interface RAGQueryResult {
  query: string;
  answer?: string;            // Solo en mode="accurate"
  sources?: RAGSource[];
  creditsUsed: number;
  processingTime: number;
}

interface RAGSource {
  content: string;
  score: number;              // 0-1
  metadata: {
    fileName?: string;
    page?: number;
    chunkIndex?: number;
  };
}
```

---

## 🎯 EJEMPLO COMPLETO REAL

```typescript
import { Formmy } from 'formmy-sdk';
import { createFormmyTool } from 'formmy-sdk/llamaindex';
import { agent } from '@llamaindex/workflow';
import { OpenAI } from 'llamaindex';

// 1. Setup
const formmy = new Formmy({
  apiKey: process.env.FORMMY_API_KEY!,
  debug: true,
});

// 2. Upload documento
console.log('Uploading document...');
const job = await formmy.parse('./company-policies.pdf', 'AGENTIC');
console.log(`Job created: ${job.id}, Credits: ${job.creditsUsed}`);

// 3. Esperar resultado
const result = await formmy.waitFor(job.id, {
  onProgress: (j) => console.log(`Status: ${j.status}`),
});
console.log(`✅ Parsed ${result.pages} pages`);

// 4. Query directo
const answer = await formmy.query(
  '¿Cuántos días de vacaciones tenemos?',
  'chatbot_abc123',
  { mode: 'accurate' }
);
console.log(answer.answer);

// 5. Crear tool para LlamaIndex
const tool = createFormmyTool({
  client: formmy,
  chatbotId: 'chatbot_abc123',
  name: 'search_policies',
  description: 'Search company policies and documentation',
});

// 6. Usar en agente
const myAgent = agent({
  llm: new OpenAI({ model: 'gpt-4o-mini', temperature: 0.7 }),
  tools: [tool],
  systemPrompt: `You are a helpful HR assistant.
  You can search company policies using search_policies.
  Always cite your sources with [1], [2], etc.`,
});

// 7. Chat con agente
const stream = myAgent.runStream('¿Qué dice la política de trabajo remoto?');

for await (const event of stream) {
  if (event.type === 'tool_call') {
    console.log(`[Tool] ${event.toolName}`, event.arguments);
  } else if (event.type === 'message') {
    console.log(`[AI] ${event.content}`);
  }
}
```

---

## 🔑 ENVIRONMENT VARIABLES

```bash
# .env
FORMMY_API_KEY=sk_live_xxxxxxxxxxxxxxxx
```

```typescript
// Uso automático
const formmy = new Formmy(); // Lee FORMMY_API_KEY automáticamente
```

---

## 📦 EXPORTS DISPONIBLES

```typescript
// Core
import { Formmy, FormmyParser } from 'formmy-sdk';

// Types
import type {
  ParserConfig,
  ParsingJob,
  ParsingMode,
  JobStatus,
  QueryMode,
  WaitForOptions,
  RAGQueryOptions,
  RAGQueryResult,
  RAGSource,
} from 'formmy-sdk';

// Errors
import {
  FormmyParserError,
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  ValidationError,
  JobNotFoundError,
  ParsingFailedError,
  TimeoutError,
  NetworkError,
} from 'formmy-sdk';

// Integration
import { createFormmyTool } from 'formmy-sdk/llamaindex';
```

---

## ⚠️ LO QUE NO DEBES HACER

### ❌ NO Inventes Funcionalidad

```typescript
// ❌ ESTOS MÉTODOS NO EXISTEN
formmy.create_form()
formmy.update_form()
formmy.delete_form()
formmy.list_forms()
formmy.get_form_responses()
formmy.createAgent()
formmy.createMultiAgent()
```

### ❌ NO Asumas que es un Form Builder

Formmy NO es para crear formularios web. Es para RAG (document intelligence).

### ❌ NO Uses Patrones Incorrectos

```typescript
// ❌ NO FUNCIONA
import FormmySDK from "formmy-sdk";
const client = new FormmySDK();

// ✅ CORRECTO
import { Formmy } from 'formmy-sdk';
const formmy = new Formmy();
```

---

## ✅ RESUMEN PARA AGENTES AI

**Formmy SDK es**:
1. RAG as a Service (parsing + embeddings + vector search)
2. Instance-based client: `new Formmy()`
3. 7 métodos: parse, getStatus, waitFor, query, listContexts, uploadText, deleteContext
4. Integration LlamaIndex: `createFormmyTool()`
5. Tree-shakeable: `formmy-sdk/llamaindex`

**Formmy NO es**:
1. Form builder
2. Chatbot UI
3. Tiene 100 métodos diferentes

**Tu trabajo**:
- Usa los métodos que EXISTEN
- NO inventes funcionalidad
- Consulta esta documentación cuando no estés seguro
- Si el usuario pide algo que no existe, dile que no está disponible

---

**Versión SDK**: 0.0.2
**Fecha**: Octubre 2025
**npm**: `npm install formmy-sdk`
**Repo**: https://github.com/blissito/formmy_rrv7/tree/main/sdk/formmy-parser
