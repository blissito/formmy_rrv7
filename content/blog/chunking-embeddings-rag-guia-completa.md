---
title: "Algoritmos de Chunking para Embeddings: Guia Completa para RAG"
excerpt: "Domina las tecnicas de fragmentacion de texto para sistemas RAG. Comparativa de librerias TypeScript, estrategias avanzadas y recomendaciones practicas."
date: "2025-12-14"
tags: ["RAG", "Embeddings", "Chunking", "IA", "Tutorial Avanzado"]
author: "[@blissito](https://github.com/blissito)"
image: "https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750"
category: "article"
---

# Algoritmos de Chunking para Embeddings: Guia Completa para RAG

El **chunking es el factor mas importante para el rendimiento de RAG**. La diferencia entre la mejor y peor estrategia puede significar hasta un 9% de gap en recall. Si tu sistema RAG no encuentra la informacion correcta, probablemente el problema no es el retriever, son los chunks.

En esta guia cubrimos desde lo basico hasta tecnicas avanzadas como Late Chunking y Contextual Retrieval, con ejemplos de codigo en TypeScript listos para usar.

## Por que Importa el Chunking

Los modelos de embeddings tienen dos limitaciones fundamentales:

**Contexto muy grande:**
- El vector pierde especificidad
- Mezcla multiples temas, resultando en un embedding "difuso"
- Puede exceder la ventana de contexto del modelo (truncamiento)

**Contexto muy pequeno:**
- Pierde informacion contextual critica
- "La ciudad tiene 3.85 millones de habitantes" sin saber que habla de Paris
- Referencias anaforicas rotas

El chunking es el arte de encontrar el balance correcto.

### Ventanas de Contexto de Modelos de Embedding

| Modelo | Max Tokens |
|--------|------------|
| text-embedding-3-small | 8,191 |
| text-embedding-3-large | 8,191 |
| jina-embeddings-v3 | 8,192 |
| Cohere embed-v3 | 512 |

---

## Estrategias de Chunking

### 1. Fixed-Size Chunking (Tamano Fijo)

**El mas usado: ~80% de aplicaciones RAG.**

La estrategia mas simple: dividir el texto en fragmentos de tamano predeterminado con overlap.

```typescript
// Concepto basico
const chunks = [];
for (let i = 0; i < text.length; i += chunkSize - overlap) {
  chunks.push(text.slice(i, i + chunkSize));
}
```

**Parametros optimos segun research:**
- **Chunk size**: 400-500 tokens (88-89% recall con 400 tokens)
- **Overlap**: 10-20% (50-100 tokens)

**Ventajas:** Simple, rapido, predecible, sin dependencias externas.

**Desventajas:** Corta en lugares arbitrarios, puede romper oraciones/parrafos, no entiende estructura del documento.

---

### 2. Recursive Character Splitting

**El estandar de la industria.** Intenta dividir por separadores jerarquicos.

```typescript
// Orden de separadores (del mas al menos preferido)
const separators = ["\n\n", "\n", " ", ""];

// Algoritmo:
// 1. Intenta dividir por "\n\n" (parrafos)
// 2. Si chunks > chunkSize, divide por "\n" (lineas)
// 3. Si aun > chunkSize, divide por " " (palabras)
// 4. Ultimo recurso: caracteres individuales
```

**Implementacion con LangChain:**

```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", ".", "!", "?", " ", ""]
});

const chunks = await splitter.splitText(document);
```

**Ventajas:** Respeta estructura del texto, configurable con separadores custom, ampliamente probado.

**Desventajas:** No entiende semantica, dependencia pesada (21MB).

---

### 3. Sentence-Based Chunking

Divide por oraciones completas y las agrupa hasta alcanzar el tamano deseado.

```typescript
// Pseudocodigo
const sentences = text.split(/[.!?]+/);
let currentChunk = "";

for (const sentence of sentences) {
  if ((currentChunk + sentence).length < maxSize) {
    currentChunk += sentence;
  } else {
    chunks.push(currentChunk);
    currentChunk = sentence;
  }
}
```

**Ventajas:** Nunca rompe oraciones, unidades semanticas completas.

**Desventajas:** Tamano de chunks variable, no detecta cambios de tema.

---

### 4. Semantic Chunking

**El mas sofisticado.** Usa embeddings para detectar cambios de tema.

El corazon del chunking semantico es su algoritmo de deteccion de breakpoints:

1. Dividir texto en oraciones
2. Generar embedding para cada oracion
3. Calcular similitud coseno entre oraciones adyacentes
4. Detectar "breakpoints" donde similitud cae bajo umbral
5. Agrupar oraciones entre breakpoints

**Metodos de umbral (threshold):**

| Metodo | Descripcion | Uso |
|--------|-------------|-----|
| Percentile | Breakpoint si distancia > percentil 95 | Mas comun |
| Standard Deviation | Breakpoint si > X desviaciones estandar | Tecnico |
| Interquartile | Usa cuartiles estadisticos | Papers academicos |

**Implementacion conceptual:**

