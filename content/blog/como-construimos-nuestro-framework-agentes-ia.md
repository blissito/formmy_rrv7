---
title: "Por Qué Construimos Nuestro Propio Framework De Agentes IA"
excerpt: "La historia directa de por qué decidimos evitar frameworks pesados y construir algo simple que realmente entendemos."
date: "2024-08-24"
tags: ["Framework", "TypeScript", "IA", "Desarrollo"]
image: "/blogposts/cursos.webp"
---

# Por Qué Construimos Nuestro Propio Framework De Agentes IA

![Framework de agentes IA minimalista](https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

*La historia directa de por qué decidimos evitar frameworks pesados y construir algo simple que realmente entendemos.*

---

Cuando comenzamos Formmy, como cualquier equipo sensato, empezamos evaluando las herramientas existentes para agentes IA. LangChain era la opción obvia - documentación extensa, comunidad activa, "industry standard".

Después de tres semanas intentando implementar funciones básicas, me di cuenta de algo: estábamos pasando más tiempo entendiendo el framework que resolviendo nuestro problema real.

## Los Problemas Reales que Enfrentamos

![Desarrollo de software complejo vs simple](https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=800&h=300&fit=crop)

Como startup, teníamos necesidades específicas:

- **Chatbots que realmente ejecuten acciones** (crear recordatorios, pagos, etc.)
- **Múltiples modelos IA** (GPT-5-nano para costo, Claude para calidad)
- **Context chunking inteligente** para documentos largos
- **Retry automático** cuando las APIs fallan
- **Debuggeable** - poder entender qué pasó cuando algo falla

Con LangChain, cada una de estas necesidades requería:
- Leer documentación extensa
- Entender abstracciones complejas
- Debuggear a través de múltiples capas
- Adaptar ejemplos que casi nunca funcionaban en nuestro caso específico

El breaking point llegó cuando implementamos "herramientas" que funcionaban en development pero fallaban silenciosamente en producción. Debugging tomaba horas porque teníamos que entender primero cómo funcionaba LangChain internamente.

## La Decisión: TypeScript Puro

![TypeScript código limpio](https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800&h=300&fit=crop)

La pregunta que nos hicimos fue simple: ¿qué necesitamos realmente?

- Una clase que tome un mensaje y devuelva una respuesta
- Soporte para herramientas reales (no simuladas)
- Manejo de diferentes modelos IA
- Context management básico
- Retry logic confiable

Todo esto se puede hacer en TypeScript puro. No necesitas un framework de 15,000 líneas.

```typescript
// server/formmy-agent/index.ts
export class FormmyAgent {
  constructor(private config: AgentConfig) {
    // Control total sobre la implementación
  }
  
  async chat(): Promise<AgentResponse> {
    // Implementación simple y comprensible
  }
}
```

**Los principios que guiaron el diseño:**

1. **Código comprensible** - Cada parte debe ser entendible
2. **Optimización de costos** - Uso inteligente de modelos según la tarea
3. **Debugging directo** - Saber exactamente dónde buscar problemas
4. **Herramientas funcionales** - Ejecución real, no simulaciones
5. **Deploy rápido** - Menos complejidad, menos tiempo de build

## La Implementación Inicial

Comenzamos con una implementación básica que nos permitiera probar el concepto:

```typescript
// Primer prototipo funcional
export class FormmyAgent {
  async chat(message: string): Promise<string> {
    // Integración directa con proveedores de IA
    return await this.processWithAI(message);
  }
}
```

Desde el inicio, nos enfocamos en tener una implementación que fuera completamente comprensible para nuestro equipo.

## Implementación del Agent Loop

Implementamos el patrón ReAct para manejo de herramientas:

```typescript
// server/formmy-agent/agent-executor.ts
async executeAgentLoop(): Promise<AgentResponse> {
  let iterations = 0;
  let currentContext = this.initialContext;
  
  while (iterations < this.maxIterations) {
    // 1. Pensar (Reasoning)
    const decision = await this.makeDecision(currentContext);
    
    // 2. Actuar (Action) - HERRAMIENTAS REALES
    if (decision.needsTools) {
      const toolResult = await executeToolCall(
        decision.toolName, 
        decision.args, 
        this.context
      ); // ← Ya no simulación, ejecución real
      currentContext = this.updateContext(toolResult);
    }
    
    // 3. Observar (Observation)
    if (decision.isComplete) break;
    iterations++;
  }
  
  return this.generateFinalResponse(currentContext);
}
```

Con esta implementación, las herramientas comenzaron a ejecutarse correctamente.

## Context Chunking Inteligente

El problema: GPT-5-nano es increíblemente barato ($0.05/1M tokens), pero limitado en contexto.

La solución: chunking semántico sin embeddings costosos.

```typescript
// server/formmy-agent/context-chunker.ts
class ContextChunker {
  chunk(content: string, query: string): string[] {
    // Dividir en chunks de 4KB
    const chunks = this.splitIntoChunks(content, 4000);
    
    // Selección inteligente basada en keywords del query
    const relevantChunks = this.selectRelevantChunks(chunks, query);
    
    return relevantChunks.slice(0, 3); // Máximo 3 chunks más relevantes
  }
}
```

Esto nos permitió manejar documentos largos sin aumentar los costos significativamente.

## Retry Logic Confiable

LangChain tiene retry, pero es genérico. Nosotros construimos algo específico:

```typescript
// server/formmy-agent/agent-core.ts
async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Verificar que la respuesta no sea vacía o placeholder
      if (this.isValidResponse(result)) {
        return result;
      }
      
      throw new Error('Respuesta vacía o inválida');
    } catch (error) {
      lastError = error;
      
      // Exponential backoff específico para cada tipo de error
      const delay = this.calculateBackoff(attempt, error.type);
      await this.sleep(delay);
    }
  }
  
  throw lastError;
}
```

Esta lógica nos ha dado estabilidad en producción.

## Comparativa de Métricas

### ❌ ANTES (LangChain Hell):
- **Líneas de código**: 15,000+ (imposible de mantener)
- **Dependencias**: 47 packages (dependency hell)
- **Setup time**: 2-3 horas (solo para empezar)
- **Debugging**: 4-8 horas promedio (productividad MUERTA)
- **Costo por conversación**: Costos elevados con abstracciones innecesarias
- **Deploy time**: 8-15 minutos (eternidad en producción)
- **Bugs críticos**: 2-3 por semana (clientes furiosos)

### ✅ DESPUÉS (Formmy Agent Framework):
- **Líneas de código**: 500 (puedes leer todo en 30 min)
- **Dependencias**: 0 (CERO dependency hell)
- **Setup time**: 5 minutos (literalmente)
- **Debugging**: 5-15 minutos (productividad MÁXIMA)
- **Costo por conversación**: Optimizado con selección inteligente de modelos
- **Deploy time**: 2 minutos (velocidad competitiva)
- **Bugs críticos**: 0 en 6 meses (calidad enterprise)

## Los Resultados Reales

Después de 6 meses con nuestro framework propio:

- **Desarrollo más rápido**: Features que antes tomaban semanas, ahora toman días
- **Debugging eficiente**: Cuando algo falla, sabemos exactamente dónde buscar
- **Costos optimizados**: Uso inteligente de modelos baratos vs caros según la tarea
- **Zero mystery bugs**: Todo el código es nuestro, podemos entender cada línea

¿Ahorramos dinero? Sí. ¿Pero el beneficio real? **Velocidad de desarrollo y paz mental.**

## El Momento "No Puede Ser Tan Simple"

```typescript
// El archivo completo server/formmy-agent/config.ts
export const MODEL_CONFIGS = {
  'gpt-5-nano': {
    temperature: undefined, // GPT-5-nano no soporta temperature
    maxIterations: 5,
    contextLimit: 4000,
    retryConfig: { maxRetries: 3, backoffMs: 1000 }
  },
  
  'claude-3-haiku-20240307': {
    temperature: 0.7,
    maxIterations: 4, 
    contextLimit: 3500,
    retryConfig: { maxRetries: 4, backoffMs: 1500 }
  }
  
  // Solo lo que necesitamos, nada más
};
```

Cuando mostré esto al equipo, la primera reacción fue: "¿Eso es todo?"

Sí, eso es todo. Y funciona mejor que lo que reemplazó.

## Los Beneficios Más Importantes

### Debugging Directo
```bash
# Antes
Error en LangChain → Check tool handlers → Check agent chains → Check memory → Check vector store → ???

# Después  
Error en Formmy Agent → console.log en 3 lugares → Fixed en 5 minutos
```

### Routing Inteligente de Modelos
```typescript
// Optimización automática de costos
function selectModel(hasIntegrations: boolean, isComplexQuery: boolean): string {
  if (hasIntegrations || isComplexQuery) {
    return "claude-3-haiku-20240307"; // Calidad cuando importa
  }
  return "gpt-5-nano"; // Velocidad y economía para chat normal
}
```

### Herramientas Funcionales
```typescript
// Ya no simulación - ejecución real
const reminderResult = await scheduleReminder({
  title: "Llamar al cliente",
  date: "2025-08-25", 
  time: "14:30",
  email: "cliente@empresa.com"
});

// Se guarda en MongoDB, se programa con agenda.js, se envía email con AWS SES
```

## Las 3 Lecciones Que CAMBIARÁN Tu Enfoque de Desarrollo

### 🎯 Lección #1: La Complejidad ES Tu Enemigo Mortal
**La industria te MIENTE**: Complejidad ≠ Poder

El mejor código es el que un developer junior puede debuggear a las 2 AM sin despertarte. El Formmy Agent Framework es **exactamente eso**.

### 🔥 Lección #2: "Industry Standard" = Trampa de Productividad  
**Consideración importante**: Los frameworks populares están diseñados para casos genéricos, mientras que una solución propia se adapta a problemas específicos.

500 líneas que entiendes > 15,000 líneas que te esclavizan.

### ⚡ Lección #3: Control Total = Performance Exponencial
Cuando cada línea de código es TU decisión consciente, las optimizaciones se vuelven naturales. No accidentales. No mágicas. **Deliberadas.**

**El Formmy Agent Framework te da control TOTAL sobre tu stack de IA.**

## El Framework Hoy: En Producción

Después de 6 meses implementado:
- **Miles de conversaciones** procesadas sin problemas
- **Alta disponibilidad** y estabilidad consistente
- **Debugging simplificado** - problemas resueltos en minutos, no horas
- **Mantenimiento eficiente** - el equipo entiende completamente el código

```typescript
// La arquitectura final - simple pero poderosa
/server/formmy-agent/
  ├── index.ts           // Core del framework (FormmyAgent class)
  ├── agent-core.ts      // Retry logic y error handling
  ├── agent-executor.ts  // Loop ReAct con memoria
  ├── context-chunker.ts // División inteligente de contexto
  ├── context-optimizer.ts // Optimización de tokens
  ├── config.ts          // Configuraciones por modelo
  └── types.ts           // Interfaces TypeScript
```

## ¿Deberías Hacer Lo Mismo?

No automáticamente. Pero considera estos puntos:

**Construye tu propio framework si:**
- Tienes necesidades específicas que los frameworks genéricos no cubren bien
- Tu equipo prefiere entender completamente el código que mantienen
- Necesitas control total sobre performance y costos
- Debugging rápido es crítico para tu negocio

**Usa frameworks existentes si:**
- Tus necesidades son estándar y bien cubiertas
- Prefieres community support vs control total
- Tu equipo tiene experiencia profunda con el framework elegido

### Mientras Tanto: Construye TU Propia Solución

No esperes por nosotros. La filosofía es más importante que el código:

1. **Rechaza la complejidad artificial**
2. **Exige transparencia total** 
3. **Optimiza para debugging**, no para demos
4. **Mide el ROI real**, no las features marketing

**La mejor abstracción es la que entiendes completamente a las 2 AM.**

## La Lección Principal

No todos los problemas necesitan frameworks complejos. A veces, TypeScript puro + una buena arquitectura es la mejor solución.

Nuestro framework no es revolucionario. Es simplemente **apropiado** para nuestras necesidades específicas. Y esa diferencia importa más de lo que pensaba.

**500 líneas que entiendes completamente > 15,000 líneas que funcionan "mágicamente".**

---

**Héctor Bliss** - Fundador de Formmy y FixterGeek. Ocasionalmente escribe código que otros humanos pueden entender.

### Quieres ver el código?

Seguimos considerando open-source. Mientras tanto, el [segundo post de esta serie](/blog/tutorial-express-formmy-agent-framework) muestra cómo implementar algo similar con Express.

---

*¿Tienes experiencias similares con frameworks? Me encantaría escucharlas → [@hectorbliss](https://twitter.com/hectorbliss)*