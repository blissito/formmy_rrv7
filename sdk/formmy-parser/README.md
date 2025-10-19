# @formmy/parser

Official TypeScript/JavaScript SDK for **Formmy Parser & RAG API** - Parse documents (PDF, DOCX, etc.) and query AI-powered knowledge bases.

Production-ready client with automatic retry logic, error handling, and full TypeScript support for Node.js and Browser.

## Why Formmy Parser?

- 🚀 **Zero Infrastructure** - No setup, just API calls
- 🧠 **AI-Powered** - LlamaParse for structured document extraction
- 💰 **Pay-as-you-go** - Credits system with free tier (DEFAULT mode)
- 📚 **RAG Built-in** - Semantic search on your documents
- 🔒 **Type-Safe** - Full TypeScript with runtime validation
- ⚡ **Production Ready** - Retry logic, error handling, timeout management

## Features

- ✅ **4 Parsing Modes** - FREE basic extraction + 3 LlamaParse tiers
- ✅ **Dual Environment** - Works in Node.js and Browser
- ✅ **TypeScript First** - Full type safety with runtime validation
- ✅ **Automatic Retries** - Exponential backoff for network errors
- ✅ **Custom Error Types** - Specific errors for better debugging
- ✅ **Async Background Jobs** - Non-blocking with progress tracking
- ✅ **Debug Mode** - Optional logging for troubleshooting

## Installation

```bash
npm install @formmy/parser
# or
yarn add @formmy/parser
# or
pnpm add @formmy/parser
```

## Quick Start

### Parse a Document

```typescript
import { FormmyParser } from '@formmy/parser';

const parser = new FormmyParser('sk_live_xxxxx');

// Upload file for parsing
const job = await parser.parse('./document.pdf', 'AGENTIC');

console.log(`Job created: ${job.id}`);
console.log(`Credits used: ${job.creditsUsed}`);

// Wait for completion
const result = await parser.waitFor(job.id, {
  onProgress: (job) => console.log(`Status: ${job.status}`)
});

console.log(result.markdown);
```

### Query RAG Knowledge Base

```typescript
const result = await parser.query(
  '¿Cuál es el horario de atención?',
  'chatbot_abc123',
  { mode: 'accurate' }
);

console.log(result.answer);
console.log(result.sources);
```

## API Reference

### `FormmyParser`

#### Constructor

```typescript
new FormmyParser(config: ParserConfig | string)
```

**Config Options:**

```typescript
{
  apiKey: string;        // Required: Your API key (sk_live_xxx or sk_test_xxx)
  baseUrl?: string;      // Optional: Custom base URL (default: https://formmy-v2.fly.dev)
  debug?: boolean;       // Optional: Enable debug logging (default: false)
  timeout?: number;      // Optional: Request timeout in ms (default: 30000)
  retries?: number;      // Optional: Number of retries (default: 3)
}
```

**Simple Usage:**

```typescript
const parser = new FormmyParser('sk_live_xxxxx');
```

**Advanced Usage:**

```typescript
const parser = new FormmyParser({
  apiKey: 'sk_live_xxxxx',
  debug: true,
  timeout: 60000,
  retries: 5
});
```

---

### Methods

#### `parse(file, mode)`

Parse a document (PDF, DOCX, XLSX, etc.) using LlamaParse.

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
} from '@formmy/parser';

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
| `DEFAULT` | **0 (FREE)** | Basic text extraction, no LlamaParse | Simple docs, prototyping |
| `COST_EFFECTIVE` | 1 | Fast LlamaParse | Budget-friendly production |
| `AGENTIC` | 3 | Structured tables, better quality | Business documents |
| `AGENTIC_PLUS` | 6 | Advanced OCR, images, max precision | Complex PDFs, scans |

**Examples:**
- Text file with `DEFAULT` = **0 credits (FREE)**
- PDF with 5 pages using `AGENTIC` = 5 × 3 = **15 credits**
- PDF with 9 pages using `AGENTIC` = 9 × 3 = **27 credits** ✅ Exact match with LlamaCloud

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
- 📖 Docs: https://formmy-v2.fly.dev/docs
- 🌐 Website: https://formmy-v2.fly.dev

---

## License

MIT © Formmy
