# Implementation Plan

- [x] 1. Set up WhatsApp integration database schema

  - Add new fields to Integration model for WhatsApp-specific data
  - Add channel field to Message model to track message source
  - Create database migration scripts
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Create WhatsApp integration API routes
- [x] 2.1 Implement integration CRUD route (`api.v1.integrations.whatsapp.ts`)

  - Create loader function to fetch integrations for a chatbot
  - Implement action function with intent-based routing (create, update, delete, test)
  - Add proper error handling and validation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.2 Implement WhatsApp webhook route (`api.whatsapp.webhook.ts`)

  - Create action function to handle POST webhook requests
  - Create loader function to handle GET webhook verification
  - Implement webhook signature verification
  - Add webhook payload processing logic
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3. Build WhatsApp integration service layer
- [x] 3.1 Create WhatsApp integration service

  - Implement createIntegration method with credential validation
  - Implement updateIntegration method for editing existing integrations
  - Implement deleteIntegration method with proper cleanup
  - Implement testConnection method using existing WhatsApp SDK
  - _Requirements: 1.3, 3.2, 3.3, 4.2, 4.3_

- [x] 3.2 Implement webhook message processing

  - Create processIncomingMessage method to handle WhatsApp webhooks
  - Integrate with existing conversation and message models
  - Add logic to create/find conversations using phone numbers as sessionId
  - Implement chatbot response generation and WhatsApp message sending
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4_

- [ ] 4. Create WhatsApp integration UI components
- [ ] 4.1 Build WhatsAppIntegrationModal component

  - Create modal component with form for manual credential entry
  - Implement form validation for Phone Number ID, Access Token, Business Account ID
  - Add connection testing functionality with loading states
  - Handle success/error states and user feedback
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 4.2 Enhance IntegrationCard component

  - Update IntegrationCard to show connection status (connected/disconnected/error)
  - Add onConnect handler to open WhatsApp configuration modal
  - Add onManage handler for editing/disconnecting existing integrations
  - Display last activity and connection details when available
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4.3 Add channel indicators to conversation UI

  - Create ChannelIndicator component to show message source (web/whatsapp)
  - Update conversation list to display channel icons
  - Add phone number display (masked) for WhatsApp conversations
  - Integrate channel filtering in existing conversations section
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 5. Integrate WhatsApp with existing conversation system
- [ ] 5.1 Update conversation creation logic

  - Modify conversation creation to handle WhatsApp phone numbers as visitorId
  - Add channel metadata to messages when they come from WhatsApp
  - Update message storage to include externalMessageId for WhatsApp messages
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 5.2 Update conversation display logic

  - Modify conversation list to show channel indicators
  - Update conversation details to display WhatsApp-specific information
  - Ensure existing conversation UI works seamlessly with WhatsApp messages
  - _Requirements: 8.5, 9.1, 9.2, 9.3_

- [ ] 6. Add integration management functionality
- [ ] 6.1 Implement integration editing

  - Add edit functionality to update existing WhatsApp integration credentials
  - Implement form pre-population with existing integration data
  - Add validation and testing for updated credentials
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6.2 Implement integration activation/deactivation

  - Add toggle functionality to activate/deactivate integrations
  - Update UI to reflect integration status changes
  - Handle webhook processing based on integration active status
  - _Requirements: 3.3, 3.4_

- [ ] 6.3 Implement integration deletion

  - Add delete functionality with confirmation dialog
  - Clean up associated data when integration is deleted
  - Update UI to remove deleted integrations from display
  - _Requirements: 3.4, 3.5_

- [ ] 7. Add error handling and user feedback
- [ ] 7.1 Implement comprehensive error handling

  - Add specific error messages for different failure scenarios
  - Implement retry mechanisms for transient failures
  - Add logging for debugging and monitoring
  - _Requirements: 1.5, 4.4, 5.5_

- [ ] 7.2 Add user feedback and notifications

  - Implement success messages for integration operations
  - Add loading states for async operations
  - Display helpful error messages with actionable guidance
  - _Requirements: 1.4, 1.5, 2.4, 4.3, 4.4_

- [ ] 8. Test and validate integration functionality
- [ ] 8.1 Test integration CRUD operations

  - Verify integration creation with valid credentials
  - Test integration editing and updates
  - Validate integration deletion and cleanup
  - Test connection validation functionality
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [ ] 8.2 Test webhook message processing

  - Verify webhook signature validation
  - Test incoming message processing and conversation creation
  - Validate chatbot response generation and sending
  - Test message storage with proper channel metadata
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

- [ ] 8.3 Test UI integration and user experience
  - Verify modal opening/closing and form interactions
  - Test integration status display and updates
  - Validate conversation list with channel indicators
  - Test error handling and user feedback flows
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3, 9.4_
