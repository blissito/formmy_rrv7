# Formmy

**AI-powered forms, chatbots, and document parsing platform** built with React Router v7, LlamaIndex, and OpenRouter.

Production SaaS for creating intelligent chatbots with RAG, tool calling, and document parsing capabilities.

🌐 **Live**: https://formmy-v2.fly.dev
📦 **SDK**: [@formmy/parser](./sdk/formmy-parser)
🔧 **Stack**: React Router v7, Prisma, MongoDB, Fly.io, Stripe, AWS SES

---

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Environment Variables

```bash
# Database
MONGO_ATLAS=mongodb+srv://...

# AI Models
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLAMA_CLOUD_API_KEY=llx-...

# Payments
STRIPE_SECRET_KEY=sk_test_...

# Email
AWS_SES_ACCESS_KEY=...
AWS_SES_SECRET_KEY=...
AWS_SES_REGION=us-east-1
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run deploy  # Deploy to Fly.io
```

---

## 📚 Parser SDK (@formmy/parser)

Production-ready TypeScript SDK for parsing documents and querying RAG knowledge bases.

### Installation

```typescript
import { FormmyParser } from './sdk/formmy-parser';

const parser = new FormmyParser({
  apiKey: 'sk_live_xxxxx',
  baseUrl: 'https://formmy-v2.fly.dev',
  debug: true,
  retries: 3
});
```

### Parse Document (Async Job)

```typescript
// 1. Upload and enqueue parsing job
const job = await parser.parse('./document.pdf', 'AGENTIC');

console.log(`Job ${job.id} created - ${job.creditsUsed} credits`);

// 2. Wait for completion with progress tracking
const result = await parser.waitFor(job.id, {
  pollInterval: 2000,
  timeout: 60000,
  onProgress: (currentJob) => {
    console.log(`Status: ${currentJob.status}`);
  }
});

console.log(result.markdown); // Extracted text
```

### Query RAG Knowledge Base

```typescript
const result = await parser.query(
  '¿Cuál es el horario de atención?',
  'chatbot_abc123',
  { mode: 'accurate' }
);

console.log(result.answer);
console.log(result.sources); // Retrieved chunks with scores
```

### Parsing Modes & Pricing

| Mode | Credits/Page | Features |
|------|--------------|----------|
| `DEFAULT` | **0 (FREE)** | Basic text extraction (no LlamaParse) |
| `COST_EFFECTIVE` | 1 | Fast LlamaParse |
| `AGENTIC` | 3 | Structured tables, better quality |
| `AGENTIC_PLUS` | 6 | OCR, images, max precision |

**Example**: PDF with 9 pages using `AGENTIC` = 9 × 3 = **27 credits**

### Error Handling

```typescript
import {
  AuthenticationError,
  InsufficientCreditsError,
  TimeoutError
} from './sdk/formmy-parser';

try {
  const job = await parser.parse('./doc.pdf', 'AGENTIC');
  const result = await parser.waitFor(job.id);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof InsufficientCreditsError) {
    console.error(`Need ${error.creditsRequired} credits`);
  } else if (error instanceof TimeoutError) {
    console.error(`Timeout after ${error.timeoutMs}ms`);
  }
}
```

**Full SDK Documentation**: [/sdk/formmy-parser/README.md](./sdk/formmy-parser/README.md)

---

## 🤖 Agent Workflows (LlamaIndex)

### Create Agent with Tools

```typescript
import { agent, runStream } from "@llamaindex/workflow";
import { OpenAI } from "llamaindex";

const llm = new OpenAI({
  model: "gpt-4o-mini",
  temperature: 1.0
});

const tools = [
  {
    name: "save_contact",
    description: "Save customer contact information",
    parameters: z.object({
      email: z.string().email(),
      name: z.string()
    }),
    handler: async ({ email, name }) => {
      await db.contact.create({ data: { email, name } });
      return { success: true };
    }
  }
];

const agentInstance = agent({ llm, tools, systemPrompt });
```

### Run Agent with Streaming

```typescript
const events = agentInstance.runStream({
  message: "Save contact: john@example.com, John Doe"
});

for await (const event of events) {
  if (event.type === "agent_stream") {
    process.stdout.write(event.data.delta);
  } else if (event.type === "tool_call") {
    console.log(`Calling tool: ${event.data.tool.name}`);
  }
}
```

