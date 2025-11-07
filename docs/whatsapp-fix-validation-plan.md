# Plan de Validación: Fix WhatsApp Duplicados + Auto-Takeover

## 🎯 Objetivos de Validación

1. ✅ **Deduplicación funciona cross-instance**
2. ✅ **Auto-takeover activa modo manual al recibir eco**
3. ✅ **Auto-release desactiva modo manual después de 30 min**
4. ✅ **NO hay duplicados en producción**

---

## 📋 Tests Realizados (Local) ✅

### Test 1: Deduplicación en MongoDB
```bash
npx tsx scripts/test-auto-takeover.ts
```
**Resultado**: ✅ PASSED
- Primera llamada: `false` (mensaje nuevo)
- Segunda llamada: `true` (mensaje duplicado)

### Test 2: Auto-Takeover
**Resultado**: ✅ PASSED
- Conversación cambia a `manualMode: true`
- `lastEchoAt` se actualiza correctamente

### Test 3: Auto-Release (30 min timeout)
**Resultado**: ✅ PASSED
- Conversaciones con eco >30 min se liberan
- `manualMode` cambia a `false` automáticamente

---

## 🧪 Tests Necesarios en PRODUCCIÓN

### Paso 1: Verificar Índice TTL en MongoDB
```bash
# Conectar a MongoDB production y verificar
fly ssh console -a formmy-v2
npx tsx scripts/setup-ttl-indexes.ts
```

**Verificar output**:
```json
{
  "expiresAt_ttl": {
    "expireAfterSeconds": 0
  }
}
```

---

### Paso 2: Test de Deduplicación en Producción

#### A. Simular Webhook Duplicado
```bash
# Enviar el MISMO mensaje 3 veces seguidas desde WhatsApp
# Verificar que solo se procesa UNA vez
```

**Cómo verificar**:
1. Enviar mensaje "TEST DEDUP 123" desde WhatsApp
2. Ver logs de Fly.io: `fly logs -a formmy-v2`
3. Buscar: `[Webhook] Skipping duplicate message`

**Expected**: Ver 2 mensajes skipped (duplicados)

#### B. Verificar en MongoDB
```typescript
// Script: scripts/verify-deduplication.ts
const count = await db.processedWebhook.count({
  phoneNumberId: "TU_PHONE_NUMBER_ID"
});
console.log(`Processed webhooks: ${count}`);
```

**Expected**: Número aumenta con cada mensaje único, NO con duplicados

---

### Paso 3: Test de Auto-Takeover (ECO)

#### Escenario
1. Cliente te manda mensaje por WhatsApp
2. Bot responde automáticamente
3. TÚ respondes desde tu celular (WhatsApp Business App)
4. Cliente responde de nuevo

**Expected Behavior**:
- ✅ Paso 1-2: Bot responde (normal)
- ✅ Paso 3: Webhook recibe ECO → `manualMode = true` activado
- ✅ Paso 4: Bot NO responde (modo manual activo)

**Cómo verificar**:
```bash
# Ver logs en tiempo real
fly logs -a formmy-v2 | grep "Auto-Takeover"
```

**Expected log**:
```
✅ [Auto-Takeover] Activated manual mode for conversation XXX (echo from business)
```

**Verificar en DB**:
```typescript
const conv = await db.conversation.findUnique({
  where: { sessionId: "SESSION_ID" }
});
console.log(`Manual mode: ${conv.manualMode}`); // true
console.log(`Last echo: ${conv.lastEchoAt}`); // timestamp reciente
```

---

### Paso 4: Test de Auto-Release (30 min)

#### Escenario
1. Conversación en `manualMode = true` (porque respondiste desde cel)
2. Esperar 30 minutos SIN responder desde tu cel
3. Cliente manda mensaje de nuevo

**Expected Behavior**:
- ✅ Después de 30 min: Cron job ejecuta y desactiva `manualMode`
- ✅ Mensaje del cliente: Bot responde automáticamente de nuevo

**Cómo verificar**:

##### A. Forzar Cron Job (NO esperar 30 min)
```bash
# Llamar endpoint manualmente
curl -X POST https://formmy.app/api/cron/auto-release \
  -H "X-Cron-Secret: $CRON_SECRET"
```

**Expected response**:
```json
{
  "success": true,
  "result": {
    "released": 1
  }
}
```

