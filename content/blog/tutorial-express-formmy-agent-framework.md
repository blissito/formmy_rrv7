---
title: "Tutorial: Implementa El Formmy Agent Framework En Express.js"
excerpt: "Guía práctica para integrar nuestro micro-framework de agentes IA en un servidor Express desde cero."
date: "2024-08-24"
tags: ["Tutorial", "Express", "Framework", "IA", "Node.js"]
image: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop"
---

# Tutorial: Implementa El Formmy Agent Framework En Express.js

![Tutorial Express.js con IA](https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

*Guía práctica para integrar nuestro micro-framework de agentes IA en un servidor Express desde cero.*

---

Este tutorial te mostrará cómo implementar el Formmy Agent Framework en Express.js para crear un servidor de agentes IA conversacionales.

En los próximos 45 minutos vas a:
- ✅ Configurar un servidor Express con el framework
- ✅ Implementar agentes que ejecutan herramientas reales  
- ✅ Manejar documentos largos con context chunking
- ✅ Crear un sistema robusto de testing

**El resultado**: Un servidor Express funcional con agentes IA conversacionales.

**Tiempo estimado**: 45-60 minutos

## Comparativa de Frameworks

![Comparación de herramientas de desarrollo](https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800&h=300&fit=crop)

El Formmy Agent Framework ofrece ventajas en simplicidad y mantenibilidad:

| Característica | LangChain | Formmy Agent |
|---|---|---|
| **Líneas de código** | 15,000+ | 500 |
| **Tiempo de setup** | 2-3 horas | 45 minutos |
| **Debugging** | Complejo | Directo |
| **Dependencias** | 47+ packages | 0 |
| **Control del código** | Limitado | Total |

## Ventajas del Enfoque Minimalista

- **Código comprensible**: Puedes entender cada línea
- **Debugging eficiente**: Sabes exactamente dónde buscar errores
- **Sin dependency hell**: Control total sobre dependencias
- **Setup rápido**: Funcionando en minutos, no horas

## Prerequisites

```bash
# Stack requerido:
Node.js >= 16.x  
npm >= 8.x       
Express >= 4.18.x 

# Skills necesarias:
✅ JavaScript/TypeScript intermedio
✅ Express.js básico
✅ APIs REST
```

**Nota**: Este framework prioriza simplicidad y control total sobre abstracciones complejas.

## Parte 1: Setup Inicial (5 minutos)

### 1.1 Crear Tu Proyecto

```bash
# Crear directorio del proyecto
mkdir mi-app-agentes-ia
cd mi-app-agentes-ia
npm init -y

# Dependencias principales (mínimas y controladas)
npm install express dotenv cors helmet
npm install -D typescript @types/node @types/express ts-node nodemon

# SDKs directos (sin wrappers)
npm install openai @anthropic-ai/sdk axios
```

**Resultado**: Setup completo en minutos con dependencias mínimas y controladas.

### 1.2 Configuración de Variables de Entorno

Crea `.env` en la raíz:

```env
# APIs de IA - obtén keys gratuitas
OPENAI_API_KEY=tu_openai_api_key_aquí
ANTHROPIC_API_KEY=tu_anthropic_key_aquí  
OPENROUTER_API_KEY=tu_openrouter_key_opcional

# Configuración del servidor
PORT=3001
NODE_ENV=development

# Base de datos (opcional para persistencia)
MONGODB_URI=mongodb://localhost:27017/mi-app-agentes
```

### 1.3 Estructura de Carpetas

```
mi-app-agentes/
├── src/
│   ├── server/
│   │   ├── formmy-agent/     # El framework completo
│   │   │   ├── index.ts
│   │   │   ├── config.ts  
│   │   │   ├── agent-core.ts
│   │   │   ├── agent-executor.ts
│   │   │   ├── context-chunker.ts
│   │   │   └── types.ts
│   │   └── tools/            # Sistema de herramientas
│   │       ├── registry.ts
│   │       └── handlers/
│   │           ├── weather.ts
│   │           └── reminder.ts
│   ├── routes/
│   │   └── chat.ts
│   └── app.ts
├── .env
├── package.json
└── tsconfig.json
```

## Parte 2: Instalar el Framework (10 minutos)

### 2.1 Descargar el Framework

Descarga los archivos del Formmy Agent Framework desde nuestro repositorio:

```bash
# Crear directorio del framework
mkdir -p src/server/formmy-agent

# Opción A: Clone del repo público
git clone https://github.com/formmy/agent-examples.git temp
cp -r temp/framework/* src/server/formmy-agent/
rm -rf temp

# Opción B: Copiar manualmente los archivos desde documentación
```

### 2.2 Configurar TypeScript

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.3 Verificar Instalación

Crea `src/test-framework.ts`:

```typescript
import { FormmyAgent } from './server/formmy-agent';

async function testFramework() {
  try {
    console.log('🧪 Testeando Formmy Agent Framework...');
    
    const agent = new FormmyAgent({
      chatbotId: 'test-bot-001',
      userId: 'test-user',
      message: 'Hola, ¿estás funcionando correctamente?',
      model: 'gpt-5-nano',
      context: ''
    });
    
    const response = await agent.chat();
    
    console.log('✅ Framework funcionando!');
    console.log('📝 Respuesta:', response.message);
    console.log('⚡ Tokens usados:', response.tokensUsed);
    console.log('🔄 Iteraciones:', response.iterations);
    
  } catch (error) {
    console.error('❌ Error en el framework:', error.message);
    console.error('💡 Verifica tus API keys en .env');
  }
}

testFramework();
```

```bash
# Ejecutar test
npx ts-node src/test-framework.ts
```

## Parte 3: Servidor Express Básico (10 minutos)

### 3.1 App Principal

`src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-frontend.com'] 
    : ['http://localhost:3000', 'http://localhost:5173']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging básico
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rutas principales
app.use('/api/chat', chatRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    framework: 'Formmy Agent Framework v1.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    availableRoutes: ['/api/chat', '/health']
  });
});

// Error handler global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error global:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    requestId: `req_${Date.now()}`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`🧪 Test: curl http://localhost:${PORT}/health`);
});

