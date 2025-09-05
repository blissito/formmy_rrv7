---
marp: true
theme: uncover
class: invert
paginate: true
footer: 'Claude Code para Desarrolladores - Sesión 1/3'
style: |
  section {
    font-size: 28px;
    background: linear-gradient(135deg, #000000 0%, #1A2229 100%);
  }
  h1 {
    font-size: 42px;
    color: #37ab93;
    text-shadow: 0 0 20px #37ab93;
  }
  h2 {
    font-size: 36px;
    color: #4ed8b8;
  }
  h3 {
    font-size: 32px;
    color: #6ee5c9;
  }
  code {
    background-color: #1A2229;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 24px;
    color: #37ab93;
    border: 1px solid #37ab93;
  }
  pre {
    background-color: #0f1419;
    padding: 20px;
    border-radius: 8px;
    font-size: 20px;
    border: 1px solid #37ab93;
  }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .highlight {
    background-color: #1A2229;
    padding: 10px;
    border-radius: 8px;
    border-left: 4px solid #37ab93;
    box-shadow: 0 0 15px rgba(55, 171, 147, 0.3);
  }
  .warning {
    background-color: #2a1a1a;
    padding: 10px;
    border-radius: 8px;
    border-left: 4px solid #ff6b6b;
  }
  .success {
    background-color: #1a2a1f;
    padding: 10px;
    border-radius: 8px;
    border-left: 4px solid #37ab93;
    box-shadow: 0 0 10px rgba(55, 171, 147, 0.2);
  }
  ul {
    text-align: left;
  }
  strong {
    color: #37ab93;
  }
  footer {
    color: #37ab93;
    background: linear-gradient(90deg, #000000, #1A2229);
  }
---

# 🚀 Claude Code para Proyectos Profesionales
## Sesión 1: Gestión Avanzada de Contexto

**Duración:** 2 horas
**Nivel:** Jr/Mid Developers
**Instructor:** Héctorbliss

---

## 📋 Agenda de Hoy

<div class="columns">
<div>

### Primera Hora (7:00-8:00pm)
- Prompts efectivos (30 min)
- Gestión de contexto (30 min)

</div>
<div>

### ☕ Break: 8:00-8:05pm
### Segunda Hora (8:05-9:05pm)
- Optimización de tokens (30 min)
- Casos prácticos (30 min)

</div>
</div>

---

## 🎯 Objetivos de Aprendizaje

Al finalizar esta sesión podrás:

- ✅ Escribir prompts que maximicen la efectividad de Claude
- ✅ Gestionar sesiones largas sin perder contexto
- ✅ Optimizar el uso de tokens y memoria
- ✅ Implementar técnicas para proyectos multi-día

---

# Parte 1: Prompts Efectivos
## 🎨 El Arte del Prompt Engineering

---

## 📝 Anatomía de un Prompt Efectivo

<div class="highlight">

**Estructura RICE:**
- **R**ol: Define quién es Claude
- **I**nstrucciones: Qué debe hacer
- **C**ontexto: Información relevante
- **E**jemplos: Casos de uso esperados

</div>

---

## ❌ Prompt Básico vs ✅ Prompt Efectivo

### ❌ Básico:
```
"Ayúdame a refactorizar este código"
```

### ✅ Efectivo:
```
"Actúa como un senior developer especializado en React.
Refactoriza este componente siguiendo:
- Hooks composition pattern
- TypeScript estricto
- Testing con Vitest
Contexto: Es parte de un sistema de pagos"
```

---

## 🔧 Técnica: Prompts Modulares

```bash
# Prompt base en CLAUDE.md
"Eres un experto en arquitectura serverless con AWS"

# Prompt específico de tarea
"Usando el contexto del proyecto, optimiza las funciones 
Lambda para reducir cold starts"
```

**Ventaja:** Reutilización y consistencia

---

## 💡 Ejercicio Práctico #1
### (10 minutos)

Transforma este prompt básico:
```
"Crea una API REST"
```

En uno efectivo usando RICE para:
- Sistema de inventarios
- Node.js + Express
- MongoDB
- Autenticación JWT

---

## 🎯 Solución Ejercicio #1

```markdown
# Rol
Actúa como un backend architect con experiencia en Node.js

# Instrucciones
Crea una API REST completa con:
- CRUD para productos y categorías
- Autenticación JWT con refresh tokens
- Validación con Joi/Zod
- Manejo de errores centralizado

# Contexto
- Stack: Node.js 20+, Express 4, MongoDB con Mongoose
- Patrón: Repository pattern con clean architecture
- Testing: Jest + Supertest

# Ejemplos esperados
GET /api/products?category=electronics&sort=price
POST /api/auth/refresh
```

---

# Parte 2: Gestión de Contexto
## 🧠 El Poder del Contexto Persistente

---

## 📚 CLAUDE.md: Tu Mejor Aliado

<div class="highlight">

**¿Qué es?**
- Archivo markdown en la raíz del proyecto
- Se carga automáticamente en cada sesión
- Máximo ~8000 tokens recomendado

</div>

---

## 🏗️ Estructura Óptima de CLAUDE.md

```markdown
# [Nombre del Proyecto]

## Arquitectura
- Stack técnico
- Patrones de diseño
- Estructura de carpetas

## Convenciones
- Estilo de código
- Naming conventions
- Reglas de negocio

## Contexto Actual
- Feature en desarrollo
- Decisiones técnicas
- TODOs prioritarios
```

---

## 🔄 Comando /resume: Continuidad Total

### Uso básico:
```bash
claude --resume
```

### Qué preserva:
- ✅ Historial de conversación
- ✅ Archivos modificados
- ✅ Decisiones tomadas
- ✅ Estado del proyecto

---

## 📊 Demo: Gestión Multi-Sesión

```bash
# Día 1: Iniciamos feature
$ claude "Implementa sistema de notificaciones"
# ... trabajo ...

# Día 2: Continuamos donde quedamos
$ claude --resume "Agrega tests al sistema de ayer"
# Claude recuerda TODO el contexto

# Día 3: Refinamos
$ claude --resume "Optimiza las queries N+1"
```

---

## 🎯 Estrategia: Context Layering

<div class="columns">
<div>

### Capa 1: Global
`CLAUDE.md`
- Arquitectura
- Convenciones

</div>
<div>

### Capa 2: Sesión
`--resume`
- Estado actual
- Decisiones recientes

</div>
</div>

### Capa 3: Prompt
Instrucciones específicas de la tarea actual

---

## 💡 Ejercicio Práctico #2
### (15 minutos)

Crea un CLAUDE.md para un proyecto de:
- E-commerce con Next.js
- Prisma + PostgreSQL
- Stripe para pagos
- Testing con Playwright

Incluye al menos 3 secciones clave

---

## 🎯 Solución Ejercicio #2

```markdown
# ShopNext - E-commerce Platform

## Arquitectura
- **Frontend**: Next.js 14 (App Router), TailwindCSS, Zustand
- **Backend**: API Routes, Prisma ORM, PostgreSQL
- **Pagos**: Stripe (Payment Intents API)
- **Testing**: Playwright E2E, Vitest unit tests

## Estructura de Carpetas
\`\`\`
/app
  /(shop)     → Rutas públicas
  /(admin)    → Dashboard admin
  /api        → API routes
/components
  /ui         → Componentes reutilizables
  /checkout   → Flujo de compra
/lib
  /stripe     → Integración Stripe
  /db         → Prisma client
\`\`\`

## Convenciones de Código
- **Componentes**: PascalCase, Server Components por defecto
- **API Routes**: RESTful, respuestas tipadas con Zod
- **DB Queries**: Usar transacciones para operaciones críticas
- **Error Handling**: Boundaries en cada ruta

## Estado Actual
- Feature actual: Carrito de compras con persistencia
- Pendiente: Integrar webhooks de Stripe
- Bug conocido: Race condition en actualización de stock
```

---

# ☕ Break Time
## 5 Minutos de Descanso

<div class="center">

### <span class="large-emoji">⏰</span> 8:00 - 8:05 PM

<div class="highlight">

**Aprovecha para:**
- 🚶‍♂️ Estirar las piernas
- ☕ Tomar algo
- 📱 Revisar mensajes rápidamente
- 💭 Procesar lo aprendido

</div>

### 🔄 Regresamos en 5 minutos para la segunda parte

**Próximo tema:** Optimización de Tokens y Casos Prácticos

</div>

---

# Parte 3: Optimización de Tokens
## 💰 Maximiza tu Contexto

---

## 📏 Entendiendo los Límites

<div class="columns">
<div>

### Claude 3.5 Sonnet
- **Contexto**: 200K tokens
- **Salida**: 8K tokens
- **Óptimo**: 50-100K

</div>
<div>

### ¿Cuánto es un token?
- ~4 caracteres inglés
- ~2 caracteres código
- 1 palabra ≈ 1.3 tokens

</div>
</div>

---

## 🗜️ Técnicas de Compresión

### 1. **Summarization Pattern**
```bash
# En lugar de incluir TODO el código
"El módulo de autenticación usa JWT con refresh 
tokens, middleware en /middleware/auth.js"

# En vez de 500 líneas de código
```

---

## 🎯 Técnica: Selective Context

```javascript
// ❌ NO hagas esto
"Aquí está TODO mi proyecto: [10,000 líneas]"

// ✅ Haz esto
"Trabajaremos en el módulo de pagos:
- Archivo principal: /lib/payments/stripe.ts
- Tipos: /types/payment.ts
- Tests actuales pasan excepto 'refund-flow'"
```

---

## 📊 Herramientas de Análisis

### Token Counter Script
```python
# token-counter.py
import tiktoken

def count_tokens(text, model="cl100k_base"):
    encoder = tiktoken.get_encoding(model)
    return len(encoder.encode(text))

# Uso
with open("CLAUDE.md", "r") as f:
    tokens = count_tokens(f.read())
    print(f"CLAUDE.md usa {tokens} tokens")
```

---

## 🔄 Patrón: Rolling Context Window

```markdown
# CLAUDE.md - Actualización semanal

## Contexto Histórico (Resumen)
- Semana 1: Implementamos auth y usuarios
- Semana 2: Sistema de pagos completado

## Contexto Actual (Detallado)
- Feature: Sistema de notificaciones
- Archivos clave: [lista específica]
- Decisiones: Usar WebSockets sobre SSE
```

---

## 💡 Ejercicio Práctico #3
### (10 minutos)

Tienes un componente de 500 líneas.
Crea un resumen contextual de máximo 100 palabras que:
- Preserve la funcionalidad clave
- Mencione dependencias
- Indique patrones usados

---

# Parte 4: Casos Prácticos
## 🚀 Aplicación Real

---

## 📱 Caso 1: App Mobile Multi-Semana

### Semana 1 - Setup
```bash
$ claude "Inicia app React Native con Expo, 
         autenticación y navegación"
```

### Semana 2 - Features
```bash
$ claude --resume "Agrega sistema de chat 
                   con Socket.io"
```

### Semana 3 - Optimización
```bash
$ claude --resume "Optimiza renders y 
                   agrega caching"
```

---

## 🏗️ Caso 2: Refactoring Gradual

```markdown
# CLAUDE.md
## Refactoring Plan
- [ ] Migrar de callbacks a async/await
- [x] Actualizar dependencias
- [ ] Implementar TypeScript gradual
- [ ] Agregar tests unitarios

## Archivos Migrados
- /api/users.js → ✅ async/await + TS
- /api/products.js → ⏳ en progreso
```

---

## 🛠️ Herramientas Complementarias

<div class="columns">
<div>

### VS Code Extension
- Auto-save context
- Token counter
- Resume shortcuts

</div>
<div>

### Scripts Útiles
```bash
# context-backup.sh
cp CLAUDE.md "backups/$(date +%Y%m%d).md"

# token-check.sh
wc -w CLAUDE.md | awk '{print $1 * 1.3}'
```

</div>
</div>

---

## 📈 Métricas de Éxito

### ¿Cómo saber si lo estás haciendo bien?

- ✅ Claude mantiene contexto entre sesiones
- ✅ No repites instrucciones básicas
- ✅ Tokens utilizados < 50% del límite
- ✅ Puedes retomar trabajo después de días
- ✅ Otros devs pueden continuar tu trabajo

---

## 🎯 Ejercicio Final Integrador
### (20 minutos)

**Proyecto:** Blog con CMS
1. Crea un CLAUDE.md completo
2. Escribe un prompt RICE para "implementar sistema de categorías"
3. Simula un --resume después de 3 días
4. Optimiza para < 1000 tokens total

---

## 💬 Q&A y Troubleshooting
### Problemas Comunes

<div class="warning">

**"Claude olvidó el contexto"**
- Solución: Verifica CLAUDE.md < 8K tokens

**"Resume no funciona"**
- Solución: Usa `--conversation-id` explícito

**"Tokens exceeded"**
- Solución: Implementa summarization pattern

</div>

---

## 📚 Recursos y Tarea

### Para profundizar:
- [Documentación oficial Claude Code](https://docs.anthropic.com/claude-code)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [Token Optimization Patterns](https://github.com/anthropics/prompt-eng)

### Tarea para Sesión 2:
✏️ Implementa CLAUDE.md en un proyecto real
✏️ Prueba --resume en 3 sesiones distintas
✏️ Mide reducción de tokens con las técnicas

---

## 🎉 Resumen de Hoy

<div class="success">

Aprendiste a:
- ✅ Estructurar prompts con RICE
- ✅ Gestionar contexto con CLAUDE.md
- ✅ Usar --resume para continuidad
- ✅ Optimizar tokens 3-5x
- ✅ Aplicar técnicas en casos reales

</div>

---

## 📅 Próxima Sesión

### Sesión 2: Claude SDK y Automatización Empresarial
**Jueves 21 Agosto 2025 • 7:00 PM CDMX • 2 horas**

**Contenido:**
- Claude SDK para Python y TypeScript en detalle
- Creación y configuración de subagentes especializados
- Automatización de workflows de desarrollo
- Scripting avanzado con TypeScript y Python
- Pipelines CI/CD automatizados con Claude
- Integración con herramientas de desarrollo existentes
- Casos empresariales: integración en sistemas existentes

**Prerequisito:** Tarea de esta sesión completada

---

# 🙏 ¡Gracias!

## ¿Preguntas?

**Contacto:**
- Email: hector@fixtergeek.com
- GitHub: @hectorbliss
- Twitter: @hectorbliss
- FixterGeek.com

### 🚀 Happy Coding with Claude!

