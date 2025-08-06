# Plan de Sistema de Métricas para Ghosty

## 🎯 Objetivo
Implementar sistema completo de tracking y métricas para que Ghosty pueda analizar y optimizar Formmys y Chatbots con datos reales.

## 📊 Métricas a Trackear

### **Chatbots**
- Mensajes enviados/recibidos por bot
- Respuestas fallidas (sin match)
- Tiempo promedio de respuesta
- Horarios de mayor actividad
- Palabras clave más consultadas
- Conversaciones abandonadas
- Rate de resolución exitosa

### **Formmys**
- Visitas totales por form
- Tasa de completación
- Abandono por campo específico
- Tiempo promedio de llenado
- Dispositivo/browser usado
- Fuente de tráfico
- Conversiones (si hay thank you page)

### **Métricas Generales**
- DAU/MAU por proyecto
- Proyectos creados por día
- API calls consumidos
- Tiempo en plataforma
- Features más usados

## 🏗️ Implementación Técnica

### **1. Event Tracking System (Día 1)**
```typescript
// utils/analytics.ts
interface TrackEvent {
  event: string;
  projectId: string;
  userId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Eventos a trackear:
- 'formmy.view'
- 'formmy.submit'  
- 'formmy.abandon'
- 'chatbot.message.sent'
- 'chatbot.message.received'
- 'chatbot.no_match'
- 'project.created'
```

### **2. Database Schema (Día 1)**
```sql
-- tabla principal de eventos
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- índices para queries rápidas
CREATE INDEX idx_events_project_date ON analytics_events(project_id, created_at);
CREATE INDEX idx_events_type ON analytics_events(event_type);
```

### **3. Tracking Implementation (Día 2)**
```typescript
// app/lib/analytics.server.ts - Server-side tracking
export async function trackEvent(event: TrackEvent) {
  return await db.analyticsEvents.create({ data: event });
}

// app/lib/analytics.client.ts - Client-side tracking  
export function trackFormView(projectId: string) {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      event: 'formmy.view',
      projectId,
      metadata: { url: window.location.href }
    })
  });
}
```

### **4. API Endpoints (Día 3)**
```typescript
// app/routes/api.analytics.tsx
export async function action({ request }) {
  const { event, projectId, metadata } = await request.json();
  return await trackEvent({ event, projectId, metadata });
}

// app/routes/api.metrics.$projectId.tsx  
export async function loader({ params }) {
  const metrics = await getProjectMetrics(params.projectId);
  return json(metrics);
}
```

### **5. Ghosty Integration (Día 4)**
```typescript
// Tools para Ghosty
const analyticsTools = [
  {
    name: 'getMetricsReport',
    description: 'Generate metrics report for project',
    parameters: { projectId: string, timeRange: string },
    function: async (projectId, timeRange) => {
      return await generateMetricsReport(projectId, timeRange);
    }
  },
  {
    name: 'getTopQuestions', 
    description: 'Get most common unanswered questions',
    parameters: { botId: string, limit: number },
    function: async (botId, limit) => {
      return await getUnansweredQuestions(botId, limit);
    }
  }
];
```

## 🎯 Timeline Detallado

### **Día 1: Fundación**
- [ ] Crear schema de base de datos
- [ ] Implementar funciones básicas de tracking
- [ ] Definir eventos críticos a trackear

### **Día 2: Implementación**  
- [ ] Integrar tracking en componentes Formmy
- [ ] Integrar tracking en sistema de chatbots
- [ ] Crear API endpoints para recibir eventos

### **Día 3: API de Métricas**
- [ ] Endpoints para consultar métricas agregadas
- [ ] Funciones de análisis y reportes
- [ ] Testing de performance con datos sintéticos

### **Día 4: Integración Ghosty**
- [ ] Tools de analytics para Ghosty
- [ ] Prompts contextuales con datos
- [ ] Dashboard básico de métricas

## 💡 Tools Específicos para Ghosty

### **Análisis Inteligente**
- "¿Por qué mi form tiene 60% de abandono?" → Análisis de abandono por campo
- "¿Cuándo es mejor enviar mi chatbot?" → Análisis de horarios pico
- "¿Qué preguntas no sabe responder mi bot?" → Top preguntas sin match

### **Optimización Sugerida**
- Detectar campos problemáticos automáticamente
- Sugerir mejoras basadas en patrones de uso  
- Alertas proactivas de problemas de performance

## 🔧 Consideraciones Técnicas

### **Performance**
- Batch inserts para eventos high-volume
- Agregaciones pre-calculadas para queries frecuentes
- TTL para datos antiguos (6 meses)

### **Privacy**
- No guardar datos personales en metadata
- Anonimizar IPs después de geo-localización
- Cumplir GDPR con retention policies

### **Escalabilidad**
- Considerar mover a ClickHouse si crece volumen
- Implementar sampling para eventos very high-frequency
- Cache Redis para métricas consultadas frecuentemente

---

**Nota**: Este plan se ejecuta después de completar la interfaz base de Ghosty. La integración será transparente - Ghosty tendrá acceso a métricas reales para dar consejos fundamentados en datos.