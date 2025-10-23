# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-10-23

### Fixed
- 🐛 **Critical**: DEFAULT mode (free parsing) now works - installed missing `pdf-parse` dependency
- 🐛 **Critical**: ESM imports now include `.js` extensions for proper Node.js ESM compatibility
- 🔧 **TypeScript**: Updated tsconfig to use `module: "Node16"` for correct ESM output

### Changed
- 📦 Added `pdf-parse` as production dependency for DEFAULT parsing mode

## [1.0.2] - 2025-10-23

### Added
- 🎯 **Hybrid Architecture**: Instance-based core + Functional integrations pattern
- 🤖 **LlamaIndex Integration**: Native tool creation with `createFormmyTool()`
- 📦 **New Methods**:
  - `listContexts(chatbotId)` - List all documents in knowledge base
  - `uploadText(content, options)` - Upload text content directly
  - `deleteContext(contextId, chatbotId)` - Delete context from knowledge base
- 📖 **README Rewrite**: Clear "RAG as a Service" concept from line 1
- 🔧 **Modular Exports**: `formmy-sdk/llamaindex` for tree-shakeable imports
- 📝 **Enhanced Documentation**: Complete API reference with examples

### Fixed
- 🐛 **Critical Bug**: RAG endpoint corrected from `/api/rag/v1` to `/api/v1/rag`
- 🔧 **TypeScript**: Added missing `ValidationError` import

### Changed
- ✨ **Main Class**: `FormmyParser` → `Formmy` (with backward compatible alias)
- 📝 **Description**: Updated to reflect "RAG as a Service" positioning
- 🏷️ **Keywords**: Improved discoverability with RAG-focused terms
- 📋 **Dependencies**: Added optional peerDependencies for llamaindex and zod

### Migration Guide
**From 1.0.1 to 1.0.2**: All v1.0.x code continues to work. No breaking changes.

New capabilities:
```typescript
import { Formmy } from 'formmy-sdk';
import { createFormmyTool } from 'formmy-sdk/llamaindex';

const formmy = new Formmy({ apiKey: 'sk_live_xxx' });

// New methods
await formmy.listContexts('chatbot_123');
await formmy.uploadText('content', { chatbotId: 'chatbot_123' });
await formmy.deleteContext('ctx_xyz', 'chatbot_123');

// LlamaIndex integration
const tool = createFormmyTool({ client: formmy, chatbotId: 'chatbot_123' });
```

## [1.0.0] - 2025-01-20

### Added
- Initial release of formmy-sdk
- Full TypeScript support with runtime validation
- Document parsing with 4 modes: DEFAULT (free), COST_EFFECTIVE, AGENTIC, AGENTIC_PLUS
- RAG query support with fast and accurate modes
- Automatic retry logic with exponential backoff
- Custom error types for better error handling:
  - `AuthenticationError`
  - `InsufficientCreditsError`
  - `RateLimitError`
  - `ValidationError`
  - `JobNotFoundError`
  - `ParsingFailedError`
  - `TimeoutError`
  - `NetworkError`
- Support for Node.js and Browser environments
- Async job polling with progress callbacks
- Debug mode for troubleshooting
- Configurable timeout and retry settings
- Complete API documentation in README
- TypeScript declarations (.d.ts) with source maps

### Features
- ✅ Parse PDF, DOCX, XLSX, and other documents
- ✅ Query knowledge bases with semantic search
- ✅ Wait for job completion with automatic polling
- ✅ Track parsing progress in real-time
- ✅ Handle files from paths, Buffers, or Blobs
- ✅ Full type safety with runtime validation
- ✅ Production-ready error handling

### Documentation
- Complete README with installation, usage, and examples
- API reference for all methods and types
- Error handling guide
- Pricing information
- Advanced examples (batch processing, progress tracking, RAG search)
