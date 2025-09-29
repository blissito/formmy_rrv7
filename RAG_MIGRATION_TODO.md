# RAG Migration TODO - Vectorization Implementation Plan

> **Goal**: Migrate from current context injection system to MongoDB Atlas Vector Search with embeddings for scalable RAG (Retrieval-Augmented Generation)

## 📋 Current State Analysis

### Current Context System
- **Storage**: Context data stored in `Context` model (MongoDB/Prisma)
- **Types**: FILE, LINK, TEXT, QUESTION contexts per chatbot
- **Injection**: Raw text concatenation in system prompts
- **Limitations**:
  - Token explosion with large contexts (>50MB impossible)
  - No semantic search capabilities
  - Linear scaling issues with context size
  - No relevance ranking for retrieval

### Current Context Schema
```prisma
model Context {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  chatbotId   String   @db.ObjectId
  type        String   // FILE, LINK, TEXT, QUESTION
  title       String
  content     String?  // Raw text content
  fileUrl     String?
  sizeKB      Int?
  createdAt   DateTime @default(now())
}
```

## 🎯 Migration Strategy

### Phase 1: Infrastructure Setup (2-3 weeks)

#### 1.1 MongoDB Atlas Vector Search Setup
- [ ] **Enable Vector Search** on MongoDB Atlas cluster
  - Navigate to Atlas Search → Create Search Index
  - Choose "Vector Search" type
  - Configure embedding dimensions (1536 for OpenAI ada-002)

- [ ] **Create Vector Index Configuration**
  ```json
  {
    "name": "vector_index",
    "type": "vectorSearch",
    "fields": [
      {
        "path": "embedding",
        "type": "vector",
        "numDimensions": 1536,
        "similarity": "cosine"
      },
      {
        "path": "chatbotId",
        "type": "filter"
      },
      {
        "path": "contextType",
        "type": "filter"
      }
    ]
  }
  ```

#### 1.2 New Database Schema Design
- [ ] **Create VectorEmbedding Model**
  ```prisma
  model VectorEmbedding {
    id           String   @id @default(auto()) @map("_id") @db.ObjectId
    chatbotId    String   @db.ObjectId
    originalId   String   @db.ObjectId // Reference to original Context
    chunkId      String   // For large documents split into chunks
    content      String   // Text chunk content
    embedding    Float[]  // Vector embedding array [1536]
    metadata     Json     // { type, title, source, chunkIndex }
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    chatbot Chatbot @relation(fields: [chatbotId], references: [id])
    @@index([chatbotId, chunkId])
    @@index([originalId])
  }
  ```

- [ ] **Extend Context Model**
  ```prisma
  model Context {
    // ... existing fields
    isVectorized     Boolean @default(false)
    vectorizedAt     DateTime?
    chunkCount       Int?     // Number of chunks created
    embeddingStatus  String?  // 'pending', 'processing', 'completed', 'failed'

    vectorEmbeddings VectorEmbedding[]
  }
  ```

#### 1.3 Embedding Service Implementation
- [ ] **Create Embedding Provider Service** (`/server/embeddings/provider.server.ts`)
  - OpenAI Embeddings API integration
  - Batch processing support (up to 100 texts per request)
  - Error handling and retry logic
  - Cost tracking per embedding generation

- [ ] **Implement Text Chunking Service** (`/server/embeddings/chunker.server.ts`)
  - Intelligent text splitting (respect sentence boundaries)
  - Configurable chunk sizes (default: 1000 tokens, 200 overlap)
  - Preserve context across chunks with metadata
  - Support for different content types (PDF, DOCX, TXT, URLs)

### Phase 2: Vectorization Pipeline (1-2 weeks)

#### 2.1 Background Processing System
- [ ] **Create Vectorization Queue** (using agenda.js or Bull)
  ```typescript
  interface VectorizationJob {
    contextId: string;
    chatbotId: string;
    priority: 'high' | 'normal' | 'low';
    retryCount: number;
  }
  ```

