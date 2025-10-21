# 🔍 Monitoreo en Tiempo Real - WhatsApp OAuth2

## ✅ App Secret Verificado

El App Secret **SÍ corresponde** al App ID `1128273322061107` ✅

```
App Name: Formmy
App ID: 1128273322061107  ✅
App Secret: c49cf42e3c45c64f818b70d09daa4c63  ✅ CORRECTO
```

## 📊 Próximo Paso: Monitorear Logs en Tiempo Real

Ya que el App Secret es correcto, necesitamos ver exactamente qué error está devolviendo Meta.

### Opción 1: Producción (Fly.io)

En una terminal, ejecuta:

```bash
fly logs | grep -i "embedded signup\|token exchange\|❌"
```

### Opción 2: Desarrollo Local

1. **Terminal 1** - Ejecutar servidor:
```bash
npm run dev
```

2. **Terminal 2** - Monitorear logs:
```bash
# Ver todos los logs relacionados
tail -f /dev/null  # O simplemente observar la Terminal 1
```

3. **Browser** - Probar conexión:
- Abrir: http://localhost:3000/dashboard/codigo
- Abrir DevTools Console (CMD+Option+I)
- Click en "Connect WhatsApp"
- Observar logs en:
  - **Browser Console** (frontend)
  - **Terminal** (backend)

## 🎯 Logs Esperados

### Si TODO está bien:

**Browser Console:**
```
✅ [Modal] Inicializando Facebook SDK con App ID: 1128273322061107
🚀 [Modal] Iniciando Facebook Login for Business
   App ID: 1128273322061107
   Config ID: No configurado (opcional)
   Chatbot ID: abc123

📥 [Modal] Facebook Login Response recibido:
   Status: connected
   Code: AQA...

🚀 [Modal] Iniciando proceso de conexión WhatsApp...
📞 [Modal] PASO 1: Intercambiando código por tokens con Meta...
✅ [Modal] PASO 1 COMPLETADO - Tokens obtenidos de Meta
🎉 [Modal] PROCESO COMPLETO - Actualizando UI...
```

**Server Logs:**
```
📊 [Embedded Signup] Parámetros recibidos del cliente:
   chatbotId: abc123
   code: AQA...
   userID: N/A
   status: connected

🔄 [Embedded Signup] Iniciando intercambio de código por token...
📋 [Embedded Signup] Client ID (App ID): 1128273322061107
🔐 [Embedded Signup] Code recibido: AQA...

✅ [Embedded Signup] Token de larga duración obtenido exitosamente

✅✅✅✅✅✅✅...
✅ [Embedded Signup] PROCESO COMPLETADO EXITOSAMENTE
✅✅✅✅✅✅✅...
```

### Si hay ERROR en token exchange:

**Server Logs:**
```
❌❌❌❌❌❌❌...
❌ [Embedded Signup] Token exchange FAILED
   HTTP Status: 400 Bad Request
   Client ID usado: 1128273322061107
   Code usado: AQA...
   Response de Meta:
   Error Type: OAuthException
   Error Code: 100
   Error Message: [EL MENSAJE EXACTO DEL ERROR]
   Error Subcode: [SI HAY]
   Fbtrace ID: AqWS7x...
❌❌❌❌❌❌❌...
```

## 🔍 Debugging Step by Step

### Paso 1: Verificar Config ID

¿Tienes `VITE_FACEBOOK_CONFIG_ID` configurado en `.env`?

```bash
# Ver valor actual
echo $VITE_FACEBOOK_CONFIG_ID

# Si no está configurado (opcional)
# El flujo funcionará sin config_id
```

### Paso 2: Verificar Scopes

Los scopes solicitados son:
```javascript
scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management'
```

¿Estos scopes están **aprobados** en tu Facebook App?
- Ir a: https://developers.facebook.com/apps/1128273322061107/
- Verificar: "Permissions & Features"

### Paso 3: Verificar App Mode

¿El App está en **Development Mode** o **Live Mode**?
- Development Mode: Solo puede ser usado por testers/admins del App
- Live Mode: Requiere App Review por Meta

### Paso 4: Verificar Webhook Configuration

```bash
# .env debe tener:
PHONE_NUMBER_ID=699799846554182
# Business Account se obtiene del token exchange
```

### Paso 5: Intentar Conexión y Capturar Error

**Browser (DevTools Console):**
- Copiar TODO el output
- Especialmente buscar el error de `exchangeResponse`

**Server:**
- Copiar el bloque completo de `❌ Token exchange FAILED`
- El `fbtrace_id` es crítico para reportar a Meta Support

## 🆘 Errores Comunes y Soluciones

### Error: "Invalid OAuth code"
**Causa**: El código expiró (10 minutos)
**Solución**: Reintentar el flujo

### Error: "Permissions not granted"
**Causa**: Los scopes no están aprobados
**Solución**: Verificar en App Dashboard > Permissions & Features

### Error: "App is in Development Mode"
**Causa**: Solo admins/testers pueden usar el App
**Solución**:
- Opción 1: Agregar usuarios como testers
- Opción 2: Solicitar App Review a Meta

### Error: "redirect_uri mismatch"
**Causa**: El redirect_uri no está registrado
**Nota**: Ya removimos el redirect_uri, este error NO debería aparecer

## 📝 Información para Reportar

Si el error persiste, necesitaré estos datos:

1. **Logs completos del browser console** (todo el bloque desde "🚀 Iniciando" hasta el error)
2. **Logs completos del server** (el bloque de ❌ Token exchange FAILED)
3. **fbtrace_id** del error de Meta (si aparece)
4. **Error Type, Code, Message** exactos

Con esa información podré diagnosticar el problema exacto.

---

## 🎬 Instrucciones para Testing

1. **Ejecutar en desarrollo local:**
   ```bash
   npm run dev
   ```

2. **En otra terminal, estar listo para capturar logs**

3. **Abrir browser:**
   ```
   http://localhost:3000/dashboard/codigo
   ```

4. **Abrir DevTools Console** (CMD+Option+I)

5. **Click en** "Connect WhatsApp"

6. **Autorizar** en el popup de Facebook

7. **Capturar TODOS los logs** del browser y server

8. **Compartirme los logs** para analizar el error exacto