##### B. Ver Logs
```bash
fly logs -a formmy-v2 | grep "Auto-Release"
```

**Expected log**:
```
✅ [Auto-Release] Released 1 conversations from manual mode
  - Conversation XXX (inactive for 31 min)
```

##### C. Verificar Stats
```bash
curl https://formmy.app/api/cron/auto-release
```

**Expected response**:
```json
{
  "stats": {
    "total": 0,      // No más conversaciones en modo manual
    "active": 0,
    "expired": 0
  }
}
```

---

### Paso 5: Test de NO Duplicados (CRÍTICO)

#### Monitorear durante 24 horas
```bash
# Script para detectar duplicados
npx tsx scripts/detect-duplicates-live.ts
```

**Script a crear**:
```typescript
// Monitorear mensajes con mismo externalMessageId
const duplicates = await db.message.groupBy({
  by: ['conversationId', 'externalMessageId'],
  having: {
    externalMessageId: {
      _count: {
        gt: 1
      }
    }
  }
});

if (duplicates.length > 0) {
  console.error('🔴 DUPLICATES FOUND:', duplicates);
} else {
  console.log('✅ No duplicates detected');
}
```

**Métricas a verificar**:
- Total mensajes recibidos hoy
- Total ProcessedWebhook records
- Diferencia debe ser CERO (o solo duplicados externos de Meta)

---

## 🚨 Alertas de Monitoreo

### Configurar en Fly.io Metrics
1. **Tasa de Mensajes Duplicados**
   - Query: `COUNT(skipped=true, reason=duplicate) / COUNT(total messages)`
   - Alert si > 5% (indicaría problema con deduplicación)

2. **Conversaciones Stuck en Manual Mode**
   - Query: `COUNT(manualMode=true AND lastEchoAt < NOW() - 60min)`
   - Alert si > 0 (indicaría que auto-release no está corriendo)

3. **ProcessedWebhook Growth**
   - Query: `COUNT(ProcessedWebhook) per hour`
   - Alert si crece exponencialmente (indicaría que TTL no está funcionando)

---

## 📊 Checklist Pre-Deploy

- [ ] ✅ Tests locales pasados (3/3)
- [ ] ✅ Índice TTL creado localmente
- [ ] ⏳ Código revisado
- [ ] ⏳ Deploy a staging/producción
- [ ] ⏳ Ejecutar `setup-ttl-indexes.ts` en prod
- [ ] ⏳ Configurar Cron job (cada 10 min)
- [ ] ⏳ Test de deduplicación en producción
- [ ] ⏳ Test de auto-takeover con eco real
- [ ] ⏳ Test de auto-release (forzado)
- [ ] ⏳ Monitoreo 24h sin duplicados

---

## 🔧 Rollback Plan

Si algo falla en producción:

### Opción 1: Deshabilitar Deduplicación
```typescript
// En webhook.tsx, comentar línea:
// const alreadyProcessed = await isMessageProcessed(...)
// Volver a usar Set en memoria (temporal)
```

### Opción 2: Deshabilitar Auto-Takeover
```typescript
// En webhook.tsx, comentar:
// await db.conversation.update({ manualMode: true, lastEchoAt: ... })
```

### Opción 3: Rollback completo
```bash
git revert HEAD
npm run deploy
```

---

## 📈 Métricas de Éxito

### Semana 1
- ✅ CERO duplicados detectados
- ✅ Auto-takeover funciona en 100% de casos
- ✅ Auto-release ejecuta correctamente cada 10 min

### Semana 2-4
- ✅ Reducción de quejas de usuarios sobre duplicados
- ✅ Conversaciones fluyen correctamente entre bot y humano
- ✅ Modo manual se libera automáticamente

---

## 🎉 Criterios de Éxito Final

1. ✅ NO hay mensajes duplicados en DB (verificar con script)
2. ✅ Eco activa modo manual 100% de las veces
3. ✅ Modo manual se desactiva después de 30 min
4. ✅ Bot NO responde cuando hay eco reciente (<30 min)
5. ✅ Bot SÍ responde cuando eco es antiguo (>30 min)
6. ✅ ProcessedWebhook records se auto-eliminan (TTL funciona)
7. ✅ Sistema funciona en múltiples instancias de Fly.io

