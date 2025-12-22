# Plan: Sistema de Ciclo de Vida para Artefactos

**Fecha**: 2025-12-21
**Estado**: ✅ Implementado
**Branch**: `feat/artifacts-system`

---

## Problema

El artefacto (ej: date-picker) no muta después de una acción. Tras hacer click en "OK", sigue siendo interactivo en vez de mostrar un estado de confirmación.

---

## Solución: 3 Estados + Persistencia en MessageMetadata

### Los 3 Estados

| Estado | Descripción | UI |
|--------|-------------|-----|
| `interactive` | Esperando input del usuario | Controles habilitados |
| `processing` | Usuario tomó acción, esperando | Controles bloqueados, spinner |
| `resolved` | Finalizado (outcome: `confirmed` \| `cancelled`) | Vista de confirmación o cancelación |

### Persistencia: Extender `messageMetadata`

```typescript
// app/lib/artifact-events.ts - Extender interfaz
interface ArtifactEventMetadata {
  artifactEvent: {
    name: string;
    payload: ArtifactEventPayload;
  };
  // NUEVO
  artifactLifecycle: {
    phase: "interactive" | "processing" | "resolved";
    outcome?: "confirmed" | "cancelled" | "expired";
    artifactName: string;
    resolvedData?: Record<string, unknown>;
  };
}
```

---

## Archivos Modificados

### 1. `app/lib/artifact-events.ts` ✅
- [x] Agregar tipos `ArtifactPhase`, `ResolvedOutcome`, `ArtifactLifecycleState`
- [x] Actualizar `createArtifactEventMetadata()` para incluir `artifactLifecycle`
- [x] Nueva función `getOutcomeFromEvent(eventName)` que mapea eventos a outcomes
- [x] Constantes `RESOLVING_EVENTS` y `CANCELLING_EVENTS`

### 2. `app/hooks/useArtifact.tsx` ✅
- [x] Agregar estado: `phase`, `outcome`, `resolvedData`
- [x] Nueva función `transitionTo(phase, outcome?, data?)`
- [x] Nueva función `findLifecycleResolution(messages)` - reconstruye estado desde historial
- [x] Timeout de 5s para auto-resolve de processing → resolved

### 3. `app/components/artifacts/ArtifactRenderer.tsx` ✅
- [x] Recibir nuevas props: `phase`, `outcome`
- [x] Pasar `phase` y `outcome` al componente renderizado
- [x] Vistas default: `DefaultProcessingView` y `DefaultResolvedView`
- [x] Bloqueo de eventos cuando `phase !== "interactive"`

### 4. `app/components/ghosty/artifact/ArtifactV0.tsx` ✅
- [x] Actualizar `handleArtifactEvent` para llamar `transitionTo()`
- [x] Eventos resolving (`onSelect`, `onConfirm`, `onSubmit`) → `processing` → `resolved:confirmed`
- [x] Eventos cancelling (`onCancel`, `onClose`) → `resolved:cancelled`
- [x] Badge de fase en el header

### 5. `app/components/ghosty/GhostyChatInterface.tsx` ✅
- [x] Actualizar `onArtifactEvent` para incluir `artifactLifecycle` en metadata
- [x] Pasar `artifactName` al `createArtifactEventMetadata()`

### 6. `app/components/ChatPreview.tsx` ✅
- [x] Mismo cambio que GhostyChatInterface
- [x] Actualizar interfaces de tipos

### 7. `server/artifacts/examples/date-picker.tsx` ✅
- [x] Simplificar: solo implementa vista "interactive"
- [x] Documentar cómo personalizar vistas de processing/resolved (opcional)

---

## Flujo de Transiciones

```
Usuario interactúa con artefacto
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ INTERACTIVE                                                │
│ - Controles habilitados                                    │
│ - onEvent disponible                                       │
└───────────────────────────────────────────────────────────┘
        │
        │ onSelect / onSubmit / onConfirm
        ▼
┌───────────────────────────────────────────────────────────┐
│ PROCESSING                                                 │
│ - Controles bloqueados                                     │
│ - Spinner/loading (vista default del sistema)              │
│ - Resuelve cuando: agente responde O timeout 5s           │
└───────────────────────────────────────────────────────────┘
        │
        │ (agent response O timeout 5s)
        ▼
┌───────────────────────────────────────────────────────────┐
│ RESOLVED (outcome: confirmed)                              │
│ - Vista de confirmación                                    │
│ - Datos capturados visibles                                │
│ - No más interacción                                       │
└───────────────────────────────────────────────────────────┘


ALTERNATIVO: onCancel / onClose
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ RESOLVED (outcome: cancelled)                              │
│ - Vista de cancelación                                     │
│ - No más interacción                                       │
└───────────────────────────────────────────────────────────┘
```

