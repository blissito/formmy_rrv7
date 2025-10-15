# 📅 Estado de Integración: Google Calendar con Composio

**Última actualización**: Oct 15, 2025
**Estado general**: ✅ Backend 95% completo + Bugs críticos corregidos | ⏳ UI/Frontend pendiente

## 🐛 Bugs Críticos Corregidos (Oct 15, 2025)

### 1. **Filtro incorrecto en `connectedAccounts.list()`**
- **Problema**: Parámetro `app: 'googlecalendar'` devolvía TODAS las cuentas (gmail, whatsapp, youtube, etc.)
- **Solución**: Cambiar a `toolkitSlugs: ['googlecalendar']`
- **Archivos**: `/app/routes/api.v1.composio.google-calendar.ts` líneas 140-143, 195-198
- **Status**: ✅ Corregido

### 2. **Parámetro incorrecto en `initiate()`**
- **Problema**: Usaba `redirectUrl` en lugar de `callbackUrl`
- **Solución**: Cambiar a `callbackUrl` según documentación de Composio
- **Archivo**: `/app/routes/api.v1.composio.google-calendar.ts` línea 95
- **Status**: ✅ Corregido

### 3. **Modal mostraba "Conectado" sin verificar estado**
- **Problema**: Confiaba en `postMessage` sin verificar que Composio completó el OAuth
- **Solución**: Agregado polling con retry (5 intentos, 1s delay) para verificar estado real
- **Archivo**: `/app/components/integrations/GoogleCalendarComposioModal.tsx` líneas 62-85
- **Status**: ✅ Corregido

### Conexión Actual Confirmada:
- **ID**: `ca_FKbV979wt-fQ`
- **Estado**: `ACTIVE` ✅
- **Creada**: `2025-10-15T03:57:24.607Z`
- **Tokens**: Activos con refresh_token disponible

---

---

## ✅ Lo que YA está implementado:

### 1. **Composio SDK Instalado**
- `@composio/core`: ^0.1.55
- `@composio/llamaindex`: ^0.1.55
- API Key configurado en `.env`: `COMPOSIO_API_KEY`

### 2. **Handlers de Google Calendar** (`server/tools/handlers/google-calendar.ts`)
✅ 4 handlers completados con soporte para chatbots y Ghosty:
- `createCalendarEventHandler` - Crear eventos
- `listCalendarEventsHandler` - Listar eventos próximos
- `updateCalendarEventHandler` - Actualizar eventos
- `deleteCalendarEventHandler` - Eliminar eventos

**Características**:
- `entityId = chatbot_${chatbotId}` (a nivel chatbot, no usuario)
- Soporte para Ghosty: parámetro `chatbotId` opcional para elegir calendario
- Timezone: America/Mexico_City (GMT-6)
- Error handling robusto con mensajes en español

### 3. **Tool Definitions** (`server/tools/index.ts`)
✅ 4 tools registradas con Zod schemas:
- `create_calendar_event`
- `list_calendar_events`
- `update_calendar_event`
- `delete_calendar_event`

**Parámetros especiales**:
- Todas incluyen `chatbotId?: string` para uso de Ghosty
- Descriptions detalladas con ejemplos
- Formato ISO 8601 para fechas

### 4. **Lógica de Permisos** (`server/tools/index.ts:538-562`)
✅ Implementado:
```typescript
// Chatbots públicos PRO+: solo si ESE chatbot tiene Calendar
if (!context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) && integrations.googleCalendar) {
  // Agregar Calendar tools
}

// Ghosty: si ALGÚN chatbot tiene Calendar
if (context.isGhosty && ['STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) && integrations.googleCalendar) {
  // Agregar Calendar tools
}
```

### 5. **Tool Credits** (`server/tools/toolCosts.ts`)
✅ Costos definidos:
- `create_calendar_event`: 3 créditos
- `list_calendar_events`: 2 créditos
- `update_calendar_event`: 3 créditos
- `delete_calendar_event`: 2 créditos

### 6. **Endpoints OAuth (Composio)**
✅ Creados (requieren ajustes):
- `/api/v1/composio/google-calendar` - Connect/Status/Disconnect
- `/api/v1/composio/google-calendar/callback` - OAuth callback con UI bonita

---

## 🔧 Configuración Requerida (OBLIGATORIO)

### Crear Auth Config en Composio Dashboard

**IMPORTANTE**: Antes de poder usar la integración, debes crear un Auth Config en Composio:

1. **Ve al Dashboard de Composio**: https://platform.composio.dev
2. **Navega a Marketplace** → Busca "Google Calendar"
3. **Crea un Auth Config**:
   - Click en "Create Google Calendar Auth Config"
   - Configura los scopes necesarios (los scopes por defecto son correctos):
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click "Save"
4. **Copia el Auth Config ID**: Aparecerá con formato `ac_XXXXXXXXXX`
5. **Agrégalo al .env**:
   ```bash
   COMPOSIO_GOOGLE_CALENDAR_AUTH_CONFIG_ID=ac_XXXXXXXXXX
   ```
