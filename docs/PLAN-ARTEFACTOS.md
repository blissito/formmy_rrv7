# Plan: Sistema de Artefactos para Formmy

> **Fecha**: 2025-12-21
> **Estado**: Diseño completado, listo para implementar
> **Branch sugerida**: `feat/artifacts-system`

## Resumen

Sistema minimalista para que equipos externos suban componentes React interactivos ("artefactos") que se renderizan dentro del chat cuando el chatbot los activa.

**Caso de uso principal**: 3 equipos de devs suben sus artefactos vía dashboard, pasan review manual, y quedan disponibles en marketplace para que usuarios los instalen en sus chatbots.

---

## Decisiones de Diseño

| Aspecto | Decisión | Notas |
|---------|----------|-------|
| **Ejecución** | Código TSX en DB, renderizado directo | Sin iframe para POC |
| **Stream** | Bidireccional | Usuario interactúa → bot reacciona → muta artefacto |
| **Review** | Manual | Admin aprueba antes de publicar |
| **Scope** | Marketplace global + activación por chatbot | Estilo Shopify apps |
| **Upload** | Via dashboard | Self-service para equipos externos |
| **Versionado** | No hay | Dev sustituye el código directamente |

---

## Fase 1: Modelos de Datos

### Archivo: `prisma/schema.prisma`

```prisma
enum ArtifactStatus {
  DRAFT           // Dev trabajando
  PENDING_REVIEW  // Enviado para revisión
  PUBLISHED       // Aprobado, visible en marketplace
  REJECTED        // Rechazado por admin
}

model Artifact {
  id           String         @id @default(auto()) @map("_id") @db.ObjectId
  name         String         @unique  // "payment-form" (slug)
  displayName  String                  // "Formulario de Pago"
  description  String
  code         String                  // TSX code (dev sustituye directamente)

  // Author
  authorId     String         @db.ObjectId
  authorEmail  String

  // Review
  status       ArtifactStatus @default(DRAFT)
  reviewedBy   String?        @db.ObjectId
  reviewedAt   DateTime?
  reviewNotes  String?

  // Metadata
  category     String?                 // "forms", "calendars", "payments"
  iconUrl      String?
  propsSchema  Json?                   // JSON Schema para validar props
  events       String[]       @default([])  // ["onSubmit", "onCancel"]

  // Stats
  installCount Int            @default(0)

  // Relations
  installations ArtifactInstallation[]

  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@index([status])
  @@index([authorId])
  @@index([category])
}

model ArtifactInstallation {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  chatbotId   String   @db.ObjectId
  chatbot     Chatbot  @relation(fields: [chatbotId], references: [id], onDelete: Cascade)
  artifactId  String   @db.ObjectId
  artifact    Artifact @relation(fields: [artifactId], references: [id], onDelete: Cascade)

  config      Json?    // Config específica por chatbot
  isActive    Boolean  @default(true)
  usageCount  Int      @default(0)
  lastUsedAt  DateTime?
  installedAt DateTime @default(now())

  @@unique([chatbotId, artifactId])
  @@index([chatbotId])
  @@index([artifactId])
}
```

**Agregar a modelo Chatbot:**
```prisma
artifactInstallations ArtifactInstallation[]
```

---

## Fase 2: Backend

### Archivo: `server/artifacts/artifact.service.ts`

Funciones:
- `createArtifact(data)` - Crear nuevo (status: DRAFT)
- `updateArtifact(id, data)` - Actualizar código y/o metadata (sustituye)
- `deleteArtifact(id, userId)` - Eliminar (solo si DRAFT o propio)
- `submitForReview(id, userId)` - Enviar a revisión (status → PENDING_REVIEW)
- `approveArtifact(id, adminId)` - Admin aprueba (status → PUBLISHED)
- `rejectArtifact(id, adminId, reason)` - Admin rechaza con razón
- `installArtifact(chatbotId, artifactId, config?)` - Instalar en chatbot
- `uninstallArtifact(chatbotId, artifactId)` - Desinstalar
- `getInstalledArtifacts(chatbotId)` - Lista instalados
- `listMarketplace(filters?)` - Lista PUBLISHED
- `listMyArtifacts(userId)` - Mis artefactos (dev)
- `listPendingReview()` - Admin: pendientes

### Archivo: `server/tools/vercel/artifactTool.ts`

```typescript
import { tool } from "ai";
import { z } from "zod";
import { db } from "~/utils/db.server";

export const createOpenArtifactTool = (chatbotId: string) => {
  return tool({
    description: `Abre un artefacto interactivo en el chat.

Usa esto cuando:
- Usuario necesita llenar un formulario
- Usuario necesita interactuar con un componente visual
- Usuario necesita ver datos estructurados en un widget

