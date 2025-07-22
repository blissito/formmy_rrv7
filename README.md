# Welcome to Formmy!

The easiest way to embed forms in your website. 👻

---

Built with ❤️ by @BrendaOrtega & @blissito.

---

## 📦 Custom Hook: `useManualSave`

Un hook reutilizable para manejar formularios con validación, guardado manual, feedback visual y sincronización con endpoints tipo resource route (como `/api/v1/chatbot`).

### Uso básico

```tsx
import { useManualSave } from "~/hooks/useManualSave";
import { validateChatbotDataEffect } from "~/utils/zod";

const manualSave = useManualSave({
  initialData: chatbot, // objeto inicial
  validate: validateChatbotDataEffect, // función de validación (debe retornar { success, error })
  endpoint: "/api/v1/chatbot", // endpoint a usar
  intent: "update_chatbot", // intent por defecto (opcional)
  idField: "chatbotId", // nombre del campo ID principal (opcional, default: "id")
  planLimits: { availableModels: ["gpt-4o-mini"] }, // límites de plan (opcional)
});
```

### API del hook

- `formData`: estado del formulario
- `isSaving`: boolean, true si está guardando
- `error`: error actual (si existe)
- `success`: true si el último guardado fue exitoso
- `hasChanges`: true si hay cambios sin guardar
- `handleChange(field, value)`: actualiza un campo
- `handleSave()`: guarda los cambios (llama al endpoint)
- `resetChanges()`: descarta cambios
- `setFormData(obj)`: setea el estado manualmente

### Ejemplo de integración

```tsx
const handleInputChange = (field, value) => manualSave.handleChange(field, value);

<input value={manualSave.formData.name} onChange={e => handleInputChange("name", e.target.value)} />
<button onClick={manualSave.handleSave} disabled={manualSave.isSaving || !manualSave.hasChanges}>Guardar</button>
```

---

## 🤖 API: `/api/v1/chatbot` (resource route)

### Intents soportados

| Intent                    | Descripción                                | Campos requeridos                  |
| ------------------------- | ------------------------------------------ | ---------------------------------- |
| create_chatbot            | Crear un nuevo chatbot                     | name, userId, ...                  |
| update_chatbot            | Actualizar un chatbot existente            | chatbotId, campos a actualizar     |
| get_chatbot               | Obtener un chatbot por ID                  | chatbotId                          |
| get_chatbot_by_slug       | Obtener un chatbot por slug                | slug                               |
| get_user_chatbots         | Listar chatbots de un usuario              | userId                             |
| delete_chatbot            | Eliminar (soft) un chatbot                 | chatbotId                          |
| activate_chatbot          | Activar un chatbot                         | chatbotId                          |
| deactivate_chatbot        | Desactivar un chatbot                      | chatbotId                          |
| set_to_draft              | Poner chatbot en modo borrador             | chatbotId                          |
| get_chatbot_state         | Obtener estado actual del chatbot          | chatbotId                          |
| get_usage_stats           | Obtener estadísticas de uso                | chatbotId                          |
| check_monthly_limit       | Checar límite mensual de conversaciones    | chatbotId                          |
| get_plan_features         | Obtener features del plan del usuario      | userId                             |
| get_branding_config       | Obtener config de branding                 | chatbotId                          |
| add_file_context          | Añadir archivo como contexto               | chatbotId, fileName, ...           |
| add_url_context           | Añadir URL como contexto                   | chatbotId, url, ...                |
| add_text_context          | Añadir texto como contexto                 | chatbotId, title, content          |
| remove_context            | Eliminar contexto                          | chatbotId, contextItemId           |
| get_contexts              | Listar contextos del chatbot               | chatbotId                          |
| create_integration        | Crear integración (ej: WhatsApp, Telegram) | chatbotId, platform, [token]       |
| get_integrations          | Listar integraciones                       | chatbotId                          |
| update_integration        | Actualizar integración                     | integrationId, [token], [isActive] |
| toggle_integration_status | Activar/desactivar integración             | integrationId, isActive            |
| delete_integration        | Eliminar integración                       | integrationId                      |

### Ejemplo de request (fetch)

```js
const fd = new FormData();
fd.append("intent", "update_chatbot");
fd.append("chatbotId", "abc123");
fd.append("name", "Nuevo nombre");
// ...otros campos
fetch("/api/v1/chatbot", { method: "POST", body: fd });
```

---

Para más detalles, revisa el código fuente de `/app/routes/api.v1.chatbot.ts` y el hook `/app/hooks/useManualSave.tsx`.
