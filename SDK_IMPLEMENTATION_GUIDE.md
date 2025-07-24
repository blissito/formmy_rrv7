# Formmy Chat SDK - Guía de Implementación

## Visión General

SDK para integrar widgets de chat personalizados en sitios web de terceros con autenticación por API key y diseño idéntico a la aplicación principal.

## Características Clave

- **Fácil integración**: Solo un script personalizado a incluir
- **Autenticación segura**: Sistema de API keys con rate limiting
- **Diseño idéntico**: Misma apariencia que el chat de la app principal
- **Streaming en tiempo real**: Soporte para respuestas con efecto de escritura
- **Auto-generación**: Scripts personalizados generados dinámicamente
- **Sin dependencias**: JavaScript vanilla puro

## 🎯 La Solución Técnica

### Problema Original

Inicialmente intentamos usar **Server-Side Rendering (SSR)** con React para generar HTML idéntico al de la app, pero surgieron varios desafíos:

1. **Complejidad de renderizado**: `renderToString` de React generaba HTML complejo
2. **Selectores rotos**: Los IDs y clases no coincidían con los selectores JavaScript
3. **Dependencias pesadas**: Requería React en el cliente para funcionalidad
4. **Hidratación compleja**: El HTML estático necesitaba "hidratarse" para ser interactivo

### Solución Final: Hybrid Approach

La solución exitosa combina lo mejor de ambos mundos:

#### 1. **Generación Dinámica de Scripts**

```typescript
// app/routes/api.sdk.$apiKey[.]js.ts
export const loader = async ({ params }: Route.LoaderArgs) => {
  // Autenticar API key
  const authResult = await authenticateApiKey(apiKey);

  // Obtener chatbots del usuario
  const chatbots = await db.chatbot.findMany({...});

  // Generar script personalizado
  const script = generateSDKScript({ apiKey, chatbot });

  return new Response(script, {
    headers: { "Content-Type": "application/javascript" }
  });
};
```

#### 2. **DOM Creation en JavaScript Vanilla**

En lugar de SSR, creamos el DOM directamente en JavaScript con estilos idénticos:

```javascript
createChatWidget: function() {
  // Crear estructura idéntica a la app React
  const container = document.createElement('section');
  container.style.cssText = `
    position: fixed;
    background: white;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    // ... estilos idénticos a la app
  `;

  // Header con avatar y nombre (igual que ChatHeader.tsx)
  const header = document.createElement('header');
  // ... estructura idéntica

  // Messages area (igual que MessageBubble.tsx)
  const messagesArea = document.createElement('main');
  // ... estructura idéntica

  // Footer con input (igual que ChatInput.tsx)
  const footer = document.createElement('footer');
  // ... estructura idéntica
}
```

#### 3. **Ventajas de la Solución Final**

- ✅ **Diseño 100% idéntico**: Mismos estilos, colores y estructura
- ✅ **Ligero**: Solo JavaScript vanilla, sin React en el cliente
- ✅ **Funcional**: Todos los event listeners conectados correctamente
- ✅ **Personalizable**: Colores y configuración del chatbot embebidos
- ✅ **Escalable**: Fácil de mantener y actualizar

### Por Qué Funcionó

El problema clave era que **los selectores JavaScript no encontraban los elementos** generados por React SSR. La solución fue:

1. **Control total del DOM**: Creamos cada elemento con IDs específicos
2. **Referencias directas**: Guardamos referencias a elementos durante la creación
3. **Event listeners inmediatos**: Conectamos eventos justo después de crear elementos
4. **Estructura predecible**: DOM creado de forma determinística

## Estructura del Proyecto

```
app/sdk/
├── index.ts        # Punto de entrada principal
├── widget.ts       # Lógica del widget
└── api.ts          # Cliente API
```

## Uso Rápido

### 1. Incluir el SDK

```html
<script
  src="/sdk/ghosty-chat.js"
  data-chatbot-id="tu-chatbot-id"
  data-position="right"
  data-primary-color="#7c3aed"
  defer
></script>
```

### 2. Implementar el Backend (Ejemplo con Express)

```javascript
// Ruta para streaming
app.post("/api/chat/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");

  const { text } = req.body;
  const response = "Hola, esto es un ejemplo de stream...".split(" ");

  let i = 0;
  const interval = setInterval(() => {
    if (i < response.length) {
      res.write(`data: ${JSON.stringify({ text: response[i] + " " })}\n\n`);
      i++;
    } else {
      res.write("data: [DONE]\n\n");
      clearInterval(interval);
      res.end();
    }
  }, 100);
});
```

## Configuración

