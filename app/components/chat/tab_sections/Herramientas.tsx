/**
 * 🔧 Herramientas - Custom HTTP Tools Management
 *
 * Permite a los usuarios configurar herramientas HTTP personalizadas
 * que el agente puede invocar automáticamente durante las conversaciones.
 *
 * Ejemplos de uso:
 * - Consultar inventario en API externa
 * - Crear tickets en sistema de soporte
 * - Verificar disponibilidad de citas
 * - Enviar datos a webhooks personalizados
 */

import { useState, useEffect } from "react";
import { useRevalidator } from "react-router";
import toast from "react-hot-toast";
import { StickyGrid } from "../PageContainer";
import { useDashboardTranslation } from "~/hooks/useDashboardTranslation";
import type { Chatbot, User, CustomTool, HttpMethod } from "@prisma/client";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineLightningBolt,
  HiOutlineGlobe,
  HiOutlineLockClosed,
  HiOutlineCode,
  HiOutlinePlay,
  HiOutlineExclamationCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi";
import { cn } from "~/lib/utils";

interface HerramientasProps {
  chatbot: Chatbot;
  user: User;
  customTools?: CustomTool[];
}

type AuthType = "none" | "bearer" | "api_key" | "basic";

interface ToolFormData {
  name: string;
  displayName: string;
  description: string;
  method: HttpMethod;
  url: string;
  authType: AuthType;
  authKey: string;
  authValue: string;
  headers: string; // JSON string
  parametersSchema: string; // JSON string
  successMessage: string;
}

const initialFormData: ToolFormData = {
  name: "",
  displayName: "",
  description: "",
  method: "POST",
  url: "",
  authType: "none",
  authKey: "",
  authValue: "",
  headers: "",
  parametersSchema: "",
  successMessage: "",
};