- [ ] **Implement Vectorization Worker** (`/server/workers/vectorization.server.ts`)
  - Process contexts asynchronously
  - Generate embeddings for text chunks
  - Store in VectorEmbedding collection
  - Update Context status
  - Handle failures gracefully

#### 2.2 Context Processing Pipeline
- [ ] **Automatic Vectorization Triggers**
  - On new context creation
  - On context updates
  - Bulk processing for existing contexts
  - Re-vectorization when content changes

- [ ] **Content Preprocessing**
  - Text extraction from PDFs, DOCX files
  - URL content scraping and cleaning
  - Text normalization and cleaning
  - Language detection and optimization

### Phase 3: RAG Implementation (2-3 weeks)

#### 3.1 Vector Search Service
- [ ] **Create Vector Search Service** (`/server/rag/vector-search.server.ts`)
  ```typescript
  interface VectorSearchOptions {
    query: string;
    chatbotId: string;
    limit?: number;
    scoreThreshold?: number;
    contextTypes?: string[];
  }

  interface SearchResult {
    content: string;
    score: number;
    metadata: {
      contextType: string;
      title: string;
      chunkIndex: number;
    };
  }
  ```

- [ ] **Implement Semantic Search**
  - Generate query embedding
  - Perform vector similarity search using MongoDB Atlas Vector Search
  - Filter by chatbot and context type
  - Return ranked results with relevance scores

#### 3.2 RAG Query Processing
- [ ] **Create RAG Service** (`/server/rag/rag-service.server.ts`)
  - Query analysis and embedding generation
  - Relevant context retrieval (top-k results)
  - Context ranking and filtering by relevance
  - Dynamic context injection based on query

- [ ] **Smart Context Selection**
  - Relevance threshold filtering (e.g., >0.75 similarity)
  - Token budget management (max tokens for context)
  - Context diversity to avoid redundancy
  - Metadata-aware context selection

#### 3.3 LlamaIndex Integration
- [ ] **Integrate with AgentEngine_v0** (`/server/agents/agent-v0.server.ts`)
  - Replace current context injection with RAG retrieval
  - Implement context-aware tool selection
  - Maintain backwards compatibility during transition

- [ ] **Create RAG-Aware Prompts**
  - Dynamic prompt construction with retrieved contexts
  - Context source attribution in responses
  - Confidence scoring for RAG answers

### Phase 4: Migration & Optimization (1-2 weeks)

#### 4.1 Gradual Migration Strategy
- [ ] **Feature Flag Implementation**
  ```typescript
  const useVectorRAG = process.env.ENABLE_VECTOR_RAG === 'true';
  ```

- [ ] **A/B Testing Setup**
  - Compare current system vs RAG responses
  - Quality metrics tracking
  - Performance benchmarking
  - User satisfaction metrics

#### 4.2 Performance Optimization
- [ ] **Embedding Caching Strategy**
  - Cache frequently accessed embeddings in Redis
  - Implement embedding TTL and refresh strategies
  - Optimize batch processing for large contexts

- [ ] **Search Optimization**
  - Index optimization for vector queries
  - Query result caching for repeated searches
  - Precompute embeddings for common queries

## 🛠️ Technical Implementation Details

### MongoDB Atlas Vector Search Configuration

```javascript
// Vector Search Index Configuration
db.vectorEmbeddings.createSearchIndex(
  "vector_index",
  {
    "mappings": {
      "dynamic": false,
      "fields": {
        "embedding": {
          "type": "knnVector",
          "dimensions": 1536,
          "similarity": "cosine"
        },
        "chatbotId": { "type": "string" },
        "contextType": { "type": "string" }
      }
    }
  }
);
```

### Vector Search Query Example

```typescript
const searchResults = await db.collection('vectorEmbeddings').aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: queryEmbedding, // [1536] array
      numCandidates: 100,
      limit: 10,
      filter: {
        chatbotId: { $eq: chatbotId }
      }
    }
  },
  {
    $project: {
      content: 1,
      metadata: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
]).toArray();
```

