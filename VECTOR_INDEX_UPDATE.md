# Actualización del Índice Vectorial - MongoDB Atlas

## Problema Identificado

El filtrado por `contextId` falla porque el índice vectorial de MongoDB Atlas no incluye `metadata.contextId` como campo filtrable.

**Error**:
```
Path 'metadata.contextId' needs to be indexed as filter
```

## Solución

Actualizar el índice vectorial en MongoDB Atlas para incluir los campos de metadata como filtrables.

---

## Pasos para Actualizar el Índice

### Opción 1: Via Atlas UI (Recomendado)

1. **Ir a MongoDB Atlas**
   - Navegar a: Database → Collections → `embeddings`
   - Tab: "Search Indexes"

2. **Editar el índice `vector_index_bliss`**
   - Click en el botón "Edit" del índice existente
   - Cambiar a "JSON Editor"

3. **Reemplazar con esta configuración**:

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
    },
    {
      "type": "filter",
      "path": "metadata.contextId"
    },
    {
      "type": "filter",
      "path": "metadata.contextType"
    }
  ]
}
```

4. **Guardar y esperar**
   - Click "Save Changes"
   - El índice se reconstruirá automáticamente (~2-5 minutos)
   - Status cambiará de "Building" → "Active"

---

### Opción 2: Via MongoDB Shell

```javascript
// Conectar a MongoDB
mongosh "YOUR_MONGODB_URI"

// Usar la base de datos
use formmy_bliss

// Eliminar índice viejo (si existe)
db.embeddings.dropSearchIndex("vector_index_bliss")

// Crear nuevo índice con metadata filters
db.embeddings.createSearchIndex(
  "vector_index_bliss",
  {
    "mappings": {
      "dynamic": false,
      "fields": {
        "embedding": {
          "dimensions": 768,
          "similarity": "cosine",
          "type": "knnVector"
        },
        "chatbotId": {
          "type": "token"
        },
        "metadata": {
          "fields": {
            "contextId": {
              "type": "token"
            },
            "contextType": {
              "type": "token"
            }
          },
          "type": "document"
        }
      }
    }
  }
)
```

---

## Verificación

Una vez actualizado el índice, verificar que funciona:

### 1. Verificar Status del Índice

```bash
# MongoDB Shell
db.embeddings.getSearchIndexes("vector_index_bliss")

# Debe mostrar status: "READY"
```

### 2. Test con curl

```bash
curl -X POST "http://localhost:3000/api/rag/v1?intent=query" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "chatbotId": "CHATBOT_ID",
    "contextId": "CONTEXT_ID",
    "mode": "fast"
  }'
```

### 3. Re-ejecutar Suite de Tests

```bash
npx tsx scripts/test-rag-api-audit.ts
```

**Resultado esperado**: 7/7 tests PASS (sin errores de índice)

---

## Configuración Actualizada

El archivo `/server/vector/vector-config.ts` ya fue actualizado con la nueva configuración:

```typescript
export const ATLAS_VECTOR_INDEX_CONFIG = {
  fields: [
    {
      type: 'vector',
      path: 'embedding',
      numDimensions: 768,
      similarity: 'cosine'
    },
    {
      type: 'filter',
      path: 'chatbotId'
    },
    {
      type: 'filter',
      path: 'metadata.contextId'  // ✅ NUEVO
    },
    {
      type: 'filter',
      path: 'metadata.contextType' // ✅ NUEVO
    }
  ]
};
```

---

## Notas Importantes

1. **Sin downtime**: Atlas permite editar índices sin afectar el servicio
2. **Tiempo de rebuild**: ~2-5 minutos dependiendo del tamaño de la colección
3. **No requiere migración de datos**: Solo reconstruye el índice
4. **Backwards compatible**: La búsqueda sin filtros sigue funcionando igual

---

## Troubleshooting

### Si el índice no se actualiza:
1. Verificar permisos de usuario en Atlas
2. Verificar que el nombre del índice sea correcto (`vector_index_bliss`)
3. Revisar logs de Atlas para errores de construcción

### Si los queries siguen fallando después de actualizar:
1. Esperar a que el status sea "Active" (no "Building")
2. Verificar que el nombre del índice en `.env` coincida: `VECTOR_INDEX_NAME=vector_index_bliss`
3. Reiniciar la aplicación para recargar configuración

---

## Tracking

- [ ] Actualizar índice en Atlas
- [ ] Verificar status "Active"
- [ ] Test con contextId filter
- [ ] Re-ejecutar suite completa de tests
- [ ] Documentar resultado en reporte de auditoría
