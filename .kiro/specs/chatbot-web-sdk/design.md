# Design Document

## Overview

SDK ultra-simple: un archivo JS que crea un widget de chat usando los componentes React existentes.

### Arquitectura

```
app/sdk/
├── index.ts           # Entry point
├── compiler.ts        # React → Vanilla JS compiler
├── widget-vanilla.ts  # Widget en JavaScript puro
└── api.ts            # API calls

app/components/        # Componentes existentes (se reusan)
├── MessageBubble.tsx
├── ChatInput.tsx
└── ChatHeader.tsx
```

**Build**: Scripts dinámicos < 10KB (sin React runtime)

## Usage

**Ultra-simple: Una sola línea (RECOMENDADA)**

```html
<script src="https://cdn.formmy.app/pk_live_abc123.js"></script>
```

**Con configuración opcional**

```html
<script
  src="https://cdn.formmy.app/pk_live_abc123.js"
  data-theme="dark"
  data-position="bottom-left"
></script>
```

**Múltiples chatbots (especificar slug)**

```html
<script
  src="https://cdn.formmy.app/pk_live_abc123.js"
  data-chatbot="soporte"
></script>
```

### Cómo funciona

1. **URL personalizada por API key**: Cada usuario tiene su propia URL con su API key embebida
2. **Auto-detección**: El script detecta automáticamente el chatbot activo del usuario
3. **Cero configuración**: Funciona inmediatamente sin parámetros adicionales
4. **Seguro**: La API key está en la URL pero sigue siendo segura (solo lectura pública)

### Cómo Funciona el Sistema

#### Flujo Técnico

1. **Usuario pega el script**:

   ```html
   <script
     src="https://cdn.formmy.app/pk_live_abc123.js"
     data-chatbot="soporte"
   ></script>
   ```

2. **El navegador hace request a**: `GET /pk_live_abc123.js`

3. **Nuestro servidor**:

   - Valida que `pk_live_abc123` sea una API key válida y activa
   - Busca los chatbots del usuario dueño de esa API key
   - Genera un script JavaScript personalizado on-the-fly
   - Devuelve el script con toda la configuración embebida

4. **El script generado**:
   - Ya tiene toda la info del usuario (chatbots, plan, configuración)
   - Auto-detecta qué chatbot usar (por `data-chatbot` o el primero activo)
   - Carga el widget de chat inmediatamente
   - No necesita hacer más requests de autenticación

#### Ejemplo de Script Generado

Cuando alguien pide `https://cdn.formmy.app/pk_live_abc123.js`, nuestro servidor genera algo así:

```javascript
// Script generado dinámicamente para pk_live_abc123
(function () {
  const userConfig = {
    apiKey: "pk_live_abc123",
    chatbots: [
      { id: "1", slug: "soporte", name: "Soporte", welcomeMessage: "Hola!" },
      { id: "2", slug: "ventas", name: "Ventas", welcomeMessage: "Te ayudo!" },
    ],
    plan: "PRO",
  };

  // Detectar qué chatbot usar
  const requestedBot = document.currentScript.dataset.chatbot; // "soporte"
  const chatbot =
    userConfig.chatbots.find((c) => c.slug === requestedBot) ||
    userConfig.chatbots[0];

  // Cargar el widget inmediatamente
  loadChatWidget(chatbot, userConfig);
})();
```

**Ventajas del sistema:**

- ✅ **Una sola request** - No hay autenticación adicional
- ✅ **Cero latencia** - Todo está pre-configurado en el script
- ✅ **Súper simple** - Solo cambiar la API key en la URL
- ✅ **Seguro** - La API key valida el acceso pero no expone datos sensibles
- ✅ **Personalizado** - Cada usuario tiene su propia URL única
- ✅ **Rate limiting** - Control automático de límites por plan

## Implementation

### API Key System

#### API Key Format

```
pk_live_1234567890abcdef  // Production key
pk_test_1234567890abcdef  // Test/development key
```

#### API Key Model (Prisma)