### Memory Management (Static Block Pattern)

```typescript
import { createMemory, staticBlock } from "llamaindex";

const memory = createMemory({
  tokenLimit: 8000,
  memoryBlocks: [
    staticBlock({
      content: `Historial:\n\nUser: Hola\nAssistant: ¡Hola! ¿En qué puedo ayudarte?`
    })
  ]
});

const agent = agent({ llm, tools, memory, systemPrompt });
```

**⚠️ IMPORTANT**: Use `staticBlock` for conversation history, NEVER `memory.add()`.

**Location**: `/server/agents/agent-workflow.server.ts`

---

## 🔧 Tool System

### Tool Registry

All tools are registered in `/server/tools/index.ts`:

```typescript
import { z } from "zod";
import type { ToolDefinition } from "./types";

export const TOOLS: ToolDefinition[] = [
  {
    name: "save_contact",
    description: "Save customer contact information to CRM",
    parameters: z.object({
      email: z.string().email(),
      name: z.string().optional(),
      phone: z.string().optional()
    }),
    cost: 1, // Credits per call
    handler: async (args, context) => {
      const contact = await db.contact.create({
        data: {
          ...args,
          chatbotId: context.chatbotId,
          conversationId: context.conversationId
        }
      });
      return { success: true, contactId: contact.id };
    }
  }
];
```

### Tool Access by Plan

```typescript
const TOOL_ACCESS = {
  FREE: [],
  STARTER: ["save_contact", "get_datetime", "web_search"],
  PRO: ["save_contact", "get_datetime", "web_search", "create_payment_link"],
  ENTERPRISE: ["*"], // All tools
  TRIAL: ["*"]
};
```

### Tool Credits System

```typescript
// Dual credit system
interface User {
  toolCreditsUsed: number;      // Monthly credits (reset every month)
  purchasedCredits: number;     // Purchased credits (permanent)
  creditsResetAt: Date;
  lifetimeCreditsUsed: number;
}

// Consumption order: Monthly first, then purchased
async function consumeCredits(userId: string, amount: number) {
  const user = await db.user.findUnique({ where: { id: userId } });

  const plan = PLANS[user.plan];
  const monthlyAvailable = plan.toolCreditsPerMonth - user.toolCreditsUsed;

  if (monthlyAvailable >= amount) {
    // Use monthly credits
    await db.user.update({
      where: { id: userId },
      data: { toolCreditsUsed: { increment: amount } }
    });
  } else {
    // Use purchased credits
    const remaining = amount - monthlyAvailable;
    await db.user.update({
      where: { id: userId },
      data: {
        toolCreditsUsed: { increment: monthlyAvailable },
        purchasedCredits: { decrement: remaining }
      }
    });
  }
}
```

**Location**: `/server/llamaparse/credits.service.ts`

---

## 🗄️ RAG (Agentic RAG with MongoDB Vector Search)

### Vector Index Configuration

```typescript
// MongoDB Atlas Vector Search Index: vector_index_2
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "chatbotId"
    }
  ]
}
```

### Embedding & Indexing

```typescript
import { OpenAIEmbedding } from "llamaindex";

const embedModel = new OpenAIEmbedding({
  model: "text-embedding-3-small",
  dimensions: 768
});

// Create embeddings
const chunks = await chunkDocument(markdown, {
  chunkSize: 2000,
  chunkOverlap: 200
});

for (const chunk of chunks) {
  const embedding = await embedModel.getTextEmbedding(chunk.content);

  await db.embedding.create({
    data: {
      chatbotId,
      content: chunk.content,
      embedding,
      metadata: { fileName, page: chunk.page }
    }
  });
}
```

### Vector Search Query

```typescript
const queryEmbedding = await embedModel.getTextEmbedding(query);

const results = await db.embedding.aggregateRaw({
  pipeline: [
    {
      $vectorSearch: {
        index: "vector_index_2",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 50,
        limit: 5,
        filter: { chatbotId: { $eq: chatbotId } }
      }
    },
    {
      $project: {
        content: 1,
        score: { $meta: "vectorSearchScore" },
        metadata: 1
      }
    }
  ]
});
```

