# Implementation Plan

## Important Notes

- **Server-side code**: All functions that run on the server (database operations, authentication, etc.) must be placed in files with `.server.ts` extension to avoid bundling issues
- **Client-side code**: Components and client-only logic should be in regular `.ts/.tsx` files

## Tasks

- [ ] 1. Set up route structure and navigation

  - Create `/chat` route with loader and action handlers
  - Update existing `/chat/config` route to support navigation back to list
  - Configure React Router 7 route definitions
  - _Requirements: 1.1, 4.1, 4.2, 4.4_

- [ ] 2. Implement chat list data layer
- [ ] 2.1 Create chat list loader function

  - Implement loader to fetch user's chatbots with plan limits
  - Add user plan validation and chatbot count logic
  - Include conversation counts and usage statistics
  - _Requirements: 1.1, 1.2, 2.4, 2.5_

- [ ] 2.2 Implement chat list action handlers

  - Create action handler for create, toggle status, and delete operations
  - Add plan limit validation for chatbot creation
  - Implement error handling with specific error codes
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 3.1, 3.2, 3.4, 3.5_

- [ ] 3. Create main chat list components
- [ ] 3.1 Implement ChatListRoute main component

  - Create main route component with state management
  - Add search and filter functionality
  - Implement modal state management for creation
  - Handle navigation and redirects after actions
  - _Requirements: 1.1, 1.3, 2.1_

- [ ] 3.2 Build ChatListHeader component

  - Create header with title and "Create new chatbot" button
  - Add plan limits display and upgrade prompts
  - Implement conditional rendering based on user plan
  - _Requirements: 2.1, 2.4, 2.5_

- [ ] 3.3 Implement ChatListFilters component

  - Add search input with debounced filtering
  - Create status filter dropdown (all/active/inactive)
  - Implement real-time filtering of chatbot list
  - _Requirements: 1.3_

- [ ] 4. Build chatbot card and grid components
- [ ] 4.1 Create ChatListGrid component

  - Implement responsive grid layout for chatbot cards
  - Add loading states and empty state handling
  - Handle filtered results display
  - _Requirements: 1.1, 1.3_

- [ ] 4.2 Implement ChatbotCard component

  - Create individual chatbot card with info display
  - Add visual status indicators (active/inactive)
  - Include chatbot stats (conversations, creation date)
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 4.3 Build ChatbotActions component

  - Implement edit button with navigation to config
  - Add toggle status button with optimistic updates
  - Create delete button with confirmation dialog
  - Handle loading states and error display
  - _Requirements: 1.6, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_

- [ ] 5. Implement chatbot creation functionality
- [ ] 5.1 Create CreateChatbotModal component

  - Build modal with form for new chatbot creation
  - Add form validation and error handling
  - Implement plan limit warnings and upgrade prompts
  - Handle submission states and success redirects
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

- [ ] 5.2 Add chatbot creation form logic

  - Implement form state management and validation
  - Add real-time validation feedback
  - Handle server-side validation errors
  - _Requirements: 2.2, 2.7_

- [ ] 6. Create empty and error state components
- [ ] 6.1 Implement EmptyState component

  - Create empty state for users with no chatbots
  - Add different empty states for filtered results
  - Include call-to-action for creating first chatbot
  - _Requirements: 1.2_

- [ ] 6.2 Build error handling components

  - Create error boundaries for component failures
  - Add inline error messages for failed actions
  - Implement retry mechanisms for failed operations
  - _Requirements: 3.5_

- [ ] 7. Implement navigation integration
- [ ] 7.1 Update existing config route navigation

  - Modify `/chat/config` to include back navigation to list
  - Add breadcrumb or back button to config view
  - Ensure proper URL parameter handling
  - _Requirements: 4.2, 4.4_

- [ ] 7.2 Add route parameter validation

  - Implement chatbot ID validation in config route
  - Add 404 handling for non-existent chatbots
  - Ensure proper ownership validation
  - _Requirements: 4.5_

- [ ] 8. Add required database operations
- [ ] 8.1 Implement chatbot CRUD operations

  - Create getChatbotsByUserId function in .server.ts file
  - Add updateChatbotStatus function for toggle operations in .server.ts file
  - Implement deleteChatbot function with proper cleanup in .server.ts file
  - _Requirements: 1.1, 3.1, 3.4_

- [ ] 8.2 Add user plan validation functions

  - Create getUserWithPlan function in .server.ts file
  - Implement getPlanLimits utility in .server.ts file
  - Add plan limit validation helpers in .server.ts file
  - _Requirements: 2.4, 2.5_

- [ ] 9. Implement styling and responsive design
- [ ] 9.1 Style chat list components

  - Apply consistent styling to all list components
  - Implement responsive grid layout
  - Add hover states and interactive feedback
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 9.2 Add dark mode support

  - Ensure all components support dark/light themes
  - Test color contrast and accessibility
  - Implement theme-aware status indicators
  - _Requirements: 1.4, 1.5_

- [ ] 11. Performance optimization
- [ ] 11.1 Implement performance optimizations

  - Add React.memo to prevent unnecessary re-renders
  - Implement debounced search functionality
  - Add optimistic updates for quick actions
  - _Requirements: 3.1, 3.2_

- [ ] 11.2 Add loading and caching strategies
  - Implement proper loading states throughout
  - Add client-side caching for chatbot list
  - Implement cache invalidation after mutations
  - _Requirements: 1.1, 3.1, 3.2, 3.4_
