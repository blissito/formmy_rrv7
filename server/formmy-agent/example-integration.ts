/**
 * EJEMPLO DE INTEGRACIÓN del Formmy Agent Framework
 * 
 * Este archivo muestra cómo integrar el micro-framework con tu API existente
 * NO es parte del framework core, solo un ejemplo de uso
 */

import { FormmyAgent, createAgent, createTestAgent } from './index';
import type { ChatOptions } from './types';

// ===== EJEMPLO 1: USO BÁSICO =====

async function exemploBasico() {
  console.log('\n🚀 === EJEMPLO BÁSICO ===');
  
  // Crear agente simple para testing
  const agent = createTestAgent('gpt-5-nano');
  
  // Chat básico
  const response1 = await agent.preview('¿Qué es Formmy?');
  console.log('Respuesta 1:', response1);
  
  // Chat con contexto
  const response2 = await agent.chat('¿Cómo puedo crear un formulario?', {
    contexts: [
      {
        id: '1',
        type: 'TEXT',
        title: 'Guía de Formmy',
        content: 'Formmy es una plataforma para crear formularios y chatbots inteligentes. Para crear un formulario, ve al dashboard y haz clic en "Nuevo Formmy".',
        sizeKB: 1,
        keywords: ['formmy', 'formulario', 'crear', 'dashboard']
      }
    ]
  });
  
  console.log('Respuesta 2:', response2.content);
  console.log('Tokens usados:', response2.usage?.totalTokens);
}

// ===== EJEMPLO 2: INTEGRACIÓN CON TU API ACTUAL =====

/**
 * Esta función muestra cómo reemplazar tu lógica actual de chat
 * en /app/routes/api.v1.chatbot.ts
 */
async function integracionConAPI(
  message: string,
  chatbot: any, // Tu tipo Chatbot de Prisma
  user: any,    // Tu tipo User de Prisma  
  sessionId: string,
  stream: boolean
) {
  console.log('\n🔗 === INTEGRACIÓN CON API ===');
  
  try {
    // 1. Crear agente específico para el chatbot
    const agent = await createAgent(chatbot);
    
    // 2. Preparar opciones
    const options: ChatOptions = {
      contexts: chatbot.contexts || [],
      model: chatbot.aiModel,
      stream: stream,
      user: user,
      sessionId: sessionId,
      chatbotId: chatbot.id
    };
    
    // 3. Ejecutar chat (esto reemplaza toda tu lógica actual)
    const response = await agent.chat(message, options);
    
    // 4. Manejar streaming vs non-streaming
    if (stream && response.stream) {
      return new Response(response.stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    } else {
      return new Response(JSON.stringify({
        message: response.content,
        modelUsed: options.model,
        tokensUsed: response.usage?.totalTokens,
        toolsUsed: response.toolsUsed,
        iterations: response.iterations,
        frameworkUsed: 'formmy-agent'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Error en integración:', error);
    
    return new Response(JSON.stringify({
      error: 'Error procesando solicitud con Formmy Agent',
      details: (error as Error).message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ===== EJEMPLO 3: DEBUG Y TESTING =====

async function ejemploDebug() {
  console.log('\n🐛 === EJEMPLO DEBUG ===');
  
  const agent = createTestAgent('gpt-5-nano');
  
  // Usar método debug para ver qué está pasando internamente
  const { response, debug } = await agent.debug('Créame un recordatorio para mañana', {
    contexts: [],
    user: { id: 'test-user', plan: 'PRO' }
  });
  
  console.log('=== DEBUG INFO ===');
  console.log('Contexto optimizado:', debug.contextOptimized.length, 'chars');
  console.log('Herramientas disponibles:', debug.toolsAvailable);
  console.log('Usó agent loop:', debug.usedAgentLoop);
  console.log('Tiempo de procesamiento:', debug.processingTime, 'ms');
  
  console.log('\n=== RESPONSE ===');
  console.log('Contenido:', response.content);
  console.log('Herramientas usadas:', response.toolsUsed);
  console.log('Iteraciones:', response.iterations);
}

// ===== EJEMPLO 4: COMPARACIÓN ANTES/DESPUÉS =====

/**
 * Muestra la diferencia entre tu código actual y el framework
 */
function comparacionCodigo() {
  console.log('\n📊 === COMPARACIÓN ANTES/DESPUÉS ===');
  
  console.log(`
🔴 ANTES (tu código actual):
- ~2000 líneas en api.v1.chatbot.ts
- Lógica de retry dispersa
- Manejo de contexto manual
- Agent loop básico en archivo separado
- Sin optimización de tokens
- Debugging complejo

🟢 DESPUÉS (con framework):
- ~50 líneas en api.v1.chatbot.ts
- Retry automático con backoff
- Optimización de contexto inteligente  
- Agent loop robusto integrado
- Chunking y selección de contexto
- Debug mode built-in
- TypeScript completo
- Configuración por modelo (nano sin temperature)

CÓDIGO DE INTEGRACIÓN:
\`\`\`typescript
// Reemplazar toda tu lógica actual con:
const agent = await createAgent(chatbot);
const response = await agent.chat(message, {
  contexts: chatbot.contexts,
  stream: true,
  user: user
});
return response.stream || JSON.stringify(response);
\`\`\`
`);
}

// ===== RUNNER PRINCIPAL =====

export async function runExamples() {
  console.log('🎯 === FORMMY AGENT FRAMEWORK - EJEMPLOS ===\n');
  
  try {
    await exemploBasico();
    await ejemploDebug();
    comparacionCodigo();
    
    console.log('\n✅ Todos los ejemplos ejecutados correctamente!');
    
  } catch (error) {
    console.error('❌ Error ejecutando ejemplos:', error);
  }
}

// ===== HELPERS PARA MIGRATION =====

/**
 * Helper para migrar gradualmente tu código actual
 */
export const migrationHelper = {
  // Paso 1: Reemplazar solo el agent loop
  replaceAgentLoop: async (message: string, chatbot: any, user: any) => {
    const agent = await createAgent(chatbot);
    return agent.preview(message);
  },
  
  // Paso 2: Añadir optimización de contexto
  addContextOptimization: async (message: string, chatbot: any, contexts: any[]) => {
    const agent = await createAgent(chatbot);
    return agent.chat(message, { contexts });
  },
  
  // Paso 3: Migración completa
  fullMigration: integracionConAPI
};

// Para testing rápido, descomenta la línea siguiente:
// runExamples();