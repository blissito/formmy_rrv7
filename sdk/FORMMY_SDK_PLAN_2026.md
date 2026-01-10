# Formmy SDK - Plan 2026

**Fecha**: Enero 2026
**Objetivo**: SDK moderno para que plataformas como Denik integren agentes de Formmy

---

## Patrones Seleccionados

| Patrón | Nombre Técnico | Inspiración |
|--------|----------------|-------------|
| Arquitectura | **Headless-First** | Vercel AI SDK 5 |
| Autenticación | **Publishable/Secret Key + Domain Restriction** | Stripe |
| API del cliente | **Instance-Based with Namespaces** | OpenAI SDK, Anthropic SDK |
| Hooks | **Headless Hooks** | Vercel AI SDK `useChat` |
| Componentes | **Optional UI Layer** | Radix UI, shadcn |
| Multi-tenant (futuro) | **Platform Connect** | Stripe Connect |

---

## Estructura del SDK

```
@formmy/react
├── core/
│   ├── client.ts           # FormmyClient (vanilla JS)
│   ├── transport.ts        # FetchTransport, WSTransport
│   └── types.ts
│
├── hooks/
│   ├── useFormmyChat.ts    # Hook principal (headless)
│   ├── useFormmyAgent.ts   # Metadata del agente
│   └── useFormmyRAG.ts     # Búsqueda en docs
│
├── ui/                     # OPCIONAL
│   ├── ChatBubble.tsx
│   ├── ChatPanel.tsx
│   └── primitives/
│       ├── MessageList.tsx
│       ├── MessageInput.tsx
│       └── TypingIndicator.tsx
│
└── index.ts
```

---

## Modelo de Autenticación

### Fase 1: Dual Key (Implementar ahora)

```
sk_live_xxx  → Secret Key (solo backend)
pk_live_xxx  → Publishable Key (frontend, restringida por dominio)
```

### Fase 2: Platform Connect (Futuro)

```
platform_xxx      → Platform Key
acct_user123      → Connected Account ID
```

---

## Ejemplos de Uso

### 1. Frontend - Componente Listo

```tsx
import { FormmyProvider, ChatBubble } from '@formmy/react'

function App() {
  return (
    <FormmyProvider publishableKey="pk_live_xxx">
      <LandingPage />
      <ChatBubble
        agentId="agent_123"
        position="bottom-right"
        theme={{ primaryColor: '#9A99EA' }}
      />
    </FormmyProvider>
  )
}
```

### 2. Frontend - Hook Headless (UI Custom)

```tsx
import { useFormmyChat } from '@formmy/react'

function CustomChat({ agentId }) {
  const {
    messages,
    sendMessage,
    status,      // 'idle' | 'streaming' | 'error'
    agent,       // metadata
    reset
  } = useFormmyChat({ agentId })

  return (
    <div className="mi-chat-custom">
      {messages.map(m => (
        <div key={m.id} className={`msg msg--${m.role}`}>
          {m.content}
        </div>
      ))}

      {status === 'streaming' && <TypingDots />}

      <form onSubmit={e => {
        e.preventDefault()
        sendMessage(input)
      }}>
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button disabled={status === 'streaming'}>Enviar</button>
      </form>
    </div>
  )
}
```

### 3. Backend - Operaciones Admin

```typescript
import { Formmy } from '@formmy/core'

const formmy = new Formmy({ secretKey: 'sk_live_xxx' })

// Crear agente
const agent = await formmy.agents.create({
  name: 'Asistente de Juan',
  instructions: 'Eres un asistente amable...',
  welcomeMessage: 'Hola, ¿en qué puedo ayudarte?',
  model: 'claude-sonnet-4-20250514',
})

// Listar agentes
const agents = await formmy.agents.list()

// Actualizar agente
await formmy.agents.update('agent_123', {
  instructions: 'Nuevas instrucciones...',
})

// Eliminar agente
await formmy.agents.delete('agent_123')

// Obtener analytics
const stats = await formmy.agents.analytics('agent_123', {
  from: '2026-01-01',
  to: '2026-01-31',
})
```

### 4. Backend - Chat Server-Side

```typescript
// Para integraciones server-side (webhooks, etc.)
const formmy = new Formmy({ secretKey: 'sk_live_xxx' })

const response = await formmy.chat.send({
  agentId: 'agent_123',
  message: 'Hola',
  conversationId: 'conv_456', // opcional, para continuar
})

console.log(response.content)
console.log(response.conversationId)

// Streaming
const stream = formmy.chat.stream({
  agentId: 'agent_123',
  message: 'Explícame esto',
})

for await (const chunk of stream) {
  process.stdout.write(chunk.text)
}
```

### 5. Futuro - Platform Connect

```tsx
// Usuario de Denik conectó su cuenta de Formmy via OAuth
<FormmyProvider
  platformKey="pp_denik_xxx"
  connectedAccountId={user.formmyAccountId}
>
  <ChatBubble agentId={user.selectedAgentId} />
</FormmyProvider>
```

---

## API del Hook `useFormmyChat`

```typescript
const {
  // Estado
  messages,         // Message[]
  status,           // 'idle' | 'streaming' | 'error'
  error,            // Error | null

  // Metadata
  agent,            // { name, avatar, welcomeMessage }
  conversationId,   // string

  // Acciones
  sendMessage,      // (text: string) => Promise<void>
  regenerate,       // () => Promise<void>
  reset,            // () => void
  stop,             // () => void

} = useFormmyChat({
  agentId: string,

  // Opcional
  initialMessages?: Message[],
  conversationId?: string,

  // Callbacks
  onMessage?: (message: Message) => void,
  onError?: (error: Error) => void,
  onFinish?: () => void,
})
```

---

## Validación de Request (Server-Side)

```
POST /api/v1/chat
Headers:
  X-Publishable-Key: pk_live_xxx
  Origin: https://denik.me

Formmy valida:
1. ✅ Key existe y es tipo 'publishable'
2. ✅ Origin ∈ allowedDomains ['denik.me', '*.denik.me']
3. ✅ Agent pertenece a esta cuenta
4. ✅ Rate limit por IP (100 req/min)
5. ✅ Procesar request
```

---

## Fases de Implementación

### Fase 1: Core + Hook (2 semanas)
- [ ] `FormmyClient` con namespaces (agents, chat)
- [ ] `useFormmyChat` hook headless
- [ ] Diferenciar `sk_` vs `pk_` keys
- [ ] Validación de Origin contra allowedDomains

### Fase 2: UI Components (1 semana)
- [ ] `<ChatBubble />` componente listo
- [ ] `<ChatPanel />` alternativa
- [ ] Primitivas: MessageList, MessageInput

### Fase 3: Platform Connect (3-4 semanas)
- [ ] OAuth flow en Formmy
- [ ] Modelo `ConnectedAccount`
- [ ] Header `X-Connected-Account`
- [ ] Developer portal

---

## Referencias

- [Vercel AI SDK 5](https://vercel.com/blog/ai-sdk-5) - Headless hooks, transport architecture
- [Stripe API](https://stripe.com/docs/api) - Key model, Connect
- [OpenAI SDK](https://github.com/openai/openai-node) - Instance-based, namespaces
- [ElysiaJS](https://elysiajs.com/) - Type inference, DX

---

## Notas Adicionales

- **Pipeline Pattern** (Valibot) considerado pero no adoptado - mejor Builder/Fluent para DX
- **Elysia/Eden** type inference es overkill para este SDK - valor está en componentes
- El modelo **Stripe Connect** es el objetivo final para monetización
