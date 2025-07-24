# Ghosty Chat SDK

SDK ligero para integrar un widget de chat en sitios web de terceros con soporte para streams de texto.

## Características

- Fácil de integrar (solo un script)
- Sin dependencias externas (JavaScript vanilla)
- Soporte para streams de texto (efecto de escritura)
- Personalización de temas y posiciones
- Tamaño reducido y optimizado

## Estructura de Archivos

```
app/sdk/
├── index.ts        # Punto de entrada principal del SDK
├── widget.ts       # Lógica del widget de chat (vanilla JS)
├── api.ts          # Cliente para llamadas a la API
└── README.md       # Esta documentación
```

## Instalación

1. Copiar la carpeta `sdk` al directorio `app/` de tu proyecto
2. Asegurarse de que el archivo de salida se sirva estáticamente desde `/sdk/ghosty-chat.js`

## Uso Básico

### En el HTML del sitio web:

```html
<!-- En el <head> -->
<script 
  src="/sdk/ghosty-chat.js" 
  data-chatbot-id="tu-chatbot-id"
  data-position="right"
  data-primary-color="#7c3aed"
  data-background-color="#ffffff"
  data-text-color="#1f2937"
  data-button-color="#7c3aed"
  defer
></script>
```

### Configuración Disponible

| Atributo | Tipo | Requerido | Descripción |
|----------|------|-----------|-------------|
| `data-chatbot-id` | string | ✅ | ID único del chatbot |
| `data-position` | 'left'\|'right' | ❌ | Posición del chat (predeterminado: 'right') |
| `data-primary-color` | color | ❌ | Color primario (botones, acentos) |
| `data-background-color` | color | ❌ | Color de fondo del chat |
| `data-text-color` | color | ❌ | Color del texto |
| `data-button-color` | color | ❌ | Color del botón flotante |

## Implementación del Backend

El SDK espera un endpoint que soporte streaming de texto. Aquí un ejemplo con Express:

```javascript
// Ruta de ejemplo para streaming
app.post('/v1/messages/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const { text } = req.body;
  
  // Ejemplo: dividir la respuesta en palabras
  const response = "Esta es una respuesta en stream...".split(' ');
  
  let i = 0;
  const interval = setInterval(() => {
    if (i < response.length) {
      // Formato SSE (Server-Sent Events)
      res.write(`data: ${JSON.stringify({ text: response[i] + ' ' })}\n\n`);
      i++;
    } else {
      res.write('data: [DONE]\n\n');
      clearInterval(interval);
      res.end();
    }
  }, 100);
});
```

## Desarrollo

### Requisitos

- Node.js 16+
- npm o yarn

### Construcción

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Construir el SDK:
   ```bash
   npm run build:sdk
   ```
   Esto generará el archivo `public/sdk/ghosty-chat.js`.

### Estructura del Código

1. **index.ts**
   - Punto de entrada principal
   - Maneja la inicialización y configuración
   - Proporciona la API pública

2. **widget.ts**
   - Lógica del widget de chat
   - Manejo del DOM y eventos
   - Integración con la API

3. **api.ts**
   - Cliente HTTP para llamadas a la API
   - Implementación de streams con SSE

## Soporte para Streams

El SDK soporta streams de texto para el efecto de escritura. La API debe devolver respuestas en formato SSE (Server-Sent Events):

```
data: {"text": "Hola"}

data: {"text": " "}

data: {"text": "mundo"}

data: [DONE]
```

## Pruebas

1. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abrir `http://localhost:3000/sdk/test` para probar la integración.

## Despliegue

1. Construir para producción:
   ```bash
   npm run build
   ```

2. El archivo `public/sdk/ghosty-chat.js` estará listo para ser servido estáticamente.

## Seguridad

- Validar el `chatbotId` en el backend
- Implementar CORS adecuadamente
- Usar HTTPS en producción
- Validar y sanitizar todas las entradas

## Licencia

MIT
