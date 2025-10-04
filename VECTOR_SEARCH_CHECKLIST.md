# ✅ Checklist: MongoDB Atlas Vector Search Troubleshooting

## Status Actual
- ✅ Embeddings creados: 3 documentos con 768 dimensiones
- ✅ Queries ejecutan sin error
- ❌ Queries retornan 0 resultados (PROBLEMA)

## Verificación en Atlas UI

### 1. Verificar que estás en Vector Search (NO Atlas Search)

**Navegar a:**
```
MongoDB Atlas → Clusters → [Tu Cluster] → Atlas Vector Search
```

**NO debe ser:**
```
MongoDB Atlas → Clusters → [Tu Cluster] → Atlas Search  ← INCORRECTO
```

### 2. Verificar el índice existe

En la sección **Atlas Vector Search**:
- [ ] Hay un índice llamado `vector_index`
- [ ] Status es **"Active"** (verde)
- [ ] Database es `formmy_dev` (o tu nombre)
- [ ] Collection es `embeddings`

### 3. Verificar configuración del índice

Click en el índice `vector_index` → Edit → View JSON:

**Debe ser EXACTAMENTE:**
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

**Verificar:**
- [ ] `"type": "vector"` (NO "knnVector")
- [ ] `"path": "embedding"` (exacto, minúsculas)
- [ ] `"numDimensions": 768` (número, no string)
- [ ] `"similarity": "cosine"` (exacto)

### 4. Verificar que no haya índices duplicados

- [ ] NO hay índice `vector_index` en **Atlas Search** (sección diferente)
- [ ] Solo 1 índice con nombre `vector_index` en **Vector Search**

### 5. Tiempo de indexación

Si acabas de crear/recrear el índice:
- [ ] Han pasado al menos **10-15 minutos**
- [ ] El status cambió de "Building" → "Active"

## Test Manual en Atlas UI

1. Ve a **Database** → Collection `embeddings`
2. Click en **Aggregation** tab
3. Ejecuta este pipeline:

```javascript
[
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: Array(768).fill(0.1),
      numCandidates: 10,
      limit: 3
    }
  },
  {
    $project: {
      content: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
]
```

**Resultado esperado:**
- Si retorna 0 docs → El índice NO está funcionando
- Si retorna 1-3 docs → El índice SÍ funciona (problema en el código)

## Si el test manual funciona pero el código no

El problema está en nuestro código, no en Atlas. Revisar:
- Sintaxis de `aggregateRaw`
- Formato del `queryVector`
- Conexión a la BD correcta

## Si el test manual NO funciona

Recrear el índice:

1. **Eliminar** el índice actual
2. Esperar 1 minuto
3. **Crear nuevo** con la configuración exacta de arriba
4. Esperar **15 minutos** completos
5. Probar de nuevo

## Clusters M0 Free - Limitaciones conocidas

- ⚠️ Pueden tardar hasta 20-30 minutos en indexar
- ⚠️ A veces requieren reiniciar el cluster
- ⚠️ Máximo 3 vector search indexes

## Próximos pasos

Una vez que el test manual funcione:
```bash
npx tsx scripts/test-vector-simple.ts
```

Si sigue sin funcionar después de verificar TODO:
- Puede ser un bug de MongoDB Atlas M0
- Considerar upgrade temporal a M10 para testing
