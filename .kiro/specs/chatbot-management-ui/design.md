# Design Document

## Overview

El diseño se enfoca en crear una vista de lista de chatbots (`/chat`) que sirva como punto de entrada principal para la gestión de bots, y una vista de edición completa (`/chat/config/:chatbotId`) para configurar todos los aspectos de cada chatbot. Además, se implementarán endpoints RESTful para permitir integraciones y automatizaciones. Todo se implementará usando React Router 7 con loaders y actions, siguiendo los patrones ya establecidos en el proyecto.

## Architecture

### Route Structure

```
/chat (Lista principal)
├── Loader: Cargar todos los chatbots del usuario
├── Action: Crear, eliminar, toggle estado
└── Navegación a /chat/config/:chatbotId

/chat/config (Vista de edición existente)
├── Loader: Cargar chatbot específico con todas sus configuraciones
├── Action: Actualizar configuración del chatbot
└── Navegación de vuelta a /chat


```

### Component Architecture

```
ChatListRoute
├── ChatListHeader (título, botón crear)
├── ChatListFilters (búsqueda, filtros de estado)
├── ChatListGrid (lista de chatbots)
│   └── ChatbotCard (tarjeta individual)
│       ├── ChatbotStatus (indicador activo/inactivo)
│       ├── ChatbotActions (editar, eliminar, toggle)
│       └── ChatbotInfo (nombre, fecha, stats)
├── EmptyState (cuando no hay chatbots)
└── CreateChatbotModal (modal de creación)
```

### Data Flow

```mermaid
graph TD
    A[/chat Loader] --> B[Obtener Usuario]
    B --> C[Cargar Chatbots del Usuario]
    C --> D[Obtener Plan y Límites]
    D --> E[Renderizar Lista]

    E --> F[Acción Usuario]
    F --> G{Tipo de Acción}

    G -->|Crear| H[Validar Límites]
    G -->|Toggle Estado| I[Actualizar Estado]
    G -->|Eliminar| J[Confirmar y Eliminar]
    G -->|Editar| K[Navegar a /chat/config]

    H --> L[Action Handler]
    I --> L
    J --> L
    L --> M[Actualizar DB]
    M --> N[Revalidar Datos]
    N --> E
```

## Components and Interfaces

### Chat List Loader

```typescript
export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await getUserOrNull(request);
  if (!userId) {
    throw redirect("/login");
  }

  // Obtener usuario con plan para límites
  const user = await getUserWithPlan(userId);

  // Cargar todos los chatbots del usuario
  const chatbots = await getChatbotsByUserId(userId);

  // Obtener límites del plan
  const planLimits = getPlanLimits(user.plan);

  return json({
    chatbots,
    user,
    planLimits,
    canCreateMore: user.plan === "PRO" || chatbots.length === 0,
  });
};
```

### Chat List Action Handler

```typescript
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const userId = await getUserOrNull(request);
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  switch (intent) {
    case "create_chatbot":
      return handleCreateChatbot(formData, userId);

    case "toggle_status":
      return handleToggleStatus(formData, userId);

    case "delete_chatbot":
      return handleDeleteChatbot(formData, userId);

    default:
      return json({ success: false, error: "Invalid intent" }, { status: 400 });
  }
};

const handleCreateChatbot = async (formData: FormData, userId: string) => {
  try {
    // Validar límites de plan
    const user = await getUserWithPlan(userId);
    const existingChatbots = await getChatbotsByUserId(userId);

    if (user.plan === "FREE" && existingChatbots.length >= 1) {
      return json({
        success: false,
        error: "LIMIT_EXCEEDED_CHATBOTS",
        message:
          "Los usuarios FREE solo pueden tener 1 chatbot. Actualiza a PRO para crear más.",
        upgradeRequired: true,
      });
    }

    // Crear chatbot con datos del formulario
    const chatbotData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      userId,
    };

    const newChatbot = await createChatbot(chatbotData);

    return json({
      success: true,
      data: newChatbot,
      redirectTo: `/chat/config/${newChatbot.id}`,
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
};

const handleToggleStatus = async (formData: FormData, userId: string) => {
  try {
    const chatbotId = formData.get("chatbotId") as string;
    const newStatus = formData.get("isActive") === "true";

    // Verificar ownership
    const chatbot = await getChatbotById(chatbotId, userId);
    if (!chatbot) {
      return json(
        { success: false, error: "Chatbot not found" },
        { status: 404 }
      );
    }

    const updatedChatbot = await updateChatbotStatus(chatbotId, newStatus);

    return json({
      success: true,
      data: updatedChatbot,
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
};

const handleDeleteChatbot = async (formData: FormData, userId: string) => {
  try {
    const chatbotId = formData.get("chatbotId") as string;

    // Verificar ownership
    const chatbot = await getChatbotById(chatbotId, userId);
    if (!chatbot) {
      return json(
        { success: false, error: "Chatbot not found" },
        { status: 404 }
      );
    }

    await deleteChatbot(chatbotId);

    return json({
      success: true,
      message: "Chatbot eliminado exitosamente",
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
};
```

### Main Chat List Component