export const Herramientas = ({
  chatbot,
  user,
  customTools = [],
}: HerramientasProps) => {
  const { t } = useDashboardTranslation();
  const revalidator = useRevalidator();

  const [tools, setTools] = useState<CustomTool[]>(customTools);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<CustomTool | null>(null);
  const [formData, setFormData] = useState<ToolFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync tools from props
  useEffect(() => {
    setTools(customTools);
  }, [customTools]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre técnico es requerido";
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.name)) {
      newErrors.name =
        "Solo letras minúsculas, números y guiones bajos. Debe iniciar con letra.";
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = "El nombre visible es requerido";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida para el agente";
    }

    if (!formData.url.trim()) {
      newErrors.url = "La URL es requerida";
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = "URL inválida";
      }
    }

    if (formData.authType !== "none" && !formData.authValue.trim()) {
      newErrors.authValue = "El token/key de autenticación es requerido";
    }

    if (formData.headers.trim()) {
      try {
        JSON.parse(formData.headers);
      } catch {
        newErrors.headers = "JSON inválido";
      }
    }

    if (formData.parametersSchema.trim()) {
      try {
        JSON.parse(formData.parametersSchema);
      } catch {
        newErrors.parametersSchema = "JSON Schema inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        intent: editingTool ? "update" : "create",
        chatbotId: chatbot.id,
        ...(editingTool && { toolId: editingTool.id }),
        name: formData.name.trim(),
        displayName: formData.displayName.trim(),
        description: formData.description.trim(),
        method: formData.method,
        url: formData.url.trim(),
        authType: formData.authType,
        authKey:
          formData.authType === "api_key" ? formData.authKey.trim() : null,
        authValue: formData.authType !== "none" ? formData.authValue : null,
        headers: formData.headers.trim() ? JSON.parse(formData.headers) : null,
        parametersSchema: formData.parametersSchema.trim()
          ? JSON.parse(formData.parametersSchema)
          : null,
        successMessage: formData.successMessage.trim() || null,
      };

      const response = await fetch("/api/v1/custom-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar herramienta");
      }

      toast.success(
        editingTool
          ? "Herramienta actualizada correctamente"
          : "Herramienta creada correctamente"
      );

      setIsFormOpen(false);
      setEditingTool(null);
      setFormData(initialFormData);
      revalidator.revalidate();
    } catch (error) {
      console.error("Error saving tool:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar herramienta"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tool: CustomTool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description,
      method: tool.method,
      url: tool.url,
      authType: (tool.authType as AuthType) || "none",
      authKey: tool.authKey || "",
      authValue: tool.authValue || "",
      headers: tool.headers ? JSON.stringify(tool.headers, null, 2) : "",
      parametersSchema: tool.parametersSchema
        ? JSON.stringify(tool.parametersSchema, null, 2)
        : "",
      successMessage: tool.successMessage || "",
    });
    setIsFormOpen(true);
    setErrors({});
  };

  const handleDelete = async (toolId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta herramienta?")) return;

    try {
      const response = await fetch("/api/v1/custom-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "delete",
          chatbotId: chatbot.id,
          toolId,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al eliminar");
      }

      toast.success("Herramienta eliminada");
      revalidator.revalidate();
    } catch (error) {
      console.error("Error deleting tool:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleToggleActive = async (tool: CustomTool) => {
    try {
      const response = await fetch("/api/v1/custom-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "toggle",
          chatbotId: chatbot.id,
          toolId: tool.id,
          isActive: !tool.isActive,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al actualizar");
      }

      toast.success(
        tool.isActive ? "Herramienta desactivada" : "Herramienta activada"
      );
      revalidator.revalidate();
    } catch (error) {
      console.error("Error toggling tool:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar"
      );
    }
  };

  const handleTestTool = async (tool: CustomTool) => {
    setIsTesting(true);
    try {
      const response = await fetch("/api/v1/custom-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "test",
          chatbotId: chatbot.id,
          toolId: tool.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al probar herramienta");
      }

      toast.success(`Conexión exitosa: ${result.status}`);
    } catch (error) {
      console.error("Error testing tool:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al probar herramienta"
      );
    } finally {
      setIsTesting(false);
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingTool(null);
    setFormData(initialFormData);
    setErrors({});
  };

  return (
    <section className="h-full min-h-[60vh]">
      <article>
        <div className="mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-dark">
                Herramientas HTTP
              </h2>
              <p className="text-sm text-irongray mt-1">
                Configura endpoints HTTP que tu agente puede invocar
                automáticamente
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-brand-500 text-white font-medium",
                "hover:bg-brand-600 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
                "max-w-[240px]"
              )}
            >
              <HiOutlinePlus className="w-5 h-5" />
              Nueva herramienta
            </button>
          </div>

          {/* Form */}
          {isFormOpen && (
            <div className="bg-white border border-outlines/30 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-dark">
                  {editingTool ? "Editar herramienta" : "Nueva herramienta"}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 text-irongray hover:text-dark rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identificación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1">
                      Nombre técnico *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="check_inventory"
                      disabled={!!editingTool}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
                        errors.name
                          ? "border-red-300 bg-red-50"
                          : "border-outlines/50",
                        editingTool && "bg-gray-100 cursor-not-allowed"
                      )}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                    )}
                    <p className="text-xs text-irongray mt-1">
                      snake_case, ej: consultar_inventario
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-1">
                      Nombre visible *
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayName: e.target.value,
                        })
                      }
                      placeholder="Consultar Inventario"
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
                        errors.displayName
                          ? "border-red-300 bg-red-50"
                          : "border-outlines/50"
                      )}
                    />
                    {errors.displayName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.displayName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Descripción para el agente *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Usa esta herramienta cuando el usuario pregunte por disponibilidad de productos. Requiere el ID del producto como parámetro."
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg text-sm resize-none",
                      "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
                      errors.description
                        ? "border-red-300 bg-red-50"
                        : "border-outlines/50"
                    )}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description}
                    </p>
                  )}
                  <p className="text-xs text-irongray mt-1">
                    Describe cuándo debe usarse y qué parámetros necesita
                  </p>
                </div>

                {/* Método y URL */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1">
                      Método
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          method: e.target.value as HttpMethod,
                        })
                      }
                      className="w-full px-3 py-2 border border-outlines/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-dark mb-1">
                      URL del endpoint *
                    </label>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      placeholder="https://api.example.com/inventory"
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
                        errors.url
                          ? "border-red-300 bg-red-50"
                          : "border-outlines/50"
                      )}
                    />
                    {errors.url && (
                      <p className="text-xs text-red-500 mt-1">{errors.url}</p>
                    )}
                  </div>
                </div>

                {/* Autenticación */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <HiOutlineLockClosed className="w-4 h-4 text-irongray" />
                    <span className="text-sm font-medium text-dark">
                      Autenticación
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Tipo
                      </label>
                      <select
                        value={formData.authType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            authType: e.target.value as AuthType,
                          })
                        }
                        className="w-full px-3 py-2 border border-outlines/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                      >
                        <option value="none">Sin autenticación</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="api_key">API Key</option>
                        <option value="basic">Basic Auth</option>
                      </select>
                    </div>

                    {formData.authType === "api_key" && (
                      <div>
                        <label className="block text-sm font-medium text-dark mb-1">
                          Nombre del header
                        </label>
                        <input
                          type="text"
                          value={formData.authKey}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              authKey: e.target.value,
                            })
                          }
                          placeholder="X-API-Key"
                          className="w-full px-3 py-2 border border-outlines/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                        />
                      </div>
                    )}

                    {formData.authType !== "none" && (
                      <div
                        className={
                          formData.authType === "api_key" ? "" : "md:col-span-2"
                        }
                      >
                        <label className="block text-sm font-medium text-dark mb-1">
                          {formData.authType === "bearer"
                            ? "Token"
                            : formData.authType === "api_key"
                              ? "Valor del API Key"
                              : "Credenciales (user:pass)"}
                        </label>
                        <input
                          type="password"
                          value={formData.authValue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              authValue: e.target.value,
                            })
                          }
                          placeholder={
                            formData.authType === "basic"
                              ? "usuario:contraseña"
                              : "sk_live_..."
                          }
                          className={cn(
                            "w-full px-3 py-2 border rounded-lg text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
                            errors.authValue
                              ? "border-red-300 bg-red-50"
                              : "border-outlines/50"
                          )}
                        />
                        {errors.authValue && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.authValue}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuración Avanzada */}
                <div className="space-y-4 border-t border-outlines/30 pt-4">
                  <div className="flex items-center gap-2">
                    <HiOutlineCode className="w-4 h-4 text-irongray" />
                    <span className="text-sm font-medium text-dark">
                      Configuración avanzada
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Headers adicionales (JSON)
                      </label>
                      <textarea
                        value={formData.headers}
                        onChange={(e) =>
                          setFormData({ ...formData, headers: e.target.value })
                        }
                        rows={3}
                        placeholder={'{\n  "X-Custom-Header": "value"\n}'}
                        className={cn(
                          "w-full px-3 py-2 border rounded-lg text-sm font-mono resize-none",
                          "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
                          errors.headers
                            ? "border-red-300 bg-red-50"
                            : "border-outlines/50"
                        )}
                      />
                      {errors.headers && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.headers}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark mb-1">
                        Parámetros (JSON Schema)
                      </label>
                      <textarea
                        value={formData.parametersSchema}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parametersSchema: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder={
                          '{\n  "type": "object",\n  "properties": {\n    "product_id": { "type": "string" }\n  }\n}'
                        }
                        className={cn(
                          "w-full px-3 py-2 border rounded-lg text-sm font-mono resize-none",
                          "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
                          errors.parametersSchema
                            ? "border-red-300 bg-red-50"
                            : "border-outlines/50"
                        )}
                      />
                      {errors.parametersSchema && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.parametersSchema}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark mb-1">
                      Mensaje de éxito personalizado
                    </label>
                    <input
                      type="text"
                      value={formData.successMessage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          successMessage: e.target.value,
                        })
                      }
                      placeholder="Inventario consultado correctamente"
                      className="w-full px-3 py-2 border border-outlines/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                    />
                    <p className="text-xs text-irongray mt-1">
                      Opcional. Si se deja vacío, se mostrará la respuesta del
                      endpoint.
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outlines/30">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-irongray hover:text-dark transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                      "bg-brand-500 text-white font-medium text-sm",
                      "hover:bg-brand-600 transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <HiOutlineCheck className="w-4 h-4" />
                        {editingTool ? "Actualizar" : "Crear herramienta"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tools List */}
          {tools.length === 0 && !isFormOpen ? (
            <div className="bg-white border border-outlines/30 rounded-xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 mb-4">
                <HiOutlineLightningBolt className="w-8 h-8 text-brand-500" />
              </div>
              <h3 className="text-lg font-medium text-dark mb-2">
                Sin herramientas configuradas
              </h3>
              <p className="text-irongray mb-6 max-w-md mx-auto">
                Configura herramientas HTTP para que tu agente pueda conectarse
                con APIs externas y realizar acciones automáticamente.
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-brand-500 text-white font-medium",
                  "hover:bg-brand-600 transition-colors"
                )}
              >
                <HiOutlinePlus className="w-5 h-5" />
                Crear primera herramienta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className={cn(
                    "bg-white border rounded-xl overflow-hidden transition-all",
                    tool.isActive
                      ? "border-outlines/30"
                      : "border-outlines/20 opacity-60"
                  )}
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() =>
                      setExpandedTool(expandedTool === tool.id ? null : tool.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          tool.isActive ? "bg-brand-50" : "bg-gray-100"
                        )}
                      >
                        <HiOutlineGlobe
                          className={cn(
                            "w-5 h-5",
                            tool.isActive ? "text-brand-500" : "text-gray-400"
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-dark">
                            {tool.displayName}
                          </h4>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              tool.method === "POST"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {tool.method}
                          </span>
                          {!tool.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              Desactivada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-irongray font-mono">
                          {tool.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {tool.errorCount > 0 && (
                        <div className="flex items-center gap-1 text-amber-500 text-sm">
                          <HiOutlineExclamationCircle className="w-4 h-4" />
                          <span>{tool.errorCount} errores</span>
                        </div>
                      )}
                      {expandedTool === tool.id ? (
                        <HiOutlineChevronUp className="w-5 h-5 text-irongray" />
                      ) : (
                        <HiOutlineChevronDown className="w-5 h-5 text-irongray" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedTool === tool.id && (
                    <div className="px-4 pb-4 space-y-4 border-t border-outlines/20">
                      <div className="pt-4">
                        <p className="text-sm text-irongray">
                          {tool.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-irongray">URL:</span>
                          <p className="font-mono text-dark truncate">
                            {tool.url}
                          </p>
                        </div>
                        <div>
                          <span className="text-irongray">Autenticación:</span>
                          <p className="text-dark capitalize">
                            {tool.authType || "Ninguna"}
                          </p>
                        </div>
                        <div>
                          <span className="text-irongray">Usos:</span>
                          <p className="text-dark">{tool.usageCount}</p>
                        </div>
                        <div>
                          <span className="text-irongray">Último uso:</span>
                          <p className="text-dark">
                            {tool.lastUsedAt
                              ? new Date(tool.lastUsedAt).toLocaleDateString()
                              : "Nunca"}
                          </p>
                        </div>
                      </div>

                      {tool.lastError && (
                        <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">
                          <strong>Último error:</strong> {tool.lastError}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-outlines/20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestTool(tool);
                          }}
                          disabled={isTesting}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
                            "border border-outlines/50 text-irongray hover:text-dark hover:bg-gray-50",
                            "transition-colors"
                          )}
                        >
                          <HiOutlinePlay className="w-4 h-4" />
                          Probar conexión
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(tool);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
                            "border border-outlines/50 text-irongray hover:text-dark hover:bg-gray-50",
                            "transition-colors"
                          )}
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(tool);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
                            "border border-outlines/50 transition-colors",
                            tool.isActive
                              ? "text-irongray hover:text-dark hover:bg-gray-50"
                              : "text-green-600 hover:bg-green-50"
                          )}
                        >
                          {tool.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tool.id);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
                            "border border-red-200 text-red-500 hover:bg-red-50",
                            "transition-colors ml-auto"
                          )}
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info Card */}
          {tools.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HiOutlineLightningBolt className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">
                    Cómo usa el agente las herramientas
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    El agente analiza cada mensaje y decide automáticamente si
                    debe usar una herramienta basándose en la descripción que
                    configuraste. Asegúrate de escribir descripciones claras
                    indicando cuándo y cómo usarla.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
};
