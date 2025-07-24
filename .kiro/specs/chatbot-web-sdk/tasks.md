# Implementation Plan

- [-] 1. Set up API Key system and database models

  - Create ApiKey model in Prisma schema with security and usage tracking fields
  - Add enableStreaming and streamingSpeed fields to existing Chatbot model
  - Run `npx prisma generate` to update Prisma client
  - _Requirements: API key authentication, streaming configuration_

- [ ] 2. Implement API key authentication middleware

  - Create authenticateApiKey function with rate limiting and usage tracking
  - Add checkRateLimit function for hourly request limits
  - Implement updateKeyUsage function for analytics
  - _Requirements: API key validation, rate limiting, usage tracking_

- [ ] 3. Create SDK API endpoints using flatRoutes

  - [ ] 3.1 Implement dynamic script generation endpoint

    - Create app/routes/api.sdk.$apiKey[.]js.ts for personalized script delivery
    - Add script template generation with user config embedded
    - Implement caching strategy with 1-hour cache duration
    - _Requirements: Dynamic script generation, API key validation_

  - [ ] 3.2 Implement chatbot discovery endpoint

    - Create app/routes/api.sdk.chatbots.ts for fetching user's active chatbots
    - Include streaming configuration in chatbot data
    - Add slug-based filtering support
    - _Requirements: Chatbot discovery, streaming configuration_

  - [ ] 3.3 Implement chat conversation endpoint with streaming
    - Create app/routes/api.sdk.chat.ts for handling chat messages
    - Add streaming response support using Server-Sent Events
    - Implement createStreamingResponse generator function
    - Add fallback to regular JSON response when streaming disabled
    - _Requirements: Chat processing, streaming support, API key authentication_

- [ ] 4. Build React component compiler for vanilla JS

  - [ ] 4.1 Create component compilation system

    - Build app/sdk/compiler.ts to convert React components to vanilla JS
    - Extract MessageBubble, ChatInput, ChatHeader components
    - Generate vanilla JS equivalents maintaining same functionality
    - _Requirements: Component reusability, vanilla JS conversion_

  - [ ] 4.2 Implement streaming-specific components
    - Add showTypingIndicator and hideTypingIndicator functions
    - Create handleStreamingResponse for Server-Sent Events processing
    - Implement character-by-character typing effect
    - _Requirements: Streaming support, typing effect_

- [ ] 5. Create vanilla JS SDK widget

  - [ ] 5.1 Build core widget functionality

    - Create app/sdk/widget-vanilla.ts with chat interface
    - Implement sendMessage function with streaming detection
    - Add DOM manipulation for chat UI creation
    - _Requirements: Chat interface, vanilla JS implementation_

  - [ ] 5.2 Implement streaming message handling
    - Add handleStreamingResponse function for real-time message display
    - Implement typing indicator management
    - Create character-by-character text animation
    - _Requirements: Streaming support, real-time updates_

- [ ] 6. Build SDK bundling and deployment system

  - Create build process for generating lightweight SDK bundles
  - Implement CDN strategy for script delivery
  - Add cache invalidation when chatbot configurations change
  - Write deployment scripts for SDK distribution
  - _Requirements: Lightweight delivery, CDN distribution_

- [ ] 7. Add comprehensive error handling and validation

  - Implement client-side error handling for network failures
  - Add server-side validation for all API endpoints
  - Create graceful fallbacks when streaming fails
  - Add proper error messages for invalid API keys
  - _Requirements: Error handling, graceful degradation_

- [ ] 8. Implement usage analytics and monitoring

  - Add request logging for API key usage tracking
  - Implement monthly usage counters and plan limit enforcement
  - Create analytics dashboard integration for SDK usage metrics
  - Add monitoring for streaming performance and error rates
  - _Requirements: Usage tracking, analytics, monitoring_

- [ ] 9. Optimize performance and bundle size
  - Minimize SDK bundle size to target < 10KB
  - Implement lazy loading for non-essential features
  - Add compression and minification to build process
  - Optimize streaming performance and reduce latency
  - _Requirements: Performance optimization, lightweight delivery_
