# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