export default app;
```

### 3.2 Rutas de Chat

`src/routes/chat.ts`:

```typescript
import express from 'express';
import { FormmyAgent } from '../server/formmy-agent';

const router = express.Router();

// Modelos disponibles
const MODELOS_DISPONIBLES = {
  'gpt-5-nano': {
    nombre: 'GPT-5 Nano',
    descripcion: 'Ultrarrápido y económico',
    costoAproximado: '$0.008/conversación'
  },
  'claude-3-haiku-20240307': {
    nombre: 'Claude 3 Haiku',
    descripcion: 'Equilibrio calidad-precio',
    costoAproximado: '$0.025/conversación'
  }
};

// Endpoint principal de chat
router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { mensaje, modelo = 'gpt-5-nano', contexto = '', opciones = {} } = req.body;
    
    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return res.status(400).json({
        error: 'Campo "mensaje" es requerido y debe ser un string no vacío',
        ejemplo: { mensaje: "Hola, ¿cómo estás?" }
      });
    }
    
    // Validar modelo
    if (!MODELOS_DISPONIBLES[modelo as keyof typeof MODELOS_DISPONIBLES]) {
      return res.status(400).json({
        error: 'Modelo no soportado',
        modelosDisponibles: Object.keys(MODELOS_DISPONIBLES),
        ejemplo: { modelo: 'gpt-5-nano' }
      });
    }
    
    console.log(`💬 Nueva conversación: ${mensaje.substring(0, 50)}...`);
    console.log(`🤖 Modelo: ${modelo}`);
    
    // Configuración del agente
    const configAgente = {
      chatbotId: req.headers['x-chatbot-id'] as string || `express-bot-${Date.now()}`,
      userId: req.headers['x-user-id'] as string || `user-${Date.now()}`,
      message: mensaje,
      model: modelo,
      context: contexto,
      ...opciones
    };
    
    // Crear y ejecutar agente
    const agente = new FormmyAgent(configAgente);
    const respuesta = await agente.chat();
    
    const tiempoEjecucion = Date.now() - startTime;
    
    // Respuesta exitosa
    res.json({
      exito: true,
      mensaje: respuesta.message,
      metadatos: {
        modelo: modelo,
        tokensUsados: respuesta.tokensUsed,
        iteraciones: respuesta.iterations,
        tiempoEjecucionMs: tiempoEjecucion,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`✅ Respuesta generada en ${tiempoEjecucion}ms`);
    
  } catch (error) {
    const tiempoEjecucion = Date.now() - startTime;
    console.error('❌ Error en chat:', error);
    
    // Manejo específico de errores
    let statusCode = 500;
    let mensaje = 'Error interno del servidor';
    
    if (error.message.includes('API key')) {
      statusCode = 401;
      mensaje = 'Credenciales de API inválidas o faltantes';
    } else if (error.message.includes('rate limit')) {
      statusCode = 429; 
      mensaje = 'Límite de tasa excedido. Intenta nuevamente en unos minutos';
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      mensaje = 'Tiempo de espera agotado. Intenta con un mensaje más corto';
    }
    
    res.status(statusCode).json({
      exito: false,
      error: mensaje,
      codigo: error.code || 'UNKNOWN_ERROR',
      tiempoEjecucionMs: tiempoEjecucion,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para obtener información de modelos
router.get('/modelos', (req, res) => {
  res.json({
    modelosDisponibles: MODELOS_DISPONIBLES,
    recomendacion: 'gpt-5-nano para la mayoría de casos de uso',
    documentacion: 'https://formmy.app/docs/modelos'
  });
});

export { router as chatRouter };
```

## Parte 4: Sistema de Herramientas (15 minutos)

### 4.1 Registry de Herramientas

`src/server/tools/registry.ts`:

```typescript
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, context?: ToolContext) => Promise<any>;
}

export interface ToolContext {
  chatbotId: string;
  userId: string;
  message?: string;
}

const herramientas = new Map<string, ToolDefinition>();

// Herramienta de clima
herramientas.set('obtener_clima', {
  name: 'obtener_clima',
  description: 'Obtiene información del clima actual de una ciudad',
  parameters: {
    type: 'object',
    properties: {
      ciudad: {
        type: 'string',
        description: 'Nombre de la ciudad para consultar el clima'
      }
    },
    required: ['ciudad']
  },
  handler: async (args) => {
    const climas = {
      'madrid': 'Soleado, 22°C',
      'barcelona': 'Nublado, 19°C', 
      'valencia': 'Lluvioso, 17°C',
      'sevilla': 'Muy soleado, 28°C'
    };
    
    const ciudad = args.ciudad.toLowerCase();
    const clima = climas[ciudad] || 'No disponible para esta ciudad';
    
    return `El clima en ${args.ciudad} es: ${clima}`;
  }
});

// Herramienta de recordatorios
herramientas.set('programar_recordatorio', {
  name: 'programar_recordatorio',
  description: 'Programa un recordatorio para una fecha y hora específica',
  parameters: {
    type: 'object',
    properties: {
      titulo: {
        type: 'string',
        description: 'Título o descripción del recordatorio'
      },
      fecha: {
        type: 'string', 
        description: 'Fecha en formato YYYY-MM-DD'
      },
      hora: {
        type: 'string',
        description: 'Hora en formato HH:MM (24h)'
      },
      email: {
        type: 'string',
        description: 'Email donde enviar el recordatorio (opcional)'
      }
    },
    required: ['titulo', 'fecha', 'hora']
  },
  handler: async (args, context) => {
    console.log('📅 Recordatorio programado:', args);
    
    const recordatorio = {
      id: `reminder_${Date.now()}`,
      titulo: args.titulo,
      fecha: args.fecha,
      hora: args.hora,
      email: args.email || 'No especificado',
      chatbotId: context?.chatbotId,
      userId: context?.userId,
      creado: new Date().toISOString()
    };
    
    return `✅ Recordatorio "${args.titulo}" programado para el ${args.fecha} a las ${args.hora}. ID: ${recordatorio.id}`;
  }
});

export function getAvailableTools(): ToolDefinition[] {
  return Array.from(herramientas.values());
}

export async function executeToolCall(
  toolName: string, 
  args: any, 
  context?: ToolContext
): Promise<any> {
  const herramienta = herramientas.get(toolName);
  
  if (!herramienta) {
    throw new Error(`❌ Herramienta "${toolName}" no encontrada. Herramientas disponibles: ${Array.from(herramientas.keys()).join(', ')}`);
  }
  
  try {
    console.log(`🔧 Ejecutando herramienta: ${toolName}`, args);
    const resultado = await herramienta.handler(args, context);
    console.log(`✅ Herramienta ejecutada exitosamente: ${toolName}`);
    return resultado;
  } catch (error) {
    console.error(`❌ Error ejecutando herramienta ${toolName}:`, error);
    throw new Error(`Error en herramienta ${toolName}: ${error.message}`);
  }
}

export function registerTool(tool: ToolDefinition): void {
  herramientas.set(tool.name, tool);
  console.log(`🔧 Herramienta registrada: ${tool.name}`);
}
```

## Parte 5: Testing y Debugging (10 minutos)

### 5.1 Scripts de Test

`src/test-integration.ts`:

```typescript
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(nombre: string, config: any) {
  try {
    console.log(`🧪 Testing: ${nombre}`);
    const response = await axios(config);
    console.log(`✅ ${nombre} - OK`);
    return response.data;
  } catch (error: any) {
    console.log(`❌ ${nombre} - Error: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando tests de integración...\n');
  
  // Test 1: Health check
  await testEndpoint('Health Check', {
    method: 'GET',
    url: `${BASE_URL}/health`
  });
  
  // Test 2: Chat básico
  const chatResponse = await testEndpoint('Chat Básico', {
    method: 'POST',
    url: `${BASE_URL}/api/chat`,
    data: {
      mensaje: 'Hola, ¿cómo estás?',
      modelo: 'gpt-5-nano'
    }
  });
  
  if (chatResponse) {
    console.log(`   📝 Respuesta: ${chatResponse.mensaje.substring(0, 100)}...`);
    console.log(`   ⚡ Tokens: ${chatResponse.metadatos.tokensUsados}`);
  }
  
  // Test 3: Modelos disponibles
  await testEndpoint('Modelos Disponibles', {
    method: 'GET',
    url: `${BASE_URL}/api/chat/modelos`
  });
  
  console.log('\n✅ Tests completados!');
}

runAllTests().catch(console.error);
```

### 5.2 Scripts de Package.json

Actualiza `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "ts-node src/test-integration.ts",
    "test:framework": "ts-node src/test-framework.ts"
  }
}
```

## Parte 6: Optimizaciones de Producción (5 minutos)

### 6.1 Rate Limiting

```bash
npm install express-rate-limit
```

Actualiza `src/app.ts`:

```typescript
import rateLimit from 'express-rate-limit';

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    error: 'Demasiadas consultas. Intenta nuevamente en 15 minutos',
    limitePorVentana: 100,
    ventanaMinutos: 15
  }
});

app.use('/api/chat', chatLimiter);
```

## Testing Final y Deployment

### 1. Ejecutar Tests

```bash
# Terminal 1 - Iniciar servidor
npm run dev

# Terminal 2 - Ejecutar tests
npm run test
```

### 2. Variables de Producción

`.env.production`:

```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=tu_key_produccion
ANTHROPIC_API_KEY=tu_key_produccion
RATE_LIMIT_MAX=50
CORS_ORIGIN=https://tu-frontend-produccion.com
```

## Resumen del Tutorial

### Lo que has implementado:

✅ **Servidor Express con agentes IA** funcional y robusto  
✅ **Sistema de herramientas modular** con ejecución real  
✅ **Procesamiento de documentos** con context chunking  
✅ **Rate limiting y logging** para producción  
✅ **Suite de testing** completa

### Próximos Pasos

1. **Base de datos**: Agregar persistencia para conversaciones
2. **Autenticación**: Implementar JWT y manejo de usuarios
3. **Herramientas avanzadas**: Integrar APIs externas específicas
4. **Monitoring**: Métricas detalladas y alertas

## Recursos y Documentación

### Enlaces Útiles:
- **Documentación Formmy**: https://formmy.app/docs
- **Ejemplos en GitHub**: https://github.com/formmy/agent-examples
- **Comunidad Discord**: https://discord.gg/formmy

### Obtener API Keys Gratuitas:
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **OpenRouter**: https://openrouter.ai/

---

## Reflexiones Finales

**HéctorBliss** - Fundador de Formmy, creador del framework.

Este tutorial demuestra que no siempre necesitas frameworks complejos para resolver problemas reales. A veces, una solución simple y bien diseñada es más efectiva que arquitecturas "enterprise".

**La clave**: Elegir las herramientas apropiadas para tu problema específico, no las más populares.

---

*¿Tienes preguntas o mejoras? Contribuye al proyecto o únete a nuestra comunidad.*