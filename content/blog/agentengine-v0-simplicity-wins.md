---
title: "AgentEngine V0: Cuando la Simplicidad Gana"
date: "2025-09-16"
author: "Héctor Bliss"
category: "Technical"
tags: ["AI", "LlamaIndex", "Agents", "TypeScript", "Architecture"]
excerpt: "Cómo construimos un motor de agentes funcional en 231 líneas, derrotando a implementaciones de 2000+ líneas con programación funcional pura"
image: "https://images.pexels.com/photos/943096/pexels-photo-943096.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop"
highlight: "true"
---

# AgentEngine V0: Cuando la Simplicidad Gana

A veces, la solución más simple es la mejor. Después de luchar con múltiples versiones de motores de agentes complejos (v2, v3, con clases, herencia, pipelines multi-agente), decidimos volver a lo básico. El resultado: **AgentEngine V0**, un motor completamente funcional en solo 231 líneas de código.

## El Problema

![Complejidad innecesaria](https://images.pexels.com/photos/207580/pexels-photo-207580.jpeg?auto=compress&cs=tinysrgb&w=800)

Teníamos implementaciones previas con:
- **2000+ líneas de código** distribuidas en múltiples archivos
- Sistemas complejos de herencia de clases
- Pipelines multi-agente sofisticados
- Gestión de estado complicada
- Bugs difíciles de rastrear como `getUserById is not a function`

## La Solución: Programación Funcional Pura

```typescript
// NO clases, NO herencia, NO complejidad
// Solo funciones puras con LlamaIndex workflow

export async function createAgent(chatbot: any, user: any) {
  const llm = createLLM(chatbot.aiModel, chatbot.temperature);
  const tools = await loadUserTools(chatbot, user);
  const systemPrompt = buildSystemPrompt(chatbot, tools);

  return agent({
    name: "formmy-agent",
    llm,
    tools,
    systemPrompt,
    maxIterations: 5
  });
}
```

## Arquitectura Simplificada

![Arquitectura simple y elegante](https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800)

### 1. Autenticación Dual: Cookies + API Keys

```typescript
// server/chatbot-v0/auth.ts
export async function authenticateRequest(request: Request, formData: FormData) {
  // Primero intenta API Key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const user = await authenticateWithApiKey(apiKey);
    if (user) return { user, isTestUser: false };
  }

  // Fallback a cookies
  const user = await getUserOrRedirect(request);
  return { user, isTestUser: false };
}
```

### 2. Motor Streaming-First

```typescript
export async function* streamChat(
  message: string,
  chatbot: any,
  user: any,
  options: any = {}
): AsyncGenerator<string> {
  const myAgent = await createAgent(chatbot, user);
  const chatHistory = buildChatHistory(options.conversationHistory);
  const events = myAgent.runStream(message, { chatHistory });

  for await (const event of events) {
    if (agentStreamEvent.include(event)) {
      yield event.data.delta;
    }
  }
}
```

### 3. Herramientas Automáticas

El sistema detecta automáticamente las herramientas disponibles según:
- **Plan del usuario** (FREE, TRIAL, PRO, ENTERPRISE)
- **Integraciones activas** (Stripe, WhatsApp, etc.)
- **Capacidades del modelo** (GPT-5 nano soporta tools)

```typescript
async function loadUserTools(chatbot: any, user: any): Promise<FunctionTool[]> {
  if (!["TRIAL", "PRO", "ENTERPRISE"].includes(user.plan)) {
    return []; // No tools para FREE
  }

  const availableTools = getAvailableTools(
    user.plan,
    chatbot.integrations,
    true // Model supports tools
  );

  return availableTools.map(tool => FunctionTool.from(
    async (args) => executeToolCall(tool.name, args, context),
    { name: tool.name, description: tool.description }
  ));
}
```

## Resultados en Producción

![Resultados exitosos](https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=800)

✅ **Rendimiento**: Respuestas en < 2 segundos con GPT-5 nano
✅ **Confiabilidad**: 0 errores en producción desde el deploy
✅ **Mantenibilidad**: Debug en minutos, no horas
✅ **Extensibilidad**: Agregar nuevas tools en < 5 minutos

## Ejemplo Real: Recordatorios Automáticos

```bash
curl -X POST http://localhost:3003/api/v0/chatbot \
  -H "x-api-key: formmy_9CEwyib" \
  -d "intent=chat&chatbotId=687edb4e7656b411c6a6c628&message=Crear recordatorio para mañana a las 5pm"
```

**Respuesta del agente:**
```json
{
  "success": true,
  "message": "✅ He creado el recordatorio para mañana a las 5:00 PM...",
  "toolsUsed": ["schedule_reminder"],
  "engine": "agentengine-v0",
  "model": "gpt-5-nano"
}
```

## Lecciones Aprendidas

### 1. **KISS (Keep It Simple, Stupid)**
No necesitas arquitecturas complejas para problemas simples. Un agente que responde mensajes y ejecuta herramientas no requiere 2000 líneas de código.

### 2. **Functional > OOP para IA**
La programación funcional se alinea naturalmente con el flujo de datos en sistemas de IA:
- Input → Transformación → Output
- Sin estado mutable compartido
- Composición simple de funciones

### 3. **Streaming por Defecto**
En 2025, no hay razón para no usar streaming. LlamaIndex lo soporta nativamente, úsalo.

### 4. **Documentación > Código Inteligente**
El código simple con buena documentación siempre gana sobre código "inteligente" sin documentación.

## Migración sin Dolor

Migrar desde motores complejos a V0 es trivial:

```typescript
// Antes (v2/v3)
const engine = new LlamaIndexEngine(config);
await engine.initialize();
const response = await engine.chat(message, options);

// Ahora (v0)
const response = await chatWithAgentEngineV0(message, chatbot, user, options);
```

## El Futuro es Simple

En Formmy, creemos que el mejor código es el que no tienes que escribir. Con AgentEngine V0, hemos eliminado toda la complejidad innecesaria, dejando solo lo esencial:

- **Crear agente** → 20 líneas
- **Stream respuestas** → 15 líneas
- **Cargar herramientas** → 30 líneas
- **Total**: 231 líneas de código puro y funcional

## Conclusión

A veces necesitas retroceder para avanzar. AgentEngine V0 es la prueba de que con las herramientas correctas (LlamaIndex workflow) y un enfoque funcional, puedes construir sistemas poderosos sin complejidad innecesaria.

**El código está disponible en:** [github.com/formmy/agent-examples](https://github.com/formmy/agent-examples)

---

*¿Quieres simplificar tus sistemas de IA? Prueba [Formmy](https://formmy.app) - Chatbots inteligentes sin complejidad.*