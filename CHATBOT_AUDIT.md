# 🤖 Sistema de Chatbot - Auditoría y Testing

## 📋 Resumen de la Implementación

Este documento describe la auditoría completa realizada al sistema de chatbot de Formmy, incluyendo las mejoras implementadas para garantizar solidez, robustez y patterns nativos de LlamaIndex.

## ✅ Elementos Implementados

### 1. Health Check System
- **Endpoint**: `/api/health/chatbot`
- **Funcionalidad**: Verifica estado de todos los componentes críticos
- **Componentes verificados**:
  - Base de datos (MongoDB/Prisma)
  - AgentEngine V0 (LlamaIndex nativo)
  - LlamaIndex Workflow
  - Proveedores AI (OpenAI, Anthropic)
  - Registry de herramientas

```bash
# Test básico de salud
curl http://localhost:3000/api/health/chatbot

# Test de componente específico
curl -X POST http://localhost:3000/api/health/chatbot \
  -d "component=agent"
```

### 2. Rate Limiting
- **Implementación**: Sistema en memoria con ventana deslizante
- **Configuración**: 20 requests por minuto para chatbot
- **Features**:
  - Identificación por userId o IP
  - Headers estándar de rate limiting
  - Mensajes de error amigables
  - Auto-cleanup de entradas expiradas

### 3. Validación de Modelos por Plan
- **Módulo**: `modelValidator.server.ts`
- **Funcionalidad**: Valida que usuarios solo usen modelos permitidos
- **Corrección automática**: Aplica modelo por defecto si el solicitado no está disponible
- **Planes soportados**:
  - FREE: Sin acceso
  - STARTER: `gpt-3.5-turbo`
  - PRO/TRIAL: `gpt-5-nano`, `claude-3-haiku`
  - ENTERPRISE: Todos los modelos

### 4. Config Resolver
- **Módulo**: `configResolver.server.ts`
- **Separación de concerns**: Business logic separado de agent logic
- **Funcionalidad**:
  - Resolución completa de configuración de chatbot
  - Aplicación de límites por plan
  - Validación de acceso a features
  - Generación de metadata para logging

### 5. Scripts de Testing CLI

#### Test Completo
```bash
# Ejecutar suite completa de tests
./scripts/test-chatbot.sh --chatbot-id YOUR_CHATBOT_ID --verbose

# Con configuración específica
./scripts/test-chatbot.sh \
  --api-url http://localhost:3000 \
  --chatbot-id 507f1f77bcf86cd799439011 \
  --output-dir ./test-results \
  --verbose
```

#### Quick Test
```bash
# Test rápido de funcionalidad básica
./scripts/quick-test.sh

# Con chatbot específico
CHATBOT_ID=your-id ./scripts/quick-test.sh
```

## 🔧 Arquitectura del Sistema

### Flujo de Request
1. **Rate Limiting** → Verificar límites por usuario/IP
2. **Authentication** → Validar usuario y permisos
3. **Config Resolution** → Resolver configuración según plan
4. **Model Validation** → Validar/corregir modelo AI
5. **Agent Execution** → Ejecutar con patterns nativos LlamaIndex
6. **Response Streaming** → SSE con manejo robusto de errores

### Separación de Responsabilidades

```
/server/chatbot/
├── auth.server.ts           # Autenticación y autorización
├── planLimits.server.ts     # Límites y restricciones por plan
├── modelValidator.server.ts # Validación de modelos AI
├── configResolver.server.ts # Resolución de configuración
└── chatbotAccess.server.ts  # Control de acceso a chatbots

/server/middleware/
└── rateLimiter.server.ts    # Rate limiting

/server/agents/
└── agent-v0.server.ts       # Motor LlamaIndex nativo

/app/routes/
├── api.v0.chatbot.ts        # Endpoint principal
└── api.health.chatbot.ts    # Health checks
```

## 🧪 Testing

### Test Categories

#### 1. Connectivity Tests
- Health check básico
- Conectividad de componentes
- Disponibilidad de servicios

#### 2. Functional Tests
- Chat básico sin streaming
- Streaming SSE
- Validación de input
- Manejo de errores

#### 3. Business Logic Tests
- Validación de planes
- Restricciones de modelos
- Límites por usuario
- Corrección automática

#### 4. Performance Tests
- Rate limiting
- Carga concurrente
- Timeouts y recovery
- Memory usage

#### 5. Security Tests
- Validación de acceso
- Sanitización de input
- Manejo seguro de errores

### Test Results Format

Los scripts generan resultados en formato JSON:

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "total_tests": 25,
  "passed": 24,
  "failed": 1,
  "success_rate": 96,
  "api_url": "http://localhost:3000",
  "chatbot_id": "507f1f77bcf86cd799439011"
}
```

## 🚨 Puntos de Falla Identificados y Resueltos

### ✅ Resueltos
1. **Doble implementación de AgentEngine**: Deprecated marcado claramente
2. **Error 500s expuestos**: Ahora devuelve mensajes amigables
3. **Sin rate limiting**: Implementado con límites apropiados
4. **Sin validación de modelos**: Validación automática por plan
5. **Business logic mezclado**: Separado en módulos independientes

### ⚠️ Monitoreados
1. **GPT-5 Nano stalls**: Recovery mode implementado
2. **Contextos grandes**: Truncamiento automático
3. **Timeouts fijos**: Configurables por modelo

## 📊 Monitoring y Métricas

### Health Check Response
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "checks": {
    "database": { "status": "up", "responseTime": 45 },
    "agentEngine": { "status": "up", "responseTime": 120 },
    "aiProviders": {
      "openai": { "status": "up" },
      "anthropic": { "status": "up" }
    }
  }
}
```

### Rate Limiting Headers
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1642247400
X-RateLimit-Window: 60000
```

## 🔄 Mantenimiento

### Logs de Configuración
El sistema registra automáticamente:
- Correcciones de modelo aplicadas
- Warnings de configuración
- Violaciones de límites
- Fallbacks y recovery

### Limpieza Automática
- Rate limiting: Auto-cleanup cada 10k entradas
- Logs: Rotación automática por tamaño
- Contextos: Truncamiento por límites de plan

## 🚀 Comandos de Deploy

```bash
# Verificar salud antes de deploy
./scripts/quick-test.sh

# Deploy con verificación
npm run deploy && ./scripts/test-chatbot.sh --api-url https://formmy-v2.fly.dev

# Monitoring post-deploy
watch -n 30 'curl -s https://formmy-v2.fly.dev/api/health/chatbot | jq .status'
```

## 📝 Próximas Mejoras

### Corto Plazo
- [ ] Métricas con Prometheus
- [ ] Cache de respuestas (Redis)
- [ ] Logs estructurados (JSON)

### Largo Plazo
- [ ] A/B testing de modelos
- [ ] Vector DB para contextos grandes
- [ ] Auto-scaling basado en métricas

---

**Documentación actualizada**: Enero 2025
**Versión del sistema**: 1.0.0
**Patrón oficial**: [LlamaIndex Agent Workflows](https://developers.llamaindex.ai/typescript/framework/modules/agents/agent_workflow/)