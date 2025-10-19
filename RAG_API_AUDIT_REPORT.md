# RAG API v1 - Reporte de Auditoría
**Fecha**: Octubre 19, 2025
**Auditor**: Claude Code
**Usuario de prueba**: fixtergeek@gmail.com (Plan: TRIAL)

---

## Resumen Ejecutivo

✅ **Status General**: FUNCIONAL con 1 bug crítico
📊 **Tests Ejecutados**: 7
✅ **Tests Exitosos**: 5 (71.4%)
❌ **Tests Fallidos**: 2 (1 esperado)
💰 **Créditos Consumidos**: 3
⏱️ **Tiempo Promedio de Respuesta**: 1262ms

---

## Endpoints Auditados

### 1. GET /api/rag/v1?intent=list ✅
**Status**: FUNCIONAL
**Tiempo de respuesta**: 868ms
**Créditos**: 0

**Funcionalidad**:
- Lista todos los documentos parseados del chatbot
- Retorna metadata completa: fileName, type, mode, pages, chunks
- Distingue entre fuentes: parser_api, manual_upload, web_source, text_context, qa_context
- Filtrado correcto por chatbot ownership

**Respuesta de ejemplo**:
```json
{
  "contexts": [
    {
      "id": "XwCanMW7fhGVrXhlsio5U",
      "fileName": "https://beta.formmy.app",
      "type": "LINK",
      "mode": "COST_EFFECTIVE",
      "pages": 8,
      "chunks": 6,
      "source": "web_source"
    },
    {
      "id": "PIlBgA5-dh5c6F_GMCYOY",
      "fileName": "Axolotl-en-Final-de-juego-Julio-Cortázar1.pdf",
      "type": "FILE",
      "mode": "COST_EFFECTIVE",
      "pages": 0,
      "chunks": 9,
      "source": "manual_upload"
    }
  ],
  "total": 2
}
```

---

### 2. GET /api/rag/v1?intent=cleanup ✅
**Status**: FUNCIONAL
**Tiempo de respuesta**: 792ms
**Créditos**: 0

**Funcionalidad**:
- Identifica embeddings huérfanos (sin contextId válido)
- Elimina embeddings sin contexto asociado
- Retorna estadísticas de limpieza

**Respuesta de ejemplo**:
```json
{
  "success": true,
  "totalEmbeddings": 15,
  "validContexts": 3,
  "orphanedFound": 0,
  "orphanedDeleted": 0,
  "message": "No se encontraron embeddings huérfanos"
}
```

---

### 3. POST /api/rag/v1?intent=query (mode=fast) ✅
**Status**: FUNCIONAL
**Tiempo de respuesta**: 2224ms
**Créditos**: 1

**Funcionalidad**:
- Retrieval vectorial sin síntesis de LLM
- Retorna top 5 chunks más relevantes
- Incluye scores de similitud (0.72-0.79)
- Metadata completa: contextType, title, fileName, url, page, chunkIndex, contextId

**Request de ejemplo**:
```json
{
  "query": "qué animal es el axolotl?",
  "chatbotId": "68f456dca443330f35f8c81d",
  "mode": "fast"
}
```

**Respuesta de ejemplo**:
```json
{
  "query": "qué animal es el axolotl?",
  "results": [
    {
      "content": "...descripción del axolotl...",
      "score": 0.7924591302871704,
      "metadata": {
        "contextType": "FILE",
        "title": null,
        "fileName": "Axolotl-en-Final-de-juego-Julio-Cortázar1.pdf",
        "url": null,
        "chunkIndex": 1,
        "contextId": "PIlBgA5-dh5c6F_GMCYOY"
      }
    }
  ],
  "creditsUsed": 1,
  "processingTime": 1248
}
```

---

### 4. POST /api/rag/v1?intent=query (mode=accurate) ✅
**Status**: FUNCIONAL
**Tiempo de respuesta**: 3072ms
**Créditos**: 2

**Funcionalidad**:
- Retrieval vectorial + síntesis con GPT-4o-mini
- Respuesta en lenguaje natural basada en fuentes
- Incluye answer + sources
- Metadata completa de fuentes

**Request de ejemplo**:
```json
{
  "query": "qué características físicas tiene el axolotl?",
  "chatbotId": "68f456dca443330f35f8c81d",
  "mode": "accurate"
}
```

