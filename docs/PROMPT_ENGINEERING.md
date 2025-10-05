# Prompt Engineering Best Practices - Formmy

Este documento describe las técnicas de prompt engineering usadas en Ghosty y otros agentes de Formmy, comparadas con las mejores prácticas oficiales de Anthropic y LlamaIndex.

## 📖 Fuentes oficiales

- **Anthropic Prompt Engineering**: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
- **Chain of Thought**: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought
- **LlamaIndex Agent Workflows**: https://developers.llamaindex.ai/typescript/framework/modules/agents/agent_workflow/

## 🎯 Principios fundamentales

### 1. Clarity and Directness (Anthropic)

**Malo:**
```
Intenta usar la herramienta de búsqueda cuando sea necesario.
```

**Bueno:**
```
⛔ PROHIBICIONES ABSOLUTAS:
1. NUNCA respondas preguntas sobre el negocio sin buscar PRIMERO
2. NUNCA digas "no sé" sin AGOTAR todas las herramientas de búsqueda
```

### 2. Chain of Thought (Anthropic)

**Malo:**
```
Responde la pregunta del usuario.
```

**Bueno:**
```
🤔 Razonamiento interno (NO compartir con usuario):
   1. Pregunta sobre características nuevas del negocio
   2. Debo buscar PRIMERO en base de conocimiento
   3. Si no encuentro → buscar en web AUTOMÁTICAMENTE
   4. NO puedo decir "no sé" sin intentar ambas
   5. NO debo preguntar al usuario - DEBO HACERLO

✅ Acción correcta (ejecución silenciosa):
   → search_context("características nuevas...")
   → [Sin resultados]
   → web_search_google("Formmy características 2025")
   → Respuesta directa
```

### 3. Few-shot Examples (Anthropic)

**Malo:**
```
Usa múltiples búsquedas para preguntas complejas.
```

**Bueno:**
```
EJEMPLO 1: "¿Qué características nuevas tiene Formmy?"

✅ Acción correcta:
   → search_context("características nuevas")
   → search_context("novedades funcionalidades")
   → web_search_google("Formmy actualizaciones 2025")
   → Responder

❌ Respuesta INCORRECTA:
   "No tengo información..."
   "¿Te gustaría que busque?"
```

## 🔥 Técnicas avanzadas (Beyond Anthropic)

### 1. Ejemplos de respuestas PROHIBIDAS con frases exactas

En lugar de solo decir "no hagas X", mostramos **exactamente las frases que el modelo estaba usando**:

```typescript
❌ Respuesta INCORRECTA:
   "Parece que he tenido dificultades... ¿Te gustaría que busque?"
   "Vamos a hacer una búsqueda más optimizada"
```

**Por qué funciona**: El modelo reconoce sus propios patrones de output y aprende a evitarlos.

### 2. Protocolo de cascada con advertencias explícitas

```typescript
PASO 2 - Fallback a Web (AUTOMÁTICO si PASO 1 falla):
⚠️ NO PREGUNTES al usuario si quiere que busques - HAZLO DIRECTAMENTE
→ Si search_context NO tiene resultados después de 2+ intentos
→ EJECUTAR web_search_google INMEDIATAMENTE
→ Query debe incluir: "${businessDomain} [tema] 2025"
```

**Por qué funciona**: Advertencias inline previenen comportamientos no deseados en cada paso.

### 3. Razonamiento interno vs. externo

```typescript
🤔 Razonamiento interno (NO compartir con usuario):
   1. Analizar pregunta...
   2. Decidir estrategia...
   3. Ejecutar herramientas...

✅ Acción correcta (ejecución silenciosa):
   → tool_call_1
   → tool_call_2
   → Respuesta directa al usuario
```

**Por qué funciona**: El agente "piensa" (mejora accuracy) pero no "habla en voz alta" (mejor UX).

### 4. Templates concretas para queries

En lugar de "be specific", damos templates:

```typescript
→ Query debe incluir: "${businessDomain} [tema] 2025"
```

**Ejemplos generados**:
- "Formmy características nuevas 2025"
- "Formmy precios planes 2025"

## 🛠️ Patterns de LlamaIndex (100% oficial)

Todo nuestro código usa los patterns oficiales de LlamaIndex:

