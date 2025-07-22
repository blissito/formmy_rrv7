# Design Document

## Overview

El sistema de chatbot de Formmy consistirá en nuevos modelos de datos que se integrarán con la arquitectura existente basada en MongoDB y Prisma. El diseño se enfoca en simplicidad para el MVP mientras mantiene extensibilidad para futuras funcionalidades.

## Architecture

### Database Schema Extensions

El diseño extiende el esquema actual de Prisma con los siguientes modelos principales:

- **Chatbot**: Modelo principal que representa cada bot con contextos embebidos
- **Conversation**: Sesiones de chat entre visitantes y el bot
- **Message**: Mensajes individuales dentro de cada conversación
- **Integration**: Configuraciones básicas para plataformas externas

### Relationships

```
User (1) -> (N) Chatbot
Chatbot (1) -> (N) Conversation
Chatbot (1) -> (N) Integration
Conversation (1) -> (N) Message
```

### Performance Considerations

Los modelos están separados estratégicamente para optimizar performance:

- **Chatbot**: Incluye contextos embebidos para simplicidad en el MVP
- **Messages**: Separados para permitir paginación eficiente y queries específicas
- **Conversations**: Metadata ligero para listados rápidos

## Components and Interfaces

### Core Models

#### Chatbot Model

```prisma
model Chatbot {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  slug        String   @unique
  name        String
  description String?

  // Configuration
  personality     String?
  welcomeMessage  String?
  aiModel         String   @default("mistralai/mistral-small-3.2-24b-instruct")

  // Context items embedded
  contexts        ContextItem[]

  // Visual customization
  primaryColor   String?
  theme          String?  @default("light")

  // State management
  status         ChatbotStatus @default(DRAFT)
  isActive       Boolean  @default(false)

  // Usage tracking
  conversationCount Int @default(0)
  monthlyUsage     Int @default(0)
  contextSizeKB    Int @default(0)

  // Relations
  userId         String   @db.ObjectId
  user           User     @relation(fields: [userId], references: [id])
  conversations  Conversation[]
  integrations   Integration[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ChatbotStatus {
  DRAFT
  ACTIVE
  INACTIVE
}

type ContextItem {
  id        String
  type      ContextType
  fileName  String?
  fileType  String?
  fileUrl   String?
  url       String?
  title     String?
  sizeKB    Int?
  content   String?  // processed text content (optional)
  createdAt DateTime
}

enum ContextType {
  FILE
  LINK
  TEXT
}
```

#### Conversation Model

```prisma
model Conversation {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionId     String   @unique

  // Visitor info
  visitorIp     String?
  visitorId     String?  // anonymous ID

  // Conversation state
  status        ConversationStatus @default(ACTIVE)
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  messageCount  Int      @default(0)

  // Relations
  chatbotId     String   @db.ObjectId
  chatbot       Chatbot  @relation(fields: [chatbotId], references: [id])
  messages      Message[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ConversationStatus {
  ACTIVE
  COMPLETED
  TIMEOUT
}
```

#### Message Model

```prisma
model Message {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  content        String
  role           MessageRole

  // Metadata
  tokens         Int?     // for usage tracking
  responseTime   Int?     // in milliseconds

  // Relations
  conversationId String   @db.ObjectId
  conversation   Conversation @relation(fields: [conversationId], references: [id])

  createdAt DateTime @default(now())
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

#### Integration Model (Simplified for MVP)

```prisma
model Integration {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  platform   IntegrationType
  token      String?
  isActive   Boolean  @default(false)

  // Relations
  chatbotId  String   @db.ObjectId
  chatbot    Chatbot  @relation(fields: [chatbotId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum IntegrationType {
  WHATSAPP
  TELEGRAM
}
```

### User Model Extensions

```prisma
// Add to existing User model
model User {
  // ... existing fields
  chatbots Chatbot[]
}
```

## Data Models

### Plan-Based Limitations

Las limitaciones se implementarán a nivel de aplicación consultando el plan del usuario:

```typescript
const PLAN_LIMITS = {
  FREE: {
    maxChatbots: 1,
    maxContextSizeKB: 1000, // 1MB
    maxConversationsPerMonth: 100,
    availableModels: ["mistralai/mistral-small-3.2-24b-instruct"],
    showBranding: true,
  },
  PRO: {
    maxChatbots: -1, // unlimited
    maxContextSizeKB: 10000, // 10MB
    maxConversationsPerMonth: -1, // unlimited
    availableModels: [
      "mistralai/mistral-small-3.2-24b-instruct",
      "openai/gpt-4.1-mini",
      "x-ai/grok-3-mini",
      "google/gemini-2.5-flash",
    ],
    showBranding: false,
  },
};
```

### Context Processing

Los archivos subidos se procesarán para extraer texto:

- PDFs → texto plano
- DOCs → texto plano
- URLs → scraping de contenido
- Almacenamiento del contenido procesado en `ContextItem.content` (opcional)

## Error Handling

### Validation Rules

1. **Chatbot Creation**: Validar límites por plan antes de crear
2. **Context Upload**: Validar tamaño y tipo de archivo
3. **Conversation Limits**: Verificar límites mensuales antes de iniciar chat
4. **Rate Limiting**: Implementar límites por IP (ej: 10 mensajes/minuto)

### Error Responses

```typescript
interface ChatbotError {
  code: string;
  message: string;
  details?: any;
}

// Ejemplos:
// LIMIT_EXCEEDED_CHATBOTS
// LIMIT_EXCEEDED_CONTEXT_SIZE
// LIMIT_EXCEEDED_MONTHLY_CONVERSATIONS
// INVALID_FILE_TYPE
// RATE_LIMIT_EXCEEDED
```
