# Widgets - Mejoras Pendientes

## 🚨 CRÍTICO - Error Handling

**Fecha**: 13 Oct 2025
**Problema**: Los errores de Prisma/Backend se muestran directamente al usuario en el iframe del widget

**Ejemplo de error inaceptable**:
```
PrismaClientKnownRequestError:
Invalid `prisma.user.findFirst()` invocation:
Inconsistent column data: Malformed ObjectID...
```

**Impacto**:
- ❌ UX terrible - usuario ve stacktraces técnicos
- ❌ Expone detalles de implementación (Prisma, MongoDB, rutas internas)
- ❌ No hay fallback ni recovery
- ❌ Rompe la percepción de profesionalismo

**Solución requerida**:

### 1. Error Boundaries en Widget Routes
```typescript
// app/routes/widgets.$widgetId.tsx
export function ErrorBoundary() {
  return (
    <div className="p-8 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold mb-2">
        Widget temporalmente no disponible
      </h2>
      <p className="text-gray-600">
        Estamos trabajando en resolver este problema.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
```

### 2. Try-Catch con Fallback UI
```typescript
export async function loader({ params, request }: LoaderFunctionArgs) {
  try {
    // ... código existente
  } catch (error) {
    console.error('[Widget Loader Error]', error);

    // NO lanzar Response error - retornar estado de error
    return {
      error: true,
      type: 'load_error',
      message: 'No pudimos cargar este widget'
    };
  }
}

export default function WidgetRoute() {
  const data = useLoaderData<typeof loader>();

  if ('error' in data) {
    return <WidgetErrorState message={data.message} />;
  }

  // ... render normal
}
```

### 3. Logging Estructurado (NO mostrar al usuario)
```typescript
// server/utils/error-logger.ts
export function logWidgetError(error: Error, context: {
  widgetId?: string;
  userId?: string;
  action: string;
}) {
  // Log a Sentry, LogRocket, o archivo
  console.error('[Widget Error]', {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context
  });
}
```

### 4. Monitoring de Widgets
```typescript
// Track widget load failures
analytics.track('widget_load_failed', {
  widgetId,
  widgetType,
  errorType: 'prisma_validation',
  userId: user?.id
});
```

---

## 🎨 UX - Widget Placement

**Problema**: Widget renderiza dentro de la burbuja del mensaje
**Estado**: Pendiente evaluación con usuario

**Opciones**:
- A) Widget fuera de burbuja (standalone)
- B) Widget en modal al click en botón
- C) Widget como card separado tipo Stripe embeds

---

## 🔧 Mejoras Técnicas Adicionales

### Session Management
- [ ] Fix `session.set("userId", email)` en `google.server.ts:203`
  - Debe guardar `user.id`, no `user.email`
  - Esto evitaría el workaround del ObjectID validation

### Widget Security
- [ ] Rate limiting en loader de widgets (prevenir spam)
- [ ] Audit log de accesos a widgets
- [ ] TTL opcional para widgets (auto-expirar después de X tiempo)

### Widget Analytics
- [ ] Track views de widgets
- [ ] Track clicks en "Pagar Ahora"
- [ ] Track conversión (completaron pago)
- [ ] A/B testing de diseños de widgets

---

## 📊 Prioridad

1. **URGENTE**: Error boundaries y manejo de errores graceful
2. **ALTA**: Fix session userId (root cause del error actual)
3. **MEDIA**: Widget placement UX
4. **BAJA**: Analytics y A/B testing

---

**Última actualización**: 13 Oct 2025
