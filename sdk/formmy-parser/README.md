# formmy-sdk

> **RAG as a Service** - Upload documents, query knowledge. We handle everything.

[![npm version](https://img.shields.io/npm/v/formmy-sdk.svg)](https://www.npmjs.com/package/formmy-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## What is Formmy?

Formmy is a **RAG (Retrieval-Augmented Generation) platform** that manages the entire document intelligence pipeline.

**You focus on**: Upload docs → Query → Get answers
**We handle**: Parsing, chunking, embeddings, vector storage (MongoDB), semantic search

### ✅ Formmy IS:
- 📄 **Document Parser** - PDF, DOCX, XLSX → Structured markdown
- 🔍 **RAG Knowledge Base** - Semantic search with AI-generated answers
- 🤖 **LLM Integration** - Native tools for LlamaIndex, LangChain

### ❌ Formmy is NOT:
- ❌ A form builder (despite the name)
- ❌ A chatbot UI framework
- ❌ Just a parser (it's parsing + RAG + vector DB as a service)

---

## Why Formmy?

- 🚀 **Zero Infrastructure** - No vector DB setup, no embedding models to manage
- 🧠 **AI-Powered Parsing** - Structured extraction with tables, charts, OCR
- 💰 **Pay-as-you-go** - Credits system, no monthly minimums
- 📚 **RAG Built-in** - Upload once, query unlimited times
- 🔒 **Type-Safe** - Full TypeScript with runtime validation
- ⚡ **Production Ready** - Retry logic, error handling, connection pooling

---

## What We Handle For You

### When you upload a document:
1. 📄 Parse with AI (tables, structure, OCR)
2. ✂️ Smart chunking (2000 chars, 5% overlap)
3. 🧬 Generate embeddings (text-embedding-3-small)
4. 💾 Store in MongoDB vector index
5. 🔍 Deduplicate semantically (85% threshold)

### When you query:
1. 🧬 Embed your question
2. 🔍 Vector similarity search
3. 🤖 Generate AI answer with citations
4. 📊 Return answer + source passages

**You just call 2 methods. We do the rest.**

---

## Features

- ✅ **Hybrid Architecture** - Instance-based core + Functional integrations
- ✅ **LlamaIndex Native Tool** - One-line integration with agents
- ✅ **4 Parsing Modes** - FREE basic → Advanced OCR
- ✅ **TypeScript First** - Full type safety with runtime validation
- ✅ **Automatic Retries** - Exponential backoff for network errors
- ✅ **Tree-shakeable** - Modular exports, import only what you need
- ✅ **Debug Mode** - Optional logging for troubleshooting

## Installation

```bash
npm install formmy-sdk
# or
yarn add formmy-sdk
# or
pnpm add formmy-sdk
```

## Quick Start

### 1. Upload a Document

```typescript
import { Formmy } from 'formmy-sdk';

const formmy = new Formmy({
  apiKey: process.env.FORMMY_API_KEY, // or 'sk_live_xxxxx'
});

// Upload document (we parse, chunk, embed, store automatically)
const job = await formmy.parse('./invoice.pdf', 'AGENTIC');
const result = await formmy.waitFor(job.id);

console.log(result.markdown); // Parsed content
console.log(`Credits used: ${result.creditsUsed}`);
```

### 2. Query Knowledge Base

```typescript
// Query your uploaded documents
const answer = await formmy.query('¿Cuál es el total de la factura?', {
  chatbotId: 'chatbot_abc123',
  mode: 'accurate',
});

console.log(answer.answer);
// "El total de la factura es $1,234.56 MXN."

console.log(answer.sources);
// [{ content: "...", score: 0.95, metadata: {...} }]
```

### 3. Upload Text Directly

```typescript
// Upload text content (no file needed)
await formmy.uploadText('Horarios: Lunes a Viernes 9am-6pm', {
  chatbotId: 'chatbot_abc123',
  metadata: { title: 'Horarios de atención' },
});

// Query immediately
const result = await formmy.query('¿Cuál es el horario?', {
  chatbotId: 'chatbot_abc123',
});
```

### 4. Use with LlamaIndex (One Line!)

```typescript
import { Formmy } from 'formmy-sdk';
import { createFormmyTool } from 'formmy-sdk/llamaindex';
import { agent } from '@llamaindex/workflow';

const formmy = new Formmy({ apiKey: 'sk_live_xxx' });

// Create native LlamaIndex tool
const tool = createFormmyTool({
  client: formmy,
  chatbotId: 'chatbot_abc123',
});

// Use in agent
const myAgent = agent({
  tools: [tool],
  systemPrompt: 'You can search documents with formmy_search',
});

// Chat!
const stream = myAgent.runStream('¿Cuáles son nuestras políticas de devolución?');
```

## API Reference

### `Formmy` (Main Client)

The core client for interacting with Formmy's RAG platform.

**Note**: `FormmyParser` is an alias for backward compatibility. New code should use `Formmy`.

#### Constructor

```typescript
new Formmy(config?: FormmyConfig | string)
```

**Config Options:**

```typescript
{
  apiKey?: string;       // Your API key (sk_live_xxx or sk_test_xxx)
                         // Default: process.env.FORMMY_API_KEY
  baseUrl?: string;      // Custom base URL
                         // Default: https://formmy.app
  debug?: boolean;       // Enable debug logging (default: false)
  timeout?: number;      // Request timeout in ms (default: 30000)
  retries?: number;      // Number of retries (default: 3)
}
```

**Simple Usage:**

```typescript
// Reads from process.env.FORMMY_API_KEY
const formmy = new Formmy();

// Or explicit API key
const formmy = new Formmy('sk_live_xxxxx');
```

**Advanced Usage:**

```typescript
const formmy = new Formmy({
  apiKey: 'sk_live_xxxxx',
  debug: true,
  timeout: 60000,
  retries: 5,
});
```

---

### Core Methods

#### `parse(file, mode)`

Upload and parse a document (PDF, DOCX, XLSX, etc.)

Parse a document (PDF, DOCX, XLSX, etc.) with advanced AI extraction.

**Parameters:**

- `file`: `string | Buffer | Blob`
  - **Node.js**: File path (e.g., `'./document.pdf'`)
  - **Browser**: File object or Blob
- `mode`: `'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS'` (default: `'AGENTIC'`)

**Returns:** `Promise<ParsingJob>`

**Example (Node.js):**

```typescript
const job = await parser.parse('./document.pdf', 'AGENTIC');
```

**Example (Browser):**

```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const job = await parser.parse(file, 'AGENTIC_PLUS');
```

---

#### `getStatus(jobId)`

Get the current status of a parsing job.

**Parameters:**

- `jobId`: `string` - The job ID returned from `parse()`

**Returns:** `Promise<ParsingJob>`

**Example:**

```typescript
const status = await parser.getStatus('job_abc123');
console.log(status.status); // PENDING, PROCESSING, COMPLETED, or FAILED
```

---

#### `waitFor(jobId, options)`

Wait for a job to complete with automatic polling.

**Parameters:**

- `jobId`: `string` - The job ID
- `options`: `WaitForOptions` (optional)
  - `pollInterval`: `number` - ms between checks (default: 2000)
  - `timeout`: `number` - total timeout in ms (default: 300000 = 5 min)
  - `onProgress`: `(job: ParsingJob) => void` - callback with current status

**Returns:** `Promise<ParsingJob>` (with `markdown` when completed)

**Example:**

```typescript
const result = await parser.waitFor('job_abc123', {
  pollInterval: 3000,
  timeout: 600000,
  onProgress: (job) => {
    console.log(`Current status: ${job.status}`);
    if (job.status === 'PROCESSING') {
      console.log(`Processing... ${job.pages} pages detected`);
    }
  }
});

console.log(result.markdown);
```

---

#### `query(query, chatbotId, options)`

Query the RAG knowledge base with semantic search.

**Parameters:**

- `query`: `string` - Search query (min 3 characters)
- `chatbotId`: `string` - Chatbot ID to search in
- `options`: `RAGQueryOptions` (optional)
  - `mode`: `'fast' | 'accurate'` (default: `'accurate'`)
  - `contextId`: `string` - For specific document testing

**Returns:** `Promise<RAGQueryResult>`

**Example:**

```typescript
const result = await parser.query(
  '¿Horarios de atención?',
  'chatbot_123',
  { mode: 'accurate' }
);

console.log(`Answer: ${result.answer}`);
console.log(`Credits used: ${result.creditsUsed}`);

result.sources.forEach((source, i) => {
  console.log(`\nSource ${i + 1} (score: ${source.score}):`);
  console.log(source.content);
  console.log(`From: ${source.metadata.fileName}, page ${source.metadata.page}`);
});
```

---

#### `listContexts(chatbotId)`

List all uploaded documents and content in a chatbot's knowledge base.

**Parameters:**

- `chatbotId`: `string` - The chatbot ID to list contexts from

**Returns:** `Promise<ContextList>`

**Example:**

```typescript
const contexts = await formmy.listContexts('chatbot_123');

console.log(`Total contexts: ${contexts.totalContexts}`);
console.log(`Total embeddings: ${contexts.totalEmbeddings}`);
console.log(`Total size: ${contexts.totalSizeKB}KB`);

contexts.contexts.forEach(ctx => {
  console.log(`- ${ctx.fileName || ctx.type} (${ctx.sizeKB}KB)`);
});
```

---

#### `uploadText(content, options)`

Upload text content directly to knowledge base (no file needed).

**Parameters:**

- `content`: `string` - Text content to upload
- `options`: `UploadTextOptions`
  - `chatbotId`: `string` - Required: Chatbot ID
  - `metadata`: `object` - Optional metadata
    - `title`: `string` - Content title
    - `type`: `string` - Content type

**Returns:** `Promise<UploadResult>`

**Example:**

```typescript
await formmy.uploadText('Horarios: Lunes a Viernes 9am-6pm', {
  chatbotId: 'chatbot_123',
  metadata: {
    title: 'Horarios de atención',
    type: 'TEXT',
  },
});

// Query immediately
const result = await formmy.query('¿Cuál es el horario?', {
  chatbotId: 'chatbot_123',
});
```

---

#### `deleteContext(contextId, chatbotId)`

Delete a context (document or text) from the knowledge base.

**Parameters:**

- `contextId`: `string` - The context ID to delete
- `chatbotId`: `string` - The chatbot ID that owns the context

**Returns:** `Promise<void>`

**Example:**

```typescript
await formmy.deleteContext('ctx_xyz789', 'chatbot_123');
```

---

## LlamaIndex Integration

### `createFormmyTool(config)`

Create a native LlamaIndex tool for querying Formmy knowledge base.

**Parameters:**

```typescript
{
  client: Formmy;              // Formmy client instance
  chatbotId: string;           // Chatbot ID to query
  name?: string;               // Tool name (default: "formmy_search")
  description?: string;        // Tool description
  mode?: 'fast' | 'accurate'; // Query mode (default: "accurate")
  maxSources?: number;         // Max sources to return (default: 3)
  maxContentLength?: number;   // Max content length per source (default: 400)
}
```

**Returns:** LlamaIndex tool ready to use in agents

**Example:**

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
  systemPrompt: 'You can search documents with search_company_docs',
});
```

---

## Types

### `ParsingJob`

```typescript
{
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName: string;
  mode: 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS';
  creditsUsed: number;
  markdown?: string;          // Only when status === 'COMPLETED'
  pages?: number;
  processingTime?: number;    // in seconds
  error?: string;             // Only when status === 'FAILED'
  createdAt: string;
  completedAt?: string;
}
```

### `RAGQueryResult`

```typescript
{
  query: string;
  answer?: string;            // Only in mode='accurate'
  sources?: RAGSource[];
  creditsUsed: number;
  processingTime: number;     // in seconds
}
```

---

## Error Handling

The SDK provides specific error types for better error handling:

```typescript
import {
  FormmyParser,
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  ValidationError,
  ParsingFailedError,
  TimeoutError,
  NetworkError
} from 'formmy-sdk';

try {
  const job = await parser.parse('./document.pdf', 'AGENTIC');
  const result = await parser.waitFor(job.id);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof InsufficientCreditsError) {
    console.error(`Need ${error.creditsRequired} credits, have ${error.creditsAvailable}`);
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limit exceeded, retry after ${error.retryAfter}s`);
  } else if (error instanceof ParsingFailedError) {
    console.error(`Parsing failed for job ${error.jobId}`);
  } else if (error instanceof TimeoutError) {
    console.error(`Job ${error.jobId} timed out after ${error.timeoutMs}ms`);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.originalError);
  }
}
```

---

## Pricing (Credits per Page)

| Mode | Credits/Page | Features | Use Case |
|------|--------------|----------|----------|
| `DEFAULT` | **0 (FREE)** | Basic text extraction | Simple docs, prototyping |
| `COST_EFFECTIVE` | 1 | Fast AI extraction | Budget-friendly production |
| `AGENTIC` | 3 | Structured tables, better quality | Business documents |
| `AGENTIC_PLUS` | 6 | Advanced OCR, images, max precision | Complex PDFs, scans |

**Examples:**
- Text file with `DEFAULT` = **0 credits (FREE)**
- PDF with 5 pages using `AGENTIC` = 5 × 3 = **15 credits**
- PDF with 9 pages using `AGENTIC` = 9 × 3 = **27 credits**

**Free Tier:**
- DEFAULT mode is 100% free (basic extraction)
- Perfect for prototyping and simple use cases
- Upgrade to paid modes for production-grade extraction

---

## Advanced Examples

### Parse with Progress Tracking

```typescript
console.log('Starting parse...');

const job = await parser.parse('./large-document.pdf', 'AGENTIC_PLUS');

console.log(`Job ${job.id} created`);
console.log(`Estimated credits: ${job.creditsUsed}`);

const result = await parser.waitFor(job.id, {
  pollInterval: 2000,
  onProgress: (currentJob) => {
    switch (currentJob.status) {
      case 'PENDING':
        console.log('⏳ Job queued...');
        break;
      case 'PROCESSING':
        console.log(`⚙️  Processing ${currentJob.pages} pages...`);
        break;
    }
  }
});

console.log(`✅ Done! Processed ${result.pages} pages in ${result.processingTime}s`);
console.log(`\nFirst 500 chars:\n${result.markdown?.substring(0, 500)}`);
```

### Batch Processing

```typescript
const files = ['doc1.pdf', 'doc2.pdf', 'doc3.pdf'];

// Start all jobs in parallel
const jobs = await Promise.all(
  files.map(file => parser.parse(file, 'AGENTIC'))
);

console.log(`Started ${jobs.length} jobs`);

// Wait for all to complete
const results = await Promise.all(
  jobs.map(job => parser.waitFor(job.id))
);

console.log(`All done! Total pages: ${results.reduce((sum, r) => sum + (r.pages || 0), 0)}`);
```

### RAG Search with Fallback

```typescript
async function searchKnowledgeBase(query: string, chatbotId: string) {
  try {
    // Try accurate mode first
    const result = await parser.query(query, chatbotId, { mode: 'accurate' });
    return result.answer || result.sources?.[0]?.content || 'No answer found';
  } catch (error) {
    console.warn('Accurate search failed, trying fast mode...');
    // Fallback to fast mode
    const result = await parser.query(query, chatbotId, { mode: 'fast' });
    return result.sources?.[0]?.content || 'No results found';
  }
}
```

---

## Environment Variables

For server-side usage, you can set your API key as an environment variable:

```bash
FORMMY_API_KEY=sk_live_xxxxx
```

Then:

```typescript
const parser = new FormmyParser(process.env.FORMMY_API_KEY!);
```

---

## Support

- 📧 Email: support@formmy.app
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/formmy/issues)
- 📖 Docs: https://formmy.app/docs
- 🌐 Website: https://formmy.app

---

## License

MIT © Formmy
