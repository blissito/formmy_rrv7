# 🔧 Guía de Configuración de Endpoints

Sistema centralizado para gestionar múltiples endpoints de Flowise en tu Worker de WhatsApp.

## 🚀 Comandos Rápidos

### Ver endpoints disponibles:
```bash
npm run config:list
```

### Ver endpoint activo:
```bash
npm run config:current
```

### Cambiar endpoint activo:
```bash
npm run config:set staging
npm run config:set backup
npm run config:set production
```

### Agregar nuevo endpoint:
```bash
npm run config:add mi-endpoint https://mi-flowise.fly.dev abc123-def456
```

## 📋 Endpoints Pre-configurados

| Nombre | Descripción | Status |
|--------|-------------|--------|
| `production` | ✅ Instancia principal | **Activo por defecto** |
| `staging` | 🧪 Ambiente de pruebas | Listo para usar |
| `backup` | 🛡️ Instancia de respaldo | Listo para usar |
| `development` | 💻 Desarrollo local | Para testing local |
| `experimental` | 🔬 Nuevas funcionalidades | Para experimentos |

## 🔄 Cambiar Endpoint Fácilmente

### 1. **Ver endpoints disponibles:**
```bash
npm run config:list
```
Te mostrará algo como:
```
📋 Endpoints disponibles:

🟢 ACTIVO production
   📍 https://formmy-tasks.fly.dev
   🆔 1a7b3b45-e9b2-45ec-a2ed-f1eb293f0271
   📝 Instancia principal de producción

⚪ Disponible staging
   📍 https://formmy-staging.fly.dev
   🆔 staging-chatflow-id
   📝 Ambiente de pruebas
```

### 2. **Cambiar al endpoint que necesites:**
```bash
# Para tu nuevo endpoint:
npm run config:set staging

# O cualquier otro:
npm run config:set backup
npm run config:set experimental
```

### 3. **Aplicar cambios:**
```bash
npm run deploy
```

## ➕ Agregar tu Nuevo Endpoint

### Método 1: Comando rápido
```bash
npm run config:add mi-nuevo-endpoint https://tu-flowise.fly.dev tu-chatflow-id-aqui
```

### Método 2: Editar config.js manualmente
Edita `/config.js` y agrega en la sección `endpoints`:

```javascript
// En config.js, dentro de CONFIG.flowise.endpoints:
mi_endpoint: {
  url: 'https://tu-flowise.fly.dev',
  chatflowId: 'tu-chatflow-id-aqui',
  apiKey: true,
  name: 'Mi Endpoint Personalizado',
  description: 'Descripción de tu endpoint'
}
```

## 🎯 Ejemplo de Flujo de Trabajo

### **Escenario: Quieres probar un nuevo endpoint**

```bash
# 1. Agregar tu endpoint
npm run config:add testing https://nuevo-flowise.fly.dev abc123-def456

# 2. Cambiarlo como activo
npm run config:set testing

# 3. Deployar
npm run deploy

# 4. Probar con mensajes de WhatsApp

# 5. Si funciona bien, dejarlo. Si no, regresar:
npm run config:set production
npm run deploy
```

## 🔧 Configuración Avanzada

### **Fallback Automático**
Si tu endpoint principal falla, el sistema automáticamente intentará con endpoints de respaldo en este orden:
1. `backup`
2. `staging`

### **Personalizar comportamiento**
En `config.js` puedes modificar:

```javascript
behavior: {
  timeout: 30000,              // Timeout en ms
  retries: 3,                  // Reintentos
  enableFallback: true,        // Habilitar fallback
  fallbackOrder: ['backup', 'staging']  // Orden de fallback
}
```

### **Logs detallados**
Para ver logs más detallados:
```javascript
behavior: {
  enableDetailedLogs: true
}
```

## 📊 Monitoreo

### **Ver logs en tiempo real:**
```bash
npm run tail
```

### **Logs que verás:**
```
🔗 Calling Flowise [production]: Formmy Tasks - Producción
📍 URL: https://formmy-tasks.fly.dev/api/v1/prediction/abc123
⏱️ Response time: 1250ms
✅ Flowise response: {...}
```

## 🚨 Troubleshooting

### **Error: Endpoint no encontrado**
```bash
npm run config:list  # Ver endpoints disponibles
npm run config:set production  # Regresar a producción
```

### **Error de timeout**
Aumenta el timeout en `config.js`:
```javascript
behavior: {
  timeout: 60000  // 60 segundos
}
```

### **Endpoint no responde**
El sistema automáticamente intentará fallbacks. Para forzar un endpoint específico:
```bash
npm run config:set backup
npm run deploy
```

## 🎉 ¡Listo!

Ahora puedes cambiar endpoints fácilmente para:
- ✅ Testing de nuevas instancias
- ✅ Rotación por mantenimiento
- ✅ Fallback automático
- ✅ Desarrollo y staging

**¡Solo edita `config.js`, ejecuta un comando, y deploy!** 🚀