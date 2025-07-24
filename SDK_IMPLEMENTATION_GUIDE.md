# Ghosty Chat SDK - Guía de Implementación

## Visión General
SDK ligero para integrar un widget de chat en sitios web de terceros con soporte para streams de texto.

## Características Clave
- **Fácil integración**: Solo un script a incluir
- **Sin dependencias**: JavaScript vanilla puro
- **Streaming en tiempo real**: Soporte para efecto de escritura
- **Personalizable**: Temas y posiciones configurables
- **Ligero**: Código mínimo y optimizado

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
  defer>
</script>
```

### 2. Implementar el Backend (Ejemplo con Express)
```javascript
// Ruta para streaming
app.post('/api/chat/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  
  const { text } = req.body;
  const response = "Hola, esto es un ejemplo de stream...".split(' ');
  
  let i = 0;
  const interval = setInterval(() => {
    if (i < response.length) {
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

## Configuración

| Atributo | Descripción |
|----------|-------------|
| `data-chatbot-id` | ID único del chatbot (requerido) |
| `data-position` | Posición del chat (left/right) |
| `data-primary-color` | Color principal (#RRGGBB) |
| `data-background-color` | Color de fondo |
| `data-text-color` | Color del texto |
| `data-button-color` | Color del botón |

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
