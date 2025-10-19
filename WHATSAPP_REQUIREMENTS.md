# WhatsApp Coexistence - Requisitos para Aprobación de Meta

## Contexto
Meta rechazó nuestra solicitud de WhatsApp Coexistence con los siguientes comentarios:

### Feedback del Revisor

**1. Interfaz en Inglés + Tooltips**
> "usar inglés como idioma de la interfaz de usuario de la app, proporcionar subtítulos e información sobre las herramientas, y explicar el significado de los botones y otros elementos de la interfaz de usuario."

**2. Video de Mensajería Bidireccional**
> "To verify two-way messaging, please re-record showing (1) sending a message from your app to a test account and (2) receiving the reply inside your app UI. Keep the handle/account visible for both send and receive segments."

**3. Video de Gestión de Templates**
> "We could not verify template creation or management for WhatsApp Business Messaging. Please re-record showing (1) how a template is created or selected, (2) where it is approved or managed in your interface (or Meta's WhatsApp Manager), and (3) a message sent using that template to a test number."

---

## Cambios Necesarios

### 1. Internacionalización (i18n) - Sistema de Traducciones

**Archivos a crear:**
- `/app/i18n/whatsapp.en.json`
- `/app/i18n/whatsapp.es.json`

**Estructura de traducciones:**
```json
{
  "whatsapp": {
    "modal": {
      "title_connect": "Connect WhatsApp",
      "title_update": "Update WhatsApp",
      "subtitle": "Connect your WhatsApp Business number with coexistence mode",
      "phone_number_id_label": "Phone Number ID",
      "access_token_label": "Access Token",
      "business_account_id_label": "Business Account ID",
      "test_connection": "Test Connection",
      "connect": "Connect",
      "update": "Update",
      "testing": "Testing...",
      "instructions_title": "Get your credentials:",
      "instructions_step_1": "Go to Meta for Developers",
      "instructions_step_2": "Your app → WhatsApp → API Setup",
      "instructions_step_3": "Copy Phone Number ID, Access Token and Business Account ID"
    },
    "templates": {
      "title": "WhatsApp Templates",
      "status_pending": "Pending",
      "status_approved": "Approved",
      "status_rejected": "Rejected",
      "view_in_manager": "View in WhatsApp Manager",
      "send_template": "Send Template",
      "select_template": "Select a template"
    }
  }
}
```

**Archivos a modificar:**
- `/app/components/integrations/WhatsAppCoexistenceRealModal.tsx`
  - Importar hook `useTranslation` o crear contexto i18n
  - Reemplazar todos los strings hardcodeados con `t('whatsapp.modal.title_connect')`
  - Agregar toggle EN/ES en el header del modal

---

### 2. Tooltips Explicativos

**Librería recomendada:** `react-tooltip` o `@radix-ui/react-tooltip`

**Instalar:**
```bash
npm install react-tooltip
```

**Tooltips a agregar en `WhatsAppCoexistenceRealModal.tsx`:**

| Elemento | Tooltip EN | Tooltip ES |
|----------|-----------|-----------|
| Botón "Test Connection" | "Verify your WhatsApp credentials before saving the integration" | "Verifica tus credenciales de WhatsApp antes de guardar la integración" |
| Botón "Connect" | "Save and activate WhatsApp Business integration" | "Guardar y activar la integración de WhatsApp Business" |
| Campo "Phone Number ID" | "Find this in Meta for Developers > WhatsApp > API Setup" | "Encuéntralo en Meta for Developers > WhatsApp > API Setup" |
| Campo "Access Token" | "Your WhatsApp Business API permanent access token" | "Tu token de acceso permanente de la API de WhatsApp Business" |
| Campo "Business Account ID" | "Your WhatsApp Business Account unique identifier" | "El identificador único de tu cuenta de WhatsApp Business" |

**Tooltips en vista de conversaciones:**

| Elemento | Tooltip EN |
|----------|-----------|
| Toggle manual/auto | "Switch between AI agent (auto) and manual responses" |
| Botón enviar mensaje | "Send manual message via WhatsApp to this contact" |
| Badge de WhatsApp | "Message sent/received via WhatsApp Business API" |

**Ejemplo de implementación:**
```tsx
import { Tooltip } from 'react-tooltip';

<div data-tooltip-id="phone-number-id-tooltip" data-tooltip-content={t('whatsapp.tooltips.phone_number_id')}>
  <Input
    label={t('whatsapp.modal.phone_number_id_label')}
    name="phoneNumberId"
    value={formData.phoneNumberId}
    onChange={(value) => handleInputChange('phoneNumberId', value)}
    placeholder="123456789012345"
    required
  />
</div>
<Tooltip id="phone-number-id-tooltip" place="top" />
```

