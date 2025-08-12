# Chatbot SEO - Micro Spec

## Objetivo
Hacer que los chatbots de Formmy sean descubribles en Google, usando Ghosty como interfaz para todas las features SEO.

---

## MVP - Features Esenciales

### 1. Query Tracking (2 días)
**Qué**: Guardar todas las preguntas que hacen usuarios al chatbot  
**Por qué**: Entender qué busca la gente  
**Cómo**: 
```typescript
// Nuevo modelo en Prisma
model ChatbotQuery {
  id        String @id
  chatbotId String
  query     String
  count     Int
  lastAsked DateTime
}

// En Ghosty
User: "qué preguntan más?"
Ghosty: "Top 10 preguntas esta semana:
1. ¿Cómo devolver un producto? (234 veces)
2. ¿Cuánto tarda el envío? (189 veces)..."
```

### 2. Meta Tags con AI (1 día)
**Qué**: Auto-generar title y description SEO  
**Por qué**: Google necesita entender de qué trata el chatbot  
**Cómo**:
```typescript
// Comando en Ghosty
User: "/optimizar meta"
Ghosty: "Generando meta tags optimizados..."
// Llama a OpenAI/Gemini con contexto del chatbot
// Muestra preview → Usuario aprueba → Se guarda
```

### 3. Google Search Console (3 días)
**Qué**: Ver métricas reales de Google  
**Por qué**: Saber si el chatbot aparece en búsquedas  
**Cómo**:
```typescript
// OAuth flow simple
User: "/conectar google"
// Después de conectar:
User: "/metricas seo"
Ghosty: "Esta semana:
- Apareciste 1,234 veces en Google
- 89 personas hicieron click
- Posición promedio: #12"
```

### 4. Respuestas SEO-Optimizadas (2 días)
**Qué**: Expandir respuestas cortas para mejor SEO  
**Por qué**: Google prefiere contenido sustancial (150+ palabras)  
**Cómo**:
```typescript
// Ghosty detecta respuestas < 50 palabras
Ghosty: "5 respuestas son muy cortas para SEO. ¿Las mejoro?"
User: "Sí"
// AI expande cada respuesta manteniendo el tono
```

### 5. Content Gaps (2 días)
**Qué**: Detectar preguntas sin buena respuesta  
**Por qué**: Oportunidades perdidas de tráfico  
**Cómo**:
```typescript
// Cuando chatbot usa fallback o da respuesta genérica
logContentGap(query)

// En Ghosty
Ghosty: "8 personas preguntaron sobre 'garantía' pero no tienes respuesta"
User: "crear respuesta"
// AI genera respuesta basada en contexto
```

### 6. SEO Score Simple (1 día)
**Qué**: Un número 0-100 que resume la salud SEO  
**Por qué**: Métrica simple para tracking  
**Cómo**:
```typescript
score = 0
if (hasMetaTags) score += 25
if (avgResponseLength > 100) score += 25  
if (gscConnected) score += 25
if (contentGapRate < 10%) score += 25

// En Ghosty
Ghosty: "Tu SEO Score: 75/100 ⬆️ +5 desde la semana pasada"
```

---

## Implementación Progresiva

### Semana 1
- Query tracking básico
- Meta tags con AI
- Comandos básicos en Ghosty

### Semana 2
- Conectar Google Search Console
- Mostrar métricas en Ghosty
- Optimización de respuestas

### Semana 3
- Detectar content gaps
- SEO Score
- Testing y pulido

---

## Stack Técnico

```typescript
// Prisma models necesarios
model ChatbotSEO {
  id              String @id
  chatbotId       String @unique
  metaTitle       String?
  metaDescription String?
  seoScore        Int @default(0)
  gscConnected    Boolean @default(false)
}

model ChatbotQuery {
  id        String @id
  chatbotId String
  query     String
  count     Int @default(1)
}

// API endpoints
POST /api/chatbot/:id/seo/analyze    // Analizar SEO
POST /api/chatbot/:id/seo/optimize   // Optimizar respuestas
GET  /api/chatbot/:id/seo/queries    // Top queries
POST /api/chatbot/:id/seo/gsc        // Conectar GSC
```

---

## Ghosty Commands

```typescript
const seoCommands = {
  "que preguntan": showTopQueries,
  "metricas seo": showSEOMetrics,
  "optimizar meta": generateMetaTags,
  "optimizar respuestas": expandShortResponses,
  "conectar google": connectGSC,
  "seo score": showSEOScore,
  "content gaps": showMissingContent
}
```

---

## Métricas de Éxito

- **Adoption**: 50% de usuarios activan al menos 1 feature SEO
- **Engagement**: Usuarios chequean SEO 1x/semana via Ghosty  
- **Impact**: +30% tráfico orgánico en chatbots optimizados
- **Simplicidad**: Setup completo en <5 minutos

---

## No-Goals (por ahora)

- ❌ Dashboard dedicado de SEO
- ❌ Análisis competitivo complejo
- ❌ Schema markup avanzado
- ❌ Multi-idioma
- ❌ A/B testing automático

---

## Próximos Pasos

1. **Hoy**: Implementar query tracking
2. **Mañana**: Añadir comando en Ghosty para ver top queries
3. **Día 3**: Meta tags con AI
4. **Semana 2**: GSC integration