Los artefactos disponibles están pre-instalados por el dueño del chatbot.`,

    parameters: z.object({
      artifactName: z.string().describe("Nombre técnico del artefacto"),
      initialData: z.any().optional().describe("Datos iniciales para el artefacto"),
    }),

    execute: async ({ artifactName, initialData }) => {
      // Verificar que está instalado y activo
      const installation = await db.artifactInstallation.findFirst({
        where: {
          chatbotId,
          artifact: { name: artifactName },
          isActive: true,
        },
        include: { artifact: true },
      });

      if (!installation) {
        return {
          error: `Artefacto "${artifactName}" no instalado o no activo.`,
        };
      }

      // Actualizar stats
      await db.artifactInstallation.update({
        where: { id: installation.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      return {
        type: "artifact",
        name: artifactName,
        displayName: installation.artifact.displayName,
        code: installation.artifact.code,
        data: { ...installation.config, ...initialData },
        events: installation.artifact.events,
        propsSchema: installation.artifact.propsSchema,
      };
    },
  });
};
```

### Archivo: `app/routes/api.v1.artifacts.ts`

Intents (POST con body `{ intent, ...params }`):
- `list_marketplace` - Artefactos publicados (filtros opcionales)
- `list_installed` - Instalados en chatbot específico
- `install` - Instalar artefacto en chatbot
- `uninstall` - Desinstalar
- `create` - Crear nuevo artefacto (dev)
- `update` - Actualizar código/metadata (sustituye)
- `delete` - Eliminar artefacto
- `submit_review` - Enviar a revisión
- `approve` - Admin: aprobar
- `reject` - Admin: rechazar con razón
- `list_pending` - Admin: lista pendientes
- `my_artifacts` - Mis artefactos (dev)

---

## Fase 3: Dashboard UI

### 3.1 Agregar Tab

**Archivo: `app/components/chat/PageContainer.tsx`**

Agregar "Artefactos" a `tabKeys[]`:
```typescript
const tabKeys = [
  "Preview",
  "Conversaciones",
  "Contactos",
  "Entrenamiento",
  "Artefactos",  // <-- NUEVO
  "Herramientas",
  "Código",
  "Configuración",
];
```

### 3.2 Loader del Dashboard

**Archivo: `app/routes/dashboard.chat_.$chatbotSlug.tsx`**

Agregar en loader:
```typescript
const installedArtifacts = await db.artifactInstallation.findMany({
  where: { chatbotId: chatbot.id },
  include: { artifact: true },
  orderBy: { installedAt: 'desc' },
});
```

Agregar en JSX:
```tsx
{currentTab === "Artefactos" && (
  <Artefactos
    chatbot={chatbot}
    user={user}
    installedArtifacts={installedArtifacts}
  />
)}
```

### 3.3 Componente Tab Artefactos

**Archivo: `app/components/chat/tab_sections/Artefactos.tsx`**

Estructura:
```tsx
export const Artefactos = ({ chatbot, user, installedArtifacts }) => {
  const { currentTab, setCurrentTab } = useChipTabs("marketplace", `artifacts_${chatbot.id}`);

  return (
    <section className="h-full min-h-[60vh] p-4 overflow-y-auto">
      {/* Sub-tabs */}
      <ChipTabs
        names={["Marketplace", "Instalados"]}
        activeTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {currentTab === "marketplace" && <Marketplace chatbotId={chatbot.id} />}
      {currentTab === "instalados" && <Instalados artifacts={installedArtifacts} />}

      {/* Badge admin: pendientes de review */}
      {isAdmin(user) && <PendingReviewBadge />}
    </section>
  );
};
```

**Sub-componentes:**
- `Marketplace` - Grid de artefactos PUBLISHED con botón "Instalar"
- `Instalados` - Lista con toggle activo/inactivo, config, desinstalar

### 3.4 Portal de Desarrolladores

**Archivo: `app/routes/dashboard.artifacts.tsx`**

Página para devs:
- Ver "Mis Artefactos" (lista con status)
- Crear nuevo artefacto (formulario)
- Editar código (editor TSX con syntax highlighting)
- Enviar a review (botón)
- Ver feedback de rechazo

### 3.5 Panel Admin Review

**Archivo: `app/routes/dashboard.artifacts.review.tsx`**

Solo para admins:
- Lista de PENDING_REVIEW
- Preview del código con syntax highlighting
- Botones Aprobar/Rechazar
- Campo para notas de rechazo

---

## Fase 4: Renderizado en Chat

### 4.1 Componente Renderer

**Archivo: `app/components/artifacts/ArtifactRenderer.tsx`**

```tsx
interface ArtifactRendererProps {
  code: string;
  data: any;
  onEvent: (eventName: string, payload: any) => void;
}

export const ArtifactRenderer = ({ code, data, onEvent }: ArtifactRendererProps) => {
  // POC: Evaluar componente con Function constructor
  // En producción: sandbox con iframe o WebComponent

  const Component = useMemo(() => {
    try {
      // El código debe exportar un componente llamado ArtifactComponent
      const fn = new Function('React', 'data', 'onEvent', `
        ${code}
        return ArtifactComponent;
      `);
      return fn(React, data, onEvent);
    } catch (e) {
      console.error("Error loading artifact:", e);
      return () => <div className="text-red-500">Error cargando artefacto</div>;
    }
  }, [code, data]);

  return (
    <div className="artifact-container p-4 border rounded-lg bg-white shadow-sm">
      <Suspense fallback={<div>Cargando...</div>}>
        <Component data={data} onEvent={onEvent} />
      </Suspense>
    </div>
  );
};
```