```typescript
// ✅ PATRÓN OFICIAL
const agentConfig = {
  llm,                    // LLM instance
  tools: allTools,        // Array de tools
  systemPrompt,           // ← Nuestros prompts mejorados
  verbose: true,
  memory                  // Memoria conversacional
};

return agent(agentConfig);
```

Para tools:

```typescript
// ✅ PATRÓN OFICIAL
tool(
  async (params) => { /* handler */ },
  {
    name: "search_context",
    description: `...`,  // ← Descripciones detalladas
    parameters: z.object({ /* zod schema */ })
  }
)
```

**NO hacemos ninguna lógica custom**. Solo usamos los parámetros oficiales del API con prompts mejor escritos.

## 📊 Resultados validados

Script de prueba: `scripts/test-rag-prompts.ts`

```bash
DEVELOPMENT_TOKEN=FORMMY_DEV_TOKEN_2025 npx tsx scripts/test-rag-prompts.ts
```

**Últimos resultados (Oct 4, 2025)**:

| Test | search_context | web_search | Créditos | Status |
|------|----------------|------------|----------|--------|
| Características nuevas | 2x | 1x | 7 | ✅ |
| Planes y formas de pago | 4x | 2x | 14 | ✅ |
| Comparar Starter vs Pro | 4x | 4x | 20 | ✅ |

**Comportamiento validado**:
- ✅ Descompone preguntas complejas en sub-consultas
- ✅ Hace 2-4 búsquedas `search_context` con queries reformuladas
- ✅ Fallback automático a `web_search_google`
- ✅ Exhaustivo (hasta 8 herramientas ejecutadas!)
- ✅ No usa frases prohibidas

## 🎓 Lecciones aprendidas

### 1. Los modelos imitan patrones, no solo siguen reglas

**Regla abstracta**: "Usa múltiples búsquedas"
**Patrón concreto**: Mostrar ejemplo completo con razonamiento → ✅ Funciona mejor

### 2. Prohibiciones explícitas > Sugerencias implícitas

**Malo**: "Cuando no sepas algo, intenta buscar"
**Bueno**: "NUNCA digas 'no sé' sin AGOTAR todas las herramientas"

### 3. Ejemplos de fracaso son tan importantes como de éxito

Mostrar **qué NO hacer** con las frases exactas que el modelo usa ayuda a corregir comportamiento.

### 4. El prompt ES el comportamiento

La diferencia entre Claude Code y Ghosty NO es el modelo - es el prompt.
Mismo modelo (GPT-4o-mini), comportamiento radicalmente diferente.

## 📚 Referencias

### Ejemplos profesionales encontrados con gh CLI:

**LlamaIndex oficial** (blog-writer.ts):
```
You are a research agent. Your role is to gather information
from the internet using the provided tools and then transfer
this information to the report agent for content creation.
```
→ Simple, directo, define rol y workflow

**Azure AI Travel Agents**:
```
Assists employees in better understanding customer needs,
facilitating more accurate and personalized service.
```
→ Define propósito y valor del agente

**Nuestro approach** (Ghosty):
```
⛔ PROHIBICIONES ABSOLUTAS:
1. NUNCA respondas sin buscar PRIMERO
2. NUNCA digas "no sé" sin AGOTAR herramientas

✅ PROTOCOLO OBLIGATORIO:
PASO 1 - Base de conocimiento (search_context)
PASO 2 - Fallback a web (web_search_google)
PASO 3 - Último recurso: decir "busqué pero no encontré"

📊 EJEMPLOS CON RAZONAMIENTO:
...
```
→ Mucho más detallado, pero **necesario para comportamiento agéntico complejo**

## 🎯 Conclusión

Nuestros prompts son **más verbosos** que los ejemplos básicos de LlamaIndex/Azure, pero están **alineados con las mejores prácticas de Anthropic** para casos de uso complejos:

- ✅ Clarity and directness (imperativos)
- ✅ Chain of thought (razonamiento paso a paso)
- ✅ Few-shot examples (con reasoning)
- ✅ Structural techniques (secciones con emojis)
- ✅ Tool usage prompts (descripciones detalladas)

**Y vamos más allá**:
- Ejemplos de respuestas incorrectas con frases exactas
- Protocolo de cascada con advertencias inline
- Razonamiento interno vs. externo
- Templates concretas para queries

El resultado: **Ghosty ahora tiene comportamiento agéntico comparable a Claude Code**.
