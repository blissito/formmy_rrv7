# LlamaIndex Engine v0.0.1 🚀

Motor base reutilizable para todos los agentes de Formmy, construido sobre LlamaIndex 2025.

## 🎯 Arquitectura: Motor + Agentes

### Motor Base (`LlamaIndexEngine`)
- **Una sola responsabilidad**: Ejecutar chats con LlamaIndex consistentemente
- **Reutilizable**: Sirve como base para cientos de agentes futuros
- **Configurable**: Modelo, herramientas, prompts, iteraciones por agente
- **Monitoreado**: Sistema de eventos para logging y debugging

### Agentes Especializados
- **ChatbotAgent**: Para chatbots de usuarios (modelo configurable, UI simple)
- **GhostyAgent**: *TODO FUTURO* - Migrar desde `/server/ghosty-llamaindex/`
- **CommandPaletteAgent**: *TODO FUTURO* - Para command palette inteligente
- **FormBuilderAgent**: *TODO FUTURO* - Para creación de formularios
- **APIAgent**: *TODO FUTURO* - Para integraciones API

## 📁 Estructura

```
server/llamaindex-engine/
├── core/
│   ├── engine.ts           # Motor base LlamaIndexEngine
│   └── types.ts            # Interfaces y tipos
├── agents/
│   ├── chatbot-agent.ts    # Agente para chatbots de usuario
│   └── compatibility-adapter.ts  # Adapters de compatibilidad
├── tools/
│   └── chatbot-tools.ts    # Herramientas para ChatbotAgent
└── index.ts                # Exports principales
```

## 🚀 Uso Actual

### API de Chatbots
```typescript
// En /app/routes/api.v1.chatbot.ts
const useNewEngine = false; // 👈 Flag de migración

if (useNewEngine) {
  const { chatWithNewEngine } = await import("server/llamaindex-engine");

  const response = await chatWithNewEngine(message, chatbot, user, options);
}
```

### Testing
```bash
# Probar el motor sin afectar producción
npx tsx scripts/test-new-engine.ts
```

## ✨ Características

### ChatbotAgent v1.0
- ✅ **Modelo configurable por usuario** (respeta `chatbot.aiModel`)
- ✅ **Herramientas basadas en plan** (PRO+ tiene reminders)
- ✅ **Contexto personalizado** (instrucciones del usuario)
- ✅ **UI simple** (optimizado para ChatPreview)
- ✅ **Compatibilidad 100%** con API actual

### Motor Base v0.0.1
- ✅ **ReActAgent** con LlamaIndex patterns oficiales
- ✅ **Smart streaming** (automático según herramientas)
- ✅ **Error handling robusto** con mensajes user-friendly
- ✅ **Token tracking** y metadata completa
- ✅ **Event system** para monitoring
- ✅ **Lazy initialization** para performance

## 🛠️ Herramientas Disponibles

### ChatbotAgent
- `schedule_reminder` - Para planes PRO/ENTERPRISE/TRIAL
- `create_payment_link` - Si usuario tiene Stripe configurado

### Reutiliza Código Funcionando
Todas las herramientas reutilizan el sistema existente:
```typescript
// Usar el registry existente que sabemos funciona
const { executeToolCall } = await import('../../tools/registry');
const result = await executeToolCall('schedule_reminder', params, context);
```

## 🔄 Estado de Migración

### ✅ COMPLETADO
- [x] Motor base v0.0.1
- [x] ChatbotAgent especializado
- [x] Sistema de herramientas unificado
- [x] Adapter de compatibilidad
- [x] Flag de migración en API
- [x] Script de testing

### 🚧 EN PROGRESO
- [ ] Testing completo del ChatbotAgent
- [ ] Validación con herramientas reales
- [ ] Performance benchmarks

### 📋 TODO FUTURO
- [ ] Migrar GhostyAgent al motor v0.0.1
- [ ] Crear CommandPaletteAgent
- [ ] Crear FormBuilderAgent
- [ ] Sistema de plugins para herramientas
- [ ] Métricas avanzadas y telemetría

## 🧪 Testing

### Test Suite
```bash
npx tsx scripts/test-new-engine.ts
```

### Tests Incluidos
1. **Agent Creation** - Verificar inicialización
2. **Basic Chat** - Chat simple sin herramientas
3. **Reminders Tool** - Uso de herramientas
4. **Engine Comparison** - vs Framework anterior

### Test Manual
```typescript
import { createChatbotAgent } from 'server/llamaindex-engine';

const agent = createChatbotAgent(chatbot, user);
const response = await agent.chat('¡Hola!', executionContext);
```

## ⚡ Performance

### Optimizaciones
- **Lazy agent initialization** (solo cuando se necesita)
- **Smart model selection** (GPT-5-nano por defecto)
- **Tool filtering** (solo herramientas relevantes)
- **Context optimization** (truncar historial automáticamente)

### Métricas Esperadas
- **Tiempo respuesta**: ~500ms (sin herramientas), ~1500ms (con herramientas)
- **Tokens usage**: 20-40% reducción vs sistema anterior
- **Error rate**: <1% (con fallbacks robustos)

## 🔒 Seguridad

### Principios
- **Reutilizar código funcionando** (no reinventar herramientas)
- **Validación estricta** de parámetros de herramientas
- **Sandboxing** de system prompts por agente
- **Rate limiting** por usuario/plan

### Error Handling
- **User-friendly messages** (no exposición de errores técnicos)
- **Fallback graceful** al sistema anterior si falla
- **Logging completo** para debugging

## 📊 Monitoring

### Event System
```typescript
engine.onEvent(event => {
  console.log(`${event.type}: ${event.agentName} for user ${event.userId}`);
});
```

### Eventos Disponibles
- `agent_created` - Nuevo agente inicializado
- `chat_started` - Chat iniciado
- `chat_completed` - Chat completado exitosamente
- `tool_executed` - Herramienta ejecutada
- `error` - Error ocurrido

## 🚀 Roadmap

### v0.1.0 (Next)
- [ ] Migrar GhostyAgent
- [ ] Command palette básico
- [ ] Métricas en tiempo real

### v0.2.0 (Future)
- [ ] Sistema de plugins
- [ ] Agentes multimodales
- [ ] Workflow automation

### v1.0.0 (Goal)
- [ ] 100+ agentes especializados
- [ ] Marketplace de agentes
- [ ] IA para crear agentes automáticamente

---

*Motor v0.0.1 - La base para el futuro de agentes inteligentes en Formmy* 🤖