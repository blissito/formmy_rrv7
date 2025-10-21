# Plan Técnico WhatsApp - Validación Meta App Review

**Fecha**: Enero 2025
**Objetivo**: Implementar funcionalidades para aprobar permisos de WhatsApp Business en Meta App Review

---

## 🎯 VIDEOS A GRABAR (REQUISITOS DE META)

### Video 1: Two-Way Messaging
**Notas del revisor**:
> "To verify two-way messaging, please re-record showing (1) sending a message from your app to a test account and (2) receiving the reply inside your app UI. Keep the handle/account visible for both send and receive segments."

**Qué mostrar**:
1. ✅ Enviar mensaje desde dashboard Formmy → número de prueba
2. ✅ Responder desde WhatsApp
3. ✅ Ver respuesta en dashboard Formmy
4. ✅ Handle/número visible TODO el tiempo

### Video 2: Template Management
**Notas del revisor**:
> "We could not verify template creation or management for WhatsApp Business Messaging. Please re-record showing (1) how a template is created or selected, (2) where it is approved or managed in your interface (or Meta's WhatsApp Manager), and (3) a message sent using that template to a test number."

**Qué mostrar**:
1. ✅ Crear/seleccionar template en interfaz
2. ✅ Mostrar dónde se aprueba (WhatsApp Manager o nuestra UI)
3. ✅ Enviar mensaje usando ese template a número de prueba
4. ⚠️ Debe FUNCIONAR de verdad (no fake)

---

## ✅ ANÁLISIS DE LO QUE YA EXISTE

### Two-Way Messaging - YA IMPLEMENTADO ✅
**Archivos**:
- `api.v1.conversations.tsx:143-247` - `intent=send_manual_response`
- `api.v1.conversations.tsx:252-347` - `sendManualWhatsAppMessage()`
- `Conversations.tsx:553-563` - Input para enviar mensaje manual

**Funciona**: Envío manual + recepción automática vía webhook

**Falta**:
- ❌ UI en inglés
- ❌ Número de teléfono MUY visible
- ❌ Badge "WhatsApp" destacado

### Templates - PARCIALMENTE IMPLEMENTADO ⚠️
**Archivos**:
- `WhatsAppSDKService.ts:438-467` - `sendTemplate()` backend funcional

**Falta COMPLETAMENTE**:
- ❌ UI para crear templates
- ❌ UI para listar templates
- ❌ API endpoint para obtener templates de Graph API
- ❌ Flow completo de creación → aprobación → envío

---

## 📋 IMPLEMENTACIÓN - FASES

### **FASE 1: i18n SOLO Dashboard WhatsApp (2-3 horas)**

#### Goal 1.1: Sistema i18n minimalista ✅
**Crear**: `app/i18n/whatsapp-translations.ts`

```typescript
export const whatsappTranslations = {
  en: {
    // Conversaciones
    conversations: "Conversations",
    manualMode: "Manual Mode",
    autoMode: "Auto Mode",
    sendMessage: "Send Message",
    phoneNumber: "Phone Number",

    // Templates
    templates: "Message Templates",
    createTemplate: "Create Template",
    templateName: "Template Name",
    templateCategory: "Category",
    templateLanguage: "Language",
    templateBody: "Message Body",
    status: "Status",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    sendTemplate: "Send Template",
    selectTemplate: "Select Template",
    viewInManager: "View in WhatsApp Manager",

    // Estados
    connected: "Connected",
    disconnected: "Disconnected",
    sending: "Sending...",
    sent: "Sent",
    received: "Received"
  },
  es: {
    conversations: "Conversaciones",
    manualMode: "Modo Manual",
    autoMode: "Modo Automático",
    sendMessage: "Enviar Mensaje",
    phoneNumber: "Número de Teléfono",
    // ... resto de traducciones
  }
};
```

**Crear**: `app/hooks/useWhatsAppTranslation.ts`

```typescript
import { useState } from 'react';
import { whatsappTranslations } from '~/i18n/whatsapp-translations';

export function useWhatsAppTranslation() {
  const [lang, setLang] = useState<'en' | 'es'>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('whatsapp_lang') as 'en' | 'es') || 'en';
    }
    return 'en';
  });

  const setLanguage = (newLang: 'en' | 'es') => {
    setLang(newLang);
    sessionStorage.setItem('whatsapp_lang', newLang);
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = whatsappTranslations[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return { t, lang, setLanguage };
}
```