### 4.2 Integrar en Chat Interface

**Archivo: `app/components/ghosty/GhostyChatInterface.tsx`**

Detectar y renderizar:
```tsx
{message.parts
  .filter(part => part.type === "tool-openArtifactTool" && part.state === "output-available")
  .map((part, idx) => (
    <ArtifactRenderer
      key={idx}
      code={part.output.code}
      data={part.output.data}
      onEvent={(eventName, payload) => {
        // Enviar evento al chat como mensaje especial
        sendMessage({
          text: `[ARTIFACT_EVENT:${eventName}] ${JSON.stringify(payload)}`
        });
      }}
    />
  ))
}
```

### 4.3 Agregar Tool a Endpoints

**Archivo: `app/routes/chat.vercel.public.tsx`**

```typescript
import { createOpenArtifactTool } from "@/server/tools/vercel/artifactTool";

// En streamText config:
tools: {
  getContextTool: createGetContextTool(chatbotId),
  saveLeadTool: createSaveLeadTool(chatbotId, conversation.id),
  openArtifactTool: createOpenArtifactTool(chatbotId),  // <-- NUEVO
  ...customTools,
},
```

---

## Fase 5: Ejemplo Real

Crear artefacto de ejemplo: **"Selector de Fecha/Hora"**

```tsx
// Código del artefacto
const ArtifactComponent = ({ data, onEvent }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const { minDate, maxDate, availableSlots = [] } = data;

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onEvent("onSelect", { date: selectedDate, time: selectedTime });
    }
  };

  const handleCancel = () => {
    onEvent("onCancel", {});
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      <h3 className="text-lg font-bold mb-4">Selecciona fecha y hora</h3>

      {/* Calendario simple */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* ... días del mes ... */}
      </div>

      {/* Slots de tiempo */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableSlots.map(slot => (
          <button
            key={slot}
            onClick={() => setSelectedTime(slot)}
            className={cn(
              "px-3 py-1 rounded",
              selectedTime === slot ? "bg-blue-500 text-white" : "bg-gray-100"
            )}
          >
            {slot}
          </button>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 rounded">
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};
```

Props:
- `minDate` - Fecha mínima seleccionable
- `maxDate` - Fecha máxima seleccionable
- `availableSlots` - Array de horarios disponibles `["9:00", "10:00", "14:00"]`

Events:
- `onSelect` - `{ date: "2025-01-15", time: "10:00" }`
- `onCancel` - `{}`

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `server/artifacts/artifact.service.ts` | CRUD y lógica de negocio |
| `server/tools/vercel/artifactTool.ts` | Tool factory para Vercel AI SDK |
| `app/routes/api.v1.artifacts.ts` | API endpoint con intents |
| `app/components/chat/tab_sections/Artefactos.tsx` | Tab del dashboard |
| `app/components/artifacts/ArtifactRenderer.tsx` | Renderizador de artefactos |
| `app/components/artifacts/Marketplace.tsx` | Grid de marketplace |
| `app/components/artifacts/Instalados.tsx` | Lista de instalados |
| `app/routes/dashboard.artifacts.tsx` | Portal de devs |
| `app/routes/dashboard.artifacts.review.tsx` | Panel admin review |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar modelos Artifact, ArtifactInstallation |
| `app/components/chat/PageContainer.tsx` | Agregar "Artefactos" a tabKeys |
| `app/routes/dashboard.chat_.$chatbotSlug.tsx` | Loader + render del tab |
| `app/routes/chat.vercel.public.tsx` | Agregar openArtifactTool |
| `app/components/ghosty/GhostyChatInterface.tsx` | Detectar y renderizar artefactos |

---

## Orden de Implementación

1. **Schema** - Modelos Prisma + `npx prisma db push`
2. **Service** - CRUD básico en `artifact.service.ts`
3. **API** - Endpoints en `api.v1.artifacts.ts`
4. **Tab Artefactos** - Marketplace + Instalados
5. **Tool** - `createOpenArtifactTool()`
6. **Renderer** - `ArtifactRenderer.tsx`
7. **Dev Portal** - Crear/editar artefactos
8. **Admin Review** - Aprobar/rechazar
9. **Ejemplo** - Selector de fecha funcional

---

## Notas Técnicas

### Seguridad (POC)
- El código TSX se ejecuta con `new Function()` - **solo para POC**
- En producción: usar iframe sandbox o WebComponent
- Validar que el código no tenga `eval`, `document.cookie`, etc.

### Comunicación Bidireccional
- Artefacto → Bot: via `onEvent(name, payload)` que envía mensaje especial
- Bot → Artefacto: via props actualizados (requiere re-render)
- Para mutaciones en tiempo real: considerar WebSocket o stream annotations

### Patrón de Mensajes de Evento
```
[ARTIFACT_EVENT:onSelect] {"date":"2025-01-15","time":"10:00"}
```
El backend puede parsear esto y actuar según el evento.