**Respuesta de ejemplo**:
```json
{
  "query": "qué características físicas tiene el axolotl?",
  "answer": "El axolotl tiene un cuerpecito rosado y translúcido, similar a un pequeño lagarto de quince centímetros, con una cola de pez de gran delicadeza. Posee patas de finura sutilísima, acabadas en dedos menudos y uñas humanas...",
  "sources": [
    {
      "content": "...",
      "score": 0.804890513420105,
      "metadata": {...}
    }
  ],
  "creditsUsed": 2,
  "processingTime": 2669
}
```

---

### 5. POST /api/rag/v1?intent=query (con contextId filter) ❌
**Status**: FALLA
**Bug**: metadata.contextId no está indexado en MongoDB

**Error**:
```
Raw query failed. Code: `unknown`. Message: `Kind: Command failed:
Error code 8 (UnknownError): PlanExecutor error during aggregation ::
caused by :: Path 'metadata.contextId' needs to be indexed as filter`
```

**Solución**:
```javascript
db.embeddings.createIndex({ "metadata.contextId": 1 }, { name: "metadata_contextId_1" })
```

---

### 6. Validación de Autenticación ✅
**Status**: FUNCIONAL
**Tiempo de respuesta**: 3ms

**Funcionalidad**:
- Rechaza requests sin API key (401)
- Rechaza API keys inválidas (401)
- Mensaje de error claro: "API key required. Use Authorization: Bearer sk_live_xxx or X-API-Key header"

---

### 7. Validación de Ownership ✅
**Status**: FUNCIONAL
**Tiempo de respuesta**: 652ms

**Funcionalidad**:
- Valida que el usuario sea dueño del chatbot
- Retorna 403 si el chatbot no existe o no pertenece al usuario
- Mensaje: "Chatbot not found or unauthorized"

---

## Auditoría de Documentación

### ✅ Documentación Incluida
1. **Endpoint** `/api/rag/v1?intent=query` - ✅ DOCUMENTADO
2. **Endpoint** `/api/rag/v1?intent=list` - ✅ DOCUMENTADO
3. **Ejemplo cURL** para query - ✅ INCLUIDO
4. **SDK TypeScript** - ✅ INCLUIDO con método `query()`

### ⚠️ Documentación Faltante
1. ❌ **Endpoint** `/api/rag/v1?intent=cleanup` - NO DOCUMENTADO
2. ❌ **Parámetro** `mode=fast` vs `mode=accurate` - NO EXPLICADO
3. ❌ **Parámetro** `contextId` (filter) - NO DOCUMENTADO
4. ❌ **Costos de créditos** por modo - NO ESPECIFICADO
5. ❌ **Códigos de error** 401/402/403/500 - NO DOCUMENTADOS

### Recomendaciones de Documentación

Agregar a `app/components/APIDocumentation.tsx`:

```typescript
// Tab "RAG API" - Agregar sección de modos
<div className="mb-4">
  <h4 className="font-semibold text-dark text-sm mb-2">Modos de Query</h4>
  <div className="space-y-2">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
      <p className="text-xs font-mono font-bold text-blue-700">mode=fast (1 crédito)</p>
      <p className="text-xs text-metal">Solo retrieval - Retorna chunks relevantes sin síntesis</p>
    </div>
    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
      <p className="text-xs font-mono font-bold text-green-700">mode=accurate (2 créditos)</p>
      <p className="text-xs text-metal">Retrieval + LLM - Respuesta sintetizada en lenguaje natural</p>
    </div>
  </div>
</div>

// Agregar endpoint cleanup
<div className="bg-gray-50 border border-outlines rounded-lg p-2">
  <p className="text-xs font-mono font-bold text-orange-700">GET /api/rag/v1?intent=cleanup&chatbotId=xxx</p>
  <p className="text-xs text-metal mt-1">Limpiar embeddings huérfanos sin contexto asociado</p>
</div>

// Agregar sección de códigos de error
<div className="mb-4">
  <h4 className="font-semibold text-dark text-sm mb-2">Códigos de Error</h4>
  <ul className="space-y-1 text-xs text-metal">
    <li><code className="bg-gray-100 px-1">401</code> - API key inválida o faltante</li>
    <li><code className="bg-gray-100 px-1">402</code> - Créditos insuficientes</li>
    <li><code className="bg-gray-100 px-1">403</code> - Chatbot no encontrado o sin permisos</li>
    <li><code className="bg-gray-100 px-1">500</code> - Error interno del servidor</li>
  </ul>
</div>
```

