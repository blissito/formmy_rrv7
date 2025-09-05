# Cómo Integrar el Formmy Agent Framework en tu App Express.js

El Formmy Agent Framework es un micro-framework de IA que hemos desarrollado internamente para manejar conversaciones inteligentes con soporte para herramientas. En este tutorial te enseñaremos cómo integrarlo en tu aplicación Express.js existente.

## ¿Qué es el Formmy Agent Framework?

Es un framework ligero (~500 líneas) que proporciona:
- **Agent Loop robusto** con patrón ReAct
- **Context optimization** automático
- **Tool integration** modular
- **Retry automático** con exponential backoff
- **Support para múltiples proveedores** (OpenAI, Anthropic, OpenRouter)

## Instalación y Setup Básico

### 1. Dependencias Requeridas

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.28.0",
    "dotenv": "^16.0.0"
  }
}
```

### 2. Variables de Entorno

Crea un archivo `.env`:

```env
ANTHROPIC_API_KEY=tu_claude_api_key
OPENAI_API_KEY=tu_openai_api_key
OPENROUTER_API_KEY=tu_openrouter_api_key_opcional
```

### 3. Estructura de Archivos

```
tu-proyecto/
├── server/
│   ├── formmy-agent/        # Copia completa del framework
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── agent-core.ts
│   │   ├── agent-executor.ts
│   │   ├── context-chunker.ts
│   │   └── types.ts
│   └── tools/               # Sistema de herramientas (opcional)
│       └── registry.ts
├── app.js                   # Tu servidor Express
└── package.json
```

## Configuración del Servidor Express

### app.js - Setup Básico

```javascript
const express = require('express');
const { FormmyAgent } = require('./server/formmy-agent');
require('dotenv').config();

const app = express();
app.use(express.json());

// Endpoint principal del chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'gpt-5-nano' } = req.body;
    
    // Configuración mínima requerida
    const agentConfig = {
      chatbotId: 'demo-bot-001',
      userId: 'user-' + Date.now(),
      message: message,
      model: model,
      context: '', // Contexto adicional opcional
    };
    
    // Crear instancia del agente
    const agent = new FormmyAgent(agentConfig);
    
    // Ejecutar conversación
    const response = await agent.chat();
    
    res.json({
      success: true,
      message: response.message,
      tokensUsed: response.tokensUsed,
      iterations: response.iterations
    });
    
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error procesando el mensaje'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
```

## Ejemplo con Streaming

Para respuestas en tiempo real:

```javascript
app.post('/api/chat-stream', async (req, res) => {
  try {
    const { message, model = 'claude-3-haiku-20240307' } = req.body;
    
    // Headers para streaming
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    });
    
    const agentConfig = {
      chatbotId: 'demo-bot-stream',
      userId: 'user-' + Date.now(),
      message: message,
      model: model,
      context: '',
      stream: true, // Habilitar streaming
    };
    
    const agent = new FormmyAgent(agentConfig);
    
    // Manejar chunks de streaming
    agent.onStream = (chunk) => {
      res.write(chunk);
    };
    
    const response = await agent.chat();
    res.end();
    
  } catch (error) {
    res.write(`Error: ${error.message}`);
    res.end();
  }
});
```

## Configuración de Modelos Disponibles

El framework soporta estos modelos out-of-the-box:

```javascript
// server/formmy-agent/config.ts ya incluye:

const SUPPORTED_MODELS = {
  // OpenAI (económicos)
  'gpt-5-nano': { 
    temperature: undefined, 
    maxIterations: 5,
    contextLimit: 4000 
  },
  
  // Anthropic (calidad premium)  
  'claude-3-haiku-20240307': { 
    temperature: 0.7,
    maxIterations: 4,
    contextLimit: 3500 
  },
  
  'claude-3-5-haiku-20241022': { 
    temperature: 0.5,
    maxIterations: 6,
    contextLimit: 4000 
  }
};
```

## Uso con Context Chunking

Para documentos largos o contexto extenso:

```javascript
app.post('/api/chat-with-docs', async (req, res) => {
  const { message, document, model = 'gpt-5-nano' } = req.body;
  
  const agentConfig = {
    chatbotId: 'doc-analysis-bot',
    userId: req.headers['user-id'] || 'anonymous',
    message: message,
    model: model,
    context: document, // El framework chunkeará automáticamente
  };
  
  const agent = new FormmyAgent(agentConfig);
  const response = await agent.chat();
  
  res.json({
    response: response.message,
    chunksProcessed: response.chunks || 1,
    tokensUsed: response.tokensUsed
  });
});
```

## Integración con Herramientas (Opcional)

Si quieres usar el sistema de tools:

### 1. Configurar Registry Básico

```javascript
// server/tools/registry.js
const tools = new Map();

