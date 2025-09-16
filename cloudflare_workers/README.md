# 🚀 WhatsApp + Flowise Bridge (Cloudflare Workers)

Microservicio serverless que conecta WhatsApp Business API con Flowise usando Cloudflare Workers.

## ✨ Características

- ⚡ **0ms cold start** - Respuesta inmediata
- 💰 **$0 costo** - 100K requests gratis/mes
- 🌍 **300+ ubicaciones** - Latencia global mínima
- 🔄 **Auto-scaling** - Maneja cualquier volumen
- 🛡️ **Seguridad** - Variables encriptadas
- 🧪 **Testing** - Endpoints de prueba incluidos

## 🏗️ Arquitectura

```
WhatsApp Business → Worker (Edge) → Flowise → LlamaIndex Agent
                 ↑ 300ms latencia ↑     ↑ 500ms ↑
                 $0/mes            API calls
```

## 📋 Requisitos Previos

1. **Cuenta Cloudflare** (gratis)
2. **Instancia Flowise** (self-hosted o cloud)
3. **WhatsApp Business API** (Meta for Developers)
4. **Node.js** instalado localmente

## 🚀 Setup Completo

### 1. Instalar Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### 2. Instalar Dependencias

```bash
cd cloudflare_workers
npm install
```

### 3. Configurar Variables

```bash
# Copiar plantilla de variables
cp .env.example .env

# Editar con tus valores reales
nano .env
```

### 4. Configurar Secrets en Cloudflare

```bash
# Configurar variables sensibles como secrets
wrangler secret put FLOWISE_API_KEY --env production
wrangler secret put WHATSAPP_TOKEN --env production
wrangler secret put PHONE_NUMBER_ID --env production
wrangler secret put VERIFY_TOKEN --env production
```

### 5. Deploy del Worker

```bash
# Deploy a producción
npm run deploy

# O deploy a desarrollo
npm run deploy:dev
```

## 📊 Variables de Entorno Necesarias

### 🔧 Flowise Configuration

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `FLOWISE_URL` | URL de tu Flowise | `https://flowise.fly.dev` |
| `FLOWISE_CHATFLOW_ID` | ID del flow | `abc123-def456` |
| `FLOWISE_API_KEY` | API Key (opcional) | `eyJhbGc...` |

### 📱 WhatsApp Business API

| Variable | Descripción | Dónde Obtenerla |
|----------|-------------|-----------------|
| `WHATSAPP_TOKEN` | Token de acceso | Meta Developers > App > WhatsApp > API Setup |
| `PHONE_NUMBER_ID` | ID del número | Meta Developers > App > WhatsApp > API Setup |
| `VERIFY_TOKEN` | Token verificación | String secreto que tú defines |

## 🔗 Endpoints del Worker

### Production URL
Después del deploy, obtienes una URL como:
```
https://formmy-whatsapp-bridge.your-subdomain.workers.dev
```

### Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/webhook` | GET | Verificación WhatsApp |
| `/webhook` | POST | Recibir mensajes |
| `/health` | GET | Health check |
| `/test` | POST | Testing endpoint |

## 🧪 Testing

### 1. Test Health Check

```bash
curl https://your-worker.workers.dev/health
```

### 2. Test Flowise Connection

```bash
curl -X POST https://your-worker.workers.dev/test \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hola, ¿cómo estás?"}'
```

### 3. Test Local Development

```bash
# Ejecutar en modo desarrollo
npm run dev

# En otra terminal, probar
curl -X POST http://localhost:8787/test \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Test message"}'
```

## 📱 Configuración WhatsApp Business

### 1. Crear App en Meta for Developers

1. Ve a https://developers.facebook.com
2. Crear nueva app → Business
3. Agregar producto **WhatsApp**

### 2. Configurar Webhook

En **WhatsApp > Configuration**:

- **Callback URL**: `https://your-worker.workers.dev/webhook`
- **Verify Token**: El mismo que configuraste como `VERIFY_TOKEN`
- **Webhook Fields**: Seleccionar `messages`

### 3. Obtener Credentials

En **WhatsApp > API Setup**:
- Copiar **Temporary Access Token** → `WHATSAPP_TOKEN`
- Copiar **Phone Number ID** → `PHONE_NUMBER_ID`

## 🔧 Configuración Flowise

### 1. Crear Agentflow

1. En Flowise, crear nuevo **Agentflow**
2. Configurar tu LLM preferido (GPT-5-nano, Claude, etc.)
3. Agregar tools según necesidades
4. Guardar el flow

### 2. Habilitar API

1. En el flow, click **"API"**
2. Activar **"Allow API Access"**
3. Copiar **Chatflow ID** → `FLOWISE_CHATFLOW_ID`
4. Si usas API Key, copiarla → `FLOWISE_API_KEY`

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Logs de producción
npm run tail

# Logs de desarrollo
npm run tail:dev
```

### Dashboard Cloudflare

1. Ve a **Cloudflare Dashboard**
2. **Workers & Pages** → Tu worker
3. Ver métricas, logs y errores

## 🚨 Troubleshooting

### Error: "Webhook verification failed"

- Verificar que `VERIFY_TOKEN` coincida exactamente
- Revisar URL del webhook en Meta Developers

### Error: "Flowise API error"

- Verificar `FLOWISE_URL` y `FLOWISE_CHATFLOW_ID`
- Comprobar que Flowise esté accesible públicamente
- Revisar si necesitas `FLOWISE_API_KEY`

### Error: "WhatsApp API error"

- Verificar `WHATSAPP_TOKEN` y `PHONE_NUMBER_ID`
- Comprobar que el token no haya expirado
- Verificar permisos de la app en Meta

### Messages no llegan

- Revisar logs del worker: `npm run tail`
- Verificar webhook configurado en Meta Developers
- Probar con endpoint `/test` primero

## 💰 Costos

| Componente | Costo | Límites Gratis |
|------------|-------|----------------|
| **Cloudflare Workers** | $0 | 100K requests/mes |
| **WhatsApp Business** | $0.0085/mensaje | 1K mensajes/mes gratis |
| **Flowise** | Variable | Según hosting |

### Estimación Mensual (1K mensajes)
- Workers: $0
- WhatsApp: $0 (dentro del límite)
- **Total: $0/mes** 🎉

## 🔄 Actualizaciones

```bash
# Actualizar código
git pull

# Re-deploy
npm run deploy
```

## 📞 Soporte

Si necesitas ayuda:
1. Revisar logs con `npm run tail`
2. Probar endpoint `/health` y `/test`
3. Verificar configuración en Meta Developers
4. Comprobar accesibilidad de Flowise

## 🎯 Próximas Mejoras

- [ ] Soporte para mensajes multimedia
- [ ] Rate limiting inteligente
- [ ] Métricas y analytics
- [ ] Respuestas con botones/listas
- [ ] Multiple flows por usuario
- [ ] Fallback a otros LLMs

---

¡Tu bridge WhatsApp-Flowise está listo! 🚀