```prisma
model ApiKey {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  key         String   @unique
  name        String   // User-friendly name
  keyType     ApiKeyType @default(LIVE)

  // Security
  isActive    Boolean  @default(true)
  lastUsedAt  DateTime?

  // Usage tracking
  requestCount     Int @default(0)
  monthlyRequests  Int @default(0)

  // Rate limiting
  rateLimit        Int @default(1000) // requests per hour

  // Allowed domains (optional)
  allowedDomains   String[] // ["example.com", "*.example.com"]

  // Relations
  userId      String   @db.ObjectId
  user        User     @relation(fields: [userId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ApiKeyType {
  LIVE
  TEST
}

// Extensión al modelo Chatbot existente para incluir streaming
model Chatbot {
  // ... campos existentes ...

  // Streaming configuration
  enableStreaming   Boolean @default(true)  // Typing effect habilitado
  streamingSpeed    Int     @default(50)    // Velocidad en ms entre caracteres
}
```

#### Authentication Middleware

```typescript
export const authenticateApiKey = async (request: Request) => {
  const apiKey =
    request.headers.get("x-api-key") ||
    new URL(request.url).searchParams.get("key");

  if (!apiKey) {
    throw new Response("API key required", { status: 401 });
  }

  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey, isActive: true },
    include: { user: true },
  });

  if (!keyRecord) {
    throw new Response("Invalid API key", { status: 401 });
  }

  // Check rate limits
  await checkRateLimit(keyRecord);

  // Update usage stats
  await updateKeyUsage(keyRecord.id);

  return keyRecord;
};

const checkRateLimit = async (apiKey: ApiKey) => {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentRequests = await prisma.apiKeyUsage.count({
    where: {
      apiKeyId: apiKey.id,
      createdAt: { gte: hourAgo },
    },
  });

  if (recentRequests >= apiKey.rateLimit) {
    throw new Response("Rate limit exceeded", { status: 429 });
  }
};
```

### Widget

- **JavaScript vanilla**: El SDK no requiere React en el sitio del cliente
- **Reutilización**: Usa los componentes React existentes compilados a HTML/CSS/JS
- **Ligero**: < 10KB sin dependencias externas
- **Fixed position**: bottom-right por defecto
- **API key validation**: antes de inicializar el widget

### API Endpoints

#### SDK Authentication

```typescript
// app/routes/api.sdk.auth.ts
export const loader = async ({ request }: Route.LoaderArgs) => {
  const apiKey = await authenticateApiKey(request);

  return json({
    success: true,
    user: {
      id: apiKey.userId,
      plan: apiKey.user.plan,
    },
    limits: getPlanLimits(apiKey.user.plan),
  });
};
```

#### Chatbot Discovery

```typescript
// app/routes/api.sdk.chatbots.ts
export const loader = async ({ request }: Route.LoaderArgs) => {
  const apiKey = await authenticateApiKey(request);
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  const chatbots = await prisma.chatbot.findMany({
    where: {
      userId: apiKey.userId,
      isActive: true,
      ...(slug && { slug }),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      welcomeMessage: true,
      primaryColor: true,
      theme: true,
      enableStreaming: true,
      streamingSpeed: true,
    },
  });

  return json({ chatbots });
};
```

#### Chat Conversation

```typescript
// app/routes/api.sdk.chat.ts
export const action = async ({ request }: Route.ActionArgs) => {
  const apiKey = await authenticateApiKey(request);
  const { chatbotId, message, sessionId } = await request.json();

  // Verify chatbot ownership
  const chatbot = await prisma.chatbot.findFirst({
    where: {
      id: chatbotId,
      userId: apiKey.userId,
      isActive: true,
    },
  });

  if (!chatbot) {
    return json({ error: "Chatbot not found" }, { status: 404 });
  }

  // Check if streaming is enabled for this chatbot
  const streamingEnabled = chatbot.enableStreaming || false;

  if (streamingEnabled) {
    // Return streaming response
    return new Response(createStreamingResponse(chatbot, message, sessionId), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } else {
    // Regular JSON response
    const response = await processChatMessage(chatbot, message, sessionId);
    return json({ response });
  }
};

// Streaming response generator
async function* createStreamingResponse(chatbot, message, sessionId) {
  yield `data: ${JSON.stringify({ type: "start" })}\n\n`;

  const stream = await processStreamingMessage(chatbot, message, sessionId);

  for await (const chunk of stream) {
    yield `data: ${JSON.stringify({
      type: "chunk",
      content: chunk,
    })}\n\n`;
  }

  yield `data: ${JSON.stringify({ type: "end" })}\n\n`;
}
```

### Build & CDN Strategy

#### Dynamic Script Generation