#### Goal 1.2: Toggle EN/ES en dashboard de chatbot
**Modificar**: `app/components/chat/tab_sections/Conversations.tsx`

Agregar en header del componente:
```tsx
const { t, lang, setLanguage } = useWhatsAppTranslation();

// En el JSX, arriba del componente
<div className="flex items-center gap-2 mb-4">
  <button
    onClick={() => setLanguage(lang === 'en' ? 'es' : 'en')}
    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
  >
    {lang === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
  </button>
</div>
```

#### Goal 1.3: Traducir labels del componente Conversations
**Modificar**: `Conversations.tsx`

Cambios mínimos en strings visibles:
- "Conversaciones" → `{t('conversations')}`
- "Modo Manual" → `{t('manualMode')}`
- "Enviar" → `{t('sendMessage')}`
- "Número de teléfono" → `{t('phoneNumber')}`

---

### **FASE 2: Visual Improvements - Two-Way Messaging (2 horas)**

#### Goal 2.1: Número de teléfono MUY visible
**Modificar**: `Conversations.tsx` - Componente `ConversationDetail` (línea ~490)

En el header de la conversación seleccionada:

```tsx
<div className="border-b p-4 bg-gray-50">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-lg">{conversation.userName}</h3>
      {/* NUEVO: Número muy visible */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm text-gray-500">{t('phoneNumber')}:</span>
        <span className="font-mono font-bold text-green-600 text-base">
          {conversation.tel || conversation.visitorId}
        </span>
        {conversation.isWhatsApp && (
          <img src="/assets/chat/whatsapp.svg" className="w-5 h-5" alt="WhatsApp" />
        )}
      </div>
    </div>
  </div>
</div>
```

#### Goal 2.2: Badge WhatsApp destacado en mensajes
**Modificar**: `app/components/chat/MessageBubble.tsx` (línea ~65-75)

```tsx
{message.channel?.includes('whatsapp') && (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full mb-1">
    <img src="/assets/chat/whatsapp.svg" className="w-4 h-4" alt="WhatsApp" />
    <span className="text-xs font-semibold text-green-700">WhatsApp</span>
  </div>
)}
```

---

### **FASE 3: Template Creation UI (5-6 horas)** ⭐ CRÍTICO

#### Goal 3.1: API endpoint para crear template
**Modificar**: `app/routes/api.v1.integrations.whatsapp.tsx`

**Agregar intent: `create_template`** (después del switch existente)

