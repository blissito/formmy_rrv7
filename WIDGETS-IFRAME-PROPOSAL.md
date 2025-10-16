# Widgets con iframes para Chatbots - Propuesta

**Fecha**: Oct 11, 2025
**Status**: Propuesta / No implementado
**Inspiración**: ChatGPT Canvas, Claude Artifacts

## 🎯 Concepto

Embeber widgets interactivos dentro del chat usando **iframes** que apuntan a rutas de React Router v7. Esto permite crear experiencias ricas (confirmaciones, pagos, formularios, calendarios) sin romper el streaming de mensajes y reutilizando todo nuestro stack existente.

## 🚀 Por Qué Es Brillante

1. **Interactividad rica** - Botones, forms, calendarios sin romper el flujo del chat
2. **Aislamiento perfecto** - Estilos y scripts no contaminan el chat principal
3. **Reutiliza stack existente** - React Router v7, Tailwind, loaders, prisma
4. **UX moderna** - Similar a ChatGPT Canvas / Claude Artifacts
5. **Aplicable a TODOS los chatbots** - No solo Ghosty, cualquier agente puede usar widgets

## 🏗️ Arquitectura

### 1. Rutas de Widgets (`/widgets/*`)

Crear rutas especiales que renderizan componentes standalone diseñados para vivir en iframes:

```typescript
// app/routes/widgets.payment.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const linkId = url.searchParams.get('id');

  const paymentLink = await db.paymentLink.findUnique({
    where: { id: linkId },
    include: { product: true }
  });

  return { paymentLink };
}

export default function PaymentWidget() {
  const { paymentLink } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 max-w-md bg-white rounded-lg shadow-sm">
      <h3 className="text-xl font-bold">{paymentLink.product.name}</h3>
      <div className="text-3xl font-bold text-green-600 my-4">
        ${paymentLink.amount} MXN
      </div>
      <p className="text-gray-600 mb-6">{paymentLink.description}</p>
      <button
        onClick={() => window.open(paymentLink.stripeUrl, '_blank')}
        className="w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        Pagar Ahora →
      </button>
    </div>
  );
}
```

```typescript
// app/routes/widgets.booking-confirmation.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('id');

  const booking = await db.booking.findUnique({
    where: { id: bookingId }
  });

  return { booking };
}

export default function BookingWidget() {
  const { booking } = useLoaderData<typeof loader>();

  const handleAction = (action: 'confirm' | 'reschedule' | 'cancel') => {
    // Comunica con el parent window
    window.parent.postMessage({
      type: 'ghosty-widget',
      action,
      bookingId: booking.id
    }, window.location.origin);
  };

  return (
    <div className="p-4 max-w-sm">
      <h3 className="font-semibold">Tu Cita</h3>
      <div className="my-4 p-3 bg-blue-50 rounded">
        <p className="font-medium">{booking.service}</p>
        <p className="text-sm text-gray-600">
          📅 {booking.date} - {booking.time}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleAction('confirm')}
          className="flex-1 bg-green-600 text-white py-2 rounded"
        >
          ✓ Confirmar
        </button>
        <button
          onClick={() => handleAction('reschedule')}
          className="flex-1 bg-gray-200 py-2 rounded"
        >
          ↻ Reagendar
        </button>
        <button
          onClick={() => handleAction('cancel')}
          className="flex-1 bg-red-100 text-red-600 py-2 rounded"
        >
          ✕ Cancelar
        </button>
      </div>
    </div>
  );
}
```

### 2. Protocolo de Marcadores en Respuestas

El agente retorna marcadores especiales que el frontend detecta y convierte en iframes:

```typescript
// Tool handler retorna marcador
return {
  success: true,
  message: `He creado tu link de pago para el Plan Pro.

[WIDGET:payment:link_abc123]

Puedes proceder al pago usando el botón de arriba.`,
  data: { widgetType: 'payment', widgetId: 'link_abc123' }
};
```