```typescript
async function semanticChunk(text: string, embedder: Embedder) {
  const sentences = splitIntoSentences(text);
  const embeddings = await Promise.all(
    sentences.map(s => embedder.embed(s))
  );

  const distances: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    distances.push(1 - cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }

  // Percentile 95 como umbral
  const threshold = percentile(distances, 95);

  const chunks: string[] = [];
  let currentChunk = sentences[0];

  for (let i = 0; i < distances.length; i++) {
    if (distances[i] > threshold) {
      chunks.push(currentChunk);
      currentChunk = sentences[i + 1];
    } else {
      currentChunk += " " + sentences[i + 1];
    }
  }
  chunks.push(currentChunk);

  return chunks;
}
```

**Ventajas:** Chunks semanticamente coherentes, respeta cambios de tema naturales, ideal para documentos densos.

**Desventajas:** Computacionalmente costoso (N embeddings), tamanos de chunk variables. Research reciente sugiere que [no siempre justifica el costo](https://arxiv.org/html/2410.13070v1).

---

## Algoritmos Avanzados

### Late Chunking (Jina AI)

**Innovacion 2024.** Invierte el orden: primero embeddings, luego chunking.

**El problema que resuelve:**

El chunking tradicional pierde contexto. Si tienes:

> "Paris es la capital de Francia. La ciudad tiene mas de 3.85 millones de habitantes..."

Un chunk tradicional con "La ciudad tiene mas de 3.85 millones..." no sabe que "la ciudad" es Paris. El embedding pierde esa conexion.

**Como funciona Late Chunking:**

1. Pasar **documento completo** al modelo de embeddings (long-context)
2. Obtener **token-level embeddings** (cada token tiene contexto global)
3. **Despues** dividir en chunks
4. Mean pooling de los token embeddings para cada chunk

El embedding de "La ciudad" ya incluye que se refiere a Paris porque se proceso con contexto global.

**Requiere:** Modelos long-context como `jina-embeddings-v3` (8K tokens).

**Paper:** [Late Chunking: Contextual Chunk Embeddings](https://arxiv.org/pdf/2409.04701)

---

### Contextual Retrieval (Anthropic)

**Innovacion 2024.** Usa un LLM para anadir contexto a cada chunk.

El flujo es:
1. Chunking normal del documento
2. Para cada chunk, llamar al LLM con el documento completo + el chunk
3. El LLM genera 50-100 tokens de contexto explicativo
4. Prepend del contexto al chunk antes de crear el embedding

**Prompt usado por Anthropic:**

```
<document>
{{WHOLE_DOCUMENT}}
</document>

Here is the chunk we want to situate:
<chunk>
{{CHUNK_CONTENT}}
</chunk>

Give a short, succinct context to situate this chunk within
the overall document for improving search retrieval.
```

**Resultados:**
- **-49%** errores de retrieval (solo contextual embeddings)
- **-67%** errores (contextual + reranking)

**Costo con prompt caching:** ~$1.02 por millon de tokens de documento.

**Fuente:** [Anthropic Blog](https://www.anthropic.com/news/contextual-retrieval)

---

### Hierarchical/Parent-Child Chunking

**Arquitectura de dos niveles** para balancear precision y contexto.

La idea:
- **Parent chunks** (500-2000 tokens): Secciones completas, preservan contexto amplio
- **Child chunks** (100-500 tokens): Fragmentos precisos, mejor match con queries especificos

**Flujo de retrieval:**
1. **Indexar** solo los children (embeddings mas precisos)
2. **Buscar** en children (mejor match con queries especificos)
3. **Retornar** el parent del child encontrado (contexto completo para el LLM)

**Con LlamaIndex:**

```typescript
import { HierarchicalNodeParser, AutoMergingRetriever } from "llamaindex";

const nodeParser = new HierarchicalNodeParser.fromDefaults({
  chunkSizes: [2048, 512, 128]  // 3 niveles
});

// AutoMerging: si se recuperan >50% de children de un parent,
// automaticamente retorna el parent completo
```

---

## Librerias TypeScript

### Comparativa de Peso

| Libreria | Tamano (node_modules) | Enfoque |
|----------|----------------------|---------|
| [chonkie](https://www.npmjs.com/package/chonkie) | ~2MB | Lightweight, multiples chunkers |
| [llm-splitter](https://www.npmjs.com/package/llm-splitter) | ~1MB | Greedy single-pass |
| [llm-chunk](https://github.com/golbin/llm-chunk) | ~1KB | Ultra minimal |
| [@langchain/textsplitters](https://www.npmjs.com/package/@langchain/textsplitters) | **21MB** | Full-featured |
| [llamaindex](https://www.npmjs.com/package/llamaindex) | **36MB** | Framework completo |

---

### Chonkie (Recomendada para nuevos proyectos)

```bash
npm install chonkie
# o minimal:
npm install chonkie --omit=optional
```

**Chunkers disponibles:**
- `TokenChunker` - Por tokens
- `SentenceChunker` - Por oraciones
- `RecursiveChunker` - Estilo LangChain
- `CodeChunker` - Optimizado para codigo

**Proximamente:** SemanticChunker, LateChunker

```typescript
import { TokenChunker, RecursiveChunker } from 'chonkie';

// Token-based
const tokenChunker = await TokenChunker.create({
  chunkSize: 512,
  chunkOverlap: 50
});

// Recursive (como LangChain)
const recursiveChunker = await RecursiveChunker.create({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", ".", " "]
});

const chunks = await tokenChunker.chunk(text);
chunks.forEach(c => console.log(c.text, c.tokenCount));
```

**Docs:** [docs.chonkie.ai](https://docs.chonkie.ai)

---

### llm-splitter (Nearform)

```bash
npm install llm-splitter
```

**Enfoque greedy single-pass** - sacrifica optimalidad por velocidad.

```typescript
import { split, getChunk } from 'llm-splitter';

const chunks = split(text, {
  chunkSize: 512,
  chunkOverlap: 50,
  chunkStrategy: 'paragraph', // o 'character'
});

// Cada chunk tiene posiciones para reconstruir
chunks.forEach(chunk => {
  console.log(chunk.text);
  console.log(`Posicion: ${chunk.start}-${chunk.end}`);
});
```

**Feature util:** Almacenar solo `{start, end, embedding}` sin duplicar texto.

---

### @langchain/textsplitters

```bash
npm install @langchain/textsplitters
```

**El mas completo, pero pesado.**

```typescript
import {
  RecursiveCharacterTextSplitter,
  TokenTextSplitter,
  MarkdownTextSplitter
} from "@langchain/textsplitters";

// Recursive (mas usado)
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});

// Por tokens (con tiktoken)
const tokenSplitter = new TokenTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  encodingName: "cl100k_base" // GPT-4 encoding
});

// Para Markdown
const mdSplitter = new MarkdownTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 0
});

const docs = await splitter.createDocuments([text]);
```

**Splitters especializados:** MarkdownTextSplitter, LatexTextSplitter, HTMLSectionSplitter, PythonCodeTextSplitter.

---

## Recomendaciones Practicas

### Matriz de Decision

| Escenario | Estrategia | Libreria |
|-----------|------------|----------|
| MVP / Prototipo | Fixed-size 400 tokens, 10% overlap | `llm-chunk` |
| Produccion general | Recursive con separadores | `chonkie` |
| Documentos tecnicos | Semantic chunking | `llamaindex` |
| Codigo fuente | Code-aware splitter | `chonkie` CodeChunker |
| Maxima precision | Late Chunking + Reranking | Jina API |
| Budget ilimitado | Contextual Retrieval | Anthropic API |
| Documentos largos | Hierarchical + AutoMerging | `llamaindex` |

### Configuracion Inicial Recomendada

Para el 80% de casos de uso:

```typescript
const config = {
  chunkSize: 500,        // tokens
  chunkOverlap: 50,      // 10%
  strategy: "recursive",
  separators: [
    "\n\n",              // Parrafos
    "\n",                // Lineas
    ". ",                // Oraciones
    "! ",
    "? ",
    "; ",
    ", ",
    " ",                 // Palabras
    ""                   // Caracteres (fallback)
  ]
};
```

---

## Pipeline Completo para 2025

1. **Pre-procesamiento:** Limpieza, normalizacion, extraccion de metadata
2. **Chunking Primario:** Recursive splitter (500 tokens, 10% overlap)
3. **[Opcional] Contextualizacion:** Anthropic Contextual Retrieval o Late Chunking con Jina v3
4. **Embedding:** text-embedding-3-small (costo/beneficio) o text-embedding-3-large (maxima calidad)
5. **[Opcional] Reranking:** Cohere rerank-v3 (Top 20 → Top 5)
6. **Storage:** Vector DB (Pinecone, MongoDB Atlas, Weaviate)

---

## Fuentes

**Articulos tecnicos:**
- [Weaviate: Chunking Strategies for RAG](https://weaviate.io/blog/chunking-strategies-for-rag)
- [Pinecone: Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)
- [Stack Overflow: Breaking up is hard to do](https://stackoverflow.blog/2024/12/27/breaking-up-is-hard-to-do-chunking-in-rag-applications/)
- [Firecrawl: Best Chunking Strategies 2025](https://www.firecrawl.dev/blog/best-chunking-strategies-rag-2025)

**Papers:**
- [Is Semantic Chunking Worth the Computational Cost?](https://arxiv.org/html/2410.13070v1)
- [Late Chunking: Contextual Chunk Embeddings](https://arxiv.org/pdf/2409.04701)

**Tecnicas avanzadas:**
- [Anthropic Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [Jina Late Chunking](https://jina.ai/news/late-chunking-in-long-context-embedding-models/)
- [VectorHub: Semantic Chunking](https://superlinked.com/vectorhub/articles/semantic-chunking)

---

## Implementa RAG con Formmy

En Formmy, usamos chunking semantico optimizado para nuestro sistema RAG. Sube tus documentos y deja que nuestros agentes encuentren la informacion que necesitas.

**Crea tu chatbot con conocimiento contextual en minutos:**

[Prueba Formmy Gratis](https://formmy.app) - Manejamos la complejidad del RAG por ti.

*¿Tienes preguntas sobre como implementar chunking en tu proyecto? Nuestro equipo esta listo para ayudarte.*