---

## Tracking de Créditos

### Estado Actual del Usuario de Prueba
```
Email: fixtergeek@gmail.com
Plan: TRIAL
Créditos usados (mensuales): 19
Créditos comprados: 0
Créditos disponibles: Ilimitados (TRIAL)
```

### Verificación de Consumo

Durante la auditoría se consumieron:
- 1 crédito (mode=fast)
- 2 créditos (mode=accurate)
- **Total**: 3 créditos

**⚠️ PENDIENTE**: Verificar que estos 3 créditos se hayan registrado en:
1. `User.toolCreditsUsed` (debería incrementar de 19 → 22)
2. `User.lifetimeCreditsUsed` (tracking histórico)
3. Admin dashboard muestre el consumo actualizado

### Verificación en Admin

**Tareas pendientes**:
- [ ] Confirmar que `/admin/users` muestre `toolCreditsUsed` actualizado
- [ ] Verificar que el tracking sea en tiempo real (no batch)
- [ ] Confirmar que el tracking distinga entre créditos mensuales y comprados
- [ ] Verificar que el reset mensual funcione correctamente
- [ ] Confirmar que el historial (`lifetimeCreditsUsed`) se mantenga después del reset

---

## Bugs Identificados

### 🔴 CRÍTICO: Índice faltante en MongoDB
**Ubicación**: `Embedding.metadata.contextId`
**Impacto**: Vector search con filtro `contextId` falla completamente
**Solución**:
```javascript
db.embeddings.createIndex({ "metadata.contextId": 1 }, { name: "metadata_contextId_1" })
```

**Prioridad**: ALTA
**Effort**: 1 minuto (ejecutar comando en MongoDB Atlas)

---

## Mejoras Recomendadas

### Alta Prioridad
1. ✅ Crear índice en `metadata.contextId`
2. 📝 Completar documentación de endpoints faltantes
3. 📊 Verificar tracking de créditos en admin

### Media Prioridad
1. Agregar rate limiting por API key (actualmente en schema pero no implementado)
2. Implementar analytics de queries: tracking de queries populares, sources más usados
3. Agregar opción de limitar `topK` en query (actualmente fijo en 5)

### Baja Prioridad
1. Agregar streaming para mode=accurate
2. Implementar cache de queries frecuentes
3. Agregar support para múltiples chatbots en una sola query

---

## Scripts de Testing

### Script Automatizado
**Ubicación**: `/scripts/test-rag-api-audit.ts`

**Uso**:
```bash
npx tsx scripts/test-rag-api-audit.ts
```

**Features**:
- 7 tests automatizados
- Validación de responses
- Tracking de créditos consumidos
- Reporte detallado con estadísticas
- Exit code basado en resultados

---

## Conclusiones

### ✅ Fortalezas
1. **API funcional y estable** - 5/7 endpoints funcionan correctamente
2. **Buena performance** - Respuestas en 800-3000ms
3. **Autenticación robusta** - Validación correcta de API keys y ownership
4. **Créditos correctos** - 1 crédito (fast), 2 créditos (accurate)
5. **Metadata completa** - Responses incluyen toda la información necesaria

### ⚠️ Áreas de Mejora
1. **Falta índice en MongoDB** - Bug crítico que bloquea filtrado por contextId
2. **Documentación incompleta** - Faltan 5 elementos importantes
3. **Tracking no verificado** - Pendiente confirmar en admin dashboard

### 🎯 Siguiente Pasos
1. Crear índice en MongoDB (1 min)
2. Completar documentación (30 min)
3. Verificar tracking de créditos en admin (10 min)
4. Re-ejecutar auditoría completa (5 min)

---

## Apéndice: Comandos Útiles

### Crear Índice en MongoDB
```javascript
// MongoDB Shell
db.embeddings.createIndex({"metadata.contextId": 1}, {name: "metadata_contextId_1"})

// Verificar índices
db.embeddings.getIndexes()
```

### Ejecutar Auditoría
```bash
# Auditoría completa
npx tsx scripts/test-rag-api-audit.ts

# Tests manuales con curl
curl -H "Authorization: Bearer $API_KEY" \
  "http://localhost:3000/api/rag/v1?intent=list&chatbotId=$CHATBOT_ID"
```

### Verificar Créditos del Usuario
```typescript
npx tsx scripts/get-user-api-credentials.ts fixtergeek@gmail.com
```

---

**Fin del Reporte**