```typescript
import { json, redirect } from "react-router";
import type { Route } from "./+types/chat";
import { useState } from "react";
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
} from "react-router";

export default function ChatListRoute() {
  const { chatbots, user, planLimits, canCreateMore } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Filtrar chatbots
  const filteredChatbots = chatbots.filter((chatbot) => {
    const matchesSearch = chatbot.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && chatbot.isActive) ||
      (statusFilter === "inactive" && !chatbot.isActive);

    return matchesSearch && matchesStatus;
  });

  // Manejar redirección después de crear
  useEffect(() => {
    if (actionData?.success && actionData?.redirectTo) {
      navigate(actionData.redirectTo);
    }
  }, [actionData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ChatListHeader
        canCreateMore={canCreateMore}
        onCreateClick={() => setShowCreateModal(true)}
        planLimits={planLimits}
      />

      <ChatListFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {filteredChatbots.length === 0 ? (
        <EmptyState
          hasSearch={searchTerm || statusFilter !== "all"}
          canCreate={canCreateMore}
          onCreateClick={() => setShowCreateModal(true)}
        />
      ) : (
        <ChatListGrid chatbots={filteredChatbots} />
      )}

      {showCreateModal && (
        <CreateChatbotModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          planLimits={planLimits}
          actionData={actionData}
          isSubmitting={navigation.state === "submitting"}
        />
      )}
    </div>
  );
}
```

### Chatbot Card Component

```typescript
interface ChatbotCardProps {
  chatbot: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    conversationCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

const ChatbotCard = ({ chatbot }: ChatbotCardProps) => {
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {chatbot.name}
            </h3>
            <ChatbotStatus isActive={chatbot.isActive} />
          </div>

          {chatbot.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {chatbot.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{chatbot.conversationCount} conversaciones</span>
            <span>Creado {formatDate(chatbot.createdAt)}</span>
          </div>
        </div>

        <ChatbotActions
          chatbot={chatbot}
          isToggling={isToggling}
          onToggle={setIsToggling}
          showDeleteConfirm={showDeleteConfirm}
          onDeleteConfirm={setShowDeleteConfirm}
        />
      </div>
    </div>
  );
};
```

### Create Chatbot Modal

```typescript
interface CreateChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  planLimits: PlanLimits;
  actionData?: any;
  isSubmitting: boolean;
}

const CreateChatbotModal = ({
  isOpen,
  onClose,
  planLimits,
  actionData,
  isSubmitting,
}: CreateChatbotModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Mostrar error de límites si existe
  const hasLimitError = actionData?.error === "LIMIT_EXCEEDED_CHATBOTS";

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-semibold mb-4">Crear nuevo chatbot</h2>

          {hasLimitError && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                {actionData.message}
              </p>
              <button className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 underline">
                Actualizar a PRO
              </button>
            </div>
          )}

          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="create_chatbot" />

            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del chatbot
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Descripción (opcional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                {isSubmitting ? "Creando..." : "Crear chatbot"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </Dialog>
  );
};
```

## Data Models

### Extended Types

```typescript
interface ChatbotListItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  status: ChatbotStatus;
  conversationCount: number;
  monthlyUsage: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatListLoaderData {
  chatbots: ChatbotListItem[];
  user: UserWithPlan;
  planLimits: PlanLimits;
  canCreateMore: boolean;
}

interface ChatActionResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  redirectTo?: string;
  upgradeRequired?: boolean;
}
```

## Error Handling

### Client-Side Error Handling

```typescript
const ChatbotActions = ({ chatbot, onToggle, onDeleteConfirm }) => {
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setError(null);
    onToggle(true);

    try {
      const formData = new FormData();
      formData.append("intent", "toggle_status");
      formData.append("chatbotId", chatbot.id);
      formData.append("isActive", (!chatbot.isActive).toString());

      const response = await fetch("/chat", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Error al cambiar estado");
        // Revertir optimistic update si es necesario
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      onToggle(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {/* Botones de acción */}
    </div>
  );
};
```

### Server-Side Error Responses

```typescript
// Tipos de errores específicos
const ERROR_CODES = {
  LIMIT_EXCEEDED_CHATBOTS: "Has alcanzado el límite de chatbots para tu plan",
  CHATBOT_NOT_FOUND: "El chatbot no existe o no tienes permisos",
  VALIDATION_ERROR: "Los datos proporcionados no son válidos",
  UNAUTHORIZED: "No tienes permisos para realizar esta acción",
} as const;
```

## Performance Considerations

### Optimizations

1. **Lazy Loading**: Cargar componentes pesados bajo demanda
2. **Memoization**: Usar React.memo para ChatbotCard
3. **Debounced Search**: Evitar filtrado excesivo durante búsqueda
4. **Optimistic Updates**: Actualizar UI inmediatamente para acciones rápidas

### Caching Strategy

- Cache de lista de chatbots en sessionStorage
- Invalidación automática después de acciones
- Prefetch de datos de configuración al hover sobre "Editar"

## Security Considerations

### Authorization

- Verificar ownership en todas las operaciones
- Validar límites de plan en server-side
- Sanitizar inputs de búsqueda y filtros

### Data Protection

- No exponer datos sensibles en respuestas de API
- Validar permisos antes de cada operación
- Rate limiting para prevenir abuso

## Integration with Existing Config View

### Navigation Flow

```typescript
// Desde lista a configuración
const navigateToConfig = (chatbotId: string) => {
  navigate(`/chat/config/${chatbotId}`);
};

// Desde configuración de vuelta a lista
const navigateToList = () => {
  navigate("/chat");
};
```

### Shared State Management

- Usar URL params para mantener estado entre navegaciones
- Invalidar cache de lista cuando se actualiza configuración
- Mantener consistencia de datos entre vistas