6. **Reinicia el servidor de desarrollo**

**Sin este paso, el OAuth no funcionará** y recibirás error "Auth config not found (607)".

---

## ⏳ Lo que FALTA implementar:

### 1. **Helper Function** (PRIORIDAD ALTA)
📝 `server/chatbot/integrationModel.server.ts`
```typescript
/**
 * Obtener todos los chatbots del usuario que tengan Google Calendar conectado
 */
export async function getConnectedCalendarsForUser(userId: string) {
  return await db.integration.findMany({
    where: {
      chatbot: { userId },
      platform: 'GOOGLE_CALENDAR',
      isActive: true
    },
    include: {
      chatbot: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}
```

**Uso**:
- Verificar si Ghosty tiene acceso a Calendar (línea 550 de `server/tools/index.ts`)
- Construir system prompt de Ghosty con lista de calendarios disponibles

### 2. **System Prompt de Ghosty** (PRIORIDAD ALTA)
📝 `server/agents/agent-workflow.server.ts:76-102`

Agregar al prompt de Ghosty:
```typescript
async function buildGhostySystemPrompt(userId: string): Promise<string> {
  const connectedCalendars = await getConnectedCalendarsForUser(userId);

  let calendarInstructions = '';
  if (connectedCalendars.length > 0) {
    const calendarList = connectedCalendars
      .map(c => `- ${c.chatbot.name} (ID: ${c.chatbot.id})`)
      .join('\n');

    calendarInstructions = `

📅 CALENDARIOS DISPONIBLES:
Tienes acceso a los calendarios de estos chatbots:
${calendarList}

Cuando el usuario pida agendar algo y haya múltiples calendarios:
1. Pregunta: "¿En qué calendario quieres que lo agende? Tengo: ${connectedCalendars.map(c => c.chatbot.name).join(', ')}"
2. Espera respuesta del usuario
3. Usa create_calendar_event con el chatbotId correspondiente

Si solo hay 1 calendario, úsalo directamente sin preguntar.
`;
  }

  return `Eres Ghosty, asistente de soporte de Formmy...${calendarInstructions}...`;
}
```

### 3. **UI de Integración** (PRIORIDAD ALTA)
📝 Ruta existente de integraciones del chatbot

**Ubicación**: Junto a WhatsApp, Stripe, etc. en la sección "Integraciones" del chatbot

**Componente sugerido**:
```tsx
// En la ruta de integraciones del chatbot
<IntegrationCard
  title="Google Calendar"
  icon="📅"
  description="Permite a tu chatbot agendar eventos y citas automáticamente"
  status={isConnected ? 'connected' : 'disconnected'}
  onConnect={() => handleConnectCalendar(chatbotId)}
  onDisconnect={() => handleDisconnectCalendar(chatbotId)}
/>

async function handleConnectCalendar(chatbotId: string) {
  // 1. Crear entidad en Composio: chatbot_${chatbotId}
  const response = await fetch('/api/v1/composio/google-calendar?intent=connect', {
    method: 'POST',
    body: JSON.stringify({ chatbotId })
  });

  const { authUrl } = await response.json();

  // 2. Abrir popup OAuth
  const popup = window.open(authUrl, 'oauth', 'width=600,height=700');

  // 3. Escuchar callback
  window.addEventListener('message', (event) => {
    if (event.data.type === 'composio_oauth_success') {
      setIsConnected(true);
      // Guardar en tabla Integration
    }
  });
}
```

### 4. **Ajustar Endpoints OAuth** (PRIORIDAD MEDIA)
📝 `app/routes/api.v1.composio.google-calendar.ts`

**Cambios necesarios**:
```typescript
// Recibir chatbotId desde el request
const chatbotId = url.searchParams.get("chatbotId");

// Usar entityId a nivel chatbot
const entityId = `chatbot_${chatbotId}`;

// Guardar token en tabla Integration (no en User)
await createIntegration({
  chatbotId,
  platform: 'GOOGLE_CALENDAR',
  token: accessToken,
  refreshToken: refreshToken,
  isActive: true
});
```

### 5. **Actualizar Tabla Integration** (OPCIONAL - ya debe existir)
Verificar que la tabla `Integration` en Prisma tenga:
```prisma
model Integration {
  id           String
  chatbotId    String
  platform     IntegrationType // Debe incluir GOOGLE_CALENDAR
  token        String?
  refreshToken String?
  calendarId   String? // primary, work@, ventas@, etc
  isActive     Boolean
  // ...
}

enum IntegrationType {
  WHATSAPP
  STRIPE
  GOOGLE_CALENDAR // ← Agregar si no existe
  // ...
}
```

