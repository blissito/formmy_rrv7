# @formmy.app/chat

Official SDK for Formmy AI Chat - Build conversational AI experiences in your React applications.

## Installation

```bash
npm install @formmy.app/chat
```

**Peer Dependencies:**
```bash
npm install react ai @ai-sdk/react
```

## Quick Start

### Backend (Node.js)

Use the `Formmy` client to manage agents and conversations from your server.

```typescript
import { Formmy } from '@formmy.app/chat';

const formmy = new Formmy({ secretKey: 'formmy_sk_live_xxx' });

// List all agents
const agents = await formmy.agents.list();

// Create a new agent
const { agent } = await formmy.agents.create({
  name: 'Customer Support',
  instructions: 'You are a helpful customer support agent.',
  welcomeMessage: 'Hello! How can I help you today?',
});

// Send a message (non-streaming)
const response = await formmy.chat.send('Hello!', {
  agentId: agent.id,
  sessionId: 'user_123',
});
```

### Frontend (React)

Use the provider and components to add chat to your React app.

```tsx
import { FormmyProvider, ChatBubble } from '@formmy.app/chat/react';

function App() {
  return (
    <FormmyProvider publishableKey="formmy_pk_live_xxx">
      <YourApp />
      <ChatBubble
        agentId="agent_xxx"
        position="bottom-right"
        theme="light"
      />
    </FormmyProvider>
  );
}
```

### Headless Hook

Build custom chat UIs with the `useFormmyChat` hook.

```tsx
import { useFormmyChat } from '@formmy.app/chat/react';

function CustomChat({ agentId }: { agentId: string }) {
  const { messages, input, setInput, handleSubmit, isLoading } = useFormmyChat({
    agentId,
  });

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

## API Reference

### Formmy Client

```typescript
const formmy = new Formmy({ secretKey: 'formmy_sk_live_xxx' });

// Agents
formmy.agents.list()
formmy.agents.get(agentId)
formmy.agents.create({ name, instructions, welcomeMessage?, model? })
formmy.agents.update(agentId, { name?, instructions?, model? })
formmy.agents.delete(agentId)

// Chat
formmy.chat.send(message, { agentId, sessionId })
formmy.chat.history(sessionId, agentId)
```

### React Components

#### FormmyProvider

```tsx
<FormmyProvider
  publishableKey="formmy_pk_live_xxx"
  baseUrl="https://formmy.app"  // optional
>
  {children}
</FormmyProvider>
```

#### ChatBubble

```tsx
<ChatBubble
  agentId="agent_xxx"           // required
  position="bottom-right"        // bottom-right | bottom-left
  theme="light"                  // light | dark
  welcomeMessage="Hello!"        // optional override
  buttonLabel="Chat with us"     // optional
/>
```

#### useFormmyChat

```typescript
const {
  messages,      // Message[]
  input,         // string
  setInput,      // (value: string) => void
  handleSubmit,  // (e: FormEvent) => void
  isLoading,     // boolean
  error,         // Error | null
  reload,        // () => void
  stop,          // () => void
} = useFormmyChat({ agentId });
```

## Keys

| Key Type | Prefix | Usage | Scope |
|----------|--------|-------|-------|
| Secret Key | `formmy_sk_live_` | Backend only | Full API access |
| Publishable Key | `formmy_pk_live_` | Frontend safe | Chat only, domain-restricted |

Get your keys at [formmy.app/dashboard/api-keys](https://formmy.app/dashboard/api-keys)

## TypeScript

Full TypeScript support included.

```typescript
import type {
  FormmyMessage,
  Agent,
  FormmyConfig
} from '@formmy.app/chat';
```

## Documentation

Full documentation at [formmy.app/docs/sdk](https://formmy.app/docs/sdk)

## License

MIT
