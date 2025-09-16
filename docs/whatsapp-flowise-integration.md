# WhatsApp Business + Flowise Integration - Arquitectura MVP

## 🎯 Solución Minimalista Viable

### Arquitectura Propuesta

```
WhatsApp Business → Webhook Bridge → Flowise API → LlamaIndex Agent
```

## 1. Microservicio Webhook Bridge (Node.js)

```javascript
// server.js - Microservicio puente WhatsApp → Flowise
const express = require('express');
const axios = require('axios');
const app = express();

// Configuración Flowise
const FLOWISE_URL = process.env.FLOWISE_URL || 'http://localhost:3000';
const FLOWISE_CHATFLOW_ID = process.env.FLOWISE_CHATFLOW_ID;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

// WhatsApp Business API webhook
app.post('/webhook/whatsapp', async (req, res) => {
  const { entry } = req.body;

  if (entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const message = entry[0].changes[0].value.messages[0];
    const from = message.from;
    const text = message.text?.body;

    if (text) {
      // Llamar a Flowise Prediction API
      const flowiseResponse = await axios.post(
        `${FLOWISE_URL}/api/v1/prediction/${FLOWISE_CHATFLOW_ID}`,
        {
          question: text,
          overrideConfig: {
            sessionId: from // Usar número como session ID
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${FLOWISE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Enviar respuesta a WhatsApp
      await sendWhatsAppMessage(from, flowiseResponse.data.text);
    }
  }

  res.sendStatus(200);
});

// Verificación de webhook (requerido por WhatsApp)
app.get('/webhook/whatsapp', (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;

  if (req.query['hub.verify_token'] === verify_token) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

async function sendWhatsAppMessage(to, text) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: text }
    },
    {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

app.listen(3001, () => {
  console.log('WhatsApp-Flowise bridge running on port 3001');
});
```

## 2. Configuración en Flowise

### Agentflow V2 con LlamaIndex

1. **Crear un Agentflow** con:
   - LLM Node (GPT-5-nano o Claude)
   - Memory Node (Buffer Memory con sessionId)
   - Tool Nodes (según necesidades)
   - System Prompt personalizado

2. **Habilitar API** en el flow:
   - Activar "Allow API Access"
   - Generar API Key si es necesario
   - Copiar el Chatflow ID

## 3. Deployment con Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  flowise:
    image: flowiseai/flowise:latest
    ports:
      - "3000:3000"
    volumes:
      - flowise_data:/root/.flowise
    environment:
      - FLOWISE_USERNAME=admin
      - FLOWISE_PASSWORD=admin
      - DATABASE_PATH=/root/.flowise
      - APIKEY_PATH=/root/.flowise
      - SECRETKEY_PATH=/root/.flowise
      - LOG_LEVEL=info
      - DEBUG=false
      - DATABASE_TYPE=sqlite
      - DATABASE_PORT=
      - DATABASE_HOST=
      - DATABASE_NAME=
      - DATABASE_USER=
      - DATABASE_PASSWORD=
      - DATABASE_SSL=false
      - DATABASE_SSL_KEY_BASE64=
    command: npx flowise start
    networks:
      - flowise-network

  whatsapp-bridge:
    build: ./whatsapp-bridge
    ports:
      - "3001:3001"
    environment:
      - FLOWISE_URL=http://flowise:3000
      - FLOWISE_CHATFLOW_ID=${FLOWISE_CHATFLOW_ID}
      - FLOWISE_API_KEY=${FLOWISE_API_KEY}
      - WHATSAPP_TOKEN=${WHATSAPP_TOKEN}
      - PHONE_NUMBER_ID=${PHONE_NUMBER_ID}
      - VERIFY_TOKEN=${VERIFY_TOKEN}
    depends_on:
      - flowise
    networks:
      - flowise-network

volumes:
  flowise_data:

networks:
  flowise-network:
    driver: bridge
```

## 4. Alternativa con Baileys (Sin API Oficial)

```javascript
// baileys-bridge.js - Para desarrollo/testing sin API oficial
const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];

    if (!message.key.fromMe && message.message) {
      const text = message.message.conversation ||
                   message.message.extendedTextMessage?.text;

      if (text) {
        // Llamar a Flowise
        const response = await callFlowise(text, message.key.remoteJid);

        // Responder en WhatsApp
        await sock.sendMessage(message.key.remoteJid, {
          text: response
        });
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

async function callFlowise(text, sessionId) {
  const response = await axios.post(
    `${FLOWISE_URL}/api/v1/prediction/${FLOWISE_CHATFLOW_ID}`,
    {
      question: text,
      overrideConfig: { sessionId }
    },
    {
      headers: {
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      }
    }
  );

  return response.data.text;
}
```

## 5. Deploy en Fly.io

```toml
# fly.toml
app = "whatsapp-flowise-bridge"
primary_region = "mia"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[env]
  PORT = "3001"

[[services]]
  protocol = "tcp"
  internal_port = 3001

  [[services.ports]]
    port = 443
    handlers = ["http"]

  [[services.ports]]
    port = 80
    handlers = ["tls", "http"]
```

```dockerfile
# Dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

## 6. Configuración WhatsApp Business

1. **Crear App en Meta for Developers**
2. **Agregar producto WhatsApp**
3. **Configurar webhook**:
   - URL: `https://your-app.fly.dev/webhook/whatsapp`
   - Verify Token: Tu token secreto
   - Suscribir a eventos: `messages`

## 7. Variables de Entorno Necesarias

```bash
# .env
# Flowise
FLOWISE_URL=http://localhost:3000
FLOWISE_CHATFLOW_ID=abc123-def456
FLOWISE_API_KEY=your-flowise-api-key

# WhatsApp Business API
WHATSAPP_TOKEN=your-whatsapp-token
PHONE_NUMBER_ID=your-phone-number-id
VERIFY_TOKEN=your-verify-token

# Para Baileys (alternativa)
USE_BAILEYS=false
```

## 8. Limitaciones Conocidas

### Flowise
- No recibe webhooks nativamente, necesita bridge
- API de predicción es síncrona (no streaming para WhatsApp)
- Session management básico vía overrideConfig

### WhatsApp Business API
- Requiere aprobación de Meta para producción
- Límites de rate (1000 mensajes/día en desarrollo)
- Template messages obligatorios para mensajes iniciados por bot

### Baileys (Alternativa)
- No oficial, puede dejar de funcionar
- Requiere escanear QR code
- No recomendado para producción

## 9. Mejoras Futuras

1. **Rate Limiting**: Implementar control de flujo
2. **Queue System**: Redis/Bull para manejo asíncrono
3. **Multi-tenant**: Soporte para múltiples números/flows
4. **Rich Messages**: Botones, listas, imágenes
5. **Analytics**: Tracking de conversaciones
6. **Error Handling**: Retry logic y fallbacks

## 10. Costo Estimado

- **Flowise**: Self-hosted gratis o $35/mes cloud
- **WhatsApp Business**: $0.0085 USD por mensaje (México)
- **Fly.io**: ~$5/mes para microservicio
- **Total MVP**: ~$40/mes + costos por mensaje

## Conclusión

Esta arquitectura permite conectar WhatsApp Business con Flowise de manera efectiva mediante un microservicio puente. Flowise NO recibe webhooks directamente, pero su API de predicción es perfecta para procesar mensajes y devolver respuestas con agentes LlamaIndex.

El approach más viable para un demo es:
1. Usar Baileys para desarrollo/testing rápido
2. Migrar a WhatsApp Business API para producción
3. Deploy del bridge en Fly.io o similar
4. Flowise self-hosted o cloud según necesidades