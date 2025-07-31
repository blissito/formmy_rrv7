# Implementation Plan

- [x] 1. Set up project dependencies and Effect-TS integration

  - Install Effect-TS packages (@effect/core, @effect/platform, @effect/schema)
  - Configure TypeScript for Effect-TS usage
  - Remove existing duplicate WhatsApp service files
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create core types and error definitions

  - Define WhatsAppError, ConfigurationError, ValidationError, and ApiError classes using Effect Data
  - Create MessageResponse, IncomingMessage, and MessageType interfaces
  - Implement branded types for phone numbers, message text, and template names using Effect Schema
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3. Implement configuration management with Effect Config

  - Create WhatsAppConfig interface with all required fields
  - Implement WhatsAppConfigSchema using Effect Config for environment variable reading
  - Add configuration validation with proper error messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Build validation layer using Effect Schema

  - Implement PhoneNumberSchema with regex validation and formatting
  - Create MessageTextSchema with length validation
  - Build TemplateNameSchema with pattern validation
  - Add MimeTypeSchema and file size validation schemas
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5. Create HTTP client integration with Effect Platform

  - Set up HttpClient configuration for WhatsApp Business API
  - Implement base URL construction and authentication headers
  - Create request/response schemas for API endpoints
  - _Requirements: 1.3, 2.1, 2.2_

- [x] 6. Implement retry mechanism with Effect Schedule

  - Create exponential backoff retry schedule
  - Implement retry logic that distinguishes between client (4xx) and server (5xx) errors
  - Add maximum retry attempts configuration
  - Configure retry delays and backoff multipliers
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Build message sending functionality

  - Implement sendTextMessage with validation and retry logic
  - Create sendTemplateMessage with template validation
  - Build sendImageMessage with URL validation
  - Add generic sendMessage method with Effect error handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 8. Implement media handling capabilities

  - Create uploadMedia method with file validation and Effect error handling
  - Implement getMediaUrl for retrieving media information
  - Build downloadMedia with authentication and buffer handling
  - Add file size and MIME type validation
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 9. Build webhook processing system

  - Implement webhook signature verification using Effect
  - Create processWebhook method with payload validation
  - Build webhook payload schemas and validation
  - Add incoming message processing and mapping
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Implement comprehensive error handling

  - Create centralized error handling with Effect Match
  - Implement error classification and logging
  - Add error recovery strategies for different error types
  - Build error mapping from HTTP responses to domain errors
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 11. Add structured logging with Effect Logger

  - Implement message sending success logging
  - Create error logging with context and stack traces
  - Add webhook processing event logging
  - Build configuration error logging with field details
  - Implement sensitive data masking for phone numbers and tokens
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.4_

- [ ] 12. Create service layer and dependency injection

  - Build WhatsAppServiceImpl class implementing the service interface
  - Create WhatsAppServiceLive layer with proper dependency injection
  - Implement service factory with configuration validation
  - Add service initialization with Effect Layer composition
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 13. Consolidate into single service file

  - Merge all functionality into server/integrations/whatsapp/WhatsAppService.ts
  - Remove duplicate service files (WhatsAppBusinessService.ts and whatsapp.service.ts)
  - Update all imports and references to use the new consolidated service
  - Export service instance and factory functions
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 14. Add phone number formatting and validation utilities

  - Create phone number normalization functions
  - Implement international format validation
  - Add country code handling and validation
  - Build phone number masking for logging
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.4_

- [ ] 15. Implement production-ready configuration
  - Add environment variable validation on service startup
  - Create configuration health check endpoints
  - Implement graceful degradation for missing optional config
  - Add configuration change detection and service restart logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1, 9.2, 9.3, 9.5_