### 3. Detección y Renderizado en Frontend

```typescript
// app/components/chat/MessageRenderer.tsx
function renderMessage(content: string) {
  // Regex para detectar widgets: [WIDGET:tipo:id]
  const widgetRegex = /\[WIDGET:(\w+):(\w+)\]/g;

  const parts = content.split(widgetRegex);

  return parts.map((part, index) => {
    // Si es un tipo de widget conocido
    if (index % 3 === 1) {
      const type = part;
      const id = parts[index + 1];

      return (
        <iframe
          key={index}
          src={`/widgets/${type}?id=${id}`}
          className="w-full border rounded-lg my-4"
          style={{ height: '300px' }} // Ajustable con postMessage
          sandbox="allow-scripts allow-same-origin allow-popups"
          title={`Widget ${type}`}
        />
      );
    }

    // Si es texto normal
    if (index % 3 === 0) {
      return <Markdown key={index}>{part}</Markdown>;
    }

    return null;
  });
}
```

### 4. Comunicación Bidireccional (postMessage)

```typescript
// Inside widget (hijo)
function notifyParent(data: any) {
  window.parent.postMessage({
    type: 'ghosty-widget',
    ...data
  }, window.location.origin);
}

// Ejemplo: notificar altura dinámica
useEffect(() => {
  const height = document.body.scrollHeight;
  notifyParent({ action: 'resize', height });
}, []);

// Ejemplo: notificar acción del usuario
<button onClick={() => notifyParent({
  action: 'booking_confirmed',
  bookingId: '123'
})}>
  Confirmar
</button>
```

```typescript
// In chat parent (padre)
useEffect(() => {
  function handleWidgetMessage(event: MessageEvent) {
    // Validar origen
    if (event.origin !== window.location.origin) return;
    if (event.data.type !== 'ghosty-widget') return;

    const { action, height, bookingId } = event.data;

    // Ajustar altura del iframe
    if (action === 'resize') {
      const iframe = document.querySelector(`iframe[src*="booking"]`);
      if (iframe) iframe.style.height = `${height}px`;
    }

    // Procesar acciones del usuario
    if (action === 'booking_confirmed') {
      sendMessageToChat(`✓ Cita confirmada (ID: ${bookingId})`);
      // Opcionalmente: enviar al agente para que actualice BD
    }
  }

  window.addEventListener('message', handleWidgetMessage);
  return () => window.removeEventListener('message', handleWidgetMessage);
}, []);
```

## 🎨 Casos de Uso Priorizados

### 🔥 MVP - Alta Prioridad

#### 1. Payment Link Preview
- **Agente**: Sales, cualquier chatbot con Stripe
- **Impacto**: ↑ Conversión (botón visual vs link de texto)
- **Complejidad**: Baja
- **Datos**: `create_payment_link` tool ya existe

#### 2. Booking Confirmation
- **Agente**: Medical receptionist, service schedulers
- **Impacto**: ↓ Fricción (confirmar/reagendar en un click)
- **Complejidad**: Media (necesita tool nuevo `create_booking`)
- **Datos**: Fecha, hora, servicio, profesional

#### 3. Form Embed
- **Agente**: Cualquiera que use formularios de Formmy
- **Impacto**: ↑ Captación datos sin salir del chat
- **Complejidad**: Baja (iframe a `/forms/:id/embed`)
- **Datos**: Ya existe sistema de forms

### 🚀 Fase 2 - Media Prioridad

#### 4. Video Embed
- **Agente**: Educational assistant, sales demos
- **Impacto**: ↑ Engagement, claridad visual
- **Complejidad**: Baja (iframe a YouTube/Loom)
- **Ejemplo**: "Te comparto un video sobre cómo funciona [WIDGET:video:youtube_xyz]"

#### 5. Calendar Picker
- **Agente**: Cualquier chatbot que agende citas
- **Impacto**: UX superior vs texto "¿Qué día prefieres?"
- **Complejidad**: Media (UI calendario + disponibilidad)
- **Datos**: Slots disponibles del negocio

