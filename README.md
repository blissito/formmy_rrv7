# Welcome to Formmy!

The easiest way to embed forms in your website. 👻

---

Built with ❤️ by @BrendaOrtega & @blissito.

---

## ⚡ Sistema de Streaming

El chatbot soporta respuestas en tiempo real con efecto de escritura (typing effect) para una experiencia más natural.

### Configuración

Cada chatbot tiene dos campos configurables:

- **`enableStreaming`**: Activa/desactiva el efecto de escritura (default: `true`)
- **`streamingSpeed`**: Velocidad en milisegundos entre caracteres (default: `50ms`)

### ¿Cómo funciona?

1. **Server-Sent Events (SSE)**: El servidor envía la respuesta del AI chunk por chunk
2. **Efecto typing**: El cliente muestra cada carácter con el delay configurado
3. **Personalización**: Cada chatbot puede tener velocidades diferentes según su personalidad

### Ejemplos de velocidad

```javascript
// Chatbot rápido (soporte técnico)
streamingSpeed: 30; // Eficiente y directo

// Chatbot normal (uso general)
streamingSpeed: 50; // Velocidad balanceada

// Chatbot storyteller
streamingSpeed: 80; // Dramático y pausado
```

### Experiencia del usuario

**Sin streaming**: La respuesta aparece completa instantáneamente
**Con streaming**: Los caracteres aparecen uno por uno, simulando escritura humana

---
