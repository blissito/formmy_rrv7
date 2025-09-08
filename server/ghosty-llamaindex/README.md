# Ghosty LlamaIndex Implementation

Una implementación robusta del agente Ghosty usando LlamaIndex.ts con capacidades de switch local/remoto y herramientas especializadas.

## 🏗️ Arquitectura

```
server/ghosty-llamaindex/
├── index.ts              # Punto de entrada principal
├── types.ts              # Interfaces TypeScript
├── config.ts             # Configuración y factory de modelos
├── agents/
│   ├── local-agent.ts   # Implementación local con LlamaIndex
│   ├── remote-agent.ts  # Cliente para servicio remoto
│   └── agent-factory.ts # Factory con fallback automático
└── tools/
    ├── chatbot-query.ts # Query de chatbots del usuario
    ├── stats-query.ts   # Estadísticas detalladas
    ├── web-search.ts    # Búsqueda web (migrada)
    └── index.ts         # Registro de herramientas
```

## 🚀 Uso Básico

### Implementación Standalone

```typescript
import { GhostyLlamaIndex } from "server/ghosty-llamaindex";

// Crear instancia
const ghosty = new GhostyLlamaIndex({
  mode: 'local', // o 'remote'
  model: 'gpt-5-nano',
  llmProvider: 'openai'
});

// Chat básico
const response = await ghosty.chat(
  "¿Cuántos chatbots tengo activos?",
  user, // Usuario de Prisma
  {
    conversationHistory: previousMessages,
    sessionId: 'session-123'
  }
);

console.log(response.content);
console.log(response.toolsUsed); // ['query_chatbots']
```

### Adapter de Compatibilidad

```typescript
import { GhostyLlamaAdapter } from "server/ghosty-llamaindex";

// Drop-in replacement para la función existente
const adapter = new GhostyLlamaAdapter();

const result = await adapter.callGhostyWithTools(
  "Muéstrame las estadísticas de mi chatbot",
  true, // enableTools
  (chunk) => console.log(chunk), // onChunk callback
  conversationHistory,
  user
);
```

## 🛠️ Herramientas Disponibles

### 1. Query de Chatbots (`query_chatbots`)

```typescript
// Buscar chatbots con filtros
await ghosty.chat("Muestra mis chatbots activos creados esta semana", user);

// Filtros disponibles:
// - status: DRAFT, ACTIVE, INACTIVE, DELETED
// - isActive: true/false
// - searchTerm: búsqueda en nombre/descripción
// - dateFrom/dateTo: rango de fechas
// - includeStats: estadísticas detalladas
```

### 2. Estadísticas (`get_chatbot_stats`)

```typescript
// Obtener métricas específicas
await ghosty.chat("¿Cuántas conversaciones tuve este mes?", user);

// Métricas disponibles:
// - conversations: número total de conversaciones
// - messages: cantidad de mensajes
// - tokens: tokens consumidos
// - users: usuarios únicos
// - cost: costo total en USD

// Períodos: day, week, month, year
```

### 3. Búsqueda Web (`web_search`, `web_fetch`)

```typescript
// Información actualizada
await ghosty.chat("Busca información sobre las nuevas funciones de OpenAI GPT-5", user);

// Contenido específico de sitios web
await ghosty.chat("Obtén el contenido de la página https://docs.anthropic.com", user);
```

## 🔄 Sistema de Switch Local/Remoto

### Configuración Local

```typescript
const ghosty = new GhostyLlamaIndex({
  mode: 'local',
  model: 'gpt-5-nano',
  llmProvider: 'openai'
});
```

### Configuración Remota

```typescript
const ghosty = new GhostyLlamaIndex({
  mode: 'remote',
  remoteEndpoint: 'https://agents.formmy.app/api/chat',
  remoteApiKey: process.env.GHOSTY_REMOTE_API_KEY
});
```

### Modo Adaptivo (Recomendado)

```typescript
// Intenta remoto, fallback a local automáticamente
const response = await ghosty.chatAdaptive("Hola Ghosty", user);

// O con factory
const agent = await GhostyAgentFactory.createAdaptiveAgent(config);
```

## 🔧 Variables de Entorno

```bash
# APIs para agentes locales
CHATGPT_API_KEY=tu_openai_key
ANTHROPIC_API_KEY=tu_anthropic_key

# Configuración remota
GHOSTY_MODE=local          # local | remote
GHOSTY_REMOTE_ENDPOINT=https://agents.formmy.app/api/chat
GHOSTY_REMOTE_API_KEY=tu_remote_key
```

## 📊 Endpoint de API

### Nueva implementación: `/api/ghosty/llamaindex`

```bash
# Chat con streaming
curl -X POST /api/ghosty/llamaindex \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuántos usuarios únicos tuve esta semana?",
    "stream": true,
    "history": [],
    "mode": "adaptive"
  }'

# Health check
curl /api/ghosty/llamaindex?action=health

# Test conexión remota
curl /api/ghosty/llamaindex?action=test-remote

# Ver configuración
curl /api/ghosty/llamaindex?action=config
```

## 🧪 Testing

### Test de Conectividad

```typescript
const ghosty = new GhostyLlamaIndex();

// Test conexión remota
const result = await ghosty.testRemoteConnection();
console.log(result); // { success: boolean, latency?: number, error?: string }
```

### Test de Herramientas

```typescript
// Usar directamente las herramientas
import { queryChatbotsTool } from "server/ghosty-llamaindex/tools";

const result = await queryChatbotsTool.call(
  { filters: { status: 'ACTIVE' } },
  { userId: user.id, user }
);
```

## 🔍 Debugging

### Logs Detallados

```typescript
// Habilitar logs en desarrollo
const ghosty = new GhostyLlamaIndex({
  // ... config
  verbose: process.env.NODE_ENV === 'development'
});
```

### Observabilidad

Los logs incluyen:
- 🤖 Inicialización de agentes
- 🔍 Ejecución de herramientas
- 🌐 Llamadas remotas
- ⚠️ Fallbacks y errores
- ⏱️ Tiempos de respuesta

## 📈 Beneficios vs Implementación Anterior

### ✅ Ventajas

- **Estándar de industria**: Patrones probados de LlamaIndex
- **Type Safety**: TypeScript completo en toda la implementación
- **Observabilidad**: Logs detallados y métricas
- **Extensibilidad**: Fácil agregar nuevas herramientas
- **Fallback automático**: Sin downtime por problemas remotos
- **Memory management**: Conversaciones persistentes
- **Modularity**: Código más mantenible y testeable

### 🔧 Funcionalidades Nuevas

- **Queries complejas**: Filtros avanzados para chatbots
- **Estadísticas granulares**: Métricas por período y tipo
- **Switch dinámico**: Local/remoto sin restart
- **Health checks**: Monitoreo de servicios remotos
- **Context awareness**: Herramientas conocen el contexto del usuario

## 🚀 Migración

Para migrar del sistema actual:

1. **Instalación**: `npm install llamaindex @llamaindex/mongodb` ✅
2. **Usar adapter**: Reemplazar `callGhostyWithTools` con `GhostyLlamaAdapter`
3. **Test**: Comparar respuestas entre implementaciones
4. **Switch gradual**: Usar feature flags para migración controlada
5. **Monitor**: Observar logs y métricas durante transición

## 🎯 Próximos Pasos

- [ ] Implementar vector store para RAG avanzado
- [ ] Agregar tool para integraciones (WhatsApp, Stripe)
- [ ] Sistema de caching para respuestas frecuentes
- [ ] Métricas de performance y costos
- [ ] Dashboard de monitoreo de agentes