#### 6. Product Catalog
- **Agente**: E-commerce, sales
- **Impacto**: ↑ Visual discovery
- **Complejidad**: Media (galería scrollable)
- **Datos**: Productos con imágenes, precios

#### 7. Document Preview
- **Agente**: Data analyst, customer support
- **Impacto**: Mostrar PDFs/Excel sin descargar
- **Complejidad**: Alta (viewer inline)
- **Datos**: URL del documento

### 💎 Fase 3 - Avanzado

#### 8. Multi-step Wizard
- **Ejemplo**: Onboarding de clientes con 3-4 pasos
- **Impacto**: Captura datos complejos sin salir del chat
- **Complejidad**: Alta

#### 9. Mini Dashboard
- **Ejemplo**: KPIs del negocio en tiempo real
- **Impacto**: Data analyst agent puede mostrar métricas visualmente
- **Complejidad**: Alta (queries en vivo, gráficas)

#### 10. Signature Pad
- **Ejemplo**: Firmar contrato/autorización inline
- **Impacto**: Workflow legal/compliance sin fricción
- **Complejidad**: Media

## 🛠️ Tools Necesarios

### Crear nuevo tool: `create_widget`

```typescript
// server/tools/handlers/create-widget.ts
const createWidgetSchema = z.object({
  type: z.enum(['payment', 'booking', 'form', 'video', 'calendar']),
  entityId: z.string().describe('ID del entity (paymentLink, booking, form, etc)'),
  metadata: z.record(z.any()).optional()
});

export async function handleCreateWidget(
  input: z.infer<typeof createWidgetSchema>,
  context: ToolContext
): Promise<ToolResponse> {
  const { type, entityId, metadata } = input;

  // Validar que el entity existe y pertenece al chatbot owner
  // (seguridad: no permitir acceso a entities de otros usuarios)

  const widgetUrl = `/widgets/${type}?id=${entityId}`;

  return {
    success: true,
    message: `[WIDGET:${type}:${entityId}]`,
    data: {
      widgetType: type,
      widgetId: entityId,
      widgetUrl,
      metadata
    }
  };
}
```

### O especializados por tipo:

- `create_payment_widget` (ya tienen `create_payment_link`, solo ajustar response)
- `create_booking_widget` (nuevo)
- `embed_form_widget` (wrapper del sistema de forms existente)

## 🔒 Seguridad

### Sandbox del iframe
```html
<iframe
  sandbox="allow-scripts allow-same-origin allow-popups"
  ...
/>
```

- `allow-scripts`: JS funciona (necesario para React)
- `allow-same-origin`: Puede leer cookies (same origin)
- `allow-popups`: Para abrir Stripe/pasarelas de pago
- **NO** `allow-top-navigation`: Previene que widget redirija todo el chat

### Validación de Ownership
```typescript
// En loader del widget
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const entityId = url.searchParams.get('id');
  const conversationId = url.searchParams.get('conversationId'); // Pasar desde iframe

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { chatbot: true }
  });

  const entity = await db.paymentLink.findUnique({
    where: { id: entityId }
  });

  // Validar ownership
  if (entity.userId !== conversation.chatbot.userId) {
    throw new Response('Forbidden', { status: 403 });
  }

  return { entity };
}
```

### CSP Headers
Asegurar que iframes solo puedan cargar desde tu dominio:
```
Content-Security-Policy: frame-src 'self';
```

## 📱 Consideraciones Mobile

### Responsive Design
- Widgets deben ser mobile-first (mayoría del tráfico)
- Max width: 400px (típico ancho del chat en mobile)
- Touch targets: >= 44px

### Height Dinámico
```typescript
// Widget notifica su altura real
useEffect(() => {
  const observer = new ResizeObserver(() => {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage({
      type: 'ghosty-widget',
      action: 'resize',
      height
    }, '*');
  });

  observer.observe(document.body);
  return () => observer.disconnect();
}, []);
```

