/**
 * Portal de Desarrolladores de Artefactos
 *
 * Permite a desarrolladores externos:
 * - Ver sus artefactos
 * - Crear nuevos artefactos
 * - Editar código (TSX)
 * - Enviar a revisión
 * - Ver feedback de rechazo
 */

import { useState, useEffect } from "react";
import { useRevalidator } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import type { Route } from "./+types/dashboard.artifacts";
import type { Artifact, ArtifactStatus } from "@prisma/client";
import toast from "react-hot-toast";
import { cn } from "~/lib/utils";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineCode,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from "react-icons/hi";

export const meta = () => [
  { title: "Desarrolladores - Artefactos" },
  { name: "description", content: "Crea y gestiona artefactos para Formmy" },
];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUserOrRedirect(request);

  const artifacts = await db.artifact.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { installations: true } },
    },
  });

  return { user, artifacts };
};

export default function DashboardArtifacts({ loaderData }: Route.ComponentProps) {
  const { user, artifacts: initialArtifacts } = loaderData;
  const revalidator = useRevalidator();

  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    code: DEFAULT_CODE,
    category: "",
    iconUrl: "",
    events: "",
  });

  // Sync from props
  useEffect(() => {
    setArtifacts(initialArtifacts);
  }, [initialArtifacts]);

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      description: "",
      code: DEFAULT_CODE,
      category: "",
      iconUrl: "",
      events: "",
    });
    setEditingArtifact(null);
  };

  const openEditForm = (artifact: Artifact) => {
    setFormData({
      name: artifact.name,
      displayName: artifact.displayName,
      description: artifact.description,
      code: artifact.code,
      category: artifact.category || "",
      iconUrl: artifact.iconUrl || "",
      events: artifact.events.join(", "),
    });
    setEditingArtifact(artifact);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const events = formData.events
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);

      const body = {
        intent: editingArtifact ? "update" : "create",
        ...(editingArtifact && { id: editingArtifact.id }),
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        code: formData.code,
        category: formData.category || undefined,
        iconUrl: formData.iconUrl || undefined,
        events,
      };

      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      toast.success(editingArtifact ? "Artefacto actualizado" : "Artefacto creado");
      setIsFormOpen(false);
      resetForm();
      revalidator.revalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este artefacto?")) return;

    try {
      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "delete", id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar");
      }

      toast.success("Artefacto eliminado");
      revalidator.revalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleSubmitForReview = async (id: string) => {
    try {
      const response = await fetch("/api/v1/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "submit_review", id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar");
      }

      toast.success("Enviado a revisión");
      revalidator.revalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Mis Artefactos
          </h1>
          <p className="text-gray-500 mt-1">
            Crea componentes interactivos para chatbots de Formmy
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Nuevo Artefacto
        </button>
      </div>

      {/* Artifacts list */}
      {artifacts.length === 0 && !isFormOpen && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <HiOutlineCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes artefactos
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Los artefactos son componentes React interactivos que los chatbots
            pueden mostrar a los usuarios durante las conversaciones.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Crear mi primer artefacto
          </button>
        </div>
      )}

      {artifacts.length > 0 && !isFormOpen && (
        <div className="grid gap-4 overflow-hidden">
          {artifacts.map((artifact: Artifact & { _count: { installations: number } }) => (
            <ArtifactRow
              key={artifact.id}
              artifact={artifact}
              onEdit={() => openEditForm(artifact)}
              onDelete={() => handleDelete(artifact.id)}
              onSubmitForReview={() => handleSubmitForReview(artifact.id)}
            />
          ))}
        </div>
      )}

      {/* Form modal/section */}
      {isFormOpen && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {editingArtifact ? "Editar Artefacto" : "Nuevo Artefacto"}
            </h2>
            <button
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name (slug) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre técnico (slug)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="date-picker"
                  pattern="[a-z0-9-]+"
                  required
                  disabled={!!editingArtifact}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre visible
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Selector de Fecha"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="forms, calendars, payments..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Events */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eventos (separados por coma)
                </label>
                <input
                  type="text"
                  value={formData.events}
                  onChange={(e) =>
                    setFormData({ ...formData, events: e.target.value })
                  }
                  placeholder="onSubmit, onCancel"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe qué hace este artefacto y cuándo debería usarse..."
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Code editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código TSX
              </label>
              <textarea
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
                rows={20}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                spellCheck={false}
              />
              <p className="text-xs text-gray-500 mt-1">
                El componente debe llamarse <code>ArtifactComponent</code> y
                recibir props <code>data</code> y <code>onEvent</code>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Status badge component
const StatusBadge = ({ status }: { status: ArtifactStatus }) => {
  const config = {
    DRAFT: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      icon: HiOutlinePencil,
      label: "Borrador",
    },
    PENDING_REVIEW: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      icon: HiOutlineClock,
      label: "En revisión",
    },
    PUBLISHED: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: HiOutlineCheck,
      label: "Publicado",
    },
    REJECTED: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: HiOutlineExclamationCircle,
      label: "Rechazado",
    },
  };

  const { bg, text, icon: Icon, label } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        bg,
        text
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

// Artifact row component
const ArtifactRow = ({
  artifact,
  onEdit,
  onDelete,
  onSubmitForReview,
}: {
  artifact: Artifact & { _count: { installations: number } };
  onEdit: () => void;
  onDelete: () => void;
  onSubmitForReview: () => void;
}) => {
  const canEdit = artifact.status === "DRAFT" || artifact.status === "REJECTED";
  const canSubmit = artifact.status === "DRAFT" || artifact.status === "REJECTED";
  const canDelete = artifact.status === "DRAFT";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 overflow-hidden max-w-full">
      {/* Icon */}
      {artifact.iconUrl ? (
        <img
          src={artifact.iconUrl}
          alt=""
          className="w-12 h-12 rounded-lg object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <HiOutlineCode className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900">{artifact.displayName}</h3>
          <StatusBadge status={artifact.status} />
        </div>
        <p className="text-sm text-gray-500 truncate">{artifact.description}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
          <span>{artifact.name}</span>
          {artifact.category && <span>{artifact.category}</span>}
          <span>{artifact._count.installations} instalaciones</span>
        </div>
        {artifact.status === "REJECTED" && artifact.reviewNotes && (
          <p className="text-sm text-red-500 mt-2">
            Razón: {artifact.reviewNotes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {canEdit && (
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            title="Editar"
          >
            <HiOutlinePencil className="w-5 h-5" />
          </button>
        )}
        {canSubmit && (
          <button
            onClick={onSubmitForReview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm whitespace-nowrap"
            title="Enviar a revisión"
          >
            <HiOutlineUpload className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar a revisión</span>
          </button>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
            title="Eliminar"
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Default code template
const DEFAULT_CODE = `// Componente de artefacto
// Recibe: data (props iniciales), onEvent (para comunicar con el bot)

const ArtifactComponent = ({ data, onEvent }) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onEvent("onSubmit", { value });
    }
  };

  const handleCancel = () => {
    onEvent("onCancel", {});
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Mi Artefacto</h3>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribe algo..."
        className="w-full px-3 py-2 border rounded-lg"
      />

      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};
`;
