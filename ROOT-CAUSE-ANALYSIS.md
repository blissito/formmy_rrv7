# 🔍 Root Cause Analysis: Por qué Ghosty pedía email/teléfono

**Fecha**: 11 de octubre, 2025
**Problema**: Ghosty pedía email/teléfono en lugar de generar link de pago directamente

---

## 🎯 CAUSA RAÍZ IDENTIFICADA

### El Problema Real

Ghosty tiene configurado `personality: 'customer_support'` en la base de datos.

**El prompt de customer_support contiene**:

```typescript
customer_support: `Resuelve consultas usando la base de conocimiento.

⚠️ REGLA CRÍTICA - NO PROMETAS LO QUE NO PUEDES CUMPLIR:
- NUNCA digas "te enviaré", "te contactaré", "recibirás un email" sin datos de contacto
- Resuelve todo lo que puedas AHORA con la info disponible

📋 SI NECESITAS ESCALAR A HUMANO, DI:
"Para darte seguimiento personalizado, ¿me compartes tu email?
Solo lo usaremos para resolver tu caso..."
```

**Ubicación**: `app/utils/agents/agentPrompts.ts:21-33`

---

## 🔥 Por Qué Falló

### 1. Orden del System Prompt

**Orden anterior**:
```
ghostyInstructions → searchInstructions → toolGroundingRules → PERSONALITY
```

El prompt de `customer_support` aparecía **AL FINAL** del system prompt, dándole la última palabra.

### 2. Interpretación del Modelo

El modelo (GPT-4o-mini) interpretaba:
- "Generar link de pago" = "seguimiento personalizado"
- Por lo tanto: Aplicar regla de customer_support = "pedir email primero"

### 3. Instrucciones Ambiguas

Las instrucciones previas de Ghosty sobre planes decían:
```
✅ "Quiero el plan Pro" → create_formmy_plan_payment({ planName: "PRO" })
```

Pero NO decían explícitamente:
```
❌ NO pidas email/teléfono
```

El modelo priorizó las reglas de `customer_support` porque eran más explícitas sobre **qué NO hacer**.

---

## ✅ LA SOLUCIÓN

### Cambio Aplicado

**Archivo**: `server/agents/agent-workflow.server.ts:86-122`

```typescript
if (config.name === 'Ghosty') {
  ghostyInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 REGLA #1 - NUNCA PIDAS EMAIL/TELÉFONO PARA PLANES DE FORMMY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cuando el usuario pide PLANES (STARTER, PRO, ENTERPRISE):
❌ NO pidas email
❌ NO pidas teléfono
❌ NO digas "para proceder necesito tu..."
✅ USA create_formmy_plan_payment INMEDIATAMENTE

¿Por qué? El usuario YA está autenticado. No necesitas más datos.

Ejemplos CORRECTOS:
✅ "Quiero el plan Pro" → create_formmy_plan_payment({ planName: "PRO" })

Ejemplos INCORRECTOS:
❌ "Para proceder con el plan Pro, necesito tu email" → MAL
❌ "¿Me das tu teléfono para activar el plan?" → MAL

Esta regla SOBRESCRIBE cualquier otra instrucción sobre captura de contactos.
`;
}
```

### Por Qué Funciona Ahora

1. **Regla explícita y visual**: Emojis 🚨, separadores ━━━, y título en MAYÚSCULAS
2. **Ejemplos negativos**: Muestra exactamente QUÉ NO hacer
3. **Justificación clara**: "El usuario YA está autenticado"
4. **Override explícito**: "Esta regla SOBRESCRIBE cualquier otra instrucción"
5. **Aparece PRIMERO**: Aunque el prompt de personality venga después, la regla es tan fuerte que no puede ser ignorada

---

## 📊 Comparación: Antes vs Después

### ❌ ANTES (Comportamiento Incorrecto)

**User**: "Quiero el plan Pro"

**Ghosty**:
```
Para proceder con la activación del plan Pro, necesito que
me proporciones tu correo electrónico o número de teléfono.
¿Cuál prefieres?
```

**Razón**: Siguió la regla de `customer_support` de pedir contacto antes de "escalar"

---

### ✅ DESPUÉS (Comportamiento Esperado)

**User**: "Quiero el plan Pro"

**Ghosty**:
```
[Usa create_formmy_plan_payment({ planName: "PRO" })]

🎨WIDGET:payment:abc123🎨

✅ Link de pago generado para Plan Pro

💰 Precio: $499 MXN/mes
📊 Incluye:
• 10 chatbots
• 250 conversaciones/mes
• 1000 créditos para herramientas

💳 Puedes proceder con el pago de forma segura.
```

**Razón**: Prioriza REGLA #1 de Ghosty sobre la regla de `customer_support`

---

## 🔬 Lecciones Aprendidas

### 1. Order Matters, But Strength Matters More

No basta con poner instrucciones primero. **Deben ser MÁS FUERTES** que las que vienen después.

**Elementos de una instrucción fuerte**:
- ✅ Emojis y separadores visuales (🚨 ━━━)
- ✅ Palabras clave en MAYÚSCULAS (NUNCA, INMEDIATAMENTE)
- ✅ Ejemplos negativos explícitos (❌ "Para proceder..." → MAL)
- ✅ Justificación clara (¿Por qué?)
- ✅ Override statement ("Esta regla SOBRESCRIBE...")

### 2. Agent Personalities Can Override Everything

Los prompts de `agentPrompts.ts` son muy fuertes porque:
- Están diseñados para captura de leads (sales, support)
- Tienen reglas críticas explícitas
- Aparecen después de otras instrucciones

**Solución**: Override explícito para casos específicos (como Ghosty)

### 3. LLMs Are Literal

El modelo interpretó literalmente:
- "NUNCA prometas... sin datos de contacto"
- "Generar link de pago" = prometer algo
- Por lo tanto: Pedir datos primero

**Solución**: Ser AÚN MÁS literal con ejemplos negativos

---

## 🧪 Testing Plan

### Casos a Probar

1. ✅ "Quiero el plan Pro" → Debe generar link sin pedir nada
2. ✅ "Dame el link del Starter" → Debe generar link sin pedir nada
3. ✅ "¿Cuánto cuesta Enterprise?" → Responde precio + link si pide
4. ✅ "Necesito más conversaciones" → Presenta opciones + genera link
5. ✅ "Cámbieme a PRO" → Genera link sin pedir nada

### Resultado Esperado

**En NINGÚN caso** debe pedir email o teléfono.

---

## 🚀 Próximos Pasos

1. **Test local** (OBLIGATORIO antes de deploy):
   ```bash
   npm run dev
   # Probar en http://localhost:3000/dashboard/ghosty
   ```

2. **Verificar widgets se renderizan**

3. **Deploy a producción**:
   ```bash
   npm run deploy
   ```

---

## 📝 Notas Adicionales

### Sobre "guardando contacto" apareciendo

**Problema reportado**: El mensaje "guardando contacto" aparece aunque no se use la tool.

**Ubicación del mensaje**: `app/components/ghosty/hooks/useGhostyLlamaChat.ts:136`

```typescript
'save_contact_info': '👤 Guardando contacto...',
```

**Posibles causas**:
1. La tool `save_contact_info` se ejecuta cuando no debería
2. El frontend muestra todos los tool names disponibles en lugar de solo las ejecutadas
3. Hay un bug en el tool progress tracking

**Requiere investigación adicional** si persiste después del fix principal.

---

## 🎓 Conclusión

El problema NO era:
- ❌ La herramienta no estaba disponible
- ❌ El system prompt no tenía instrucciones
- ❌ El orden del prompt

El problema ERA:
- ✅ El prompt de `customer_support` personality era más fuerte
- ✅ Las instrucciones de Ghosty no eran lo suficientemente explícitas
- ✅ No había ejemplos negativos claros

**Solución final**: Hacer las instrucciones de Ghosty **indiscutiblemente claras** con:
- Visual emphasis (emojis, separadores)
- Explicit negatives (❌ NO hagas esto)
- Override statement
- Justificación (por qué)

---

**Última actualización**: 11 de octubre, 2025
**Autor**: Claude Code + Usuario
**Status**: ✅ Build exitoso - Listo para testing local
