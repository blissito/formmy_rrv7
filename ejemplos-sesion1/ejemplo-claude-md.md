# E-Commerce Platform - Context for Claude Code

## Project Overview
Platform for online sales with integrated inventory management and real-time analytics.

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + Radix UI
- **State Management**: Zustand for client state
- **Forms**: React Hook Form + Zod validation

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with JWT
- **Payments**: Stripe Payment Intents
- **File Storage**: AWS S3

## Project Structure
```
/app
  /(shop)         → Public shopping routes
    /products     → Product catalog
    /cart         → Shopping cart
    /checkout     → Payment flow
  /(admin)        → Admin dashboard
    /inventory    → Stock management
    /orders       → Order processing
  /api           → Backend endpoints
    /auth        → Authentication
    /stripe      → Payment webhooks
/components
  /ui            → Reusable components
  /forms         → Form components
/lib
  /db            → Database utilities
  /stripe        → Stripe integration
  /email         → Email templates
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Interfaces over types for objects
- Enums for constants

### Database
- All queries through Prisma
- Use transactions for multi-table operations
- Soft deletes for critical data
- Indexes on frequently queried fields

### API Design
- RESTful endpoints
- Consistent error responses
- Rate limiting on public endpoints
- Request validation with Zod

### Testing
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical user flows
- Minimum 80% coverage

## Current Sprint Focus

### Active Features
- Implementing real-time inventory updates
- Adding multi-currency support
- Optimizing checkout conversion

### Known Issues
- Cart persistence across devices
- Search performance on large catalogs
- Mobile responsiveness in admin panel

### Technical Debt
- Migrate from Pages to App Router (30% complete)
- Update to Stripe Payment Elements
- Implement proper error boundaries

## Environment Variables Required
```env
DATABASE_URL=
NEXTAUTH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

## Key Business Rules
1. Orders cannot be modified after payment
2. Inventory updates must be atomic
3. Prices include tax for EU customers
4. Guest checkout is allowed but limited
5. Refunds process within 30 days

## Performance Targets
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- API response time < 200ms p95
- Database queries < 50ms p99