---

### 3. UI de Gestión de Templates

**Archivo nuevo:** `/app/components/integrations/WhatsAppTemplatesManager.tsx`

**Funcionalidades:**
1. **Listar templates existentes** desde Meta Graph API
2. **Mostrar estado de aprobación** (PENDING, APPROVED, REJECTED)
3. **Botón "View in WhatsApp Manager"** que abre `https://business.facebook.com/wa/manage/message-templates/`
4. **Selector de template** para enviar mensaje
5. **Preview del template** seleccionado con placeholders

**Estructura del componente:**
```tsx
interface WhatsAppTemplate {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  category: string;
  language: string;
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    text?: string;
    format?: string;
    buttons?: Array<{ type: string; text: string }>;
  }>;
}

export function WhatsAppTemplatesManager({
  chatbotId,
  integrationId
}: WhatsAppTemplatesManagerProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [chatbotId]);

  const fetchTemplates = async () => {
    const response = await fetch(
      `/api/v1/integrations/whatsapp?intent=list_templates&chatbotId=${chatbotId}`
    );
    const data = await response.json();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  const handleSendTemplate = async (templateName: string, recipientPhone: string) => {
    // Implementar envío de template
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">WhatsApp Message Templates</h3>
        <a
          href="https://business.facebook.com/wa/manage/message-templates/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          View in WhatsApp Manager
          <FiExternalLink />
        </a>
      </div>

      {/* Lista de templates */}
      <div className="grid gap-3">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => setSelectedTemplate(template.name)}
            onSend={handleSendTemplate}
          />
        ))}
      </div>

      {/* Template preview */}
      {selectedTemplate && (
        <TemplatePreview template={templates.find(t => t.name === selectedTemplate)} />
      )}
    </div>
  );
}
```

---

### 4. Backend - Endpoint para Templates

**Archivo a modificar:** `/app/routes/api.v1.integrations.whatsapp.tsx`

**Nuevo intent: `list_templates`**

```typescript
// Agregar en el switch de intents
case "list_templates": {
  const { chatbotId } = await request.json();

  // Get integration
  const integration = await db.integration.findFirst({
    where: {
      chatbotId,
      type: IntegrationType.WHATSAPP,
      isActive: true
    }
  });

  if (!integration) {
    return Response.json({ error: "WhatsApp integration not found" }, { status: 404 });
  }

  // Fetch templates from Meta Graph API
  const settings = integration.settings as any;
  const businessAccountId = settings.businessAccountId;
  const accessToken = decryptText(settings.accessToken);

  const templatesUrl = `https://graph.facebook.com/v20.0/${businessAccountId}/message_templates?fields=name,status,category,language,components`;

  const response = await fetch(templatesUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    return Response.json({
      error: "Failed to fetch templates",
      details: error
    }, { status: response.status });
  }

  const data = await response.json();

  return Response.json({
    success: true,
    templates: data.data || []
  });
}
```

---

### 5. Método en WhatsAppSDKService

**Archivo a modificar:** `/server/integrations/whatsapp/WhatsAppSDKService.ts`

**Agregar método:**

```typescript
/**
 * Obtener templates de mensajes del Business Account
 */