| Atributo                | Descripción                      |
| ----------------------- | -------------------------------- |
| `data-chatbot-id`       | ID único del chatbot (requerido) |
| `data-position`         | Posición del chat (left/right)   |
| `data-primary-color`    | Color principal (#RRGGBB)        |
| `data-background-color` | Color de fondo                   |
| `data-text-color`       | Color del texto                  |
| `data-button-color`     | Color del botón                  |

## Desarrollo

### Requisitos

- Node.js 16+
- npm o yarn

### Comandos

```bash
# Instalar dependencias
npm install

# Construir para desarrollo
npm run dev

# Construir para producción
npm run build

# Construir solo el SDK
npm run build:sdk
```

## Seguridad

- Validar siempre el `chatbotId` en el backend
- Usar HTTPS en producción
- Implementar CORS adecuadamente
- Sanitizar todas las entradas

## Soporte

Para soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.

## Estructura del Proyecto

```
app/routes/
├── api.sdk.$apiKey[.]js.ts    # Generación dinámica de scripts
├── api.sdk.chatbots.ts        # Descubrimiento de chatbots
├── api.sdk.chat.ts            # Endpoint de conversaciones
└── api.v1.apikey.ts           # Gestión de API keys

server/chatbot/
├── apiKeyAuth.server.ts       # Autenticación de API keys
├── apiKeyModel.server.ts      # Modelo de API keys
└── conversationModel.server.ts # Modelo de conversaciones

app/components/chat/tab_sections/
└── Codigo.tsx                 # UI para generar códigos SDK
```

## Uso Rápido

### 1. Obtener API Key

Los usuarios obtienen automáticamente una API key desde la interfaz de la aplicación en la sección "Código" → "SDK".

### 2. Incluir el SDK

```html
<script
  src="https://tu-dominio.com/api/sdk/TU_API_KEY.js"
  data-chatbot="tu-chatbot-slug"
  data-theme="light"
  data-position="bottom-right"
></script>
```

### 3. Configuración Automática

El script se genera dinámicamente con:

- Configuración del chatbot embebida
- Colores y tema personalizados
- API key de autenticación
- Endpoints de chat configurados

## Endpoints de la API

### Script Generation

```
GET /api/sdk/{apiKey}.js
```

Genera un script JavaScript personalizado con la configuración del usuario.

### Chatbot Discovery

```
GET /api/sdk/chatbots?slug=chatbot-slug
Headers: X-API-Key: your-api-key
```

Obtiene información de chatbots activos del usuario.

### Chat Conversation

```
POST /api/sdk/chat
Headers: X-API-Key: your-api-key
Body: {
  "chatbotId": "chatbot-id",
  "message": "Hola",
  "sessionId": "session-123"
}
```

Envía mensajes y recibe respuestas (con soporte para streaming).

## Configuración Avanzada

### Atributos del Script

| Atributo        | Descripción             | Valores                                                |
| --------------- | ----------------------- | ------------------------------------------------------ |
| `data-chatbot`  | Slug del chatbot a usar | string                                                 |
| `data-theme`    | Tema del widget         | `light`, `dark`                                        |
| `data-position` | Posición en pantalla    | `bottom-right`, `bottom-left`, `top-right`, `top-left` |

### Personalización de Colores

Los colores se toman automáticamente de la configuración del chatbot en la base de datos:

- `primaryColor`: Color principal del chatbot
- `theme`: Tema claro u oscuro
- Avatar con inicial del nombre del bot

## Seguridad y Autenticación

### API Keys

- Generación automática por usuario
- Rate limiting (1000 requests/hora por defecto)
- Tracking de uso mensual
- Revocación y regeneración disponible

### Validación

- Autenticación en cada request
- Verificación de ownership del chatbot
- Rate limiting por IP en mensajes
- Sanitización de inputs

## Desarrollo y Testing

### Comandos Útiles

```bash
# Ejecutar en desarrollo
npm run dev

# Probar endpoint de script
curl http://localhost:3000/api/sdk/TU_API_KEY.js

# Probar endpoint de chat
curl -X POST http://localhost:3000/api/sdk/chat \
  -H "X-API-Key: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"chatbotId":"id","message":"Hola","sessionId":"test"}'
```

### Debug

El SDK incluye logs de debug en la consola del navegador:

- Inicialización del SDK
- Configuración del chatbot
- Estados de toggle del widget
- Errores de API

## Próximas Mejoras

- [ ] Soporte para múltiples idiomas
- [ ] Temas personalizables avanzados
- [ ] Webhooks para notificaciones
- [ ] Analytics de conversaciones
- [ ] Integración con más plataformas

---

**¡El SDK está listo para producción!** 🚀