### Scrolling
- Widgets pequeños (<= 400px height): `overflow: hidden` en iframe
- Widgets grandes (calendar, forms): Permitir scroll interno

## 💰 Costo / Performance

### Pros
- Cacheable (widgets son rutas estáticas)
- Lazy load (solo cuando widget aparece en viewport)
- No impacta streaming de mensajes

### Cons
- +1 HTTP request por widget (loader data)
- +Ancho de banda (HTML + CSS + JS del widget)
- Mobile data: considerar comprimir assets

### Optimizaciones
1. **Loaders con stale-while-revalidate**: Cachear data 5min
2. **Skeleton loading**: Placeholder mientras carga iframe
3. **Intersection Observer**: Solo cargar widget cuando visible
4. **Vite code splitting**: Cada widget su propio chunk

## 🗺️ Roadmap Sugerido

### Semana 1: MVP - Payment Widget
- [ ] Crear ruta `/widgets/payment`
- [ ] Modificar `create_payment_link` tool para retornar marcador
- [ ] Detección de `[WIDGET:payment:*]` en frontend
- [ ] Renderizado de iframe
- [ ] Test con chatbot de sales

### Semana 2: Booking Widget
- [ ] Crear tool `create_booking_widget`
- [ ] Ruta `/widgets/booking`
- [ ] PostMessage bidireccional (confirmar/reagendar)
- [ ] Update de booking en BD desde parent
- [ ] Test con medical receptionist

### Semana 3: Form Embed + Calendar
- [ ] Ruta `/widgets/form` (wrapper de `/forms/:id/embed`)
- [ ] Tool `embed_form_widget`
- [ ] Ruta `/widgets/calendar` con date picker
- [ ] Integración con disponibilidad del negocio

### Semana 4: Infraestructura General
- [ ] Sistema genérico de registro de widgets
- [ ] Height auto-adjust universal
- [ ] Skeleton/loading states
- [ ] Mobile optimization pass
- [ ] Security audit (sandbox, CSP, ownership)

## 📊 Métricas de Éxito

### Conversión
- **Baseline**: % conversión con links de texto plano
- **Target**: +25% conversión con payment widgets

### Engagement
- **Metric**: Time in conversation con vs sin widgets
- **Target**: +15% tiempo (mayor interacción)

### UX
- **Metric**: NPS o feedback cualitativo
- **Target**: "Me encantó poder confirmar desde el chat"

### Performance
- **Metric**: Time to Interactive del widget
- **Target**: < 1s en 4G

## 🤔 Preguntas Abiertas

1. **¿Permitir widgets de terceros?** (e.g., Calendly, Typeform embeds)
   - Pro: Flexibilidad
   - Con: Security risk, performance impredecible

2. **¿Cómo versionar widgets?** (si cambiamos UI, conversaciones viejas se rompen)
   - Opción A: Snapshot del HTML al crear (pesado)
   - Opción B: Versioning explícito `/widgets/v1/payment`

3. **¿Permitir custom CSS por chatbot?** (branding)
   - Pasar `?theme=chatbotId` al widget
   - Cargar colores/fuentes del chatbot config

4. **¿Analytics dentro del widget?**
   - Track clicks en botones de pago
   - Tiempo que pasan en calendar picker

## 🔗 Referencias

- ChatGPT Canvas: https://openai.com/index/introducing-canvas/
- Claude Artifacts: https://www.anthropic.com/news/artifacts
- React Router v7 Loaders: https://reactrouter.com/start/framework/data-loading
- Window.postMessage MDN: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- iframe sandbox: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox

---

**Próximos Pasos**:
1. Validar propuesta con equipo
2. Diseñar mockups de Payment Widget + Booking Widget
3. Implementar MVP (Semana 1)
4. A/B test con chatbot de ventas

**Owner**: TBD
**Última actualización**: Oct 11, 2025
