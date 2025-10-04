---
title: "MongoDB Atlas Vector Search: Guía Práctica para Implementar RAG"
excerpt: "Aprende cómo implementar búsqueda semántica y sistemas RAG con MongoDB Atlas Vector Search. Incluye ejemplos reales de código y mejores prácticas."
date: "2025-10-04"
tags: ["MongoDB", "Vector Search", "RAG", "IA", "Tutorial"]
author: "Equipo Formmy"
image: "/blogposts/mongodb-vector-search.webp"
category: "tutorial"
---

# Introducción a MongoDB Atlas Vector Search

La búsqueda semántica está transformando cómo las aplicaciones entienden y recuperan información. MongoDB Atlas Vector Search permite implementar esta tecnología sin necesidad de gestionar infraestructuras adicionales.

## ¿Qué es Vector Search?

A diferencia de la búsqueda tradicional que coincide palabras exactas, Vector Search utiliza embeddings vectoriales para encontrar resultados por similitud semántica. Esto significa que puede identificar contenido relacionado aunque no comparta términos idénticos.

## Características principales

**Algoritmos de búsqueda**:

- **ANN** (Approximate Nearest Neighbor): Optimizado para velocidad usando el algoritmo Hierarchical Navigable Small Worlds
- **ENN** (Exact Nearest Neighbor): Búsqueda exhaustiva cuando se requiere máxima precisión

**Capacidades técnicas**:

- Soporte para vectores hasta 4096 dimensiones
- Compatible con embeddings de OpenAI, Voyage y otros proveedores
- Quantización automática para optimizar almacenamiento
- Disponible en MongoDB v6.0.11+ y v7.0.2+

## Casos de uso

### RAG (Retrieval-Augmented Generation)

El patrón más común es implementar sistemas RAG:

1. Almacenar documentos con sus embeddings en MongoDB
2. Buscar contexto relevante usando Vector Search
3. Enviar resultados a un LLM para generar respuestas precisas

Esta arquitectura potencia chatbots inteligentes, asistentes virtuales y sistemas de recomendación.

### Búsqueda multimodal

Vector Search funciona con diversos tipos de datos: texto, imágenes, audio y combinaciones. Esto permite crear experiencias de búsqueda más ricas y contextuales.

## Implementación Práctica: Sistema RAG en Formmy

A continuación se muestran ejemplos reales de implementación de un sistema RAG completo.

### 1. Vectorización Automática

Cuando se añade contenido (documentos, URLs, texto), el sistema lo divide en fragmentos y genera embeddings:

```typescript
// auto-vectorize.service.ts - Chunking inteligente con overlap
function chunkText(
  text: string,
  maxSize: number = 2000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxSize, text.length);
    const chunk = text.slice(start, end);

    // Cortar en espacio para no partir palabras
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(" ");
      if (lastSpace > maxSize / 2) {
        chunks.push(chunk.slice(0, lastSpace).trim());
        start += lastSpace - overlap; // Overlap preserva contexto
      } else {
        chunks.push(chunk.trim());
        start += maxSize - overlap;
      }
    } else {
      chunks.push(chunk.trim());
      break;
    }
  }

  return chunks.filter((c) => c.length > 0);
}

// Generar embeddings y guardar con metadata
export async function vectorizeContext(
  chatbotId: string,
  context: ContextItem
) {
  const fullText = extractTextFromContext(context);
  const chunks = chunkText(fullText);

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);

    await db.embedding.create({
      data: {
        chatbotId,
        content: chunks[i],
        embedding,
        metadata: {
          contextId: context.id,
          contextType: context.type,
          title: context.title,
          fileName: context.fileName,
          chunkIndex: i,
          totalChunks: chunks.length,
        },
      },
    });
  }
}
```

**Puntos clave**:

- Chunks de 2000 caracteres con overlap de 200
- Corte inteligente en espacios para preservar palabras
- Metadata rica para rastrear fuente original

### 2. Búsqueda Vectorial con MongoDB

Ejecutar consultas semánticas usando el operador `$vectorSearch`:

```typescript
// vector-search.service.ts - Búsqueda con similaridad coseno
export async function vectorSearch(
  query: string,
  chatbotId: string,
  topK: number = 5
): Promise<VectorSearchResult[]> {
  // 1. Convertir query del usuario a embedding
  const queryEmbedding = await generateEmbedding(query);

  // 2. Vector search con aggregation pipeline
  const results = await db.embedding.aggregateRaw({
    pipeline: [
      {
        $vectorSearch: {
          index: "vector_index_2", // Índice en Atlas
          path: "embedding", // Campo con vectores
          queryVector: queryEmbedding, // Vector de búsqueda
          numCandidates: topK * 10, // Buscar 10x para precisión
          limit: topK,
          filter: {
            chatbotId: { $oid: chatbotId }, // Filtrar por chatbot
          },
        },
      },
      {
        $project: {
          content: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" }, // Score de similitud
        },
      },
    ],
  });

  return results.map((r) => ({
    content: r.content,
    score: r.score,
    metadata: r.metadata,
  }));
}
```

**Detalles técnicos**:

- `numCandidates: topK * 10` mejora precisión (busca 50 candidatos para top 5)
- Filtro por `chatbotId` mantiene aislamiento entre chatbots
- Score de similitud coseno (0-1) indica relevancia

### 3. Handler de Tool para Agente AI

Integración con agentes LlamaIndex que pueden ejecutar múltiples búsquedas:

```typescript
// context-search.ts - Tool disponible para el agente
export async function contextSearchHandler(
  params: { query: string; topK?: number },
  context: ToolContext
): Promise<ContextSearchResponse> {
  const { query, topK = 5 } = params;

  // Validar acceso
  if (!context.chatbotId) {
    return {
      success: false,
      message: "No hay base de conocimiento disponible.",
    };
  }

  // Ejecutar búsqueda vectorial
  const results = await vectorSearch(query, context.chatbotId, topK);

  if (results.length === 0) {
    return {
      success: true,
      message: `No encontré información relevante sobre "${query}".`,
    };
  }

  // Formatear resultados con fuentes
  const formatted = results.map((r, idx) => {
    let source = "";
    if (r.metadata.fileName) source = `📄 ${r.metadata.fileName}`;
    else if (r.metadata.url) source = `🔗 ${r.metadata.url}`;
    else if (r.metadata.title) source = `📝 ${r.metadata.title}`;

    return `
**Resultado ${idx + 1}** (relevancia: ${(r.score * 100).toFixed(1)}%)
${source ? `Fuente: ${source}\n` : ""}
Contenido: ${r.content}
    `.trim();
  });

  return {
    success: true,
    message: `Encontré ${results.length} resultado(s):\n\n${formatted.join("\n\n---\n\n")}`,
    data: { results, totalResults: results.length },
  };
}
```

**Comportamiento agéntico**:

- El agente decide CUÁNDO buscar (no es automático)
- Puede ejecutar múltiples búsquedas para preguntas complejas
- Combina resultados y cita fuentes específicas

### 4. Ejemplo de Flujo Completo

```
Usuario: "¿Cuánto cuestan los planes y qué formas de pago aceptan?"

Agente AI (internamente):
  1. search_context("precios planes suscripción")
     → Encuentra: "Starter $149 MXN, Pro $499 MXN, Enterprise $1,499 MXN"

  2. search_context("métodos formas de pago aceptadas")
     → Encuentra: "Aceptamos tarjetas Visa, Mastercard y American Express"

  3. Combina resultados:
     "Según nuestro catálogo de planes (📄 pricing.pdf), ofrecemos:
     - Starter: $149 MXN/mes
     - Pro: $499 MXN/mes
     - Enterprise: $1,499 MXN/mes

     De acuerdo a nuestra política de pagos (🔗 terminos.com), aceptamos
     tarjetas Visa, Mastercard y American Express."
```

## Ventajas de la integración

Al tener datos transaccionales y vectores en una misma plataforma, se eliminan complejidades de sincronización entre sistemas. MongoDB combina capacidades de base de datos tradicional con búsqueda semántica avanzada.

## Integración con frameworks

Vector Search se integra nativamente con herramientas populares de IA:

- LangChain
- LlamaIndex
- OpenAI
- Anthropic Claude

## Configuración del Índice en Atlas

Para habilitar búsqueda vectorial, crear índice en MongoDB Atlas UI:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "chatbotId"
    }
  ]
}
```

## Conclusión

MongoDB Atlas Vector Search democratiza el acceso a búsqueda semántica al integrarse directamente en una plataforma que muchas organizaciones ya utilizan. Los ejemplos mostrados demuestran que implementar RAG no requiere arquitecturas complejas: chunking inteligente, embeddings y el operador `$vectorSearch` son suficientes para crear experiencias de búsqueda semántica de nivel producción.

---

*¿Quieres implementar búsqueda semántica en tus chatbots? Prueba [Formmy](https://formmy.app) con RAG agéntico incluido en planes PRO y Enterprise.*