// Herramienta de ejemplo
tools.set('get_weather', {
  name: 'get_weather',
  description: 'Obtiene el clima de una ciudad',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'Nombre de la ciudad' }
    }
  },
  handler: async (args) => {
    // Lógica para obtener clima
    return `El clima en ${args.city} es soleado, 25°C`;
  }
});

function getAvailableTools() {
  return Array.from(tools.values());
}

function executeToolCall(toolName, args) {
  const tool = tools.get(toolName);
  if (!tool) throw new Error(`Herramienta ${toolName} no encontrada`);
  return tool.handler(args);
}

module.exports = { getAvailableTools, executeToolCall };
```

### 2. Endpoint con Herramientas

```javascript
app.post('/api/chat-tools', async (req, res) => {
  const { message, model = 'gpt-5-nano' } = req.body;
  
  const agentConfig = {
    chatbotId: 'tools-bot',
    userId: 'user-tools',
    message: message,
    model: model,
    context: '',
    enableTools: true, // Habilitar herramientas
  };
  
  const agent = new FormmyAgent(agentConfig);
  const response = await agent.chat();
  
  res.json({
    message: response.message,
    toolsUsed: response.toolsUsed || [],
    tokensUsed: response.tokensUsed
  });
});
```

## Manejo de Errores Robusto

```javascript
app.post('/api/chat-robust', async (req, res) => {
  try {
    const { message, model } = req.body;
    
    // Validaciones
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Mensaje requerido'
      });
    }
    
    // Modelos soportados
    const validModels = ['gpt-5-nano', 'claude-3-haiku-20240307', 'claude-3-5-haiku-20241022'];
    const selectedModel = validModels.includes(model) ? model : 'gpt-5-nano';
    
    const agentConfig = {
      chatbotId: 'robust-bot',
      userId: req.headers['x-user-id'] || 'anonymous',
      message: message,
      model: selectedModel,
      context: req.body.context || '',
    };
    
    const agent = new FormmyAgent(agentConfig);
    const response = await agent.chat();
    
    // Verificar respuesta válida
    if (!response.message || response.message.trim().length === 0) {
      throw new Error('Respuesta vacía del agente');
    }
    
    res.json({
      success: true,
      message: response.message,
      model: selectedModel,
      tokensUsed: response.tokensUsed,
      iterations: response.iterations
    });
    
  } catch (error) {
    console.error('Error en chat robusto:', error);
    
    // Diferentes tipos de errores
    if (error.message.includes('API key')) {
      res.status(401).json({
        error: 'Credenciales de API inválidas'
      });
    } else if (error.message.includes('rate limit')) {
      res.status(429).json({
        error: 'Límite de tasa excedido, intenta más tarde'
      });
    } else {
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  }
});
```

## Testing Básico

```javascript
// Endpoint de prueba
app.get('/api/test', async (req, res) => {
  try {
    const testConfig = {
      chatbotId: 'test-bot',
      userId: 'test-user',
      message: 'Hola, ¿estás funcionando correctamente?',
      model: 'gpt-5-nano',
      context: '',
    };
    
    const agent = new FormmyAgent(testConfig);
    const response = await agent.chat();
    
    res.json({
      status: 'OK',
      framework: 'Formmy Agent',
      version: '1.0.0',
      testResponse: response.message,
      tokensUsed: response.tokensUsed
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});
```

## Tips para Producción

### 1. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas consultas, intenta más tarde'
});

app.use('/api/chat*', chatLimiter);
```

### 2. Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'agent.log' })
  ]
});

// En tus endpoints
logger.info('Chat request', { 
  userId: agentConfig.userId, 
  model: agentConfig.model,
  messageLength: message.length 
});
```

### 3. Timeout Handling

```javascript
const timeout = require('connect-timeout');

app.use('/api/chat', timeout('30s'));

app.post('/api/chat', async (req, res) => {
  if (req.timedout) return;
  
  try {
    // Tu lógica aquí
  } catch (error) {
    if (!req.timedout) {
      res.status(500).json({ error: error.message });
    }
  }
});
```

## Próximos Pasos

Una vez que tengas el framework funcionando:

1. **Personaliza los modelos** según tus necesidades de costo/calidad
2. **Implementa herramientas específicas** para tu dominio
3. **Agrega autenticación** y control de acceso
4. **Configura monitoreo** de tokens y costos
5. **Optimiza el context chunking** para tus casos de uso

El Formmy Agent Framework te proporciona una base sólida para construir aplicaciones conversacionales inteligentes sin la complejidad de frameworks más pesados como LangChain.

## Recursos

- [Documentación completa del framework](https://formmy.app/docs)
- [Ejemplos en GitHub](https://github.com/formmy/agent-examples)
- [Comunidad en Discord](https://discord.gg/formmy)

¿Tienes preguntas? Únete a nuestra comunidad o contáctanos en [soporte@formmy.app](mailto:soporte@formmy.app).