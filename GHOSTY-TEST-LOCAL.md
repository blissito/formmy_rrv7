# 🧪 Ghosty - Test Local (Paso a Paso)

**Fecha**: 11 de octubre, 2025
**Problema**: Ghosty no genera widget de pago en localhost
**Solución**: Reiniciar servidor + validar cambios

---

## ✅ **PASO 1: Verificar Configuración de Tools**

```bash
npx tsx scripts/debug-ghosty-tools.ts
```

**Resultado esperado**:
```
✅ create_formmy_plan_payment: DISPONIBLE
✅ Tools prohibidas: NINGUNA (correcto)
✅ Tools esperadas: TODAS PRESENTES
```

Si ves esto → **Tools configuradas correctamente** ✅

---

## 🔄 **PASO 2: Reiniciar Servidor Dev**

**IMPORTANTE**: Los cambios al system prompt NO se aplican automáticamente.

```bash
# 1. Detener el servidor (Ctrl+C en la terminal donde corre npm run dev)

# 2. Limpiar caché si es necesario
rm -rf .react-router build

# 3. Reiniciar servidor
npm run dev
```

**Espera a que aparezca**:
```
➜  Local:   http://localhost:3000/
```

---

## 🧪 **PASO 3: Test Automatizado Contra Localhost**

Abre **OTRA terminal** (dejando el servidor corriendo) y ejecuta:

```bash
npx tsx scripts/test-localhost-ghosty.ts
```

O con un mensaje custom:

```bash
npx tsx scripts/test-localhost-ghosty.ts "Dame el link para pagar Starter"
```

**Qué hace este script**:
1. Se conecta a `http://localhost:3000/api/ghosty/v0`
2. Envía el mensaje como si fuera el usuario
3. Captura TODOS los eventos SSE
4. Muestra qué tools se ejecutan
5. Detecta si se genera el widget
6. Da diagnóstico preciso del problema

---

## 📊 **PASO 4: Interpretar Resultados**

### ✅ **Resultado Exitoso**

```
🎯 VERIFICACIONES:
✅ create_formmy_plan_payment: EJECUTADA
✅ Tools prohibidas: NO ejecutadas
✅ Widget generado: payment:abc123xyz

📋 DIAGNÓSTICO:
🎉 ¡TODO FUNCIONA CORRECTAMENTE!
```

→ **El widget SÍ se genera**. Si no lo ves en el navegador, el problema es en el frontend.

---

### ⚠️ **Posible Resultado: Stripe No Configurado**

```
🎯 VERIFICACIONES:
✅ create_formmy_plan_payment: EJECUTADA
✅ Tools prohibidas: NO ejecutadas
⚠️  Tool ejecutada pero NO se detectó widget

📋 DIAGNÓSTICO:
⚠️  POSIBLE PROBLEMA: Stripe no configurado
```

**Solución**:
1. Verifica que `.env` tiene `STRIPE_SECRET_KEY`
2. Si no tienes Stripe test key, usa:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
3. Reinicia el servidor

---

### ❌ **Resultado Incorrecto: Tools Prohibidas Ejecutadas**

```
🎯 VERIFICACIONES:
❌ create_formmy_plan_payment: NO EJECUTADA
❌ Tools prohibidas ejecutadas: get_current_datetime, save_contact_info

📋 DIAGNÓSTICO:
❌ PROBLEMA: Ghosty ejecuta tools incorrectas
   El servidor dev NO tiene los cambios recientes
```

**Solución**:
```bash
# Detener servidor (Ctrl+C)

# Limpiar completamente
rm -rf .react-router build node_modules/.vite

# Reinstalar y reiniciar
npm install
npm run dev
```

---

### ❌ **Resultado Incorrecto: Ninguna Tool Ejecutada**

```
🎯 VERIFICACIONES:
❌ create_formmy_plan_payment: NO EJECUTADA
📋 Tools ejecutadas: ninguna

💬 Respuesta: "He ejecutado las herramientas solicitadas correctamente."
```

**Diagnóstico**: El modelo AI está mintiendo (responde sin ejecutar tools).

**Causas posibles**:
1. System prompt NO se está aplicando → Verificar logs del servidor
2. Modelo incorrecto → Debería ser `gpt-4o-mini`
3. Temperature muy alta → Debería ser `1.0`

**Solución**:
```bash
# Ver logs del servidor mientras envías mensaje
# Buscar en logs: "System prompt: ━━━━━━━━━━━━"

# Si NO aparece el prompt de Ghosty optimizado:
# → El código NO se aplicó correctamente
```

---

## 🖥️ **PASO 5: Test Manual en Navegador**

1. Abre `http://localhost:3000/dashboard/ghosty`
2. Escribe: **"Quiero el plan Pro"**
3. **Abre DevTools** (F12) → Tab Network → Filtra por "ghosty"
4. Observa el request/response en tiempo real

**En DevTools deberías ver**:
```json
data: {"type":"tool-start","tool":"create_formmy_plan_payment"}
data: {"type":"widget","widgetType":"payment","widgetId":"abc123"}
data: {"type":"chunk","content":"✅ Link de pago generado..."}
```

---

## 🔍 **PASO 6: Si TODAVÍA No Funciona**

### Verificar System Prompt en Logs

Busca en los logs del servidor dev:

```
🎯 [createSingleAgent] CONFIGURANDO AGENTE
   System prompt: ━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TU TAREA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eres Ghosty, asistente de Formmy.

🚨 REGLA #1 - LINKS DE PAGO (MÁXIMA PRIORIDAD)
```

Si ves este prompt → **Cambios aplicados correctamente** ✅

Si NO lo ves o ves un prompt diferente → **Servidor NO recargó los cambios** ❌

### Forzar Rebuild Completo

```bash
# Detener servidor
# Terminal 1:
Ctrl+C

# Limpieza total
rm -rf .react-router build node_modules/.vite .cache

# Build completo
npm run build

# Reiniciar dev
npm run dev
```

---

## 📋 **Checklist Final**

Antes de decir "no funciona":

- [ ] Ejecuté `npx tsx scripts/debug-ghosty-tools.ts` → Tools correctas
- [ ] Reinicié el servidor dev (Ctrl+C + npm run dev)
- [ ] Esperé a que el servidor termine de cargar
- [ ] Ejecuté `npx tsx scripts/test-localhost-ghosty.ts`
- [ ] Vi el resultado del test automatizado
- [ ] El test mostró `create_formmy_plan_payment: EJECUTADA`
- [ ] Verifiqué en DevTools del navegador
- [ ] Busqué en logs del servidor el system prompt de Ghosty

---

## 🆘 **Si Nada de Esto Funciona**

Entonces el problema NO es el código, es el setup local:

1. **Versión de Node**: `node -v` → Debe ser v18+
2. **Puerto ocupado**: Algo más está en puerto 3000
3. **Base de datos**: MongoDB no conectado
4. **Variables de entorno**: `.env` corrupto

**Prueba en producción** (después de commit) para confirmar que el código funciona.

---

## 🚀 **Deploy a Producción**

Solo después de que el test local pase:

```bash
# Build y typecheck
npm run build
npm run typecheck

# Commit
git add .
git commit -m "fix(ghosty): optimize prompt and remove unnecessary tools"

# Deploy
npm run deploy
```

---

**Última actualización**: 11 de octubre, 2025
**Scripts creados**:
- `scripts/debug-ghosty-tools.ts` - Verifica configuración de tools
- `scripts/test-localhost-ghosty.ts` - Test automatizado contra localhost