```typescript
// app/routes/api.sdk.$apiKey[.]js.ts
export const loader = async ({ params }: Route.LoaderArgs) => {
  const { apiKey } = params;

  // Validate API key
  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey, isActive: true },
    include: { user: { include: { chatbots: true } } },
  });

  if (!keyRecord) {
    return new Response("Invalid API key", { status: 404 });
  }

  // Generate personalized script
  const script = generateSDKScript({
    apiKey,
    userId: keyRecord.userId,
    chatbots: keyRecord.user.chatbots.filter((c) => c.isActive),
    plan: keyRecord.user.plan,
  });

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600", // 1 hour cache
    },
  });
};
```

#### Script Template

```javascript
// Template para el script generado dinámicamente (JavaScript vanilla)
(function() {
  const config = {
    apiKey: '${apiKey}',
    userId: '${userId}',
    chatbots: ${JSON.stringify(chatbots)},
    plan: '${plan}'
  };

  // Auto-detect chatbot or use first active one
  const chatbot = config.chatbots.find(c =>
    c.slug === document.currentScript?.dataset?.chatbot
  ) || config.chatbots[0];

  if (!chatbot) {
    console.warn('No active chatbots found');
    return;
  }

  // Componentes compilados a vanilla JS (reutilizados de React)
  const ChatWidget = {
    // MessageBubble compilado a función vanilla
    createMessageBubble: function(message, isUser) { /* compiled from React */ },

    // ChatInput compilado a función vanilla
    createChatInput: function(onSend) { /* compiled from React */ },

    // ChatHeader compilado a función vanilla
    createChatHeader: function(title) { /* compiled from React */ },

    // Typing indicator (para streaming)
    showTypingIndicator: function() { /* compiled from React */ },
    hideTypingIndicator: function() { /* compiled from React */ },

    // Chat API con soporte para streaming
    sendMessage: async function(message) {
      const response = await fetch('/api/sdk/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          message,
          sessionId: this.sessionId
        })
      });

      if (chatbot.enableStreaming && response.headers.get('content-type')?.includes('text/event-stream')) {
        // Handle streaming response
        this.handleStreamingResponse(response);
      } else {
        // Handle regular JSON response
        const data = await response.json();
        this.displayMessage(data.response, false);
      }
    },

    // Streaming response handler
    handleStreamingResponse: function(response) {
      const reader = response.body.getReader();
      const messageElement = this.createMessageBubble('', false);
      this.showTypingIndicator();

      const readStream = async () => {
        const { done, value } = await reader.read();

        if (done) {
          this.hideTypingIndicator();
          return;
        }

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk') {
              messageElement.textContent += data.content;
            } else if (data.type === 'end') {
              this.hideTypingIndicator();
            }
          }
        });

        readStream();
      };

      readStream();
    },

    // Widget principal
    init: function(config) {
      // Crear DOM elements usando las funciones compiladas
      // Mismo comportamiento que los componentes React originales
      // Incluye soporte completo para streaming si está habilitado
    }
  };

  // Initialize widget with detected/default chatbot
  ChatWidget.init({
    ...config,
    chatbot,
    theme: document.currentScript?.dataset?.theme || 'light',
    position: document.currentScript?.dataset?.position || 'bottom-right'
  });
})();
```

#### Build Process

**Estrategia de Reutilización:**

1. **Componentes React existentes** → Se compilan a JavaScript vanilla
2. **Build separado**: Los componentes se "pre-compilan" a funciones JS puras
3. **Sin React runtime**: El cliente final no necesita React
4. **Reutilización total**: Mismo código, diferente empaquetado

**Proceso técnico:**

```typescript
// 1. Componentes existentes (MessageBubble, ChatInput, etc.)
// Se mantienen como están en la app principal

// 2. SDK Builder - Convierte React a vanilla JS
const buildSDK = () => {
  // Toma los componentes React existentes
  const components = {
    MessageBubble: require("../app/components/MessageBubble"),
    ChatInput: require("../app/components/ChatInput"),
    ChatHeader: require("../app/components/ChatHeader"),
  };

  // Los compila a funciones vanilla JS
  const vanillaComponents = compileToVanilla(components);

  // Genera el SDK final
  return bundleSDK(vanillaComponents);
};
```

**Output:**

- **Dynamic Scripts**: Generados on-demand por API key
- **CDN**: `https://cdn.formmy.app/pk_live_abc123.js` (personalizado por usuario)
- **Tamaño**: < 10KB (sin React runtime)
- **Caching**: Scripts cacheados por 1 hora, invalidados al cambiar chatbots