### Search Tool (Cascading Pattern)

```typescript
const searchTool = {
  name: "search_context",
  description: "Search company knowledge base",
  handler: async ({ query }, { chatbotId }) => {
    // 1. Try vector search (2+ reformulated attempts)
    let results = await vectorSearch(query, chatbotId);

    if (results.length === 0) {
      const reformulated = await reformulateQuery(query);
      results = await vectorSearch(reformulated, chatbotId);
    }

    // 2. Fallback to web search if no results
    if (results.length === 0) {
      results = await webSearch(query);
    }

    // 3. Return results or "not found" message
    return results.length > 0
      ? results
      : "Busqué pero no encontré información";
  }
};
```

**Location**: `/server/vector/auto-vectorize.service.ts`

---

## 🔌 Composio Integrations

### Configuration (Centralized)

```typescript
// /server/integrations/composio-config.ts
export const COMPOSIO_INTEGRATIONS = {
  WHATSAPP: {
    appName: "whatsapp",
    authScheme: "API_KEY" as const,
    expectedFields: ["phoneNumberId", "accessToken"],
    tools: ["send_whatsapp_message", "list_whatsapp_conversations"]
  },
  GMAIL: {
    appName: "gmail",
    authScheme: "OAUTH2" as const,
    tools: ["send_gmail", "read_gmail"]
  }
};
```

### Entity Management Pattern

```typescript
import { Composio } from "composio-core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// Entity = chatbot_${chatbotId}
const entityId = `chatbot_${chatbotId}`;

// Check connection
const connections = await composio.connectedAccounts.list({
  userId: entityId
});

const isConnected = connections.some(
  conn => conn.toolkit?.slug === "gmail" && conn.status === "ACTIVE"
);
```

### Execute Tool with Composio

```typescript
const result = await composio.tools.execute("GMAIL_SEND_EMAIL", {
  userId: entityId,
  arguments: {
    to: ["recipient@example.com"],
    subject: "Hello from Formmy",
    body: "Email sent via Composio integration"
  }
});

const data = (result as any).data;
```

**Location**: `/server/integrations/composio-config.ts`

---

## 📊 Model Temperatures (Centralized)

```typescript
// /server/config/model-temperatures.ts
export const MODEL_TEMPERATURES = {
  // OpenAI
  "gpt-4o-mini": 1.0,
  "gpt-4o": 1.0,
  "gpt-5": 0.7,

  // Anthropic
  "claude-3-haiku-20240307": 0.8,
  "claude-3-5-sonnet-20241022": 0.7,

  // Gemini
  "gemini-2.0-flash-exp": 0.7
};

// Validation: temp > 1.5 → force to 1.0
export function getValidTemperature(model: string, temp?: number): number {
  const defaultTemp = MODEL_TEMPERATURES[model] || 1.0;
  const finalTemp = temp ?? defaultTemp;
  return finalTemp > 1.5 ? 1.0 : finalTemp;
}
```

---

## 🎯 Background Jobs (Agenda.js)

### Setup

```typescript
import Agenda from "agenda";

const agenda = new Agenda({
  db: {
    address: process.env.MONGO_ATLAS!,
    collection: "agendaJobs"
  },
  processEvery: "10 seconds",
  maxConcurrency: 5
});

agenda.start();
```

### Define Worker

```typescript
// /server/jobs/workers/parser-worker.ts
export function registerParserWorker() {
  const agenda = getAgenda();

  agenda.define("process-parsing-job",
    { priority: "high", concurrency: 3 },
    async (job) => {
      const { jobId, fileUrl, fileKey } = job.attrs.data;
      await processParsingJob(jobId, fileUrl, fileKey);
    }
  );
}
```

### Enqueue Job

```typescript
export async function enqueueParsingJob(data: {
  jobId: string;
  fileUrl: string;
  fileKey: string;
}) {
  const agenda = getAgenda();
  await agenda.now("process-parsing-job", data);
}
```

**Location**: `/server/jobs/agenda.server.ts`

---

## 💳 Stripe Integration

### Plans & Pricing (MXN)

