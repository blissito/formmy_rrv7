# MongoDB Atlas Vector Search Setup

Guía para configurar el índice de búsqueda vectorial en MongoDB Atlas.

## Requisitos

- ✅ MongoDB Atlas M0 Free Tier (o superior)
- ✅ Cluster existente configurado
- ✅ Colección `embeddings` creada (automático al ejecutar `npx prisma db push`)

## Paso 1: Acceder a MongoDB Atlas UI

1. Ir a [MongoDB Atlas](https://cloud.mongodb.com)
2. Iniciar sesión en tu cuenta
3. Seleccionar tu proyecto (ej: `formmy_dev`)
4. Click en tu cluster

## Paso 2: Crear Vector Search Index

### ⚠️ IMPORTANTE: Es VECTOR SEARCH, no Atlas Search

1. En la barra lateral del cluster, buscar **"Atlas Vector Search"** (NO "Atlas Search")
2. Click en **"Create Vector Search Index"**
3. Seleccionar **"JSON Editor"**
4. Configurar:
   - **Database**: `formmy_dev` (o tu nombre de BD)
   - **Collection**: `embeddings`
   - **Index Name**: `vector_index`

5. Pegar la siguiente configuración JSON:

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

**⚠️ VERIFICAR**:
- Debe decir **"Vector Search Index"** en el título
- Tipo: `"vector"` (para Vector Search)
- Path: `"embedding"` (exacto)
- Dimensions: `768`

**Si ya creaste un índice de Search normal:**
1. Eliminar ese índice (está en la sección equivocada)
2. Ir a **Vector Search** específicamente
3. Crear el índice ahí con la configuración de arriba

6. Click en **"Create Index"**
7. Esperar ~5-10 minutos a que esté "Active"

### Opción B: MongoDB Shell (mongosh)

```javascript
db.embeddings.createSearchIndex(
  "vector_index",
  "vectorSearch",
  {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 768,
        similarity: "cosine"
      },
      {
        type: "filter",
        path: "chatbotId"
      }
    ]
  }
);
```

## Paso 3: Verificar el Índice

### En Atlas UI

1. Ir a **Atlas Search**
2. Ver que `vector_index` aparece con status **"Active"**
3. Debe mostrar: `embeddings` collection, `768` dimensions

### Desde código (opcional)

Crear un script de prueba:

```typescript
// scripts/test-vector-search.ts
import { db } from '~/utils/db.server';

async function testVectorIndex() {
  try {
    const result = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: new Array(768).fill(0.1),
            numCandidates: 10,
            limit: 1
          }
        },
        { $limit: 1 }
      ]
    });

    console.log('✅ Vector search index is working!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Vector search index error:', error);
  }
}

testVectorIndex();
```

Ejecutar: `npx tsx scripts/test-vector-search.ts`

## Configuración Explicada

### Campos del Índice

1. **Vector Field**
   - `type: "vector"`: Tipo de campo vectorial
   - `path: "embedding"`: Nombre del campo en el schema Prisma
   - `numDimensions: 768`: Dimensiones de `text-embedding-3-small` de OpenAI
   - `similarity: "cosine"`: Métrica de similaridad (recomendado para embeddings)

2. **Filter Field**
   - `type: "filter"`: Permite filtrar por campo antes de buscar
   - `path: "chatbotId"`: Filtrar resultados por chatbot específico
   - Mejora performance al buscar solo embeddings del chatbot actual

### Alternativas de Similaridad

- `"cosine"`: ✅ Recomendado para embeddings de OpenAI
- `"euclidean"`: Para distancias euclidianas
- `"dotProduct"`: Para productos punto

## Límites M0 Free Tier

- ✅ **Vector Search soportado**
- ⚠️ **Máximo 3 search indexes** (suficiente para empezar)
- ⚠️ **512MB storage** (suficiente para ~500-1000 chatbots)

## Upgrade a M10 ($57/mes)

Solo necesario si:
- Necesitas >3 search indexes
- Storage >512MB embeddings
- Queries más rápidas (más recursos)

## Troubleshooting

### Error: "index not found"

1. Verificar que el índice está **"Active"** en Atlas UI
2. Esperar 2-5 minutos después de crear el índice
3. Verificar nombre exacto: `vector_index`

### Error: "dimensions mismatch"

1. Verificar que el embedding tiene exactamente 768 dimensiones
2. Confirmar que usas `text-embedding-3-small` (no `-large`)

### Error: "path not found"

1. Verificar que el campo se llama `embedding` (no `embeddings`)
2. Confirmar que hay documentos en la colección

## Próximos Pasos

1. ✅ Crear embeddings de contextos existentes → Ver `/server/vector/migration/`
2. ✅ Probar herramienta `search_context` en Ghosty
3. ✅ Monitorear costos de embeddings en OpenAI dashboard

## Referencias

- [MongoDB Atlas Vector Search Docs](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [LlamaIndex MongoDB Integration](https://www.mongodb.com/docs/atlas/ai-integrations/llamaindex/)
