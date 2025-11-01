# Checklist de Producción - Formmy

## 🔐 Secrets en Fly.io (CRÍTICO)

Antes de hacer deploy a producción, **TODAS** estas variables deben estar configuradas en Fly.io secrets.

### Verificar Secrets Actuales
```bash
fly secrets list
```

### Variables Requeridas

#### 1. Base de Datos
```bash
fly secrets set MONGO_ATLAS="mongodb+srv://username:password@cluster.mongodb.net/formmy?retryWrites=true&w=majority"
# O alternativamente:
fly secrets set DATABASE_URL="mongodb+srv://..."
```

#### 2. OpenAI (Embeddings + GPT models)
```bash
fly secrets set OPENAI_API_KEY="sk-..."
```

#### 3. Anthropic (Claude models)
```bash
fly secrets set ANTHROPIC_API_KEY="sk-ant-..."
```

#### 4. OpenRouter (Router de modelos)
```bash
fly secrets set OPENROUTER_API_KEY="sk-or-..."
```

#### 5. Stripe (Pagos)
```bash
# IMPORTANTE: Usar sk_live_xxx NO sk_test_xxx
fly secrets set STRIPE_SECRET_KEY="sk_live_..."
```

#### 6. LiveKit (Voice AI - opcional si está deshabilitado)
```bash
fly secrets set LIVEKIT_API_KEY="..."
fly secrets set LIVEKIT_API_SECRET="..."
fly secrets set LIVEKIT_URL="wss://..."
```

#### 7. ElevenLabs (Voice AI - opcional si está deshabilitado)
```bash
fly secrets set ELEVEN_API_KEY="..."
```

#### 8. AWS S3 (Almacenamiento de archivos)
```bash
fly secrets set AWS_ACCESS_KEY_ID="..."
fly secrets set AWS_SECRET_ACCESS_KEY="..."
fly secrets set AWS_REGION="us-east-1"
fly secrets set AWS_BUCKET_NAME="formmy-uploads"
```

#### 9. LlamaCloud (Parser de documentos)
```bash
fly secrets set LLAMA_CLOUD_API_KEY="llx-..."
```

#### 10. Meta/WhatsApp (Opcional - si integración está activa)
```bash
# Estos se configuran via UI en la app, NO en secrets
# Solo si necesitas tokens de sistema:
# fly secrets set META_APP_ID="..."
# fly secrets set META_APP_SECRET="..."
```

#### 11. Composio (Gmail integration - opcional)
```bash
fly secrets set COMPOSIO_API_KEY="..."
```

#### 12. Session Secret (Para auth)
```bash
# Generar con: openssl rand -base64 32
fly secrets set SESSION_SECRET="tu-secret-aleatorio-muy-largo-y-seguro"
```

#### 13. Vector Index (Configuración MongoDB)
```bash
# Opcional - por defecto usa 'vector_index_bliss'
fly secrets set VECTOR_INDEX_NAME="vector_index_bliss"
```

---

## ✅ Verificaciones MongoDB Atlas

### Vector Search Index
1. Ir a: https://cloud.mongodb.com
2. Seleccionar tu cluster
3. Navegar a: **Atlas Search → Search Indexes**
4. Verificar que existe: `vector_index_bliss` (o tu VECTOR_INDEX_NAME)
5. Status debe ser: **Active** (verde)
6. Configuración:
   - Database: `formmy`
   - Collection: `EmbeddedContext`
   - Type: `Vector Search`
   - Dimensions: `768`
   - Similarity: `cosine`

### Script de Verificación
```bash
npx tsx scripts/verify-mongodb-index.ts
```

---

## 🔗 Webhooks Externos

### Stripe
1. Ir a: https://dashboard.stripe.com/webhooks
2. Agregar endpoint: `https://formmy-v2.fly.dev/api/webhooks/stripe`
3. Eventos requeridos:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiar **Signing Secret** (empieza con `whsec_...`)
```bash
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
```