---

## Reconstrucción desde Historial

Al cargar una conversación con artefactos:

```typescript
// En useArtifact.tsx
const resolveFromHistory = (messages: UIMessage[]) => {
  // 1. Encontrar el último tool call de artefacto
  const artifactToolCall = findLastArtifactToolCall(messages);
  if (!artifactToolCall) return;

  // 2. Buscar mensaje posterior con artifactLifecycle
  const resolutionMessage = findResolutionMessage(
    messages,
    artifactToolCall.artifactName
  );

  // 3. Si hay resolución, aplicar estado
  if (resolutionMessage?.metadata?.artifactLifecycle) {
    const { phase, outcome, resolvedData } = resolutionMessage.metadata.artifactLifecycle;
    setPhase(phase);
    setOutcome(outcome);
    setResolvedData(resolvedData);
  }
};
```

---

## Decisiones de Diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Cantidad de componentes | 1 con lógica de fase | Más simple para devs |
| Persistencia | `messageMetadata` | Ya existe, no cambia schema |
| Control de transiciones | **Híbrido** | Processing inmediato, resolved cuando agente responde O timeout 5s |
| Vistas del dev | **Solo interactive requerida** | Processing/resolved genéricos, dev puede sobrescribir opcionalmente |

---

## Sistema de Vistas por Defecto

El dev solo implementa `interactive`. El sistema provee defaults para `processing` y `resolved`:

```typescript
// ArtifactRenderer.tsx - Lógica de fallback
const ArtifactRenderer = ({ code, data, phase, outcome, onEvent }) => {
  // 1. Si phase es "processing" y el componente no lo maneja → Default
  if (phase === "processing") {
    return (
      <DefaultProcessingView>
        <div className="animate-pulse">Procesando...</div>
      </DefaultProcessingView>
    );
  }

  // 2. Si phase es "resolved" y el componente no lo maneja → Default
  if (phase === "resolved") {
    return (
      <DefaultResolvedView outcome={outcome} data={data}>
        {outcome === "confirmed" ? (
          <div className="text-green-600">✓ Confirmado</div>
        ) : (
          <div className="text-gray-600">✗ Cancelado</div>
        )}
      </DefaultResolvedView>
    );
  }

  // 3. Interactive → Renderiza el componente del dev
  return <Component data={data} phase={phase} outcome={outcome} onEvent={onEvent} />;
};
```

### Para devs que quieran personalizar:

```typescript
// El componente puede manejar las fases internamente
const MyArtifact = ({ data, phase, outcome, onEvent }) => {
  // Opción 1: Ignorar phase y dejar que el sistema maneje
  // (solo implementar interactive)

  // Opción 2: Manejar todas las fases
  if (phase === "resolved" && outcome === "confirmed") {
    return <MiVistaDeConfirmacionPersonalizada data={data} />;
  }

  // Default: vista interactive
  return <MiSelectorInteractivo data={data} onEvent={onEvent} />;
};
```

---

## Orden de Implementación

1. **Tipos** - Agregar tipos en `artifact-events.ts`
2. **Context** - Actualizar `useArtifact.tsx` con estado de ciclo de vida
3. **Renderer** - Actualizar `ArtifactRenderer.tsx` para pasar phase/outcome
4. **Event Handlers** - Actualizar handlers en `ArtifactV0.tsx`, `GhostyChatInterface.tsx`, `ChatPreview.tsx`
5. **Ejemplo** - Actualizar `date-picker.tsx` con renderizado por fase (opcional)
6. **Historial** - Implementar `resolveFromHistory()`

---

## Notas Adicionales

- El `messageMetadata` ya persiste en la BD con cada mensaje
- No se requieren cambios en Prisma schema
- La transición `processing → resolved` usa timeout de 5s como fallback
- Los eventos `onCancel`/`onClose` van directo a `resolved:cancelled` (sin `processing`)