```typescript
case "create_template": {
  const { chatbotId, templateData } = await request.json();

  // Validar acceso
  const user = await getUserOrRedirect(request);
  const access = await validateChatbotAccess(user.id, chatbotId);
  if (!access.canAccess) {
    return json({ error: "No access" }, { status: 403 });
  }

  // Obtener integración
  const integration = await db.integration.findFirst({
    where: { chatbotId, platform: "WHATSAPP", isActive: true }
  });

  if (!integration) {
    return json({ error: "WhatsApp integration not found" }, { status: 404 });
  }

  // Desencriptar settings
  const settings = integration.settings as any;
  const accessToken = decryptText(settings.accessToken);
  const wabaId = settings.businessAccountId;

  // Crear template en Graph API
  const createUrl = `https://graph.facebook.com/v18.0/${wabaId}/message_templates`;

  const payload = {
    name: templateData.name,
    language: templateData.language || "en_US",
    category: templateData.category || "MARKETING",
    components: [{ type: "BODY", text: templateData.body }]
  };

  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    return json({
      success: false,
      error: error.error?.message || "Failed to create template"
    }, { status: response.status });
  }

  const data = await response.json();
  return json({ success: true, templateId: data.id, status: data.status || "PENDING" });
}
```

#### Goal 3.2: API endpoint para listar templates
**Agregar intent: `list_templates`**

```typescript
case "list_templates": {
  const url = new URL(request.url);
  const chatbotId = url.searchParams.get('chatbotId');

  if (!chatbotId) {
    return json({ error: "chatbotId required" }, { status: 400 });
  }

  const integration = await db.integration.findFirst({
    where: { chatbotId, platform: "WHATSAPP", isActive: true }
  });

  if (!integration) {
    return json({ error: "Integration not found" }, { status: 404 });
  }

  const settings = integration.settings as any;
  const accessToken = decryptText(settings.accessToken);
  const wabaId = settings.businessAccountId;

  const listUrl = `https://graph.facebook.com/v18.0/${wabaId}/message_templates`;

  const response = await fetch(listUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await response.json();
  return json({ success: true, templates: data.data || [] });
}
```

#### Goal 3.3: Componente UI para crear template
**Crear**: `app/components/integrations/WhatsAppTemplateCreator.tsx`

Ver código completo en sección anterior del plan (líneas 280-380 aprox)

**Resumen de funcionalidad**:
- Formulario con campos: name, category, language, body
- Validación de formato de nombre (lowercase, underscores)
- Llamada a API `create_template`
- Manejo de errores
- Link a WhatsApp Manager

#### Goal 3.4: Componente para listar templates
**Crear**: `app/components/integrations/WhatsAppTemplateList.tsx`

Ver código completo en sección anterior del plan

**Resumen de funcionalidad**:
- Fetch automático al montar
- Lista de templates con badges de status (APPROVED/PENDING/REJECTED)
- Click en template para seleccionar
- Botón refresh

#### Goal 3.5: Integrar en tab Código
**Modificar**: `app/components/chat/tab_sections/Codigo.tsx`

Buscar donde se renderiza la integración de WhatsApp y agregar:

```tsx
import { WhatsAppTemplateCreator } from '~/components/integrations/WhatsAppTemplateCreator';
import { WhatsAppTemplateList } from '~/components/integrations/WhatsAppTemplateList';

// Dentro del render, después de la sección de integración
{whatsappIntegration && (
  <div className="space-y-6 mt-6">
    <h3 className="text-lg font-semibold">{t('templates')}</h3>

    <WhatsAppTemplateCreator
      chatbotId={chatbot.id}
      onSuccess={(template) => {
        // Mostrar toast de éxito
        console.log('Template created:', template);
      }}
    />

    <WhatsAppTemplateList chatbotId={chatbot.id} />
  </div>
)}
```

#### Goal 3.6: Enviar template desde conversaciones
**Modificar**: `app/components/chat/tab_sections/Conversations.tsx`

En la sección de input de mensaje manual (componente `ConversationDetail`):

```tsx
const [showTemplateSelector, setShowTemplateSelector] = useState(false);
const [templates, setTemplates] = useState<any[]>([]);

// Agregar botón "Send Template"
<div className="flex gap-2">
  {conversation.isWhatsApp && (
    <button
      onClick={() => setShowTemplateSelector(true)}
      className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
    >
      {t('sendTemplate')}
    </button>
  )}

  {/* Input y botón Send existentes */}
</div>
```

Crear modal simple para seleccionar template (solo mostrar los APPROVED)

#### Goal 3.7: Backend para enviar template
**Modificar**: `app/routes/api.v1.conversations.tsx`

Agregar nuevo intent después de `send_manual_response`:

```typescript
case "send_template": {
  const { conversationId, templateName, languageCode, components } = body;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { chatbot: true }
  });

  if (!conversation?.sessionId?.includes('whatsapp')) {
    return json({ error: "Not a WhatsApp conversation" }, { status: 400 });
  }

  const integration = await db.integration.findFirst({
    where: {
      chatbotId: conversation.chatbotId,
      platform: "WHATSAPP",
      isActive: true
    }
  });

  if (!integration) {
    return json({ error: "Integration not found" }, { status: 404 });
  }

  // Usar WhatsAppSDKService.sendTemplate()
  const whatsappService = new WhatsAppSDKService(integration);
  const result = await whatsappService.sendTemplate(
    conversation.visitorId,
    templateName,
    languageCode || 'en_US',
    components || []
  );

  if (!result.success) {
    return json({ error: result.error }, { status: 500 });
  }

  // Guardar mensaje en BD marcando como template
  await db.message.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: `[Template: ${templateName}]`,
      channel: "whatsapp",
      externalMessageId: result.messageId,
      tokens: 0,
      responseTime: 0
    }
  });

  return json({
    success: true,
    messageId: result.messageId,
    message: "Template sent successfully"
  });
}
```

---

### **FASE 4: Testing Real (1-2 horas)**

#### Goal 4.1: Configurar número de prueba de WhatsApp
- [ ] Tener número de prueba en WhatsApp Business
- [ ] Conectar integración en Formmy
- [ ] Enviar primer mensaje manual → verificar recepción
- [ ] Responder desde WhatsApp → verificar aparece en dashboard

#### Goal 4.2: Crear template de prueba REAL
- [ ] Usar componente nuevo para crear template
- [ ] Esperar aprobación de Meta (puede ser instantánea en sandbox)
- [ ] Verificar aparece en lista con status APPROVED
- [ ] Enviar template a número de prueba
- [ ] Verificar recepción correcta del template formateado

#### Goal 4.3: Verificar número visible
- [ ] Confirmar que en TODAS las vistas el número de teléfono esté visible
- [ ] Badge WhatsApp destacado
- [ ] UI en inglés

---

## ✅ CHECKLIST FINAL ANTES DE GRABAR

### Two-Way Messaging Video:
- [ ] Toggle EN/ES funciona (poner en EN)
- [ ] Número de teléfono visible y destacado en header
- [ ] Badge "WhatsApp" visible en todos los mensajes
- [ ] Mensaje manual se envía correctamente
- [ ] Respuesta del contacto aparece en tiempo real
- [ ] Handle visible durante TODO el video

### Template Management Video:
- [ ] Formulario de creación de template visible
- [ ] Template se crea correctamente (llamada real a Graph API)
- [ ] Link "View in WhatsApp Manager" abre URL correcta
- [ ] Lista de templates muestra status APPROVED
- [ ] Template se puede seleccionar desde conversación
- [ ] Template se envía correctamente a número de prueba
- [ ] Mensaje llega con formato correcto de template

---

## 🚨 NOTAS CRÍTICAS

### 1. Composio ELIMINADO ❌
- NO usar `api.v1.composio.whatsapp.ts`
- NO mencionar Composio en ninguna parte del flujo WhatsApp
- Solo flujo directo con Graph API de Meta

### 2. Templates DEBEN funcionar de verdad ✅
Meta dice:
> "a message sent using that template to a test number"

Esto significa:
- ✅ Crear template REAL en Meta vía Graph API
- ✅ Esperar aprobación REAL (puede ser automática en test mode)
- ✅ Enviar mensaje REAL usando template
- ❌ NO fake/mockup/simulación

### 3. Números de prueba de WhatsApp
Meta permite usar números de prueba sin costo:
https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#test-numbers

Usar esos números para la demo.

### 4. i18n - SOLO Dashboard
- ✅ Traducir SOLO la sección de WhatsApp en dashboard
- ❌ NO traducir toda la app (fuera de scope)
- Usar sessionStorage (no persistir en BD)

---

## 📊 ESTIMACIÓN DE TIEMPO

| Fase | Horas | Días |
|------|-------|------|
| FASE 1: i18n dashboard | 2-3 | 0.5 |
| FASE 2: Visual improvements | 2 | 0.25 |
| FASE 3: Template UI completa | 5-6 | 0.75 |
| FASE 4: Testing real | 1-2 | 0.25 |
| **TOTAL CODING** | **10-13** | **1.5-2** |
| Screencasts (usuario) | 2-3 | 0.5 |

**Timeline Total**: 2-2.5 días

---

## 📝 ARCHIVOS PRINCIPALES A MODIFICAR/CREAR

### Crear nuevos:
- ✅ `app/i18n/whatsapp-translations.ts`
- ✅ `app/hooks/useWhatsAppTranslation.ts`
- ✅ `app/components/integrations/WhatsAppTemplateCreator.tsx`
- ✅ `app/components/integrations/WhatsAppTemplateList.tsx`

### Modificar existentes:
- ✅ `app/routes/api.v1.integrations.whatsapp.tsx` (+2 intents)
- ✅ `app/routes/api.v1.conversations.tsx` (+1 intent)
- ✅ `app/components/chat/tab_sections/Conversations.tsx` (i18n + visual)
- ✅ `app/components/chat/MessageBubble.tsx` (badge mejorado)
- ✅ `app/components/chat/tab_sections/Codigo.tsx` (integrar templates)

### NO tocar (funcionan bien):
- ❌ `api.v1.integrations.whatsapp.webhook.tsx`
- ❌ `server/integrations/whatsapp/WhatsAppSDKService.ts` (solo usar métodos existentes)

---

## 🔗 RECURSOS

- **Meta Graph API - Templates**: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
- **WhatsApp Business Manager**: https://business.facebook.com/wa/manage/message-templates/
- **Test Numbers**: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#test-numbers
- **Meta for Developers Console**: https://developers.facebook.com/apps

---

**Estado**: En progreso
**Última actualización**: Enero 2025