```typescript
export const PLANS = {
  FREE: { price: 0, conversations: 0, chatbots: 0, credits: 0 },
  STARTER: {
    price: 149,
    conversations: 50,
    chatbots: 2,
    credits: 200,
    priceId: "price_1S5AqX..."
  },
  PRO: {
    price: 499,
    conversations: 250,
    chatbots: 10,
    credits: 1000,
    priceId: "price_1S5CqA..."
  },
  ENTERPRISE: {
    price: 1499,
    conversations: 1000,
    chatbots: Infinity,
    credits: 5000
  }
};
```

### Create Checkout Session

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [{
    price: PLANS.PRO.priceId,
    quantity: 1
  }],
  customer_email: user.email,
  success_url: `${baseUrl}/dashboard?success=true`,
  cancel_url: `${baseUrl}/dashboard?canceled=true`,
  metadata: { userId: user.id }
});
```

### Webhook Handler

```typescript
export async function handleStripeWebhook(request: Request) {
  const sig = request.headers.get("stripe-signature")!;
  const event = stripe.webhooks.constructEvent(
    await request.text(),
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await db.user.update({
      where: { id: session.metadata.userId },
      data: { plan: "PRO" }
    });
  }
}
```

---

## 📧 Email System (AWS SES)

### Email Templates

```typescript
// /server/email/templates.ts
export const EMAIL_TEMPLATES = {
  WELCOME: (userName: string) => ({
    subject: "Bienvenido a Formmy",
    html: `<h1>¡Hola ${userName}!</h1><p>Gracias por unirte...</p>`
  }),

  TRIAL_ENDING: (daysLeft: number) => ({
    subject: `Tu trial expira en ${daysLeft} días`,
    html: `<p>Upgrade ahora y continúa usando Formmy...</p>`
  })
};
```

### Send Email

```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SES_SECRET_KEY!
  }
});

await ses.send(new SendEmailCommand({
  Source: "Formmy <notificaciones@formmy.app>",
  Destination: { ToAddresses: [user.email] },
  Message: {
    Subject: { Data: template.subject },
    Body: { Html: { Data: template.html } }
  }
}));
```

---

## 🏗️ Architecture

### Stack

- **Frontend**: React Router v7, Tailwind CSS
- **Backend**: React Router v7 Server Functions
- **Database**: MongoDB Atlas (Prisma ORM)
- **AI**: LlamaIndex, OpenRouter, OpenAI
- **Hosting**: Fly.io
- **Payments**: Stripe
- **Email**: AWS SES
- **Jobs**: Agenda.js

### Key Directories

```
/app
  /routes          # React Router v7 routes
  /components      # React components
/server
  /agents          # LlamaIndex agent workflows
  /tools           # Tool definitions & handlers
  /jobs            # Agenda.js workers
  /integrations    # Composio, Stripe, etc.
  /vector          # RAG & embeddings
  /llamaparse      # Document parsing
/sdk
  /formmy-parser   # TypeScript SDK for Parser API
/prisma
  schema.prisma    # Database schema
```

---

## 🧪 Testing

### Run Parser SDK Test

```bash
FORMMY_TEST_API_KEY=sk_live_xxxxx npx tsx scripts/test-parser-sdk.ts
```

### Run Agent Test

```bash
npx tsx scripts/test-agent-workflow.js
```

### Run RAG Test

```bash
npx tsx scripts/test-agentic-rag.ts
```

---

## 📦 Deployment

### Fly.io

```bash
npm run build
npm run deploy
```

### Environment Variables (Production)

Set secrets in Fly.io:

```bash
fly secrets set MONGO_ATLAS=mongodb+srv://...
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set LLAMA_CLOUD_API_KEY=llx-...
fly secrets set STRIPE_SECRET_KEY=sk_live_...
```

---

## 🤝 Contributing

Built with ❤️ by [@BrendaOrtega](https://github.com/BrendaOrtega) & [@blissito](https://github.com/blissito)

---

## 📄 License

Proprietary - All rights reserved

---

## 🔗 Links

- 🌐 **Production**: https://formmy-v2.fly.dev
- 📧 **Support**: support@formmy.app
- 🐛 **Issues**: [GitHub Issues](https://github.com/blissito/formmy_rrv7/issues)
- 📚 **SDK Docs**: [/sdk/formmy-parser/README.md](./sdk/formmy-parser/README.md)
