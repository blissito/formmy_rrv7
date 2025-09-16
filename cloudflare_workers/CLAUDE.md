# Cloudflare Workers - Formmy WhatsApp Bridge

## 🚀 Deploy Process

### Quick Deploy
```bash
npm run deploy
```

### Deploy with Configuration Management
```bash
# Add new endpoint configuration
npm run config:add mi-endpoint https://tu-flowise.fly.dev tu-chatflow-id

# Set active endpoint
npm run config:set mi-endpoint

# Deploy with new configuration
npm run deploy
```

### Manual Deploy Steps
```bash
# 1. Login to Cloudflare
wrangler login

# 2. Set secrets (required on first deploy)
npm run secrets:set

# 3. Deploy worker
wrangler deploy

# 4. Verify deployment
wrangler tail --env production
```

## 🔧 Configuration Management

### Available Commands
- `npm run config:add <name> <url> <chatflow>` - Add new endpoint
- `npm run config:set <name>` - Set active endpoint
- `npm run config:list` - List all endpoints
- `npm run config:remove <name>` - Remove endpoint
- `npm run secrets:set` - Deploy all secrets to Cloudflare

### Configuration File Structure
```javascript
// config.js
export const ENDPOINTS = {
  production: {
    url: "https://formmy-tasks.fly.dev",
    chatflowId: "66ec7d49-7eec-402e-8d1e-141c6a7a9b23"
  },
  backup: {
    url: "https://formmy-tasks-backup.fly.dev",
    chatflowId: "backup-chatflow-id"
  }
};

export const ACTIVE_ENDPOINT = "production";
```

## 📊 Monitoring

### Real-time Logs
```bash
# Production logs
wrangler tail --env production

# Filter logs
wrangler tail --env production --format json
```

### Log Features
- ✅ Emoji indicators for easy scanning
- ✅ Endpoint rotation tracking
- ✅ Error handling with fallback attempts
- ✅ Response time monitoring

## 🔄 Fallback System

The worker automatically tries endpoints in this order:
1. **Active endpoint** (from config.js)
2. **Backup endpoints** (all other configured endpoints)
3. **Graceful failure** with user-friendly message

## 🔐 Required Secrets

Deploy these secrets before first deployment:
```bash
OPENAI_API_KEY=your-openai-key
VERIFY_TOKEN=Pelusina69
```

## 📱 Webhook Configuration

**URL**: `https://formmy-whatsapp-bridge.fixtergeek.workers.dev/webhook`
**Verify Token**: `Pelusina69`

## 🎯 Production Status

✅ **Current Version**: `66ec7d49-7eec-402e-8d1e-141c6a7a9b23`
✅ **Active Endpoint**: `formmy-tasks.fly.dev`
✅ **Fallback System**: Enabled
✅ **Error Handling**: Graceful degradation

## 🚨 Troubleshooting

### Common Issues
1. **Timeout errors**: Check Flowise endpoint health
2. **404 responses**: Verify chatflow ID is correct
3. **Auth errors**: Regenerate and redeploy secrets

### Debug Commands
```bash
# Check worker status
wrangler dev

# Test webhook locally
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"text":{"body":"test"}}]}'
```

## 📝 Development Workflow

1. **Local testing**: `wrangler dev`
2. **Configuration changes**: `npm run config:add/set`
3. **Deploy**: `npm run deploy`
4. **Monitor**: `wrangler tail --env production`
5. **Rotate endpoints**: Update config and redeploy