---

## 🧪 Testing - Pasos para Probar

### Fase 1: Chatbot Individual
1. Ir a: Dashboard → Chatbots → [Mi Chatbot] → Integraciones
2. Click "Conectar Google Calendar"
3. OAuth flow → autorizar
4. Verificar que aparece "✅ Conectado"
5. Abrir chatbot público
6. Decir: "Agenda reunión mañana a las 2pm"
7. Verificar que el chatbot usa `create_calendar_event`
8. Revisar Google Calendar → debe aparecer el evento

### Fase 2: Ghosty con 1 Calendario
1. Tener 1 chatbot con Calendar conectado
2. Abrir Ghosty
3. Decir: "Agéndame reunión con Juan mañana 3pm"
4. Ghosty debe usar el calendario automáticamente
5. Verificar evento creado

### Fase 3: Ghosty con Múltiples Calendarios
1. Conectar Calendar en 2+ chatbots
2. Abrir Ghosty
3. Decir: "Agenda reunión con María"
4. Ghosty debe preguntar: "¿En qué calendario? Tengo: Clínica, Gym"
5. Responder: "En Clínica"
6. Ghosty usa `chatbotId` del chatbot "Clínica"
7. Verificar evento creado en calendario correcto

---

## 📊 Progreso General

| Componente | Estado | Progreso |
|-----------|--------|----------|
| Composio SDK | ✅ Instalado | 100% |
| Handlers Backend | ✅ Completo | 100% |
| Tool Definitions | ✅ Completo | 100% |
| Tool Credits | ✅ Completo | 100% |
| Permisos getToolsForPlan | ✅ Completo | 100% |
| Helper Function | ⏳ Pendiente | 0% |
| System Prompt Ghosty | ⏳ Pendiente | 0% |
| UI Integración | ⏳ Pendiente | 0% |
| OAuth Endpoints | ⚠️ Ajustes | 60% |
| Prisma Schema | ⚠️ Verificar | 80% |

**Total**: ~70% completado

---

## 🚀 Próximos Pasos Recomendados

### Orden de prioridad:

1. **Implementar `getConnectedCalendarsForUser`** (15 min)
   - Función helper en `integrationModel.server.ts`
   - Actualizar lógica en `getToolsForPlan` línea 550

2. **Actualizar system prompt de Ghosty** (20 min)
   - Modificar `buildGhostySystemPrompt()`
   - Agregar contexto de calendarios disponibles

3. **Crear UI de integración** (45 min)
   - Card de Google Calendar en integraciones del chatbot
   - Botón conectar/desconectar
   - Popup OAuth flow

4. **Ajustar endpoints OAuth** (30 min)
   - Recibir `chatbotId` en query params
   - Guardar en tabla `Integration` (no `User`)
   - Usar `entityId = chatbot_${chatbotId}`

5. **Testing completo** (30 min)
   - Seguir pasos de testing arriba
   - Probar con Ghosty (1 y múltiples calendarios)

**Tiempo estimado total**: ~2.5 horas

---

## 💡 Notas Técnicas Importantes

### Composio Entity IDs:
- **Formato**: `chatbot_${chatbotId}` (NO `user_${userId}`)
- **Por qué**: Cada chatbot tiene su propia conexión OAuth
- **Ghosty**: Usa el `chatbotId` del calendario que elija

### OAuth Flow:
```
User click "Conectar"
  → POST /api/v1/composio/google-calendar?intent=connect&chatbotId=abc123
  → Composio genera authUrl
  → User autoriza en Google
  → Redirect a /callback
  → Composio intercambia code por tokens (automático)
  → Guardar en Integration table
  → Tools disponibles para ese chatbot
```

### Ghosty Multi-Calendar:
```
User: "Agenda reunión"
Ghosty system prompt: "Calendarios: Clínica, Gym"
Ghosty: "¿En cuál calendario?"
User: "Gym"
Ghosty extrae: chatbotId del chatbot "Gym"
Ghosty llama: create_calendar_event({ chatbotId: "xyz789", summary: "Reunión", ... })
Handler usa: entityId = chatbot_xyz789
```

---

## 📝 Checklist Final

- [x] Composio SDK instalado
- [x] Handlers implementados con entityId correcto
- [x] Tools registradas con parámetros
- [x] Permisos en getToolsForPlan
- [x] Tool credits definidos
- [ ] Helper function `getConnectedCalendarsForUser`
- [ ] System prompt de Ghosty actualizado
- [ ] UI de integración creada
- [ ] Endpoints OAuth ajustados
- [ ] Prisma schema verificado
- [ ] Testing E2E completado

---

**¿Listo para continuar?**
Los próximos 3 pasos son: helper function → system prompt → UI.