async getMessageTemplates(): Promise<any> {
  try {
    const url = `https://graph.facebook.com/v20.0/${this.config.businessAccountId}/message_templates?fields=name,status,category,language,components`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      templates: data.data || []
    };
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

---

### 6. Integración en Tab de Configuración

**Archivo a modificar:** `/app/components/chat/tab_sections/Configuracion.tsx`

**Agregar nueva sección:**

```tsx
import { WhatsAppTemplatesManager } from '~/components/integrations/WhatsAppTemplatesManager';

// Dentro del componente, después de la sección de integraciones
{whatsappIntegration && (
  <section className="bg-white rounded-lg shadow p-6">
    <WhatsAppTemplatesManager
      chatbotId={chatbot.id}
      integrationId={whatsappIntegration.id}
    />
  </section>
)}
```

---

### 7. Mejoras Visuales en Conversaciones

**Archivo a modificar:** Componente de mensajes en conversaciones

**Cambios necesarios:**

1. **Badge de canal WhatsApp:**
```tsx
{message.channel === 'whatsapp' && (
  <div className="flex items-center gap-1 text-xs text-green-600" data-tooltip-id="whatsapp-badge">
    <img src="/assets/chat/whatsapp.svg" className="w-4 h-4" alt="WhatsApp" />
    <span>WhatsApp</span>
  </div>
)}
<Tooltip id="whatsapp-badge" content="Message sent/received via WhatsApp Business API" />
```

2. **Número de teléfono visible:**
```tsx
<div className="text-sm text-gray-500">
  {conversation.phoneNumber || conversation.userId}
</div>
```

3. **Indicador de template:**
```tsx
{message.isTemplate && (
  <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
    <FiFile className="w-3 h-3" />
    Template: {message.templateName}
  </div>
)}
```

4. **Estados de mensaje WhatsApp:**
```tsx
{message.whatsappStatus && (
  <div className="text-xs text-gray-400 flex items-center gap-1">
    {message.whatsappStatus === 'sent' && <FiCheck />}
    {message.whatsappStatus === 'delivered' && <FiCheckCircle />}
    {message.whatsappStatus === 'read' && <FiCheckCircle className="text-blue-500" />}
  </div>
)}
```

---

## Checklist para el Video de Demostración

### Video 1: Two-Way Messaging
- [ ] Mostrar UI en **inglés**
- [ ] Tooltips visibles en botones
- [ ] Número de teléfono del contacto **visible en todo momento**
- [ ] **Enviar mensaje** desde la app al número de prueba
- [ ] Mostrar mensaje **saliendo** de la UI (con timestamp)
- [ ] **Recibir respuesta** del contacto en la UI
- [ ] Mostrar mensaje **entrante** apareciendo en tiempo real
- [ ] Badge de WhatsApp visible en ambos mensajes

### Video 2: Template Management
- [ ] Mostrar **lista de templates** en la sección de configuración
- [ ] Indicar **estado de aprobación** de cada template (APPROVED visible)
- [ ] Click en **"View in WhatsApp Manager"** → abrir Meta Business Manager
- [ ] Mostrar template aprobado en Meta Business Manager
- [ ] Volver a la app, **seleccionar template** aprobado
- [ ] **Enviar template** a número de prueba
- [ ] Mostrar mensaje **con badge de template** en la conversación
- [ ] Número de teléfono visible durante todo el proceso

---

## Orden de Implementación Sugerido

1. ✅ **Sistema i18n** - Crear archivos de traducción y hook
2. ✅ **Traducir WhatsAppCoexistenceRealModal** - Reemplazar strings + toggle idioma
3. ✅ **Agregar tooltips** - Instalar librería y aplicar en modal + conversaciones
4. ✅ **Endpoint list_templates** - Backend para obtener templates de Meta
5. ✅ **Método getMessageTemplates** - Agregar en WhatsAppSDKService
6. ✅ **Componente WhatsAppTemplatesManager** - UI completa de gestión
7. ✅ **Integrar en Configuración** - Agregar sección de templates
8. ✅ **Badges y visualización** - Mejorar UI de conversaciones
9. 🎥 **Grabar videos** - Seguir checklist

---

## Recursos y Referencias

- **Meta Graph API - Message Templates:** https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
- **WhatsApp Business Manager:** https://business.facebook.com/wa/manage/message-templates/
- **React Tooltip:** https://react-tooltip.com/
- **Meta for Developers Console:** https://developers.facebook.com/apps

---

## Notas Técnicas

### Obtener Templates desde Meta API

```bash
curl -X GET "https://graph.facebook.com/v20.0/{BUSINESS_ACCOUNT_ID}/message_templates?fields=name,status,category,language,components" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

**Respuesta esperada:**
```json
{
  "data": [
    {
      "name": "welcome_message",
      "status": "APPROVED",
      "category": "MARKETING",
      "language": "es",
      "components": [
        {
          "type": "BODY",
          "text": "Hola {{1}}, bienvenido a {{2}}!"
        }
      ]
    }
  ]
}
```

### Enviar Template

Ya implementado en `WhatsAppSDKService.ts:438-467`, solo necesita ser expuesto en la UI.

---

## Estimación de Tiempo

| Tarea | Tiempo estimado |
|-------|-----------------|
| Sistema i18n + traducciones | 2-3 horas |
| Tooltips en toda la UI | 1-2 horas |
| Endpoint + método templates | 1 hora |
| Componente WhatsAppTemplatesManager | 3-4 horas |
| Integración en Configuración | 30 min |
| Mejoras visuales conversaciones | 2 horas |
| Testing + ajustes | 2 horas |
| Grabación de videos | 1 hora |
| **TOTAL** | **12-15 horas** |

---

## Preguntas para Resolver

1. ¿Usamos librería i18n existente (react-i18next) o creamos sistema custom simple?
2. ¿Debe ser posible crear templates desde la app o solo listarlos/enviarlos?
3. ¿El toggle EN/ES debe ser global o solo para la sección de WhatsApp?
4. ¿Necesitamos persistir la preferencia de idioma del usuario?