### WhatsApp (Meta Business)
1. Ir a: https://developers.facebook.com
2. Tu app → WhatsApp → Configuration
3. Webhook URL: `https://formmy-v2.fly.dev/api/webhooks/whatsapp`
4. Verify Token: (configura uno custom en tu app)
5. Subscribe to: `messages`, `message_status`

⚠️ Los tokens de WhatsApp se configuran via UI en Formmy, NO en Fly secrets

---

## 🚀 Deploy Checklist

### Pre-Deploy
- [ ] Todas las variables de entorno configuradas en Fly.io
- [ ] MongoDB Vector Index verificado y activo
- [ ] Stripe webhooks configurados
- [ ] WhatsApp webhooks configurados (si aplica)
- [ ] Health check endpoint probado localmente

### Deploy
```bash
# 1. Verificar configuración
fly config validate

# 2. Deploy
fly deploy --ha=false

# 3. Verificar health
curl https://formmy-v2.fly.dev/api/health-check

# 4. Monitorear logs
fly logs
```

### Post-Deploy
- [ ] Health check responde correctamente
- [ ] Login funciona
- [ ] Crear chatbot de prueba
- [ ] Subir documento al RAG
- [ ] Hacer query al RAG
- [ ] Enviar mensaje de prueba
- [ ] Verificar Stripe (crear pago de prueba)
- [ ] WhatsApp (enviar mensaje de prueba si aplica)

---

## ⚠️ Features Deshabilitadas

### Voice AI (ElevenLabs + LiveKit)
**Estado:** Próximamente (NO funcional)

El worker de Voice AI está deshabilitado en producción debido a:
- LiveKit musl bindings incompatibles con Fly.io
- Problemas conocidos: alucinaciones, falta integración tools
- Conversaciones no se guardan en DB

**En UI:** Debe aparecer como "Próximamente" y NO ser clickable.

**Archivo:** `fly.toml` línea 24 - worker comentado

---

## 📊 Monitoreo Básico

### Logs en Tiempo Real
```bash
fly logs -a formmy-v2
```

### Status de la App
```bash
fly status
```

### Uso de Recursos
```bash
fly dashboard
```

### Alertas Recomendadas
Configurar en Fly.io dashboard:
- ✅ App crashes (>3 en 5 min)
- ✅ CPU >80% por >5 min
- ✅ Memory >90%
- ✅ Health check failures

---

## 🔄 Rollback de Emergencia

Si algo falla después del deploy:

```bash
# Ver releases
fly releases

# Rollback a versión anterior
fly releases rollback <VERSION_NUMBER>
```

---

## 💰 Costos Estimados (Mes 1)

| Servicio | Costo Estimado |
|----------|---------------|
| Fly.io (2GB RAM, 1 instancia) | $35-40 |
| MongoDB Atlas M0 | $0 (gratis hasta 512MB) |
| OpenAI (embeddings + GPT) | $50-200 |
| Stripe | 2.9% + $0.30 por transacción |
| WhatsApp Business | Varía por volumen |
| **TOTAL** | **~$85-240/mes** |

---

## 🆘 Troubleshooting

### App no arranca
1. Verificar logs: `fly logs`
2. Verificar secrets: `fly secrets list`
3. Verificar health: `curl https://formmy-v2.fly.dev/api/health-check`

### RAG no funciona
1. Ejecutar: `npx tsx scripts/verify-mongodb-index.ts`
2. Verificar OPENAI_API_KEY configurado
3. Verificar Vector Index en MongoDB Atlas

### Stripe no recibe webhooks
1. Verificar URL en Stripe dashboard
2. Verificar STRIPE_WEBHOOK_SECRET configurado
3. Ver logs: `fly logs | grep stripe`

### WhatsApp no responde
1. Verificar webhook en Meta dashboard
2. Verificar tokens en DB (Integration model)
3. Ver logs: `fly logs | grep whatsapp`

---

**Última actualización:** 2025-11-01
**Versión:** 1.0