### Embedding Generation Pipeline

```typescript
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: texts,
    encoding_format: "float"
  });

  return response.data.map(item => item.embedding);
}
```

## 📊 Expected Benefits

### Performance Improvements
- **Scalability**: Handle 50MB+ contexts per chatbot
- **Speed**: Sub-200ms semantic search vs full-text scanning
- **Relevance**: Semantic similarity vs keyword matching
- **Token Efficiency**: Only relevant context injected (80% token reduction)

### Business Impact
- **Enterprise Features**: Large document support for Enterprise plans
- **Better Responses**: More contextually relevant answers
- **Cost Optimization**: Reduced token usage = lower AI costs
- **Competitive Advantage**: Advanced RAG capabilities

## 💰 Cost Estimation

### OpenAI Embedding Costs
- **Text Embedding Ada-002**: $0.0001 per 1K tokens
- **Example**: 1MB document (~250K tokens) = $0.025 per document
- **Monthly**: ~$50-100 for typical usage patterns

### Infrastructure Costs
- **MongoDB Atlas Vector Search**: Included in M10+ clusters
- **Additional Storage**: ~$0.25/GB/month for vector data
- **Processing**: Minimal additional compute costs

## ⚠️ Migration Risks & Mitigation

### Technical Risks
1. **Query Latency**: Vector search adds ~100-200ms
   - **Mitigation**: Implement result caching, optimize index
2. **Storage Growth**: Vector data is ~4x larger than text
   - **Mitigation**: Implement data cleanup policies, chunking optimization
3. **Embedding Quality**: Poor embeddings = irrelevant results
   - **Mitigation**: A/B test different embedding models, tune chunk sizes

### Business Risks
1. **Migration Downtime**: Service interruption during deployment
   - **Mitigation**: Feature flags, gradual rollout, rollback plan
2. **Cost Increase**: Embedding generation and storage costs
   - **Mitigation**: Cost monitoring, usage limits, Enterprise plan pricing

## 📅 Implementation Timeline

**Week 1-2**: Infrastructure setup, schema design
**Week 3-4**: Vectorization pipeline implementation
**Week 5-6**: RAG service development
**Week 7-8**: LlamaIndex integration, testing
**Week 9-10**: Migration, optimization, monitoring

**Total Estimated Time**: 10 weeks (2.5 months)
**Required Resources**: 1 senior developer + DevOps support

## 🎯 Success Metrics

### Technical KPIs
- [ ] **Query Response Time**: <500ms average with RAG
- [ ] **Context Relevance**: >80% relevant context in responses
- [ ] **Token Reduction**: 60-80% reduction in context tokens
- [ ] **System Uptime**: >99.9% during migration

### Business KPIs
- [ ] **User Satisfaction**: Improved response quality scores
- [ ] **Enterprise Adoption**: 50%+ Enterprise users using RAG features
- [ ] **Cost Efficiency**: 30% reduction in AI API costs
- [ ] **Document Processing**: Support for 10MB+ documents

## 📚 Resources & Documentation

### MongoDB Atlas Vector Search
- [Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-search/field-types/knn-vector/)
- [Best Practices Guide](https://www.mongodb.com/developer/products/atlas/building-with-mongodb-atlas-vector-search/)

### OpenAI Embeddings
- [Embeddings API Guide](https://platform.openai.com/docs/guides/embeddings)
- [Best Practices](https://platform.openai.com/docs/guides/embeddings/what-are-embeddings)

### LlamaIndex RAG Patterns
- [RAG Implementation](https://docs.llamaindex.ai/en/stable/understanding/putting_it_all_together/rag/)
- [Vector Stores](https://docs.llamaindex.ai/en/stable/module_guides/storing/vector_stores/)

---

> **Next Steps**: Review and approve this migration plan, then begin with Phase 1 infrastructure setup when ready to implement advanced RAG capabilities.