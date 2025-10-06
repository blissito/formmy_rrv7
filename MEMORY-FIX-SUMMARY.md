# Fix: Memoria Persistente en "Nueva Conversación"

## 🐛 Problema Original

Cuando el usuario hacía click en "Nueva Conversación", el agente mantenía memoria de la conversación anterior.

### Causas Identificadas

#### **Bug 1: Frontend (ChatPreview.tsx)**
- `handleClearConversation()` solo limpiaba la UI
- `sessionIdRef.current` **nunca se regeneraba**
- Próximo mensaje usaba mismo sessionId → backend recuperaba conversación antigua

#### **Bug 2: Backend (api.v0.chatbot.server.ts)**
- Cuando cliente enviaba sessionId nuevo (no existe en BD)
- Backend buscaba por sessionId → no encontraba
- Backend hacía **fallback a `findLastActiveConversation()` por visitorId**
- Recuperaba conversación antigua → memoria persistente

---

## ✅ Soluciones Implementadas

### **Fix 1: Frontend - ChatPreview.tsx**

**Archivo:** `/app/components/ChatPreview.tsx`

#### Cambio 1: Helper con TTL de 24h (líneas 62-93)
```typescript
const getOrCreateSessionId = () => {
  if (typeof window === "undefined")
    return `${production ? "prod" : "preview"}-${chatbot.id}-${Date.now()}`;

  const storageKey = `formmy-session-${chatbot.id}`;
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const { sessionId, timestamp } = JSON.parse(stored);
      const age = Date.now() - timestamp;
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas

      if (age < MAX_AGE) return sessionId;
    } catch (e) {}
  }

  // Crear nueva sesión
  const newSessionId = `${production ? "prod" : "preview"}-${chatbot.id}-${Date.now()}`;
  localStorage.setItem(storageKey, JSON.stringify({
    sessionId: newSessionId,
    timestamp: Date.now()
  }));

  return newSessionId;
};

const sessionIdRef = useRef<string>(getOrCreateSessionId());
```

#### Cambio 2: Regenerar sessionId en handleClearConversation (líneas 230-239)
```typescript
const handleClearConversation = () => {
  setChatMessages([...]);
  setChatError(null);
  setIsConversationEnded(false);

  // 🆕 Regenerar sessionId
  const newSessionId = `${production ? "prod" : "preview"}-${chatbot.id}-${Date.now()}`;
  sessionIdRef.current = newSessionId;

  // 🆕 Actualizar localStorage
  const storageKey = `formmy-session-${chatbot.id}`;
  localStorage.setItem(storageKey, JSON.stringify({
    sessionId: newSessionId,
    timestamp: Date.now()
  }));
};
```

**Resultado:**
- ✅ Click "Nueva Conversación" → sessionId nuevo → conversación nueva
- ✅ Reset automático después de 24h
- ✅ Mantiene visitorId para tracking

---

### **Fix 2: Backend - api.v0.chatbot.server.ts**

**Archivo:** `/app/routes/api.v0.chatbot.server.ts`

#### Cambio: No hacer fallback si sessionId fue proporcionado (líneas 329-351)

**ANTES (con bug):**
```typescript
let conversation = null;

if (sessionId) {
  conversation = await getConversationBySessionId(sessionId);
}

if (!conversation && effectiveVisitorId) {
  // 👈 BUG: Siempre busca última conversación, incluso con sessionId nuevo
  conversation = await findLastActiveConversation({
    chatbotId,
    visitorId: effectiveVisitorId
  });
}
```

**DESPUÉS (arreglado):**
```typescript
let conversation = null;
let sessionIdProvided = false;

if (sessionId) {
  sessionIdProvided = true;
  conversation = await getConversationBySessionId(sessionId);
}

// 🔑 CRÍTICO: Solo buscar última conversación si NO se proporcionó sessionId
if (!conversation && !sessionIdProvided && effectiveVisitorId) {
  conversation = await findLastActiveConversation({
    chatbotId,
    visitorId: effectiveVisitorId
  });
}

if (!conversation) {
  // Crear nueva conversación
  conversation = await createConversation({...});
}
```

**Resultado:**
- ✅ Si sessionId proporcionado no existe → crea conversación nueva
- ✅ Solo recupera conversación antigua si NO se proporciona sessionId
- ✅ Memoria aislada entre sesiones diferentes

---

## 🧪 Pruebas

### Script de Prueba
**Ubicación:** `/scripts/test-memory-fix.sh`

### Resultado del Test
```
✅ ÉXITO: El agente NO recordó información de sesión anterior
   Bug de memoria persistente está ARREGLADO

   Sesión 1: Recordó contexto (esperado)
   Sesión 2: NO recordó contexto (esperado - FIX FUNCIONA)
```

### Logs del Backend (confirmación)
```
🆕 Creando nueva conversación para visitorId: dev-user-mock-pro
📚 Historial cargado: 1 mensajes totales
🆕 Creando nueva conversación para visitorId: dev-user-mock-pro
📚 Historial cargado: 1 mensajes totales
🆕 Creando nueva conversación para visitorId: dev-user-mock-pro
```

Cada sessionId nuevo → conversación nueva ✅

---

## 📊 Comportamiento Final

### Caso 1: Usuario hace click "Nueva Conversación"
1. Frontend regenera sessionId
2. Usuario envía mensaje
3. Backend recibe sessionId nuevo
4. Backend NO encuentra conversación con ese sessionId
5. Backend NO busca conversación antigua (fix aplicado)
6. Backend crea conversación nueva
7. **Agente memoria limpia** ✅

### Caso 2: Usuario recarga página (dentro de 24h)
1. Frontend recupera sessionId de localStorage (< 24h)
2. Usuario envía mensaje
3. Backend encuentra conversación existente
4. Backend carga historial
5. **Agente mantiene memoria** ✅

### Caso 3: Usuario recarga página (después de 24h)
1. Frontend detecta sessionId expirado (> 24h)
2. Frontend genera sessionId nuevo
3. Backend crea conversación nueva
4. **Agente memoria limpia** ✅

### Caso 4: Usuario sin sessionId (primera vez o localStorage vacío)
1. Frontend no tiene sessionId
2. Backend NO recibe sessionId
3. Backend busca última conversación activa (recuperación automática)
4. Si encuentra → recupera memoria
5. Si no encuentra → crea nueva

---

## 🎯 Archivos Modificados

1. **Frontend:** `/app/components/ChatPreview.tsx`
   - Líneas 62-96: Helper `getOrCreateSessionId()` con TTL 24h
   - Líneas 230-239: `handleClearConversation()` regenera sessionId

2. **Backend:** `/app/routes/api.v0.chatbot.server.ts`
   - Líneas 329-351: No hacer fallback si sessionId fue proporcionado

3. **Scripts de prueba:** `/scripts/test-memory-fix.sh`

---

## ✅ Resultado Final

- ✅ Botón "Nueva Conversación" limpia memoria completamente
- ✅ Conversaciones se resetean automáticamente después de 24h
- ✅ Memoria aislada entre diferentes sesiones
- ✅ Recuperación automática funciona cuando NO se proporciona sessionId
- ✅ Backend y frontend sincronizados
- ✅ Test automatizado pasando

**Status:** Bug crítico ARREGLADO ✅
